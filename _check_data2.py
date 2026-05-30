import sys
sys.stdout.reconfigure(encoding='utf-8')
import pandas as pd
from data_processor import load_ev_data, load_charger_data, merge_data, aggregate_by_gu

print('데이터 로딩 중...')
ev_df      = load_ev_data()
charger_df = load_charger_data()
merged     = merge_data(ev_df, charger_df)
gu_df      = aggregate_by_gu(charger_df, ev_df)

# ── 1. EV 데이터 요약 ──────────────────────────────────────────────────────
print('\n' + '='*60)
print('[전기차] 구별 등록 현황')
gu_ev = ev_df.groupby('gu').agg(ev=('ev_count','sum'), dongs=('dong','nunique')).sort_values('ev', ascending=False)
print(f"\n{'구':<10} {'전기차':>8} {'행정동수':>6}")
print('-'*28)
for gu, row in gu_ev.iterrows():
    flag = ' ⚠ 동수 이상' if row['dongs'] <= 3 else ''
    print(f"{gu:<10} {row['ev']:>8,} {row['dongs']:>6}{flag}")
print('-'*28)
print(f"{'합계':<10} {ev_df['ev_count'].sum():>8,} {ev_df['dong'].nunique():>6}")

# ── 2. 충전기 데이터 요약 ───────────────────────────────────────────────────
print('\n' + '='*60)
print('[충전기] 구별 현황 (dong 배정 상태)')
total = len(charger_df)
has_dong = charger_df['dong'].notna().sum()
print(f"\n총 충전기: {total:,}기")
print(f"dong 있음: {has_dong:,}기 ({has_dong/total*100:.1f}%)")
print(f"dong 없음: {total-has_dong:,}기 ({(total-has_dong)/total*100:.1f}%)")

gu_ch = charger_df.groupby('gu').agg(
    total=('total_count','sum'),
    dong_ok=('dong', lambda x: x.notna().sum()),
).sort_values('total', ascending=False)
print(f"\n{'구':<10} {'충전기':>7} {'동있음':>7} {'비율':>6}")
print('-'*35)
for gu, row in gu_ch.iterrows():
    pct = row['dong_ok']/max(row['total'],1)*100
    flag = ' ⚠' if pct < 30 else ''
    print(f"{gu:<10} {row['total']:>7,} {row['dong_ok']:>7,} {pct:>5.0f}%{flag}")

# ── 3. Merge 결과: 충전소 없음 동 ──────────────────────────────────────────
print('\n' + '='*60)
no_charger = merged[(merged['ev_count'] > 0) & (merged['charger_total'] == 0)]
print(f'[Merge] 전기차 있는데 충전기 0인 동: {len(no_charger)}곳')
print('\n구별 분포:')
print(no_charger.groupby('gu').size().sort_values(ascending=False).to_string())

# ── 4. 이상값 체크 ──────────────────────────────────────────────────────────
print('\n' + '='*60)
print('[이상값] 부족지수 극단값 (상위 10)')
top10 = merged[merged['ev_count']>0].nlargest(10,'shortage_idx')[
    ['gu','dong','ev_count','charger_total','shortage_idx','status']]
print(top10.to_string(index=False))

print('\n[이상값] 충전기 극단값 (상위 10 동)')
top_ch = merged.nlargest(10,'charger_total')[
    ['gu','dong','ev_count','charger_total','fast_total','slow_total']]
print(top_ch.to_string(index=False))

# ── 5. 전체 상태 분포 ──────────────────────────────────────────────────────
print('\n' + '='*60)
print('[상태 분포]')
print(merged['status'].value_counts().to_string())
