import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const brandCode = searchParams.get('brandCode') || 'M';
  const season = searchParams.get('season') || '23S';

  try {
    // 시즌에서 연도와 시즌타입 추출
    const year = parseInt(season.slice(0, 2));
    const seasonType = season.slice(2); // S, F, N
    
    // 시즌별 기간 설정
    let periodEnd: string; // 시즌 종료월 (기말재고 기준)
    let currentSeasonStart: string; // 당시즌 의류 판매 시작월
    
    if (seasonType === 'S') {
      // S시즌: 기말재고는 8월말, 판매는 전년 1월부터
      periodEnd = `20${year}08`;
      currentSeasonStart = `20${year - 1}01`;
    } else if (seasonType === 'F') {
      // F시즌: 기말재고는 다음해 2월말, 판매는 해당년 3월부터
      periodEnd = `20${year + 1}02`;
      currentSeasonStart = `20${year}03`;
    } else {
      // N시즌: 기본값
      periodEnd = `20${year}12`;
      currentSeasonStart = `20${year - 1}07`;
    }

    const query = `
-- 발주금액(당시즌의류) = 기말재고 TAG금액(당시즌의류) + 판매TAG(당시즌의류)
-- 판매율 = 판매TAG(당시즌의류) / 발주금액(당시즌의류)

-- 당시즌 의류 기준 설정
with cy_item as (
    select a.prdt_cd  
            , a.sesn
            , a.prdt_hrrc1_nm
            , case when ('${periodEnd}' between b.start_yyyymm and b.end_yyyymm) and prdt_hrrc1_nm = '의류' 
                        then '당시즌 의류'
                    else '기타' end as item_std
    from sap_fnf.mst_prdt a
    left join comm.mst_sesn b
        on a.sesn = b.sesn
    where 1=1
        and brd_cd = '${brandCode}'
)
-- 기말재고 TAG금액 (당시즌 의류만)
, end_stock_current_season as (
    select sum(a.end_stock_tag_amt) as end_stock_tag_amt
    from sap_fnf.dw_ivtr_shop_prdt_m a
    join cy_item b
      on a.prdt_cd = b.prdt_cd
    where a.brd_cd = '${brandCode}'
      and a.yyyymm = '${periodEnd}'
      and b.item_std = '당시즌 의류'
)
-- 판매TAG (당시즌 의류만)
, sales_tag_current_season as (
    select sum(a.tag_sale_amt) as tag_sale_amt
    from sap_fnf.dm_pl_shop_prdt_m a
    join cy_item b
      on a.prdt_cd = b.prdt_cd
    where a.brd_cd = '${brandCode}'
      and a.corp_cd = '1000'
      and a.chnl_cd not in ('9')
      and a.chnl_cd is not null
      and a.pst_yyyymm between '${currentSeasonStart}' and '${periodEnd}'
      and b.item_std = '당시즌 의류'
)
-- 결과 계산
select 
    round(coalesce(e.end_stock_tag_amt, 0) / 1000000) as END_STOCK_TAG_AMT,
    round(coalesce(s.tag_sale_amt, 0) / 1000000) as SALES_TAG_AMT,
    round((coalesce(e.end_stock_tag_amt, 0) + coalesce(s.tag_sale_amt, 0)) / 1000000) as ORDER_AMT,
    case 
        when (coalesce(e.end_stock_tag_amt, 0) + coalesce(s.tag_sale_amt, 0)) = 0 then 0
        else round(coalesce(s.tag_sale_amt, 0) / (coalesce(e.end_stock_tag_amt, 0) + coalesce(s.tag_sale_amt, 0)) * 100, 1)
    end as SALES_RATE
from end_stock_current_season e
cross join sales_tag_current_season s
`;

    const rows = await executeQuery(query);
    const result = rows[0] || { END_STOCK_TAG_AMT: 0, SALES_TAG_AMT: 0, ORDER_AMT: 0, SALES_RATE: 0 };

    return NextResponse.json({
      success: true,
      data: {
        endStockTagAmt: result.END_STOCK_TAG_AMT,
        salesTagAmt: result.SALES_TAG_AMT,
        orderAmt: result.ORDER_AMT,
        salesRate: result.SALES_RATE
      },
      params: {
        brandCode,
        season,
        periodEnd,
        currentSeasonStart
      }
    });
  } catch (error) {
    console.error('Order Amount API Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

