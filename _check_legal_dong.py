"""
법정동으로 잘못 파싱되는 케이스 파악:
행정동 목록에 없는 dong 이름을 가진 충전소 확인
"""
import sys, json, re
sys.stdout.reconfigure(encoding='utf-8')
from data_processor import load_charger_data, get_seoul_dong_polygons

charger_df = load_charger_data()
polygons   = get_seoul_dong_polygons()

# 유효한 행정동 이름 집합
valid_dongs = set(dong for _, dong, _ in polygons)

# dong 있지만 유효 행정동 목록에 없는 것 (= 법정동 또는 오탐)
bad = charger_df[
    charger_df['dong'].notna() &
    ~charger_df['dong'].isin(valid_dongs)
]
print(f'법정동/오탐으로 파싱된 충전기: {len(bad):,}기')
print()

from collections import Counter
cnt = Counter(zip(bad['gu'], bad['dong']))
print(f'{"구":<10} {"파싱된dong":<15} {"충전기수":>6}')
print('-'*35)
for (gu, dong), n in cnt.most_common(20):
    print(f'{gu:<10} {dong:<15} {n:>6}')
