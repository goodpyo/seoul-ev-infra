import sys
sys.stdout.reconfigure(encoding='utf-8')
import pandas as pd, re

DONG_RE   = re.compile(r'([가-힣0-9]+[동읍면리])')
GU_DONG_RE= re.compile(r'([가-힣]+구)\s+([가-힣0-9]+[동읍면리])')
GU_RE     = re.compile(r'([가-힣]+구)')

raw = pd.read_excel(
    '서울시 자치구 읍면동별 연료별 자동차 등록현황(행정동)(26년4월).xlsx',
    engine='openpyxl', skiprows=8, header=None
)
raw.iloc[:,0] = raw.iloc[:,0].ffill()
raw.iloc[:,2] = raw.iloc[:,2].ffill()
mask = raw.iloc[:,3].astype(str).str.strip() == '전기'
ev = raw[mask & raw.iloc[:,4].notna()].copy()

# 의심 동 이름을 만드는 원본 셀 확인
suspicious = ['성동', '4가동', '6가동', '3동', '4동', '7동', '8동', '목4동']

print('=== 의심 동 이름 원본 셀 확인 ===\n')
for _, r in ev.iterrows():
    gu_raw  = str(r.iloc[0])
    dong_raw= str(r.iloc[2])
    ev_cnt  = int(float(r.iloc[4]))

    # _parse_gu_dong 로직 재현
    gm = GU_RE.search(gu_raw)
    gu = gm.group(1) if gm else '기타'

    m2 = GU_DONG_RE.search(dong_raw)
    if m2:
        dong = m2.group(2)
    else:
        m3 = DONG_RE.search(dong_raw)
        dong = m3.group(1) if m3 else '기타'

    if dong in suspicious:
        print(f"파싱결과 동='{dong}' | 구열 원본: '{gu_raw.strip()}' | 동열 원본: '{dong_raw.strip()}' | 전기차: {ev_cnt}")

print('\n=== 전체 EV 동 목록 (구별) ===')
from collections import defaultdict
gu_dongs = defaultdict(list)
for _, r in ev.iterrows():
    gu_raw  = str(r.iloc[0])
    dong_raw= str(r.iloc[2])
    gm = GU_RE.search(gu_raw)
    gu = gm.group(1) if gm else '기타'
    m2 = GU_DONG_RE.search(dong_raw)
    if m2:
        dong = m2.group(2)
    else:
        m3 = DONG_RE.search(dong_raw)
        dong = m3.group(1) if m3 else '기타'
    gu_dongs[gu].append(dong)

# 동 수가 적은 구만 출력
for gu in sorted(gu_dongs):
    dongs = sorted(set(gu_dongs[gu]))
    if len(dongs) <= 5 or any(d in suspicious for d in dongs):
        print(f"\n{gu} ({len(dongs)}개): {dongs}")
