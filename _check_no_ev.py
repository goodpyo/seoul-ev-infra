import sys
sys.stdout.reconfigure(encoding='utf-8')
from data_processor import load_ev_data, load_charger_data, merge_data
import pandas as pd

ev_df      = load_ev_data()
charger_df = load_charger_data()
merged     = merge_data(ev_df, charger_df)

# 해당없음 = ev_count==0 인 행 (충전기는 있는데 EV 등록 0)
no_ev = merged[merged['ev_count'] == 0].copy()
print(f'ev_count=0 인 동: {len(no_ev)}곳')
print()

# EV 데이터에 있는 동 목록
ev_dongs = set(zip(ev_df['gu'], ev_df['dong']))

# 충전기 데이터에 있는 동 목록
charger_dongs = set(
    zip(charger_df['gu'].fillna(''), charger_df['dong'].fillna(''))
)

# 해당없음 동이 EV 데이터에 있는지 확인
print(f'{"구":<10} {"동":<15} {"충전기":>6}  EV데이터에있나?')
print('-'*50)
for _, r in no_ev.sort_values('charger_total', ascending=False).head(30).iterrows():
    in_ev = '있음' if (r['gu'], r['dong']) in ev_dongs else '없음 ←'
    print(f"{r['gu']:<10} {r['dong']:<15} {r['charger_total']:>6}  {in_ev}")

print()
# EV 데이터에는 있는데 merged에서 ev=0인 동 (이름 불일치 가능성)
print('=== EV 데이터 동 목록에는 있지만 merge 후 ev=0인 동 ===')
issue = [(r['gu'], r['dong']) for _, r in no_ev.iterrows()
         if (r['gu'], r['dong']) in ev_dongs]
print(f'이런 케이스: {len(issue)}건')

# EV 데이터 전체 동 수 vs merged에서 ev>0인 동 수
ev_with_data = merged[merged['ev_count'] > 0]
print(f'\nEV 엑셀 행정동 수:  {len(ev_df)}개')
print(f'Merge 후 ev>0인 동: {len(ev_with_data)}개')
print(f'Merge 후 ev=0인 동: {len(no_ev)}개 (충전기만 있고 EV 매칭 없음)')
