import sys, json, pandas as pd
sys.stdout.reconfigure(encoding='utf-8')

# ── 1. API 데이터에서 목4동 관련 확인 ─────────────────────────────────────
data = json.load(open('data/seoul_chargers_api.json', encoding='utf-8'))
mok4_api = [x for x in data if '목4동' in x.get('statNm','') or '목4동' in x.get('addr','')]
print(f'[API] 목4동 언급된 충전소: {len(mok4_api)}건')
for x in mok4_api[:10]:
    print(f'  이름: {x.get("statNm")} | 주소: {x.get("addr")} | GPS: {x.get("lat")},{x.get("lng")}')

# ── 2. ev.or.kr 엑셀에서 서울 양천구 목4동 관련 확인 ──────────────────────
print()
df = pd.read_excel('충전소 리스트.xlsx', sheet_name='Sheet1', skiprows=2, header=0)
seoul = df[df['지역'].astype(str).str.contains('서울', na=False)]
yc    = seoul[seoul['시군구'].astype(str).str.contains('양천', na=False)]
print(f'[ev.or.kr] 서울 양천구 충전기: {len(yc)}건')

# 목4동 관련 (충전소명 또는 주소)
mok4 = yc[
    yc['충전소'].astype(str).str.contains('목4동', na=False) |
    yc['주소'].astype(str).str.contains('목4동', na=False) |
    yc['지번 주소'].astype(str).str.contains('목4동', na=False)
]
print(f'[ev.or.kr] 목4동 관련: {len(mok4)}건')
cols = ['충전소','충전기ID','주소','지번 주소']
print(mok4[cols].drop_duplicates('충전소').to_string(index=False))

# ── 3. 두 소스 충전소 수 비교 (서울 전체) ──────────────────────────────────
print()
print('=== 두 데이터 소스 비교 ===')
print(f'API (한국환경공단):   서울 충전기 {len(data):,}기')
seoul_ev = df[df['지역'].astype(str).str.contains('서울', na=False)]
print(f'ev.or.kr (환경부포털): 서울 충전기 {len(seoul_ev):,}기')

# 양천구 동별 비교
print()
print('=== ev.or.kr 양천구 지번주소에서 동 추출 ===')
import re
DONG_RE = re.compile(r'([가-힣0-9]+[동읍면리])')
def get_dong(addr):
    if pd.isna(addr): return None
    m = DONG_RE.search(str(addr))
    return m.group(1) if m else None

yc2 = yc.copy()
yc2['dong'] = yc2['지번 주소'].apply(get_dong)
print(yc2['dong'].value_counts().head(20).to_string())
