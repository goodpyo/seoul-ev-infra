import sys
sys.stdout.reconfigure(encoding='utf-8')
import json, re, pandas as pd
from collections import Counter, defaultdict

GU_RE   = re.compile(r'([가-힣]+구)')
DONG_RE = re.compile(r'([가-힣0-9]+[동읍면리])')
SLOW_TYPES = {'02','07'}
SEOUL_GU = {
    '강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구',
    '노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구',
    '성동구','성북구','송파구','양천구','영등포구','용산구','은평구',
    '종로구','중구','중랑구',
}

# ── 1. API 충전기 데이터 ─────────────────────────────────────────────────────
data = json.load(open('data/seoul_chargers_api.json', encoding='utf-8'))
print(f'[API] 총 충전기: {len(data):,}기\n')

gu_stats = defaultdict(lambda: {'total':0,'dong_ok':0,'dong_none':0,'dong_bad':[]})

for item in data:
    addr = item.get('addr','')
    if not addr.startswith('서울특별시'):
        continue
    gm = GU_RE.search(addr)
    if not gm:
        continue
    gu = gm.group(1)
    if gu not in SEOUL_GU:
        continue

    rest = addr[gm.end():]
    dm   = DONG_RE.search(rest)
    dong = dm.group(1) if dm else None

    s = gu_stats[gu]
    s['total'] += 1
    if dong is None:
        s['dong_none'] += 1
    else:
        # 오탐 의심: 도로명/건물명에서 온 경우
        bad_hints = ['로','길','대로','자동','아리','구천면','왕십리','천면','산면']
        is_bad = any(h in dong for h in bad_hints) or len(dong) <= 1
        if is_bad:
            s['dong_bad'].append(dong)
        else:
            s['dong_ok'] += 1

print(f"{'구':<8} {'총기':>6} {'동OK':>6} {'None':>6} {'오탐':>6}  오탐샘플")
print('-'*70)
for gu in sorted(SEOUL_GU):
    s = gu_stats[gu]
    bad_cnt = len(s['dong_bad'])
    bad_sample = ', '.join(sorted(set(s['dong_bad']))[:3])
    none_pct = s['dong_none'] / max(s['total'], 1) * 100
    flag = ' ⚠' if none_pct > 60 or bad_cnt > 100 else ''
    print(f"{gu:<8} {s['total']:>6,} {s['dong_ok']:>6,} {s['dong_none']:>6,} {bad_cnt:>6,}  {bad_sample}{flag}")

total_all  = sum(s['total']     for s in gu_stats.values())
total_ok   = sum(s['dong_ok']   for s in gu_stats.values())
total_none = sum(s['dong_none'] for s in gu_stats.values())
total_bad  = sum(len(s['dong_bad']) for s in gu_stats.values())
print('-'*70)
print(f"{'합계':<8} {total_all:>6,} {total_ok:>6,} {total_none:>6,} {total_bad:>6,}")
print(f"\nGPS 있는 충전기(lat!=0): {sum(1 for x in data if float(x.get('lat') or 0) != 0):,}기")

# ── 2. 전기차 등록 데이터 ────────────────────────────────────────────────────
print('\n' + '='*70)
print('[전기차] 구별 등록 현황')
raw = pd.read_excel(
    '서울시 자치구 읍면동별 연료별 자동차 등록현황(행정동)(26년4월).xlsx',
    engine='openpyxl', skiprows=8, header=None
)
raw.iloc[:,0] = raw.iloc[:,0].ffill()
raw.iloc[:,2] = raw.iloc[:,2].ffill()
mask = raw.iloc[:,3].astype(str).str.strip() == '전기'
ev = raw[mask & raw.iloc[:,4].notna()].copy()

rows = []
for _, r in ev.iterrows():
    gu_raw  = str(r.iloc[0])
    dong_raw= str(r.iloc[2])
    gm2 = GU_RE.search(gu_raw)
    gu2 = gm2.group(1) if gm2 else '기타'
    dm2 = DONG_RE.search(dong_raw)
    dong2 = dm2.group(1) if dm2 else '기타'
    rows.append({'gu': gu2, 'dong': dong2, 'ev': int(float(r.iloc[4]))})

ev_df = pd.DataFrame(rows)
gu_ev = ev_df.groupby('gu')['ev'].sum().sort_values(ascending=False)

print(f"\n{'구':<10} {'전기차(대)':>10} {'행정동수':>8}")
print('-'*30)
for gu, cnt in gu_ev.items():
    dong_cnt = ev_df[ev_df['gu']==gu]['dong'].nunique()
    print(f"{gu:<10} {cnt:>10,} {dong_cnt:>8}")
print('-'*30)
print(f"{'합계':<10} {gu_ev.sum():>10,}")

# 비서울 구 확인
non_seoul = [g for g in gu_ev.index if g not in SEOUL_GU and g != '기타']
if non_seoul:
    print(f'\n⚠ 비서울 구 발견: {non_seoul}')
else:
    print('\n✓ 비서울 구 없음')
