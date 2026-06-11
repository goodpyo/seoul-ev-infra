import os, sys

# .env 파일 로드 (KAKAO_API_KEY 등)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def _under_streamlit() -> bool:
    """현재 프로세스가 'streamlit run' 런타임 안에서 실행 중인지 판별."""
    try:                                          # streamlit >= 1.14
        from streamlit.runtime import exists
        return exists()
    except Exception:
        pass
    try:                                          # 구버전 fallback
        from streamlit.runtime.scriptrunner import get_script_run_ctx
        return get_script_run_ctx() is not None
    except Exception:
        return False


# `python app.py` 로 직접 실행했을 때만 streamlit run 으로 재기동.
# (streamlit 이 app.py 를 실행할 때도 __name__=='__main__' 이므로
#  런타임 존재 여부로 정확히 구분해야 중복 기동을 막을 수 있다.)
if __name__ == "__main__" and not _under_streamlit():
    import subprocess
    sys.exit(subprocess.run(
        [sys.executable, "-m", "streamlit", "run", os.path.abspath(__file__)]
    ).returncode)

import streamlit as st
import folium
from folium.plugins import FastMarkerCluster
from streamlit_folium import st_folium
import pandas as pd
import json

from data_processor import (
    load_ev_data, load_charger_data, merge_data, aggregate_by_gu,
    get_seoul_gu_geojson, get_seoul_dong_geojson, geojson_centroids, geocode_address,
)
from nearby_realtime import find_stations_within_radius
from streamlit_js_eval import get_geolocation

# ─── Page config ─────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="서울시 전기차 충전 인프라 분석",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
  [data-testid="stAppViewContainer"] { background-color: #f8fafc; }
  [data-testid="stHeader"]           { background-color: #1e3a8a !important; }
  section[data-testid="stSidebar"]   {
    background-color: #f8fafc;
    border-right: 1px solid #e2e8f0;
  }
  /* ── 헤더: 전체 너비 고정 배너 ── */
  [data-testid="stHeader"] {
    position: fixed !important;   /* fixed 유지 (relative 금지) */
    top: 0 !important;
    left: 0 !important;           /* 사이드바 포함 전체 너비 */
    right: 0 !important;
    z-index: 99999 !important;    /* 사이드바(기본 z-index 1) 위 */
    height: 5.75rem !important;
    min-height: 5.75rem !important;
    background: linear-gradient(90deg,#1e3a8a 0%,#1d4ed8 100%) !important;
  }
  /* 타이틀 메인 (큰 글씨 + 번개 아이콘) */
  [data-testid="stHeader"]::before {
    content: "⚡  서울시 전기차 충전 인프라 현황 분석";
    position: absolute;
    left: 1.4rem;
    top: 1.75rem;
    font-size: 1.35rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -.02em;
    white-space: nowrap;
    pointer-events: none;
  }
  /* 타이틀 부제 (작은 글씨) */
  [data-testid="stHeader"]::after {
    content: "서울시 전기차 등록 현황 & 충전소 설치현황 (2026.04~05)";
    position: absolute;
    left: 1.4rem;
    bottom: 0.55rem;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.78);
    white-space: nowrap;
    pointer-events: none;
  }
  /* ── 탭 글자 크기 확대 ── */
  div[data-testid="stTabs"] button[role="tab"] {
    font-size: 1.05rem !important;
    font-weight: 600 !important;
    padding: 0.5rem 1.2rem !important;
  }
  /* ── 사이드바: 헤더 아래에서 시작 ── */
  section[data-testid="stSidebar"] {
    top: 5.75rem !important;
    height: calc(100vh - 5.75rem) !important;
    z-index: 9999 !important;     /* 헤더보다 낮게 */
  }
  section[data-testid="stSidebar"] > div:first-child {
    padding-top: 1rem !important;
  }
  /* ── 본문: 헤더 높이만큼 아래로 ── */
  div.block-container {
    padding-top: 6.3rem !important;
    padding-bottom: 1rem !important;
  }
  /* KPI 메트릭 값 크기 축소 (세로 공간 절약) */
  div[data-testid="stMetricValue"] { font-size: 1.6rem !important; }
  /* ── 인라인 배너 숨기기 (헤더에서 대체) ── */
  div[data-testid="stMarkdownContainer"]:has(#app-header) {
    display: none !important;
  }
  /* ── 탭 바: 헤더 바로 아래 sticky ── */
  div[data-testid="stTabs"] > div:first-child {
    position: sticky;
    top: 5.75rem;
    z-index: 998;
    background: #ffffff;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 2px;
  }
  .metric-card {
    background: #f0f4f8;
    border: 1px solid #e2e8f0;
    border-radius: 8px; padding: 16px 20px; margin: 4px 0;
  }
  .status-pill {
    display: inline-block; padding: 2px 10px; border-radius: 12px;
    font-size: 0.82em; font-weight: 600;
  }
  .pill-red    { background:#fee2e2; color:#dc2626; }
  .pill-orange { background:#ffedd5; color:#ea580c; }
  .pill-yellow { background:#fef9c3; color:#a16207; }
  .pill-green  { background:#dcfce7; color:#16a34a; }
  .pill-gray   { background:#f1f5f9; color:#64748b; }
  /* ── 실시간 상태 배지 ── */
  .rt-available { background:#dcfce7; color:#16a34a; padding:2px 8px;
                  border-radius:10px; font-size:0.78em; font-weight:600; }
  .rt-busy      { background:#ffedd5; color:#ea580c; padding:2px 8px;
                  border-radius:10px; font-size:0.78em; font-weight:600; }
  .rt-full      { background:#fee2e2; color:#dc2626; padding:2px 8px;
                  border-radius:10px; font-size:0.78em; font-weight:600; }
  .rt-unknown   { background:#f1f5f9; color:#64748b; padding:2px 8px;
                  border-radius:10px; font-size:0.78em; font-weight:600; }
  .dist-badge   { background:#eff6ff; color:#2563eb; padding:2px 6px;
                  border-radius:6px; font-size:0.78em; }
</style>
""", unsafe_allow_html=True)


# ─── Data loading (cached) ───────────────────────────────────────────────────
@st.cache_resource(show_spinner="데이터 로딩 중...")
def load_all():
    ev_df      = load_ev_data()
    charger_df = load_charger_data()
    merged     = merge_data(ev_df, charger_df)
    gu_df      = aggregate_by_gu(charger_df, ev_df)
    geojson    = get_seoul_gu_geojson()
    centroids  = geojson_centroids(geojson)
    return ev_df, charger_df, merged, gu_df, geojson, centroids


ev_df, charger_df, merged_df, gu_df, geojson, gu_centroids = load_all()

@st.cache_data(show_spinner=False)
def load_dong_geojson():
    return get_seoul_dong_geojson()

dong_geojson = load_dong_geojson()


@st.cache_data(show_spinner=False)
def get_dong_centroids():
    """행정동 폴리곤 중심 좌표 {gu_dong: (lat, lon)} — 부족 동 클릭 시 지도 이동용."""
    cents = {}
    if not dong_geojson:
        return cents
    for feat in dong_geojson.get("features", []):
        name = feat.get("properties", {}).get("gu_dong", "")
        geom = feat.get("geometry", {})
        coords = []
        if geom.get("type") == "Polygon":
            coords = geom["coordinates"][0]
        elif geom.get("type") == "MultiPolygon":
            for poly in geom["coordinates"]:
                coords.extend(poly[0])
        if name and coords:
            lons = [c[0] for c in coords]
            lats = [c[1] for c in coords]
            cents[name] = (sum(lats) / len(lats), sum(lons) / len(lons))
    return cents


dong_centroids = get_dong_centroids()


def find_dong_centroid(gu_dong: str):
    """행정동 중심 좌표 조회. 정확히 없으면 분동된 동(상일동→상일제1동 등)으로 폴백."""
    if gu_dong in dong_centroids:
        return dong_centroids[gu_dong]
    # 폴백: '강동구 상일동' → '강동구 상일'로 시작하는 동 (상일제1동 등)
    stem = gu_dong[:-1] if gu_dong.endswith("동") else gu_dong
    for key, cent in dong_centroids.items():
        if key.startswith(stem):
            return cent
    return None


@st.cache_data
def get_stations_map(_charger_df):
    """충전소 단위 집계 — 캐시하여 매 re-run 재계산 방지."""
    return (
        _charger_df[(_charger_df["lat"] != 0) & (_charger_df["lon"] != 0)]
        .groupby(["stat_id", "location", "address", "lat", "lon"], as_index=False)
        .agg(fast_count=("fast_count", "sum"), slow_count=("slow_count", "sum"))
    )


stations_map = get_stations_map(charger_df)

# ─── Status color helpers ────────────────────────────────────────────────────
STATUS_COLOR = {
    "충전소 없음": "#ff0000",
    "매우 부족":   "#ff6b35",
    "부족":        "#ffc300",
    "보통":        "#a3d977",
    "충분":        "#00c49a",
    "해당없음":    "#aaaaaa",
}
STATUS_PILL = {
    "충전소 없음": "pill-red",
    "매우 부족":   "pill-red",
    "부족":        "pill-orange",
    "보통":        "pill-yellow",
    "충분":        "pill-green",
    "해당없음":    "pill-gray",
}


def shortage_color(idx: float) -> str:
    if idx == 0:   return "#aaaaaa"
    if idx > 20:   return "#d73027"
    if idx > 10:   return "#fc8d59"
    if idx > 5:    return "#fee090"
    return "#1a9850"


def convenience_color(idx: float) -> str:
    if idx >= 30:  return "#1a9850"
    if idx >= 15:  return "#a3d977"
    if idx >= 5:   return "#fee090"
    if idx > 0:    return "#fc8d59"
    return "#d73027"


# ─── Sidebar ─────────────────────────────────────────────────────────────────
with st.sidebar:
    map_mode = st.radio(
        "지도 표시 모드",
        ["부족지수 (전기차/충전기)", "충전편의지수", "전기차 등록 수", "충전기 설치 수"],
        index=0,
        help=(
            "**부족지수** = 전기차 등록 수 ÷ 충전기 수\n\n"
            "충전기 1기가 감당하는 전기차 대수 — 클수록 부족\n\n"
            "---\n\n"
            "**충전편의지수** = (급속×3 + 완속) ÷ 전기차 × 100\n\n"
            "급속은 충전 속도를 감안해 3배 가중 — 클수록 편리"
        ),
    )

    st.divider()
    show_chargers = st.checkbox("⚡ 충전소 위치 표시 (클러스터)", value=False)

    st.divider()
    st.subheader("📊 범례")
    if "부족지수" in map_mode:
        for label, color in [("매우 부족 (>20)", "#d73027"), ("부족 (>10)", "#fc8d59"),
                              ("보통 (>5)", "#fee090"), ("충분 (≤5)", "#1a9850"),
                              ("데이터 없음", "#aaaaaa")]:
            st.markdown(f"<span style='color:{color}'>■</span> {label}", unsafe_allow_html=True)
    elif "편의지수" in map_mode:
        for label, color in [("매우 좋음 (≥30)", "#1a9850"), ("좋음 (≥15)", "#a3d977"),
                              ("보통 (≥5)", "#fee090"), ("나쁨 (>0)", "#fc8d59"),
                              ("인프라 전무", "#d73027")]:
            st.markdown(f"<span style='color:{color}'>■</span> {label}", unsafe_allow_html=True)


# ─── Main area ───────────────────────────────────────────────────────────────
st.markdown(
    """
    <div id="app-header" style="
        background: linear-gradient(90deg,#1e3a8a 0%,#1d4ed8 100%);
        color:#fff;
        padding:0.7rem 1.4rem 0.75rem;
        border-radius:0 0 10px 10px;
        box-shadow:0 3px 10px rgba(30,58,138,.25);
        margin-bottom:0.5rem;
    ">
      <div style="font-size:1.35rem;font-weight:700;letter-spacing:-.01em;">
        ⚡ 서울시 전기차 충전 인프라 현황 분석
      </div>
      <div style="font-size:0.78rem;margin-top:3px;opacity:.85;">
        서울시 전기차 등록 현황 &amp; 충전소 설치현황 (2026.04~05)
      </div>
    </div>
    """,
    unsafe_allow_html=True,
)

main_tab1, main_tab2 = st.tabs(["📊 인프라 분석", "🔌 가까운 충전소 찾기"])


# ═══════════════════════════════════════════════════════════════════════════════
# 탭 1: 인프라 분석 (기존 기능)
# ═══════════════════════════════════════════════════════════════════════════════
with main_tab1:
    # KPI row
    k1, k2, k3, k4, k5 = st.columns(5)
    total_ev       = int(ev_df["ev_count"].sum())
    total_chargers = int(charger_df["total_count"].sum())
    total_fast     = int(charger_df["fast_count"].sum())
    total_slow     = int(charger_df["slow_count"].sum())
    shortage_dongs = int((merged_df["status"].isin(["매우 부족", "부족"])).sum())

    k1.metric("전기차 등록 대수", f"{total_ev:,} 대",
              help="2026년 4월 기준 — 자동차관리정보시스템 (국토교통부)")
    k2.metric("충전기 총 수", f"{total_chargers:,} 기",
              help="2026년 5월 12일 기준 — 한국환경공단 API")
    k3.metric("급속 충전기", f"{total_fast:,} 기",
              help="2026년 5월 12일 기준 — 한국환경공단 API")
    k4.metric("완속 충전기", f"{total_slow:,} 기",
              help="2026년 5월 12일 기준 — 한국환경공단 API")
    k5.metric("인프라 부족 동 수", f"{shortage_dongs} 곳",
              delta="부족 + 매우 부족", delta_color="inverse")

    # ── 부족 동 목록 (잔여 버킷 제외) ─────────────────────────────────────────
    # 행정구역 개편 잔여 버킷 제외 — 옛 동명으로 남은 등록 데이터 조각이라
    # 실제 부족이 아님 (예: 상일동 41대 — 상일제1·2동은 충분)
    ARTIFACT_DONGS = {("강동구", "상일동")}
    shortage_dongs_df = (
        merged_df[
            (merged_df["ev_count"] > 0)
            & ~merged_df.apply(lambda r: (r["gu"], r["dong"]) in ARTIFACT_DONGS, axis=1)
        ]
        .sort_values("shortage_idx", ascending=False)
        .head(20).copy()
    )

    # 📍 버튼 클릭을 지도 렌더 전에 처리 — st.rerun() 없이 한 번에 이동
    if st.session_state.get("dong_focus_reset"):
        st.session_state.pop("dong_focus", None)
    else:
        for _, _r in shortage_dongs_df.iterrows():
            _gd = f"{_r['gu']} {_r['dong']}"
            if st.session_state.get(f"dong_focus_{_gd}"):
                st.session_state["dong_focus"] = _gd
                break

    col_map, col_panel = st.columns([2, 1])

    with col_map:
        SEOUL_BOUNDS    = [[37.413, 126.734], [37.716, 127.270]]
        SEOUL_MAXBOUNDS = [[37.35, 126.65], [37.78, 127.36]]

        # 색상 기준 컬럼
        if "부족지수" in map_mode:
            key_col = "shortage_idx"
        elif "편의지수" in map_mode:
            key_col = "convenience_idx"
        elif "전기차" in map_mode:
            key_col = "ev_count"
        else:
            key_col = "charger_total"

        # ── 제목 + 표시 단위 토글을 한 줄로 배치 ───────────────────────────
        dong_available = dong_geojson is not None and (
            "부족지수" in map_mode or "편의지수" in map_mode
        )
        title_col, radio_col = st.columns([3.4, 1.25], vertical_alignment="center")
        title_col.markdown(
            f"<div style='font-size:1.15rem;color:#1e293b;'>🗺️ {map_mode} 지도</div>",
            unsafe_allow_html=True,
        )
        if dong_available:
            with radio_col:
                granularity = st.radio(
                    "표시 단위",
                    ["자치구별", "행정동별"],
                    horizontal=True,
                    label_visibility="collapsed",
                    key="map_granularity",
                )
        else:
            granularity = "자치구별"
        dong_mode = (granularity == "행정동별") and dong_available

        # 부족 동 클릭 시 해당 동 중심으로 이동·확대
        focus_gd   = st.session_state.get("dong_focus") if dong_mode else None
        focus_cent = find_dong_centroid(focus_gd) if focus_gd else None
        if focus_cent:
            map_center, map_zoom = focus_cent, 14
        else:
            # fit_bounds 대신 고정 zoom 11 — 서울시가 화면에 꽉 차게 시작
            map_center, map_zoom = [37.5665, 126.9780], 11

        m = folium.Map(
            location=map_center,
            zoom_start=map_zoom,
            tiles="OpenStreetMap",
            min_zoom=10, max_zoom=18,
            maxBounds=SEOUL_MAXBOUNDS,
            maxBoundsViscosity=1.0,
        )

        if dong_mode:
            # ── 행정동 단위 ──────────────────────────────────────────────────
            merged_val   = dict(zip(
                merged_df["gu"].fillna("") + " " + merged_df["dong"].fillna(""),
                merged_df[key_col]))
            merged_ev    = dict(zip(
                merged_df["gu"].fillna("") + " " + merged_df["dong"].fillna(""),
                merged_df["ev_count"]))
            merged_total = dict(zip(
                merged_df["gu"].fillna("") + " " + merged_df["dong"].fillna(""),
                merged_df["charger_total"]))

            def _dong_color(gd):
                val = merged_val.get(gd, 0)
                ev  = merged_ev.get(gd, 0)
                if "부족지수" in map_mode:
                    return shortage_color(val) if ev > 0 else "#aaaaaa"
                return convenience_color(val)

            folium.GeoJson(
                dong_geojson,
                style_function=lambda f: {
                    "fillColor": _dong_color(f["properties"].get("gu_dong", "")),
                    "color": "#555", "weight": 0.8, "fillOpacity": 0.6,
                },
                highlight_function=lambda f: {"weight": 2.5, "color": "#000"},
                tooltip=folium.GeoJsonTooltip(fields=["gu_dong"], aliases=["행정동"]),
            ).add_to(m)

            # 자치구 경계선 오버레이 (방향 잡기용, 채우기 없음)
            if geojson:
                folium.GeoJson(
                    geojson,
                    style_function=lambda f: {
                        "fillOpacity": 0, "color": "#1e3a8a", "weight": 2.0,
                    },
                ).add_to(m)

            # 동 중심 마커 (지수 값 팝업)
            dong_centers = (
                charger_df[(charger_df["lat"] != 0) & (charger_df["lon"] != 0)
                           & charger_df["dong"].notna()]
                .groupby(["gu", "dong"], as_index=False)[["lat", "lon"]].mean()
            )
            for _, dr in dong_centers.iterrows():
                gd  = f"{dr['gu']} {dr['dong']}"
                val = merged_val.get(gd, 0)
                ev  = merged_ev.get(gd, 0)
                tot = merged_total.get(gd, 0)
                if ev == 0:
                    continue
                col = _dong_color(gd)
                idx_label = "부족지수" if "부족지수" in map_mode else "편의지수"
                tip = (f"{dr['gu']} {dr['dong']}<br>"
                       f"{idx_label} {val} | 전기차 {ev:,}대 | 충전기 {tot}기")
                folium.CircleMarker(
                    location=[dr["lat"], dr["lon"]],
                    radius=max(5, min(16, ev / 150)),
                    color=col, fill=True, fill_color=col, fill_opacity=0.85,
                    weight=1, tooltip=folium.Tooltip(tip),
                ).add_to(m)

        else:
            # ── 자치구 단위 (기본) ───────────────────────────────────────────
            if geojson:
                if "부족지수" in map_mode or "편의지수" in map_mode:
                    # 동별 지도·범례와 동일한 고정 임계값 색상 사용 (상대 스케일 금지)
                    gu_val = dict(zip(gu_df["gu"], gu_df[key_col]))
                    gu_ev  = dict(zip(gu_df["gu"], gu_df["ev_count"]))

                    def _gu_color(name):
                        val = gu_val.get(name, 0)
                        ev  = gu_ev.get(name, 0)
                        if "부족지수" in map_mode:
                            return shortage_color(val) if ev > 0 else "#aaaaaa"
                        return convenience_color(val)

                    folium.GeoJson(
                        geojson,
                        style_function=lambda f: {
                            "fillColor": _gu_color(f["properties"].get("name", "")),
                            "color": "#555", "weight": 1.0, "fillOpacity": 0.55,
                        },
                        highlight_function=lambda f: {"weight": 2.5, "color": "#000"},
                        tooltip=folium.GeoJsonTooltip(fields=["name"], aliases=["자치구"]),
                    ).add_to(m)
                else:
                    # 전기차/충전기 수: 크기(magnitude) 비교이므로 상대 스케일 유지
                    folium.Choropleth(
                        geo_data=geojson,
                        data=gu_df.copy(),
                        columns=["gu", key_col],
                        key_on="feature.properties.name",
                        fill_color="YlGn",
                        fill_opacity=0.55, line_opacity=0.8,
                        legend_name=map_mode, nan_fill_color="#cccccc", highlight=True,
                    ).add_to(m)

            for _, row in gu_df.iterrows():
                gu_name = row["gu"]
                if gu_name not in gu_centroids:
                    continue
                c_lat, c_lon = gu_centroids[gu_name]

                if "부족지수" in map_mode:
                    color   = shortage_color(row["shortage_idx"]) if row["ev_count"] > 0 else "#aaaaaa"
                    radius  = max(7, min(22, row["ev_count"] / 500))
                    val_str = f"부족지수: {row['shortage_idx']}"
                elif "편의지수" in map_mode:
                    color   = convenience_color(row["convenience_idx"])
                    radius  = max(7, min(22, row["ev_count"] / 500))
                    val_str = f"충전편의지수: {row['convenience_idx']}"
                elif "전기차" in map_mode:
                    color   = "#3388ff"
                    radius  = max(7, min(22, row["ev_count"] / 500))
                    val_str = f"전기차: {row['ev_count']:,}대"
                else:
                    color   = "#ff7800"
                    radius  = max(7, min(22, row["charger_total"] / 40))
                    val_str = f"충전기: {row['charger_total']}기"

                popup_html = (
                    f"<div style='font-family:sans-serif;min-width:190px'>"
                    f"<b>{gu_name}</b><br>"
                    f"전기차: <b>{row['ev_count']:,}대</b><br>"
                    f"충전기: <b>{row['charger_total']}기</b> "
                    f"(급속 {row['fast_total']} / 완속 {row['slow_total']})<br>"
                    f"{val_str}</div>"
                )
                folium.CircleMarker(
                    location=[c_lat, c_lon], radius=radius,
                    color=color, fill=True, fill_color=color, fill_opacity=0.75,
                    popup=folium.Popup(popup_html, max_width=240),
                    tooltip=f"{gu_name} | {val_str}",
                ).add_to(m)

        # ── 충전소 클러스터 (편의지수 모드 또는 체크박스) ────────────────────
        effective_show_chargers = show_chargers or ("편의지수" in map_mode)
        if effective_show_chargers:
            coords   = stations_map[["lat", "lon"]].values.tolist()
            tooltips = stations_map.apply(
                lambda r: f"{r['location']} | 급속 {r['fast_count']} 완속 {r['slow_count']}",
                axis=1,
            ).tolist()
            FastMarkerCluster(
                data=coords, popups=tooltips, name="충전소 위치",
                icon_create_function="""
                function(cluster) {
                    var count = cluster.getChildCount();
                    var size = count < 10 ? 30 : count < 100 ? 36 : 44;
                    var bg  = count < 10 ? 'rgba(37,99,235,0.75)'
                            : count < 100 ? 'rgba(29,78,216,0.80)'
                            : 'rgba(30,27,186,0.85)';
                    return new L.DivIcon({
                        html: '<div style="background:' + bg + ';color:#fff;'
                            + 'border-radius:50%;width:' + size + 'px;height:' + size + 'px;'
                            + 'display:flex;flex-direction:column;align-items:center;justify-content:center;'
                            + 'font-weight:700;'
                            + 'border:2px solid rgba(255,255,255,0.6);'
                            + 'box-shadow:0 2px 6px rgba(0,0,0,.35);">'
                            + '<span style="font-size:12px;line-height:1.1;">' + count + '</span>'
                            + '<span style="font-size:8px;line-height:1.1;opacity:0.9;">충전소</span>'
                            + '</div>',
                        className: '',
                        iconSize: new L.Point(size, size)
                    });
                }
                """,
            ).add_to(m)

        # returned_objects=[] → 지도 상호작용(이동/확대) 시 새로고침 없음
        st_folium(m, width=None, height=540, returned_objects=[], key="infra_map")

        if "편의지수" in map_mode:
            st.caption("💡 편의지수는 자치구 평균입니다. 실제 충전소 위치(클러스터)가 함께 표시됩니다.")

    with col_panel:
        # 지도 표시 단위와 패널 연동 — 자치구별 → 자치구 요약 / 행정동별 → 부족 동 목록
        panel_view = "⚠️ 부족 동" if dong_mode else "🏙️ 자치구별"

        if panel_view == "🏙️ 자치구별":
            st.caption("자치구별 요약 · 부족지수 순")
            display_gu = gu_df.sort_values("shortage_idx", ascending=False).copy()
            display_gu = display_gu.rename(columns={
                "gu": "자치구", "ev_count": "전기차(대)",
                "charger_total": "충전기(기)", "shortage_idx": "부족지수",
                "convenience_idx": "편의지수",
            })
            st.dataframe(
                display_gu[["자치구", "전기차(대)", "충전기(기)", "부족지수", "편의지수"]],
                use_container_width=True, hide_index=True, height=560,
            )

        elif panel_view == "⚠️ 부족 동":
            st.caption("인프라 부족 행정동 · 부족지수 상위 20개")
            focused = st.session_state.get("dong_focus")
            for _, r in shortage_dongs_df.iterrows():
                pill   = STATUS_PILL.get(r["status"], "pill-gray")
                gd     = f"{r['gu']} {r['dong']}"
                in_map = find_dong_centroid(gd) is not None
                txt_col, btn_col = st.columns([5, 1], vertical_alignment="center")
                txt_col.markdown(
                    f"**{gd}** &nbsp;"
                    f"<span class='status-pill {pill}'>{r['status']}</span><br>"
                    f"<small>전기차 {r['ev_count']:,}대 | 충전기 {r['charger_total']}기 | "
                    f"부족지수 {r['shortage_idx']}</small>",
                    unsafe_allow_html=True,
                )
                if in_map:
                    btn_type = "primary" if focused == gd else "secondary"
                    # 클릭 처리는 지도 렌더 전(상단)에서 수행 — 여기서는 표시만
                    btn_col.button("📍", key=f"dong_focus_{gd}",
                                   type=btn_type, help=f"{gd} 지도에서 보기")
                st.divider()

            if focused:
                st.button("🗺️ 서울 전체 보기", use_container_width=True,
                          key="dong_focus_reset")


    st.divider()

    with st.expander("📋 전체 행정동별 상세 데이터"):
        filter_status = st.multiselect(
            "상태 필터",
            options=["매우 부족", "부족", "보통", "충분", "해당없음"],
            default=["매우 부족", "부족"],
        )
        filtered = merged_df[merged_df["status"].isin(filter_status)] if filter_status else merged_df
        display  = filtered[["gu", "dong", "ev_count", "charger_total", "fast_total",
                              "slow_total", "shortage_idx", "convenience_idx", "status"]].copy()
        display.columns = ["자치구", "행정동", "전기차(대)", "충전기(기)", "급속", "완속",
                           "부족지수", "편의지수", "상태"]
        st.dataframe(display.sort_values("부족지수", ascending=False),
                     use_container_width=True, hide_index=True, height=400)

    st.caption("데이터 출처: 자동차관리정보시스템 (2026.04) | 전기차 충전소 설치현황 (2026.05.12)")


# ═══════════════════════════════════════════════════════════════════════════════
# 탭 2: 가까운 충전소 찾기
# ═══════════════════════════════════════════════════════════════════════════════
NEARBY_TOP_N = 3   # 가장 가까운 N개 충전소

with main_tab2:
    # ─── 위치 입력 (안내 + 입력 방법을 한 줄로 — 인프라 분석과 동일한 톤) ──────
    cap_col, mode_col = st.columns([3, 2], vertical_alignment="center")
    cap_col.caption("내 위치에서 가장 가까운 충전소 3곳의 급속·완속 현황을 확인하세요.")
    with mode_col:
        nb_mode = st.radio(
            "위치 입력 방법",
            ["현재 위치 자동 감지", "주소 입력"],
            horizontal=True,
            label_visibility="collapsed",
            key="nb_mode",
        )

    nb_search = False

    if nb_mode == "현재 위치 자동 감지":
        geo_data = get_geolocation()
        if geo_data and geo_data.get("coords"):
            auto_lat = float(geo_data["coords"]["latitude"])
            auto_lon = float(geo_data["coords"]["longitude"])
            acc      = geo_data["coords"].get("accuracy", 0)
            st.success(f"위치 감지 완료 — 위도 {auto_lat:.5f}, 경도 {auto_lon:.5f}  (정확도 ±{acc:.0f}m)")
            st.session_state["nb_center_lat"] = auto_lat
            st.session_state["nb_center_lon"] = auto_lon
            # 좌표가 있으면 매 run마다 즉시 계산 (벡터 연산이라 ~수 ms, 캐시 불필요)
            st.session_state["nb_nearby_df"] = find_stations_within_radius(
                auto_lat, auto_lon, charger_df, top_n=NEARBY_TOP_N
            )
            # 새 좌표 → 가장 가까운 1번 충전소로 지도 이동
            prev = st.session_state.get("nb_geo_prev")
            if prev != (auto_lat, auto_lon):
                st.session_state["nb_geo_prev"]     = (auto_lat, auto_lon)
                st.session_state["nb_selected_idx"] = 0
        else:
            st.info("브라우저에서 위치 권한을 허용해주세요. 감지에 몇 초 걸릴 수 있습니다.")
    else:
        # form으로 묶어 Enter 입력도 검색으로 처리
        with st.form("nb_addr_form", border=False):
            nb_addr_col, nb_btn_col = st.columns([5, 1])
            nb_addr_col.text_input(
                "주소", placeholder="예: 금천구청 / 마포구 서교동 어울마당로",
                label_visibility="collapsed", key="nb_addr",
            )
            nb_search = nb_btn_col.form_submit_button(
                "📍 검색", use_container_width=True, type="primary"
            )

    # ─── 수동 검색 처리 ────────────────────────────────────────────────────────
    if nb_search:
        nb_address_val = st.session_state.get("nb_addr", "").strip()
        if nb_address_val:
            with st.spinner("위치 검색 중..."):
                found_lat, found_lon = geocode_address(nb_address_val)
            if found_lat:
                st.session_state["nb_center_lat"]  = found_lat
                st.session_state["nb_center_lon"]  = found_lon
                with st.spinner("가장 가까운 충전소 검색 중..."):
                    st.session_state["nb_nearby_df"] = find_stations_within_radius(
                        found_lat, found_lon, charger_df, top_n=NEARBY_TOP_N
                    )
                st.session_state["nb_selected_idx"] = 0   # 가장 가까운 곳으로 이동
            else:
                st.error("주소를 찾을 수 없습니다. 더 구체적인 주소를 입력해주세요.")
        else:
            st.warning("주소를 입력해주세요.")

    # ─── 카드 📍 버튼 클릭을 지도 렌더 전에 처리 — 한 번에 이동 ────────────────
    if st.session_state.get("nb_show_all"):
        st.session_state.pop("nb_selected_idx", None)
    else:
        for _i in range(NEARBY_TOP_N):
            if st.session_state.get(f"nb_sel_{_i}"):
                st.session_state["nb_selected_idx"] = _i
                break

    # ─── 상태 참조 ─────────────────────────────────────────────────────────────
    nb_clat        = st.session_state.get("nb_center_lat", 37.5665)
    nb_clon        = st.session_state.get("nb_center_lon", 126.9780)
    nb_nearby      = st.session_state.get("nb_nearby_df")
    nb_sel_idx     = st.session_state.get("nb_selected_idx")   # 우측 카드에서 선택한 인덱스

    # ─── 지도 중심 결정 ────────────────────────────────────────────────────────
    # 카드 클릭 → 해당 충전소 중심 / 미선택 → fit_bounds 사용
    if (nb_sel_idx is not None
            and nb_nearby is not None
            and nb_sel_idx < len(nb_nearby)):
        sel_row   = nb_nearby.iloc[nb_sel_idx]
        map_lat   = float(sel_row["lat"])
        map_lon   = float(sel_row["lon"])
        map_zoom  = 17
        use_fit   = False
    else:
        map_lat, map_lon, map_zoom = nb_clat, nb_clon, 15
        use_fit   = nb_nearby is not None and len(nb_nearby) > 0

    # ─── 지도 + 목록 (인프라 분석 탭과 동일한 2:1 레이아웃) ────────────────────
    map_col, list_col = st.columns([2, 1])

    def _dist_str(km: float) -> str:
        m = km * 1000
        return f"{m:.0f}m" if m < 1000 else f"{km:.2f}km"

    # 번호별 색상 (1=파랑, 2=초록, 3=보라)
    _NUM_COLORS = [
        ("#2563eb", "#1e40af"),   # 1번
        ("#059669", "#065f46"),   # 2번
        ("#7c3aed", "#4c1d95"),   # 3번
    ]

    with map_col:
        st.markdown(
            "<div style='font-size:1.15rem;color:#1e293b;'>🗺️ 가까운 충전소 지도</div>",
            unsafe_allow_html=True,
        )
        nb_map = folium.Map(
            location=[map_lat, map_lon],
            zoom_start=map_zoom,
            tiles="OpenStreetMap",
        )

        # 검색 위치 마커
        folium.Marker(
            location=[nb_clat, nb_clon],
            popup="검색 위치",
            icon=folium.Icon(color="red", icon="user", prefix="fa"),
            tooltip="📍 검색 위치",
        ).add_to(nb_map)

        # 충전소 번호 마커 (1·2·3)
        if nb_nearby is not None and len(nb_nearby) > 0:
            for i, row in nb_nearby.reset_index(drop=True).iterrows():
                dist_label = _dist_str(row["distance_km"])
                bg, border = _NUM_COLORS[i % len(_NUM_COLORS)]
                is_sel     = (nb_sel_idx == i)
                # 선택된 카드는 테두리 강조
                ring = f"box-shadow:0 0 0 3px #fbbf24,0 2px 8px rgba(0,0,0,.45);" if is_sel else "box-shadow:0 2px 5px rgba(0,0,0,.35);"
                icon_html = (
                    f"<div style='background:{bg};color:#fff;"
                    f"border-radius:50%;width:40px;height:40px;"
                    f"display:flex;flex-direction:column;align-items:center;"
                    f"justify-content:center;font-weight:700;"
                    f"border:2px solid {border};{ring}'>"
                    f"<span style='font-size:14px;line-height:1.1;'>{i+1}</span>"
                    f"<span style='font-size:7px;line-height:1.1;opacity:.9;'>충전소</span>"
                    f"</div>"
                )
                popup_html = (
                    f"<div style='font-family:sans-serif;min-width:210px'>"
                    f"<b>#{i+1} {row['location']}</b><br>"
                    f"<small>{row['address']}</small><br>"
                    f"<small>거리: {dist_label}</small>"
                    f"<hr style='margin:4px 0'>"
                    f"⚡ 급속 <b>{row['fast_count']}기</b> &nbsp;|&nbsp; "
                    f"🔋 완속 <b>{row['slow_count']}기</b>"
                    f"</div>"
                )
                folium.Marker(
                    location=[row["lat"], row["lon"]],
                    popup=folium.Popup(popup_html, max_width=270),
                    tooltip=f"#{i+1} {row['location']} ({dist_label})",
                    icon=folium.DivIcon(html=icon_html, icon_size=(40, 40), icon_anchor=(20, 20)),
                ).add_to(nb_map)

            # 미선택 상태 → 3곳 + 검색위치 모두 보이도록 fit
            if use_fit:
                all_lats = [nb_clat] + nb_nearby["lat"].tolist()
                all_lons = [nb_clon] + nb_nearby["lon"].tolist()
                pad = 0.002
                nb_map.fit_bounds(
                    [[min(all_lats) - pad, min(all_lons) - pad],
                     [max(all_lats) + pad, max(all_lons) + pad]]
                )

        st_folium(nb_map, width=None, height=540, returned_objects=[], key="nb_folium_map")
        st.markdown(
            "<small>"
            "<span style='color:#2563eb'>●</span> 1번째 &nbsp;"
            "<span style='color:#059669'>●</span> 2번째 &nbsp;"
            "<span style='color:#7c3aed'>●</span> 3번째 &nbsp;&nbsp;"
            "<span style='color:#ef4444'>●</span> 검색위치"
            "</small>",
            unsafe_allow_html=True,
        )

    # ─── 충전소 목록 ───────────────────────────────────────────────────────────
    with list_col:
        st.caption("가장 가까운 충전소 TOP 3 · 거리순")
        if nb_nearby is None:
            st.info("위치를 입력하고 검색하면\n가장 가까운 충전소 3곳이 표시됩니다.")
        elif len(nb_nearby) == 0:
            st.warning("주변에 충전소가 없습니다.")
        else:
            total_fast_c  = int(nb_nearby["fast_count"].sum())
            total_slow_c  = int(nb_nearby["slow_count"].sum())
            kc1, kc2, kc3 = st.columns(3)
            kc1.metric("검색 결과", f"{len(nb_nearby)}개소")
            kc2.metric("급속 충전기", f"{total_fast_c}기")
            kc3.metric("완속 충전기", f"{total_slow_c}기")

            st.divider()
            st.caption("📍 버튼을 클릭하면 해당 충전소로 지도가 이동합니다.")

            for i, row in nb_nearby.reset_index(drop=True).iterrows():
                dist_label = _dist_str(row["distance_km"])
                bg, _      = _NUM_COLORS[i % len(_NUM_COLORS)]
                is_sel     = (nb_sel_idx == i)
                border_css = "border: 2px solid #fbbf24;" if is_sel else ""

                with st.container(border=True):
                    # 선택 강조 줄
                    if is_sel:
                        st.markdown(
                            f"<div style='height:3px;background:{bg};border-radius:2px;margin-bottom:6px'></div>",
                            unsafe_allow_html=True,
                        )
                    hd_col, btn_col = st.columns([5, 1])
                    with hd_col:
                        st.markdown(
                            f"<span style='background:{bg};color:#fff;border-radius:50%;"
                            f"width:22px;height:22px;display:inline-flex;align-items:center;"
                            f"justify-content:center;font-weight:700;font-size:12px;"
                            f"margin-right:6px;'>{i+1}</span>"
                            f"**{row['location']}**",
                            unsafe_allow_html=True,
                        )
                    with btn_col:
                        # 클릭 처리는 지도 렌더 전(상단)에서 수행 — 여기서는 표시만
                        st.button("📍", key=f"nb_sel_{i}", help="지도에서 이 충전소 보기")

                    st.markdown(
                        f"<small style='color:#64748b'>{row['address']}</small>",
                        unsafe_allow_html=True,
                    )
                    st.markdown(
                        f"⚡ 급속 **{row['fast_count']}기** &nbsp;|&nbsp; "
                        f"🔋 완속 **{row['slow_count']}기** &nbsp;&nbsp; "
                        f"<span style='color:#64748b;font-size:0.85em'>📏 {dist_label}</span>",
                        unsafe_allow_html=True,
                    )

            # 전체 보기 버튼
            if nb_sel_idx is not None:
                st.divider()
                st.button("🗺️ 3곳 전체 보기", use_container_width=True, key="nb_show_all")


