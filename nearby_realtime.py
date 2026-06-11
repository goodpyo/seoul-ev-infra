"""가까운 충전소 실시간 현황 조회 - 한국환경공단 EvCharger API"""
import math
import requests
import numpy as np
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
from data_processor import haversine

API_KEY    = "90fdcc2cbb43c6f75e133a15b94fd5cbdf7daa7ef9489cb516c11951c07548d8"
STATUS_URL = "http://apis.data.go.kr/B552584/EvCharger/getChargerStatus"
SLOW_TYPES = {"02", "07"}

# 실시간 상태 API에 실제 데이터가 있는 것으로 확인된 운영사 prefix (stat_id 앞 2자리)
RT_CONFIRMED  = {"ME", "CR", "EA", "HP", "KO", "LC", "LD", "ST"}
# 응답 느려 타임아웃됐지만 RT 데이터가 있을 수 있는 운영사
RT_POSSIBLE   = {"AL", "AM", "BE", "MO", "MT", "NE", "SZ", "TD", "TS", "TU", "UN", "UP", "ZE"}
# 실시간 조회할 대상 prefix
RT_PREFIXES   = RT_CONFIRMED | RT_POSSIBLE


_CLUSTER_KM = 0.030  # 30m 이내 → 같은 물리적 위치로 클러스터링


def find_stations_within_radius(
    lat: float, lon: float, charger_df: pd.DataFrame,
    radius_km: float = 5.0, top_n: int = None
) -> pd.DataFrame:
    """반경 radius_km 이내 충전소를 거리 오름차순으로 반환.
    top_n 지정 시 반경 제한 없이 가장 가까운 top_n개만 반환.
    30m 이내의 별도 등록 충전소(급속/완속 분리 등)는 하나로 클러스터링."""
    valid = charger_df[(charger_df["lat"] != 0) & (charger_df["lon"] != 0)]

    # stat_id 단위로 집계 (location/address 문자열 차이로 인한 중복 방지)
    stations = (
        valid.groupby("stat_id", as_index=False)
        .agg(
            location=("location", "first"),
            address=("address", "first"),
            lat=("lat", "first"),
            lon=("lon", "first"),
            fast_count=("fast_count", "sum"),
            slow_count=("slow_count", "sum"),
            total_count=("total_count", "sum"),
        )
    )
    # 벡터 haversine — apply 루프 대신 numpy 연산으로 7만 건도 즉시 처리
    R = 6371.0
    lat1, lon1 = math.radians(lat), math.radians(lon)
    lats2 = np.radians(stations["lat"].values)
    lons2 = np.radians(stations["lon"].values)
    dlat  = lats2 - lat1
    dlon  = lons2 - lon1
    a     = np.sin(dlat/2)**2 + math.cos(lat1) * np.cos(lats2) * np.sin(dlon/2)**2
    stations["distance_km"] = np.round(R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a)), 2)

    if top_n:
        # 클러스터링 후 top_n 반환 — 충분한 후보 확보 (top_n * 6 또는 최소 60개)
        n_candidates = max(top_n * 6, 60)
        nearby = (
            stations.nsmallest(n_candidates, "distance_km")
            .reset_index(drop=True)
        )
    else:
        nearby = (
            stations[stations["distance_km"] <= radius_km]
            .sort_values("distance_km")
            .reset_index(drop=True)
        )

    if len(nearby) == 0:
        return nearby

    # ── GPS 클러스터링: 30m 이내 충전소를 카드 하나로 합치기 ──────────────
    used: set = set()
    merged_rows = []
    for i in range(len(nearby)):
        if i in used:
            continue
        ri = nearby.iloc[i]
        group = [i]
        for j in range(i + 1, len(nearby)):
            if j in used:
                continue
            rj = nearby.iloc[j]
            if haversine(ri["lat"], ri["lon"], rj["lat"], rj["lon"]) <= _CLUSTER_KM:
                group.append(j)
        for idx in group:
            used.add(idx)

        grp = nearby.iloc[group]
        # 대표 location: 가장 짧은 이름 선택 (접미사 "(급)", "(완)" 등 없는 것)
        rep_loc = min(grp["location"].tolist(), key=len)
        merged_rows.append({
            "stat_id":    grp.iloc[0]["stat_id"],       # 대표 stat_id
            "stat_ids":   grp["stat_id"].tolist(),       # 클러스터 내 전체 stat_id
            "location":   rep_loc,
            "address":    grp.iloc[0]["address"],
            "lat":        float(grp.iloc[0]["lat"]),
            "lon":        float(grp.iloc[0]["lon"]),
            "fast_count": int(grp["fast_count"].sum()),
            "slow_count": int(grp["slow_count"].sum()),
            "total_count": int(grp["total_count"].sum()),
            "distance_km": float(grp.iloc[0]["distance_km"]),
        })

    result = pd.DataFrame(merged_rows).sort_values("distance_km").reset_index(drop=True)
    if top_n:
        return result.head(top_n)
    return result


def _parse_items(resp_json: dict) -> list:
    """API 응답에서 item 목록 추출 — 직접 items 구조 + response.body 래핑 구조 모두 처리."""
    # 형식 1: {"items": {"item": [...]}, ...}
    items = (resp_json.get("items") or {}).get("item")
    if items is not None:
        return [items] if isinstance(items, dict) else (items or [])
    # 형식 2: {"response": {"body": {"items": {"item": [...]}}}}
    body = ((resp_json.get("response") or {}).get("body") or {})
    items = (body.get("items") or {}).get("item")
    if items is not None:
        return [items] if isinstance(items, dict) else (items or [])
    return []


def _fetch_one_status(stat_id: str) -> tuple:
    try:
        r = requests.get(
            STATUS_URL,
            params={"serviceKey": API_KEY, "pageNo": 1, "numOfRows": 99,
                    "dataType": "JSON", "statId": stat_id},
            timeout=25,
        )
        r.raise_for_status()
        try:
            resp_json = r.json()
        except Exception:
            return stat_id, None
        items = _parse_items(resp_json)
        if not items:
            return stat_id, None

        fast_items = [x for x in items if str(x.get("chgerType", "")) not in SLOW_TYPES]
        slow_items = [x for x in items if str(x.get("chgerType", "")) in SLOW_TYPES]

        def _cnt(lst):
            return {
                "total":     len(lst),
                "available": sum(1 for x in lst if str(x.get("stat", "")) == "2"),
                "in_use":    sum(1 for x in lst if str(x.get("stat", "")) == "3"),
            }

        fc, sc    = _cnt(fast_items), _cnt(slow_items)
        avail     = fc["available"] + sc["available"]
        in_use    = fc["in_use"]    + sc["in_use"]
        total     = fc["total"]     + sc["total"]
        last_upd  = max((x.get("statUpdDt", "") for x in items), default="")

        return stat_id, {
            "total": total, "available": avail, "in_use": in_use,
            "unavailable": total - avail - in_use,
            "fast": fc, "slow": sc,
            "last_update": last_upd,
        }
    except Exception:
        return stat_id, None


def fetch_realtime_status(stat_ids: list, max_stations: int = 30) -> dict:
    """여러 충전소 실시간 상태를 병렬로 조회 (최대 max_stations개).
    클러스터링으로 stat_ids가 중첩 리스트인 경우 평탄화하여 처리."""
    # 중첩 리스트 평탄화 (클러스터링된 stat_ids 컬럼 대응)
    flat: list[str] = []
    for sid in stat_ids:
        if isinstance(sid, list):
            flat.extend(sid)
        else:
            flat.append(sid)

    result = {}
    with ThreadPoolExecutor(max_workers=5) as ex:   # 5개: API 서버 부하 조절
        futures = {ex.submit(_fetch_one_status, sid): sid
                   for sid in flat[:max_stations]}
        for f in as_completed(futures):
            sid, info = f.result()
            if info:
                result[sid] = info
    return result


def diagnose_api(stat_id: str) -> dict:
    """단일 충전소 ID로 getChargerStatus API 원본 응답 반환 (진단용)."""
    try:
        r = requests.get(
            STATUS_URL,
            params={"serviceKey": API_KEY, "pageNo": 1, "numOfRows": 10,
                    "dataType": "JSON", "statId": stat_id},
            timeout=25,
        )
        try:
            resp_json = r.json()
        except Exception:
            resp_json = None
        return {
            "status_code": r.status_code,
            "url": r.url,
            "json": resp_json,
            "text": r.text[:1200] if resp_json is None else None,
            "items_parsed": _parse_items(resp_json) if resp_json else [],
        }
    except Exception as e:
        return {"error": str(e)}
