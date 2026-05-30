import sys
sys.stdout.reconfigure(encoding='utf-8')
from data_processor import load_ev_data, load_charger_data, aggregate_by_gu
import pandas as pd

ev = load_ev_data()
ch = load_charger_data()
gu = aggregate_by_gu(ch, ev)

ev_total = ev['ev_count'].sum()
ch_total = ch['total_count'].sum()
fast_total = ch['fast_count'].sum()
slow_total = ch['slow_count'].sum()
ratio = ev_total / ch_total

# 충전소 개소 수 (stat_id 기준)
stations = ch['stat_id'].nunique()

# 동별 충전소 없는 동 (API dong 매핑이 안 돼서 gu 레벨로만)
# merged에서 상태 확인
from data_processor import merge_data
merged = merge_data(ev, ch)
no_charger = (merged['status'] == '충전소 없음').sum()
shortage    = (merged['status'].isin(['충전소 없음','매우 부족','부족'])).sum()

print("=== PPT 업데이트 필요 항목 ===")
print()
print("[슬라이드 5 - 현황 수치]")
print(f"  서울시 전기차: {ev_total:,}대  (변경 없음)")
print()
print("[슬라이드 6 - 충전 인프라 현황] ← 대폭 수정 필요")
print(f"  충전기 총계:   1,471기 → {ch_total:,}기")
print(f"  급속:          6기     → {fast_total:,}기")
print(f"  완속:          9기     → {slow_total:,}기")
print(f"  충전소 개소:   588곳   → {stations:,}곳")
print(f"  전기차/충전기: 76대:1  → {ratio:.2f}대:1")
print()
print("[슬라이드 7 - 부족지수 순위] ← 전면 교체 필요")
for _, r in gu.sort_values('shortage_idx', ascending=False).head(7).iterrows():
    print(f"  {r['gu']}: {r['ev_count']:,}대 / {r['charger_total']:,}기 / 부족지수 {r['shortage_idx']}")
print()
print("[슬라이드 4 - 데이터 출처] ← 항목 추가 필요")
print("  기존: 서울시 제공 Excel (588개소)")
print("  추가: 한국환경공단 전기자동차 충전소 정보 API")
print(f"       → {ch_total:,}기 (전수 데이터, 좌표 포함)")
print()
print("[슬라이드 9 - 기술 스택] ← 항목 추가")
print("  추가: requests (공공데이터 API 호출)")
