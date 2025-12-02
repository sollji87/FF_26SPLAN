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
    let pyPeriodEnd: string;
    let pyPeriodStart: string;
    let pyCurrentSeasonStart: string;
    
    if (seasonType === 'S') {
      periodEnd = `20${year}08`;
      periodStart = `20${year}03`;
      currentSeasonStart = `20${year - 1}01`;
      pyPeriodEnd = `20${year - 1}08`;
      pyPeriodStart = `20${year - 1}03`;
      pyCurrentSeasonStart = `20${year - 2}01`;
    } else if (seasonType === 'F') {
      periodEnd = `20${year + 1}02`;
      periodStart = `20${year}09`;
      currentSeasonStart = `20${year}03`;
      pyPeriodEnd = `20${year}02`;
      pyPeriodStart = `20${year - 1}09`;
      pyCurrentSeasonStart = `20${year - 1}03`;
    } else {
      periodEnd = `20${year}12`;
      periodStart = `20${year}01`;
      currentSeasonStart = `20${year - 1}07`;
      pyPeriodEnd = `20${year - 1}12`;
      pyPeriodStart = `20${year - 1}01`;
      pyCurrentSeasonStart = `20${year - 2}07`;
    }

    const sixMonthsBefore = seasonType === 'S' 
      ? `20${year}02` 
      : `20${year}08`;
    const pySixMonthsBefore = seasonType === 'S'
      ? `20${year - 1}02`
      : `20${year - 1}08`;

    const query = `
-- 실판가 매출
with cy_item as (
    select a.prdt_cd  
            , a.sesn
            , a.prdt_hrrc1_nm
            , a.prdt_hrrc2_nm
            , a.prdt_hrrc3_nm
            , case when ('${periodEnd}' between b.start_yyyymm and b.end_yyyymm) and prdt_hrrc1_nm = '의류' 
                        then '당시즌 의류'
                    when ('${sixMonthsBefore}' between b.start_yyyymm and b.end_yyyymm) and prdt_hrrc1_nm = '의류'
                        then '전시즌 의류'
                    when (b.start_yyyymm > '${periodEnd}') and prdt_hrrc1_nm = '의류' 
                        then '차기시즌 의류'
                    when (b.start_yyyymm < '${sixMonthsBefore}') and prdt_hrrc1_nm = '의류'
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
, py_item as (
    select a.prdt_cd  
            , a.sesn
            , a.prdt_hrrc1_nm
            , a.prdt_hrrc2_nm
            , a.prdt_hrrc3_nm
            , case when ('${pyPeriodEnd}' between b.start_yyyymm and b.end_yyyymm) and prdt_hrrc1_nm = '의류' 
                        then '당시즌 의류'
                    when ('${pySixMonthsBefore}' between b.start_yyyymm and b.end_yyyymm) and prdt_hrrc1_nm = '의류'
                        then '전시즌 의류'
                    when (b.start_yyyymm > '${pyPeriodEnd}') and prdt_hrrc1_nm = '의류' 
                        then '차기시즌 의류'
                    when (b.start_yyyymm < '${pySixMonthsBefore}') and prdt_hrrc1_nm = '의류'
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
, current_season_apparel_cy as (
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
         , a.chnl_cd
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
    group by 1, 2
)
, other_sales_cy as (
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
         , a.chnl_cd
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
    group by 1, 2
)
, current_season_apparel_py as (
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
         , sum(a.act_sale_amt) as act_sale_amt
    from sap_fnf.dm_pl_shop_prdt_m a
    join sap_fnf.mst_shop b
      on a.brd_cd = b.brd_cd and a.shop_cd = b.sap_shop_cd
    join py_item c
      on a.prdt_cd = c.prdt_cd
    where a.brd_cd = '${brandCode}'
      and a.corp_cd = '1000'
      and a.chnl_cd not in ('9')
      and a.chnl_cd is not null
      and a.pst_yyyymm between '${pyCurrentSeasonStart}' and '${pyPeriodEnd}'
      and c.item_std = '당시즌 의류'
    group by 1
)
, other_sales_py as (
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
         , sum(a.act_sale_amt) as act_sale_amt
    from sap_fnf.dm_pl_shop_prdt_m a
    join sap_fnf.mst_shop b
      on a.brd_cd = b.brd_cd and a.shop_cd = b.sap_shop_cd
    join py_item c
      on a.prdt_cd = c.prdt_cd
    where a.brd_cd = '${brandCode}'
      and a.corp_cd = '1000'
      and a.chnl_cd not in ('9')
      and a.chnl_cd is not null
      and a.pst_yyyymm between '${pyPeriodStart}' and '${pyPeriodEnd}'
      and c.item_std not in ('당시즌 의류', '차기시즌 의류')
    group by 1
)
, cy_combined as (
    select chnl_nm, chnl_cd, act_sale_amt from current_season_apparel_cy
    union all
    select chnl_nm, chnl_cd, act_sale_amt from other_sales_cy
)
, py_combined as (
    select chnl_nm, act_sale_amt from current_season_apparel_py
    union all
    select chnl_nm, act_sale_amt from other_sales_py
)
, channel_summary as (
    select 
        coalesce(cy.chnl_nm, py.chnl_nm) as chnl_nm,
        coalesce(cy.act_sale_amt, 0) as act_sale_amt_cy,
        coalesce(py.act_sale_amt, 0) as act_sale_amt_py
    from (select chnl_nm, sum(act_sale_amt) as act_sale_amt from cy_combined group by 1) cy
    full outer join (select chnl_nm, sum(act_sale_amt) as act_sale_amt from py_combined group by 1) py
    on cy.chnl_nm = py.chnl_nm
)
, total_summary as (
    select '전체' as chnl_nm
         , sum(act_sale_amt_cy) as act_sale_amt_cy
         , sum(act_sale_amt_py) as act_sale_amt_py
    from channel_summary
)
-- 채널코드별 실판가 합계 (로열티 계산용)
, chnl_cd_summary as (
    select chnl_cd
         , sum(act_sale_amt) as act_sale_amt
    from cy_combined
    group by chnl_cd
)
-- 채널코드 3,4,5,7,11 실판가 합계
, retail_chnl_total as (
    select sum(act_sale_amt) as retail_act_sale_amt
    from chnl_cd_summary
    where chnl_cd in ('3', '4', '5', '7', '11')
)
select chnl_nm as CHNL_NM
    , round(act_sale_amt_cy / 1000000) as ACT_SALE_AMT
    , case when act_sale_amt_py = 0 then null 
           else round(act_sale_amt_cy / act_sale_amt_py * 100) 
      end as YOY
    , null as CHNL_CD
    , null as RETAIL_ACT_SALE_AMT
from channel_summary
union all
select chnl_nm as CHNL_NM
    , round(act_sale_amt_cy / 1000000) as ACT_SALE_AMT
    , case when act_sale_amt_py = 0 then null 
           else round(act_sale_amt_cy / act_sale_amt_py * 100) 
      end as YOY
    , null as CHNL_CD
    , round((select retail_act_sale_amt from retail_chnl_total) / 1000000) as RETAIL_ACT_SALE_AMT
from total_summary
union all
select 'CHNL_CD_' || chnl_cd as CHNL_NM
    , round(act_sale_amt / 1000000) as ACT_SALE_AMT
    , null as YOY
    , chnl_cd as CHNL_CD
    , null as RETAIL_ACT_SALE_AMT
from chnl_cd_summary
order by 
    case 
        when CHNL_NM = '전체' then 0
        when CHNL_NM = '플래그쉽' then 1
        when CHNL_NM = '백화점' then 2
        when CHNL_NM = '대리점' then 3
        when CHNL_NM = '직영(가두)' then 4
        when CHNL_NM = '온라인(직)' then 5
        when CHNL_NM = '온라인(제휴)' then 6
        when CHNL_NM = '면세점' then 7
        when CHNL_NM = 'RF' then 8
        when CHNL_NM = '아울렛(직)' then 9
        when CHNL_NM = '사입' then 10
        when CHNL_NM = '기타' then 11
        when CHNL_NM like 'CHNL_CD_%' then 100
        else 12
    end
`;

    const rows = await executeQuery(query);

    // 채널명 기준 데이터 (기존)
    const channelData = rows.filter((row: any) => row.CHNL_NM !== '전체' && !row.CHNL_NM?.startsWith('CHNL_CD_'));
    const totalRow = rows.find((row: any) => row.CHNL_NM === '전체');
    
    // 채널코드별 데이터 (로열티 계산용)
    const chnlCdData = rows.filter((row: any) => row.CHNL_NM?.startsWith('CHNL_CD_'));
    
    // 채널코드 3,4,5,7,11 실판가 합계 (백만원 단위)
    const retailActSaleAmt = totalRow?.RETAIL_ACT_SALE_AMT || 0;

    return NextResponse.json({
      success: true,
      data: channelData,
      channels: channelData,
      chnlCdData: chnlCdData,
      total: totalRow?.ACT_SALE_AMT || 0,
      totalYOY: totalRow?.YOY || null,
      retailActSaleAmt: retailActSaleAmt,
      params: {
        brandCode,
        season,
        periodStart,
        periodEnd,
        currentSeasonStart
      }
    });
  } catch (error) {
    console.error('Actual Sales API Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

