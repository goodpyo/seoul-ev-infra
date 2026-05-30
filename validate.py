import sys
sys.stdout.reconfigure(encoding='utf-8')
from data_processor import (load_ev_data, load_charger_data, merge_data,
    aggregate_by_gu, find_nearest_chargers)

ev = load_ev_data()
ch = load_charger_data()
merged = merge_data(ev, ch)
gu = aggregate_by_gu(ch, ev)

ev_total = ev['ev_count'].sum()
ch_total = ch['total_count'].sum()
lat_ok   = (ch['lat'] != 0).sum()
print(f"전기차: {ev_total:,}대")
print(f"충전기: {ch_total:,}기 (좌표 있음: {lat_ok:,}기)")
print(f"전기차/충전기 비율: {ev_total/ch_total:.2f}")
print()

print("[자치구별 부족지수 TOP 5]")
for _, r in gu.sort_values('shortage_idx', ascending=False).head(5).iterrows():
    print(f"  {r['gu']}: 전기차 {r['ev_count']:,}대 / 충전기 {r['charger_total']:,}기 / 부족지수 {r['shortage_idx']}")

print()
print("[서울시청 근처 충전소 Top 3]")
near = find_nearest_chargers(37.5662, 126.9785, ch, top_n=3)
for n in near:
    print(f"  {n['location']} | {n['distance_km']}km | 급속 {n['fast_count']} 완속 {n['slow_count']}")
    print(f"    {n['address']}")
