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
    let periodEnd: string;
    let periodStart: string;
    let currentSeasonStart: string;
    
    if (seasonType === 'S') {
      periodEnd = `20${year}08`;
      periodStart = `20${year}03`;
      currentSeasonStart = `20${year - 1}01`;
    } else if (seasonType === 'F') {
      periodEnd = `20${year + 1}02`;
      periodStart = `20${year}09`;
      currentSeasonStart = `20${year}03`;
    } else {
      periodEnd = `20${year}12`;
      periodStart = `20${year}01`;
      currentSeasonStart = `20${year - 1}07`;
    }

    // 6개월 전 기준
    const sixMonthsBefore = seasonType === 'S' 
      ? `20${year}02` 
      : `20${year}08`;

    const query = `
-- 부가세차감(출고)매출 = VAT_EXC_SALE_AMT + DSTRB_CMS
-- 판매TAG, 실판가와 동일한 기준

with cy_item as (
    select a.prdt_cd  
            , a.sesn
            , a.prdt_hrrc1_nm
            , case when ('${periodEnd}' between b.start_yyyymm and b.end_yyyymm) and prdt_hrrc1_nm = '의류' 
                        then '당시즌 의류'
                    when ('${sixMonthsBefore}' between b.start_yyyymm and b.end_yyyymm) and prdt_hrrc1_nm = '의류'
                        then '전시즌 의류'
                    when (b.start_yyyymm > '${periodEnd}') and prdt_hrrc1_nm = '의류' 
                        then '차기시즌 의류'
                    when (b.start_yyyymm < '${sixMonthsBefore}') and prdt_hrrc1_nm = '의류'
                        then '과시즌 의류'
                    when prdt_hrrc1_nm='ACC' then 'ACC'
                    else '기타' end as item_std
    from sap_fnf.mst_prdt a
    left join comm.mst_sesn b
        on a.sesn = b.sesn
    where 1=1
        and brd_cd = '${brandCode}'
)
-- 당시즌 의류 매출 (전년 1월부터 시즌 종료까지)
, current_season_apparel as (
    select case 
            when b.mgmt_chnl_cd = '4' then '온라인(직)'
            when b.mgmt_chnl_cd = '5' then '온라인(제휴)'
            when b.mgmt_chnl_cd in ('3', '11', 'C3') then '직영(가두)'
            when b.mgmt_chnl_nm like '아울렛%' then '아울렛(직)'
            when b.mgmt_chnl_nm = '백화점' then '백화점'
            when b.mgmt_chnl_nm = '대리점' then '대리점'
            when b.mgmt_chnl_nm = '면세점' then '면세점'
            when a.chnl_cd = '8' then '사입'
            when a.chnl_cd = '99' then '기타'
            else b.mgmt_chnl_nm
         end as chnl_nm
         , sum(coalesce(a.vat_exc_act_sale_amt, 0) - coalesce(a.dstrb_cms, 0)) as vat_exc_sale_amt
         , sum(a.act_sale_amt) as act_sale_amt
    from sap_fnf.dm_pl_shop_prdt_m a
    join sap_fnf.mst_shop b
      on a.brd_cd = b.brd_cd and a.shop_cd = b.sap_shop_cd
    join cy_item c
      on a.prdt_cd = c.prdt_cd
    where a.brd_cd = '${brandCode}'
      and a.corp_cd = '1000'
      and a.chnl_cd not in ('9')
      and a.chnl_cd is not null
      and a.pst_yyyymm between '${currentSeasonStart}' and '${periodEnd}'
      and c.item_std = '당시즌 의류'
    group by 1
)
-- 과시즌 의류 + 전시즌 의류 + ACC 매출 (시즌 기간 내)
, other_sales as (
    select case 
            when b.mgmt_chnl_cd = '4' then '온라인(직)'
            when b.mgmt_chnl_cd = '5' then '온라인(제휴)'
            when b.mgmt_chnl_cd in ('3', '11', 'C3') then '직영(가두)'
            when b.mgmt_chnl_nm like '아울렛%' then '아울렛(직)'
            when b.mgmt_chnl_nm = '백화점' then '백화점'
            when b.mgmt_chnl_nm = '대리점' then '대리점'
            when b.mgmt_chnl_nm = '면세점' then '면세점'
            when a.chnl_cd = '8' then '사입'
            when a.chnl_cd = '99' then '기타'
            else b.mgmt_chnl_nm
         end as chnl_nm
         , sum(coalesce(a.vat_exc_act_sale_amt, 0) - coalesce(a.dstrb_cms, 0)) as vat_exc_sale_amt
         , sum(a.act_sale_amt) as act_sale_amt
    from sap_fnf.dm_pl_shop_prdt_m a
    join sap_fnf.mst_shop b
      on a.brd_cd = b.brd_cd and a.shop_cd = b.sap_shop_cd
    join cy_item c
      on a.prdt_cd = c.prdt_cd
    where a.brd_cd = '${brandCode}'
      and a.corp_cd = '1000'
      and a.chnl_cd not in ('9')
      and a.chnl_cd is not null
      and a.pst_yyyymm between '${periodStart}' and '${periodEnd}'
      and c.item_std not in ('당시즌 의류', '차기시즌 의류')
    group by 1
)
-- 합산
, combined as (
    select chnl_nm, vat_exc_sale_amt, act_sale_amt from current_season_apparel
    union all
    select chnl_nm, vat_exc_sale_amt, act_sale_amt from other_sales
)
-- 채널별 합계
, channel_summary as (
    select 
        chnl_nm,
        sum(vat_exc_sale_amt) as vat_exc_sale_amt,
        sum(act_sale_amt) as act_sale_amt
    from combined
    group by 1
)
-- 전체 합계
, total_summary as (
    select '전체' as chnl_nm
         , sum(vat_exc_sale_amt) as vat_exc_sale_amt
         , sum(act_sale_amt) as act_sale_amt
    from channel_summary
)
select chnl_nm as CHNL_NM
    , round(vat_exc_sale_amt / 1000000) as VAT_EXC_SALE_AMT
    , round(act_sale_amt / 1000000) as ACT_SALE_AMT
from channel_summary
union all
select chnl_nm as CHNL_NM
    , round(vat_exc_sale_amt / 1000000) as VAT_EXC_SALE_AMT
    , round(act_sale_amt / 1000000) as ACT_SALE_AMT
from total_summary
order by 
    case CHNL_NM
        when '전체' then 0
        when '플래그쉽' then 1
        when '백화점' then 2
        when '대리점' then 3
        when '직영(가두)' then 4
        when '온라인(직)' then 5
        when '온라인(제휴)' then 6
        when '면세점' then 7
        when 'RF' then 8
        when '아울렛(직)' then 9
        when '사입' then 10
        when '기타' then 11
        else 12
    end
`;

    const rows = await executeQuery(query);

    // 채널별 데이터와 전체 데이터 분리
    const channelData = rows.filter((row: any) => row.CHNL_NM !== '전체');
    const totalRow = rows.find((row: any) => row.CHNL_NM === '전체');

    return NextResponse.json({
      success: true,
      data: channelData,
      total: totalRow?.VAT_EXC_SALE_AMT || 0,
      totalActSale: totalRow?.ACT_SALE_AMT || 0,
      params: {
        brandCode,
        season,
        periodStart,
        periodEnd,
        currentSeasonStart
      }
    });
  } catch (error) {
    console.error('VAT Excluded Sales API Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

