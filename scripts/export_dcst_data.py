"""
DM_DCST_SHOP_PRDT_M 테이블 Raw Data 추출 스크립트
- 채널코드 9 제외
- 채널코드 NULL 제외
- 시즌: 23S, 24S, 25S
"""

import snowflake.connector
import pandas as pd
from datetime import datetime
import os
from pathlib import Path
from dotenv import load_dotenv

# .env.local 파일에서 환경변수 로드
script_dir = Path(__file__).parent
project_root = script_dir.parent
env_local_path = project_root / '.env.local'

if env_local_path.exists():
    load_dotenv(env_local_path)
    print(f"환경변수 로드: {env_local_path}")
else:
    env_path = project_root / '.env'
    if env_path.exists():
        load_dotenv(env_path)
        print(f"환경변수 로드: {env_path}")
    else:
        print("경고: .env.local 또는 .env 파일을 찾을 수 없습니다.")

# Snowflake 연결 정보
SNOWFLAKE_CONFIG = {
    'account': os.getenv('SNOWFLAKE_ACCOUNT'),
    'user': os.getenv('SNOWFLAKE_USERNAME'),
    'password': os.getenv('SNOWFLAKE_PASSWORD'),
    'warehouse': os.getenv('SNOWFLAKE_WAREHOUSE'),
    'database': os.getenv('SNOWFLAKE_DATABASE', 'FNF'),
    'schema': os.getenv('SNOWFLAKE_SCHEMA', 'SAP_FNF'),
    'role': os.getenv('SNOWFLAKE_ROLE'),
}

# 브랜드 코드 (전체)
BRAND_CODES = {
    'M': 'MLB',
    'I': 'MLB KIDS',
    'X': 'DISCOVERY',
    'V': 'DUVETICA',
    'ST': 'SERGIO TACCHINI',
}

# 시즌별 기간 설정
SEASONS = {
    '23S': {
        'period_start': '202303',
        'period_end': '202308',
        'current_season_start': '202201',
    },
    '24S': {
        'period_start': '202403',
        'period_end': '202408',
        'current_season_start': '202301',
    },
    '25S': {
        'period_start': '202503',
        'period_end': '202508',
        'current_season_start': '202401',
    },
}


def get_snowflake_connection():
    """Snowflake 연결"""
    return snowflake.connector.connect(**SNOWFLAKE_CONFIG)


def fetch_raw_data(conn, brand_code: str, season: str) -> pd.DataFrame:
    """DM_DCST_SHOP_PRDT_M 테이블 Raw Data 전체 조회"""
    
    season_config = SEASONS[season]
    current_season_start = season_config['current_season_start']
    period_end = season_config['period_end']
    
    query = f"""
    -- DM_DCST_SHOP_PRDT_M Raw Data
    -- 브랜드: {brand_code}, 시즌: {season}
    -- 기간: {current_season_start} ~ {period_end}
    
    select 
        a.PST_YYYYMM,
        a.CORP_CD,
        a.CORP_NM,
        a.BRD_CD,
        a.BRD_NM,
        a.CHNL_CD,
        a.CHNL_NM,
        a.SHOP_CD,
        a.SHOP_NM,
        a.RF_YN,
        a.PRDT_CD,
        a.PRDT_NM,
        a.RYT,
        a.LGT_CST,
        a.CARD_CMS,
        a.SHOP_RNT,
        a.SHOP_DEPRC_CST,
        a.SM_CMS,
        a.DF_SALE_STFF_CMS,
        a.DMGMT_SALE_STFF_CMS,
        a.ALNC_ONLN_CMS,
        a.DSTRB_CMS,
        a.STRG_CST
    from sap_fnf.dm_dcst_shop_prdt_m a
    where a.brd_cd = '{brand_code}'
      and a.corp_cd = '1000'
      and a.chnl_cd not in ('9')
      and a.chnl_cd is not null
      and a.pst_yyyymm between '{current_season_start}' and '{period_end}'
    order by a.pst_yyyymm, a.chnl_cd, a.shop_cd, a.prdt_cd
    """
    
    print(f"  쿼리 실행 중... (기간: {current_season_start} ~ {period_end})")
    
    cursor = conn.cursor()
    cursor.execute(query)
    columns = [desc[0] for desc in cursor.description]
    data = cursor.fetchall()
    cursor.close()
    
    df = pd.DataFrame(data, columns=columns)
    df['SEASON'] = season
    
    return df


def fetch_raw_data_with_item_std(conn, brand_code: str, season: str) -> pd.DataFrame:
    """DM_DCST_SHOP_PRDT_M 테이블 Raw Data + item_std 구분 포함"""
    
    season_config = SEASONS[season]
    period_start = season_config['period_start']
    period_end = season_config['period_end']
    current_season_start = season_config['current_season_start']
    
    year = int(season[:2])
    six_months_before = f'20{year}02'
    
    query = f"""
    -- DM_DCST_SHOP_PRDT_M Raw Data with Item Standard
    -- 브랜드: {brand_code}, 시즌: {season}
    
    with cy_item as (
        select a.prdt_cd  
                , a.sesn
                , a.prdt_hrrc1_nm
                , a.prdt_hrrc2_nm
                , a.prdt_hrrc3_nm
                , case when ('{period_end}' between b.start_yyyymm and b.end_yyyymm) and prdt_hrrc1_nm = '의류' 
                            then '당시즌 의류'
                        when ('{six_months_before}' between b.start_yyyymm and b.end_yyyymm) and prdt_hrrc1_nm = '의류'
                            then '전시즌 의류'
                        when (b.start_yyyymm > '{period_end}') and prdt_hrrc1_nm = '의류' 
                            then '차기시즌 의류'
                        when (b.start_yyyymm < '{six_months_before}') and prdt_hrrc1_nm = '의류'
                            then '과시즌 의류'
                        when prdt_hrrc1_nm='ACC' and prdt_hrrc2_nm='Headwear' 
                            then '모자'
                        when prdt_hrrc1_nm='ACC' and prdt_hrrc2_nm='Shoes' 
                            then '신발'
                        when prdt_hrrc1_nm='ACC' and prdt_hrrc2_nm='Bag' 
                            then '가방'
                        when prdt_hrrc1_nm='ACC' and prdt_hrrc2_nm='Acc_etc' 
                            then '기타ACC'
                        else '기타' end as item_std
        from sap_fnf.mst_prdt a
        left join comm.mst_sesn b
            on a.sesn = b.sesn
        where 1=1
            and brd_cd = '{brand_code}'
    )
    select 
        a.PST_YYYYMM,
        a.CORP_CD,
        a.CORP_NM,
        a.BRD_CD,
        a.BRD_NM,
        a.CHNL_CD,
        a.CHNL_NM,
        a.SHOP_CD,
        a.SHOP_NM,
        a.RF_YN,
        a.PRDT_CD,
        a.PRDT_NM,
        c.SESN,
        c.PRDT_HRRC1_NM,
        c.PRDT_HRRC2_NM,
        c.PRDT_HRRC3_NM,
        c.ITEM_STD,
        a.RYT,
        a.LGT_CST,
        a.CARD_CMS,
        a.SHOP_RNT,
        a.SHOP_DEPRC_CST,
        a.SM_CMS,
        a.DF_SALE_STFF_CMS,
        a.DMGMT_SALE_STFF_CMS,
        a.ALNC_ONLN_CMS,
        a.DSTRB_CMS,
        a.STRG_CST
    from sap_fnf.dm_dcst_shop_prdt_m a
    left join cy_item c on a.prdt_cd = c.prdt_cd
    where a.brd_cd = '{brand_code}'
      and a.corp_cd = '1000'
      and a.chnl_cd not in ('9')
      and a.chnl_cd is not null
      and a.pst_yyyymm between '{current_season_start}' and '{period_end}'
    order by a.pst_yyyymm, a.chnl_cd, a.shop_cd, a.prdt_cd
    """
    
    print(f"  쿼리 실행 중 (item_std 포함)... (기간: {current_season_start} ~ {period_end})")
    
    cursor = conn.cursor()
    cursor.execute(query)
    columns = [desc[0] for desc in cursor.description]
    data = cursor.fetchall()
    cursor.close()
    
    df = pd.DataFrame(data, columns=columns)
    df['QUERY_SEASON'] = season
    
    return df


def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("DM_DCST_SHOP_PRDT_M Raw Data 추출 시작")
    print("=" * 60)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    try:
        conn = get_snowflake_connection()
        print("Snowflake 연결 성공!")
        
        # 브랜드별로 별도 파일 생성
        for brand_code, brand_name in BRAND_CODES.items():
            print(f"\n{'='*60}")
            print(f"브랜드: {brand_name} ({brand_code})")
            print(f"{'='*60}")
            
            output_file = f'dcst_raw_data_{brand_code}_{timestamp}.xlsx'
            
            with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
                
                for season in ['23S', '24S', '25S']:
                    print(f"\n  {season} 데이터 조회 중...")
                    
                    # Raw Data with item_std
                    df = fetch_raw_data_with_item_std(conn, brand_code, season)
                    
                    if len(df) == 0:
                        print(f"    - {season} 데이터 없음")
                        continue
                    
                    # 시트 이름은 31자 제한이 있어서 간단하게
                    sheet_name = f'{season}_RAW'
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
                    print(f"    - {season} Raw Data: {len(df):,} 행")
                    
                    # 채널코드별 요약
                    summary = df.groupby(['CHNL_CD', 'CHNL_NM', 'ITEM_STD']).agg({
                        'RYT': 'sum',
                        'LGT_CST': 'sum',
                        'STRG_CST': 'sum',
                        'CARD_CMS': 'sum',
                        'SHOP_RNT': 'sum',
                        'SHOP_DEPRC_CST': 'sum',
                        'ALNC_ONLN_CMS': 'sum',
                        'SM_CMS': 'sum',
                        'DF_SALE_STFF_CMS': 'sum',
                        'DMGMT_SALE_STFF_CMS': 'sum',
                        'DSTRB_CMS': 'sum',
                    }).reset_index()
                    
                    # 백만원 단위 컬럼 추가
                    for col in ['RYT', 'LGT_CST', 'STRG_CST', 'CARD_CMS', 'SHOP_RNT', 
                               'SHOP_DEPRC_CST', 'ALNC_ONLN_CMS', 'SM_CMS', 
                               'DF_SALE_STFF_CMS', 'DMGMT_SALE_STFF_CMS', 'DSTRB_CMS']:
                        summary[f'{col}_MIL'] = (summary[col] / 1000000).round(0)
                    
                    summary.to_excel(writer, sheet_name=f'{season}_SUMMARY', index=False)
                    print(f"    - {season} Summary: {len(summary):,} 행")
            
            print(f"\n  출력 파일: {output_file}")
        
        conn.close()
        
        print("\n" + "=" * 60)
        print(f"전체 브랜드 데이터 추출 완료!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n오류 발생: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == '__main__':
    main()
