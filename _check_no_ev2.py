import sys
sys.stdout.reconfigure(encoding='utf-8')
from data_processor import load_ev_data, load_charger_data
import pandas as pd

ev_df      = load_ev_data()
charger_df = load_charger_data()

# 유효 행정동 목록
from data_processor import get_seoul_dong_polygons
polygons    = get_seoul_dong_polygons()
valid_dongs = set(dong for _, dong, _ in polygons)

# charger_df에서 법정동 이름 남은 것 확인
bad = charger_df[
    charger_df['dong'].notna() &
    ~charger_df['dong'].isin(valid_dongs)
]
print(f'아직 법정동으로 남은 충전기: {len(bad)}기')

# 출처별 분류 (xl_ 로 시작하면 엑셀, 아니면 API)
bad_excel = bad[bad['stat_id'].str.startswith('xl_')]
bad_api   = bad[~bad['stat_id'].str.startswith('xl_')]
print(f'  API 출처: {len(bad_api)}기 (lat=0: {(bad_api["lat"]==0).sum()}기)')
print(f'  엑셀 출처: {len(bad_excel)}기 (lat=0: {(bad_excel["lat"]==0).sum()}기)')
print()

# API 출처인데 아직 법정동인 케이스 - GPS 매핑에서 왜 빠졌나
from data_processor import DONG_LOOKUP_CACHE
import json
lookup = json.load(open(DONG_LOOKUP_CACHE, encoding='utf-8'))
api_still_bad = bad_api[~bad_api['stat_id'].isin(lookup)]
print(f'API인데 lookup에 없는 것: {len(api_still_bad)}기')
if len(api_still_bad) > 0:
    from collections import Counter
    print(Counter(zip(api_still_bad['gu'], api_still_bad['dong'])).most_common(10))
