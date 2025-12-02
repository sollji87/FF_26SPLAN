import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export interface EndStockData {
  ITEM_STD: string;
  SESN: string;
  CY_END_STOCK_TAG_AMT: number;
  YOY: number;
}

const getEndStockQuery = (brandCode: string, targetYYYYMM: string, pyYYYYMM: string) => {
  return `
-- cy_item : 당해 아이템 구분 기준
with cy_item as (
    select a.prdt_cd  
            , a.sesn
            , a.prdt_hrrc1_nm
            , a.prdt_hrrc2_nm
            , a.prdt_hrrc3_nm
            , case when ('${targetYYYYMM}' between b.start_yyyymm and b.end_yyyymm) and prdt_hrrc1_nm = '의류' 
                        then decode(a.sesn, 'N', 'S', a.sesn) || ' ' || a.prdt_hrrc1_nm
                    when (to_char(add_months(to_date('${targetYYYYMM}', 'YYYYMM'), -6), 'YYYYMM') between b.start_yyyymm and b.end_yyyymm) and prdt_hrrc1_nm = '의류'
                        then decode(a.sesn, 'N', 'S', a.sesn) || ' ' || a.prdt_hrrc1_nm
                    when (b.start_yyyymm > '${targetYYYYMM}') and prdt_hrrc1_nm = '의류' 
                        then '차기시즌 의류'
                    when (b.start_yyyymm < to_char(add_months(to_date('${targetYYYYMM}', 'YYYYMM'), -6), 'YYYYMM')) and prdt_hrrc1_nm = '의류'
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
        and brd_cd = '${brandCode}'
)
-- py_item : 전년 아이템 구분 기준
, py_item as (
    select a.prdt_cd  
            , a.sesn
            , a.prdt_hrrc1_nm
            , a.prdt_hrrc2_nm
            , a.prdt_hrrc3_nm
            , case when ('${pyYYYYMM}' between b.start_yyyymm and b.end_yyyymm) and prdt_hrrc1_nm = '의류' 
                        then (left(a.sesn,2)+1)::int || decode(right(a.sesn,1), 'N', 'S', right(a.sesn,1)) || ' ' || a.prdt_hrrc1_nm
                    when (to_char(add_months(to_date('${pyYYYYMM}', 'YYYYMM'), -6), 'YYYYMM') between b.start_yyyymm and b.end_yyyymm) and prdt_hrrc1_nm = '의류'
                        then (left(a.sesn,2)+1)::int || decode(right(a.sesn,1), 'N', 'S', right(a.sesn,1)) || ' ' || a.prdt_hrrc1_nm
                    when (b.start_yyyymm > '${pyYYYYMM}') and prdt_hrrc1_nm = '의류' 
                        then '차기시즌 의류'
                    when (b.start_yyyymm < to_char(add_months(to_date('${pyYYYYMM}', 'YYYYMM'), -6), 'YYYYMM')) and prdt_hrrc1_nm = '의류'
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
        and brd_cd = '${brandCode}'
)
-- base: 필요한 데이터
, base as (
    -- 당해
    select 'cy' as div
        , b.item_std as item_std
        , sum(a.end_stock_tag_amt) as end_stock_tag_amt
    from sap_fnf.dw_ivtr_shop_prdt_m a
    left join cy_item b
    on a.prdt_cd = b.prdt_cd
    where 1=1 
    and a.brd_cd = '${brandCode}'
    and a.yyyymm = '${targetYYYYMM}'
    and a.sesn is not null
    group by b.item_std
    -- 전년
    union all
    select 'py' as div
        , b.item_std as item_std
        , sum(a.end_stock_tag_amt) as end_stock_tag_amt
    from sap_fnf.dw_ivtr_shop_prdt_m a
    left join py_item b
    on a.prdt_cd = b.prdt_cd
    where 1=1 
    and a.brd_cd = '${brandCode}'
    and a.yyyymm = '${pyYYYYMM}'
    and a.sesn is not null
    group by b.item_std
)
-- 아이템별 합계
, item_summary as (
    select item_std
            , sum(case when div='cy' then end_stock_tag_amt else 0 end) as cy_end_stock_tag_amt
            , round( sum(case when div='cy' then end_stock_tag_amt else 0 end)
                / nullif(sum(case when div='py' then end_stock_tag_amt else 0 end), 0)*100
                , 0) as yoy
    from base
    group by item_std
)
-- 시즌별 합계 (시즌별 뷰용)
, season_summary as (
    select a.sesn
            , sum(a.end_stock_tag_amt) as cy_end_stock_tag_amt
    from sap_fnf.dw_ivtr_shop_prdt_m a
    where 1=1 
    and a.brd_cd = '${brandCode}'
    and a.yyyymm = '${targetYYYYMM}'
    and a.sesn is not null
    group by a.sesn
)
-- 시즌별 아이템 상세 (시즌별 뷰에서 아이템 나열용)
, season_item_detail as (
    select b.item_std
            , a.sesn
            , sum(a.end_stock_tag_amt) as cy_end_stock_tag_amt
    from sap_fnf.dw_ivtr_shop_prdt_m a
    left join cy_item b
    on a.prdt_cd = b.prdt_cd
    where 1=1 
    and a.brd_cd = '${brandCode}'
    and a.yyyymm = '${targetYYYYMM}'
    and a.sesn is not null
    group by b.item_std, a.sesn
)
select item_std
        , null as sesn
        , cy_end_stock_tag_amt
        , yoy
from item_summary
union all
select 'SEASON_' || sesn as item_std
        , sesn
        , cy_end_stock_tag_amt
        , null as yoy
from season_summary
union all
select 'SEASON_ITEM_' || sesn || '_' || item_std as item_std
        , sesn
        , cy_end_stock_tag_amt
        , null as yoy
from season_item_detail
  `;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brandCode = searchParams.get('brandCode') || 'M';
    const season = searchParams.get('season') || '25S';
    
    // 시즌에 따른 YYYYMM 계산
    const seasonYear = parseInt('20' + season.substring(0, 2));
    const seasonType = season.substring(2, 3);
    
    // S시즌은 8월말 (08), F시즌은 2월말 (02)
    const targetYYYYMM = seasonType === 'S' ? `${seasonYear}08` : `${seasonYear}02`;
    const pyYYYYMM = seasonType === 'S' ? `${seasonYear - 1}08` : `${seasonYear - 1}02`;
    
    const query = getEndStockQuery(brandCode, targetYYYYMM, pyYYYYMM);
    const results = await executeQuery<EndStockData>(query);
    
    return NextResponse.json({ 
      success: true, 
      data: results,
      season,
      targetYYYYMM,
      pyYYYYMM
    });
  } catch (error) {
    console.error('Error fetching end stock data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

