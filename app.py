import streamlit as st
import folium
from folium.plugins import FastMarkerCluster
from streamlit_folium import st_folium
import pandas as pd
import json

from data_processor import (
    load_ev_data, load_charger_data, merge_data, aggregate_by_gu,
    get_seoul_gu_geojson, geojson_centroids, geocode_address,
    find_nearest_chargers
)

# ─── Page config ─────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="서울시 전기차 충전 인프라 분석",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
  /* ── 전체 배경 화이트 ── */
  [data-testid="stAppViewContainer"] { background-color: #ffffff; }
  [data-testid="stHeader"]           { background-color: #ffffff; }
  section[data-testid="stSidebar"]   {
    background-color: #f8fafc;
    border-right: 1px solid #e2e8f0;
  }
  /* ── 카드 ── */
  .metric-card {
    background: #f0f4f8;
    border: 1px solid #e2e8f0;
    border-radius: 8px; padding: 16px 20px; margin: 4px 0;
  }
  /* ── 상태 배지 ── */
  .status-pill {
    display: inline-block; padding: 2px 10px; border-radius: 12px;
    font-size: 0.82em; font-weight: 600;
  }
  .pill-red    { background:#fee2e2; color:#dc2626; }
  .pill-orange { background:#ffedd5; color:#ea580c; }
  .pill-yellow { background:#fef9c3; color:#a16207; }
  .pill-green  { background:#dcfce7; color:#16a34a; }
  .pill-gray   { background:#f1f5f9; color:#64748b; }
</style>
""", unsafe_allow_html=True)


# ─── Data loading (cached) ───────────────────────────────────────────────────
@st.cache_data(show_spinner="데이터 로딩 중...")
def load_all():
    ev_df = load_ev_data()
    charger_df = load_charger_data()
    merged = merge_data(ev_df, charger_df)
    gu_df = aggregate_by_gu(charger_df, ev_df)
    geojson = get_seoul_gu_geojson()
    centroids = geojson_centroids(geojson)
    return ev_df, charger_df, merged, gu_df, geojson, centroids


ev_df, charger_df, merged_df, gu_df, geojson, gu_centroids = load_all()


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
    if idx == 0:
        return "#aaaaaa"
    if idx > 20:
        return "#d73027"
    if idx > 10:
        return "#fc8d59"
    if idx > 5:
        return "#fee090"
    return "#1a9850"


def convenience_color(idx: float) -> str:
    if idx >= 30:
        return "#1a9850"
    if idx >= 15:
        return "#a3d977"
    if idx >= 5:
        return "#fee090"
    if idx > 0:
        return "#fc8d59"
    return "#d73027"


# ─── Sidebar ─────────────────────────────────────────────────────────────────
with st.sidebar:
    st.title("⚡ EV 인프라 분석")
    st.caption("서울시 전기차 등록 현황 & 충전소 설치현황 (2026.04~05)")

    st.divider()
    map_mode = st.radio(
        "지도 표시 모드",
        ["부족지수 (전기차/충전기)", "충전편의지수", "전기차 등록 수", "충전기 설치 수"],
        index=0,
    )

    st.divider()
    if st.button("🔄 데이터 새로고침", use_container_width=True):
        st.cache_data.clear()
        st.rerun()

    st.divider()
    show_chargers = st.checkbox("⚡ 충전소 위치 표시 (클러스터)", value=False)

    st.divider()
    st.subheader("🔍 가장 가까운 충전소 찾기")
    input_mode = st.radio("위치 입력 방법", ["주소 입력", "좌표 직접 입력"])

    if input_mode == "주소 입력":
        user_address = st.text_input("주소 입력", placeholder="예: 마포구 서교동")
        search_btn = st.button("충전소 검색", use_container_width=True, type="primary")
        user_lat, user_lon = None, None
        if search_btn and user_address:
            with st.spinner("위치 검색 중..."):
                user_lat, user_lon = geocode_address(user_address)
            if not user_lat:
                st.error("주소를 찾을 수 없습니다. 다시 입력해주세요.")
    else:
        col1, col2 = st.columns(2)
        user_lat = col1.number_input("위도", value=37.5665, format="%.4f")
        user_lon = col2.number_input("경도", value=126.9780, format="%.4f")
        search_btn = st.button("충전소 검색", use_container_width=True, type="primary")

    st.divider()
    st.subheader("📊 범례")
    if "부족지수" in map_mode:
        for label, color in [("매우 부족 (>20)", "#d73027"), ("부족 (>10)", "#fc8d59"),
                              ("보통 (>5)", "#fee090"), ("충분 (≤5)", "#1a9850"),
                              ("충전소 없음", "#aaaaaa")]:
            st.markdown(f"<span style='color:{color}'>■</span> {label}", unsafe_allow_html=True)
    elif "편의지수" in map_mode:
        for label, color in [("매우 좋음 (≥30)", "#1a9850"), ("좋음 (≥15)", "#a3d977"),
                              ("보통 (≥5)", "#fee090"), ("나쁨 (>0)", "#fc8d59"),
                              ("인프라 전무", "#d73027")]:
            st.markdown(f"<span style='color:{color}'>■</span> {label}", unsafe_allow_html=True)


# ─── Main area ───────────────────────────────────────────────────────────────
st.title("서울시 전기차 충전 인프라 현황 분석")

# KPI row
k1, k2, k3, k4, k5 = st.columns(5)
total_ev = int(ev_df["ev_count"].sum())
total_chargers = int(charger_df["total_count"].sum())
total_fast = int(charger_df["fast_count"].sum())
total_slow = int(charger_df["slow_count"].sum())
shortage_dongs = int((merged_df["status"].isin(["충전소 없음", "매우 부족", "부족"])).sum())

k1.metric("전기차 등록 대수", f"{total_ev:,} 대",
          help="2026년 4월 기준 — 자동차관리정보시스템 (국토교통부)")
k2.metric("충전기 총 수", f"{total_chargers:,} 기",
          help="2026년 5월 12일 기준 — 한국환경공단 API")
k3.metric("급속 충전기", f"{total_fast:,} 기",
          help="2026년 5월 12일 기준 — 한국환경공단 API")
k4.metric("완속 충전기", f"{total_slow:,} 기",
          help="2026년 5월 12일 기준 — 한국환경공단 API")
k5.metric("인프라 부족 동 수", f"{shortage_dongs} 곳", delta="충전소 없음 + 매우 부족", delta_color="inverse")

st.divider()

# ─── Map ─────────────────────────────────────────────────────────────────────
col_map, col_panel = st.columns([2, 1])

with col_map:
    st.subheader(f"🗺️ {map_mode} 지도")

    # 서울 경계 (SW, NE)
    SEOUL_BOUNDS = [[37.413, 126.734], [37.716, 127.270]]

    m = folium.Map(
        location=[37.5665, 126.9780],
        zoom_start=11,
        tiles="OpenStreetMap",
    )
    m.fit_bounds(SEOUL_BOUNDS)

    # Choropleth (자치구 단위 색상 배경)
    if geojson:
        gu_data = gu_df.copy()
        if "부족지수" in map_mode:
            key_col = "shortage_idx"
        elif "편의지수" in map_mode:
            key_col = "convenience_idx"
        elif "전기차" in map_mode:
            key_col = "ev_count"
        else:
            key_col = "charger_total"

        folium.Choropleth(
            geo_data=geojson,
            data=gu_data,
            columns=["gu", key_col],
            key_on="feature.properties.name",
            fill_color="RdYlGn_r" if "부족" in map_mode else "YlGn",
            fill_opacity=0.55,
            line_opacity=0.8,
            legend_name=map_mode,
            nan_fill_color="#cccccc",
            highlight=True,
        ).add_to(m)

    # 자치구별 요약 마커 (구 중심 1개씩 — 427개 겹침 문제 해결)
    for _, row in gu_df.iterrows():
        gu_name = row["gu"]
        if gu_name not in gu_centroids:
            continue
        c_lat, c_lon = gu_centroids[gu_name]

        if "부족지수" in map_mode:
            color = shortage_color(row["shortage_idx"]) if row["ev_count"] > 0 else "#aaaaaa"
            radius = max(7, min(22, row["ev_count"] / 500))
            val_str = f"부족지수: {row['shortage_idx']}"
        elif "편의지수" in map_mode:
            color = convenience_color(row["convenience_idx"])
            radius = max(7, min(22, row["ev_count"] / 500))
            val_str = f"충전편의지수: {row['convenience_idx']}"
        elif "전기차" in map_mode:
            color = "#3388ff"
            radius = max(7, min(22, row["ev_count"] / 500))
            val_str = f"전기차: {row['ev_count']:,}대"
        else:
            color = "#ff7800"
            radius = max(7, min(22, row["charger_total"] / 40))
            val_str = f"충전기: {row['charger_total']}기"

        popup_html = (
            f"<div style='font-family:sans-serif;min-width:190px'>"
            f"<b>{gu_name}</b><br>"
            f"전기차: <b>{row['ev_count']:,}대</b><br>"
            f"충전기: <b>{row['charger_total']}기</b> "
            f"(급속 {row['fast_total']} / 완속 {row['slow_total']})<br>"
            f"{val_str}"
            f"</div>"
        )
        folium.CircleMarker(
            location=[c_lat, c_lon],
            radius=radius,
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.75,
            popup=folium.Popup(popup_html, max_width=240),
            tooltip=f"{gu_name} | {val_str}",
        ).add_to(m)

    # 충전소 마커 — FastMarkerCluster (기본 OFF, 사이드바 체크 시 표시)
    if show_chargers:
        coords   = stations_map[["lat", "lon"]].values.tolist()
        tooltips = stations_map.apply(
            lambda r: f"{r['location']} | 급속 {r['fast_count']} 완속 {r['slow_count']}",
            axis=1,
        ).tolist()
        FastMarkerCluster(data=coords, popups=tooltips, name="충전소").add_to(m)

    # Nearest charger result on map
    if search_btn and user_lat:
        nearest = find_nearest_chargers(user_lat, user_lon, charger_df, top_n=5)
        # User location marker
        folium.Marker(
            location=[user_lat, user_lon],
            popup="내 위치",
            icon=folium.Icon(color="red", icon="user", prefix="fa"),
        ).add_to(m)
        for rank, n in enumerate(nearest, 1):
            folium.Marker(
                location=[n["lat"], n["lon"]],
                popup=folium.Popup(
                    f"<b>#{rank} {n['location']}</b><br>{n['address']}<br>"
                    f"급속 {n['fast_count']}기 / 완속 {n['slow_count']}기<br>"
                    f"거리: 약 {n['distance_km']}km",
                    max_width=280,
                ),
                icon=folium.Icon(color="green", icon="bolt", prefix="fa"),
            ).add_to(m)
            folium.PolyLine(
                [[user_lat, user_lon], [n["lat"], n["lon"]]],
                color="green", weight=1.5, dash_array="5",
            ).add_to(m)
        st.session_state["nearest_results"] = nearest

    st_folium(m, width=None, height=600, returned_objects=[])


# ─── Right panel ─────────────────────────────────────────────────────────────
with col_panel:
    tab1, tab2, tab3 = st.tabs(["🏙️ 자치구별", "⚠️ 부족 동", "🔋 충전소 검색결과"])

    with tab1:
        st.caption("자치구별 요약 (부족지수 순)")
        display_gu = gu_df.sort_values("shortage_idx", ascending=False).copy()
        display_gu = display_gu.rename(columns={
            "gu": "자치구", "ev_count": "전기차(대)",
            "charger_total": "충전기(기)", "shortage_idx": "부족지수",
            "convenience_idx": "편의지수",
        })
        st.dataframe(
            display_gu[["자치구", "전기차(대)", "충전기(기)", "부족지수", "편의지수"]],
            use_container_width=True,
            hide_index=True,
            height=520,
        )

    with tab2:
        st.caption("인프라 부족 행정동 (부족지수 상위 20개)")
        shortage_dongs_df = (
            merged_df[merged_df["ev_count"] > 0]
            .sort_values("shortage_idx", ascending=False)
            .head(20)
            .copy()
        )
        for _, r in shortage_dongs_df.iterrows():
            pill = STATUS_PILL.get(r["status"], "pill-gray")
            st.markdown(
                f"**{r['gu']} {r['dong']}** &nbsp;"
                f"<span class='status-pill {pill}'>{r['status']}</span><br>"
                f"<small>전기차 {r['ev_count']:,}대 | 충전기 {r['charger_total']}기 | "
                f"부족지수 {r['shortage_idx']}</small>",
                unsafe_allow_html=True,
            )
            st.divider()

    with tab3:
        nearest_res = st.session_state.get("nearest_results")
        if not nearest_res:
            st.info("왼쪽 사이드바에서 주소나 좌표를 입력하고\n충전소 검색 버튼을 누르세요.")
        else:
            st.caption("가장 가까운 충전소 Top 5")
            for rank, n in enumerate(nearest_res, 1):
                st.markdown(
                    f"**#{rank} {n['location']}**<br>"
                    f"<small>{n['address']}</small><br>"
                    f"급속 **{n['fast_count']}기** / 완속 **{n['slow_count']}기**<br>"
                    f"📍 약 **{n['distance_km']} km**",
                    unsafe_allow_html=True,
                )
                st.divider()

st.divider()

# ─── Bottom data table ───────────────────────────────────────────────────────
with st.expander("📋 전체 행정동별 상세 데이터"):
    filter_status = st.multiselect(
        "상태 필터",
        options=["충전소 없음", "매우 부족", "부족", "보통", "충분", "해당없음"],
        default=["충전소 없음", "매우 부족", "부족"],
    )
    filtered = merged_df[merged_df["status"].isin(filter_status)] if filter_status else merged_df
    display = filtered[["gu", "dong", "ev_count", "charger_total", "fast_total",
                         "slow_total", "shortage_idx", "convenience_idx", "status"]].copy()
    display.columns = ["자치구", "행정동", "전기차(대)", "충전기(기)", "급속", "완속",
                       "부족지수", "편의지수", "상태"]
    st.dataframe(display.sort_values("부족지수", ascending=False),
                 use_container_width=True, hide_index=True, height=400)

st.caption("데이터 출처: 자동차관리정보시스템 (2026.04) | 전기차 충전소 설치현황 (2026.05.12)")

if __name__ == "__main__":
    import os, subprocess, sys
    # Streamlit re-runs this file with __name__=="__main__", which would spawn
    # an infinite chain of subprocesses.  Guard with an env-var flag.
    if os.environ.get("_ST_LAUNCHED") != "1":
        env = os.environ.copy()
        env["_ST_LAUNCHED"] = "1"
        subprocess.run([sys.executable, "-m", "streamlit", "run", __file__], env=env)
