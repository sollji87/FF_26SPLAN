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
      // S시즌: 03월~08월
      periodEnd = `20${year}08`;
      periodStart = `20${year}03`;
      currentSeasonStart = `20${year - 1}01`; // 당시즌 의류는 전년 1월부터
    } else if (seasonType === 'F') {
      // F시즌: 09월~02월 (다음해)
      periodEnd = `20${year + 1}02`;
      periodStart = `20${year}09`;
      currentSeasonStart = `20${year}03`; // 당시즌 의류는 해당년 3월부터
    } else {
      // N시즌: 기본값
      periodEnd = `20${year}12`;
      periodStart = `20${year}01`;
      currentSeasonStart = `20${year - 1}07`;
    }

    // 6개월 전 기준 (전시즌 의류 판단용)
    const sixMonthsBefore = seasonType === 'S' 
      ? `20${year}02` 
      : `20${year}08`;

    // DM_DCST_SHOP_PRDT_M 테이블에서 CHNL_CD 기준으로 직접비 조회
    const query = `
-- 직접비 (CHNL_CD 기준)
-- cy_item : 당해 아이템 구분 기준
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
-- 당시즌 의류 직접비 (전년 1월부터 시즌 종료까지) - CHNL_CD 기준
, current_season_apparel_dcst as (
    select a.chnl_cd
         , sum(coalesce(a.RYT, 0)) as RYT
         , sum(coalesce(a.LGT_CST, 0)) as LGT_CST
         , sum(coalesce(a.STRG_CST, 0)) as STRG_CST
         , sum(coalesce(a.CARD_CMS, 0)) as CARD_CMS
         , sum(coalesce(a.SHOP_RNT, 0)) as SHOP_RNT
         , sum(coalesce(a.SHOP_DEPRC_CST, 0)) as SHOP_DEPRC_CST
         , sum(coalesce(a.ALNC_ONLN_CMS, 0)) as ALNC_ONLN_CMS
         , sum(coalesce(a.SM_CMS, 0)) as SM_CMS
         , sum(coalesce(a.DF_SALE_STFF_CMS, 0)) as DF_SALE_STFF_CMS
         , sum(coalesce(a.DMGMT_SALE_STFF_CMS, 0)) as DMGMT_SALE_STFF_CMS
    from sap_fnf.dm_dcst_shop_prdt_m a
    join cy_item c
      on a.prdt_cd = c.prdt_cd
    where a.brd_cd = '${brandCode}'
      and a.corp_cd = '1000'
      and a.chnl_cd not in ('9')
      and a.chnl_cd is not null
      and a.pst_yyyymm between '${currentSeasonStart}' and '${periodEnd}'
      and c.item_std = '당시즌 의류'
    group by a.chnl_cd
)
-- 과시즌 의류 + 전시즌 의류 + ACC 직접비 (시즌 기간 내) - CHNL_CD 기준
, other_dcst as (
    select a.chnl_cd
         , sum(coalesce(a.RYT, 0)) as RYT
         , sum(coalesce(a.LGT_CST, 0)) as LGT_CST
         , sum(coalesce(a.STRG_CST, 0)) as STRG_CST
         , sum(coalesce(a.CARD_CMS, 0)) as CARD_CMS
         , sum(coalesce(a.SHOP_RNT, 0)) as SHOP_RNT
         , sum(coalesce(a.SHOP_DEPRC_CST, 0)) as SHOP_DEPRC_CST
         , sum(coalesce(a.ALNC_ONLN_CMS, 0)) as ALNC_ONLN_CMS
         , sum(coalesce(a.SM_CMS, 0)) as SM_CMS
         , sum(coalesce(a.DF_SALE_STFF_CMS, 0)) as DF_SALE_STFF_CMS
         , sum(coalesce(a.DMGMT_SALE_STFF_CMS, 0)) as DMGMT_SALE_STFF_CMS
    from sap_fnf.dm_dcst_shop_prdt_m a
    join cy_item c
      on a.prdt_cd = c.prdt_cd
    where a.brd_cd = '${brandCode}'
      and a.corp_cd = '1000'
      and a.chnl_cd not in ('9')
      and a.chnl_cd is not null
      and a.pst_yyyymm between '${periodStart}' and '${periodEnd}'
      and c.item_std not in ('당시즌 의류', '차기시즌 의류')
    group by a.chnl_cd
)
-- 합산
, combined as (
    select chnl_cd, RYT, LGT_CST, STRG_CST, CARD_CMS, SHOP_RNT, SHOP_DEPRC_CST, ALNC_ONLN_CMS, SM_CMS, DF_SALE_STFF_CMS, DMGMT_SALE_STFF_CMS 
    from current_season_apparel_dcst
    union all
    select chnl_cd, RYT, LGT_CST, STRG_CST, CARD_CMS, SHOP_RNT, SHOP_DEPRC_CST, ALNC_ONLN_CMS, SM_CMS, DF_SALE_STFF_CMS, DMGMT_SALE_STFF_CMS 
    from other_dcst
)
-- 채널코드별 합계
, channel_summary as (
    select 
        chnl_cd,
        sum(RYT) as RYT,
        sum(LGT_CST) as LGT_CST,
        sum(STRG_CST) as STRG_CST,
        sum(CARD_CMS) as CARD_CMS,
        sum(SHOP_RNT) as SHOP_RNT,
        sum(SHOP_DEPRC_CST) as SHOP_DEPRC_CST,
        sum(ALNC_ONLN_CMS) as ALNC_ONLN_CMS,
        sum(SM_CMS) as SM_CMS,
        sum(DF_SALE_STFF_CMS) as DF_SALE_STFF_CMS,
        sum(DMGMT_SALE_STFF_CMS) as DMGMT_SALE_STFF_CMS,
        sum(RYT) + sum(LGT_CST) + sum(STRG_CST) + sum(CARD_CMS) + sum(SHOP_RNT) + sum(SHOP_DEPRC_CST) + sum(ALNC_ONLN_CMS) + sum(SM_CMS) + sum(DF_SALE_STFF_CMS) + sum(DMGMT_SALE_STFF_CMS) as DIRECT_COST_TOTAL
    from combined
    group by chnl_cd
)
-- 전체 합계
, total_summary as (
    select 'TOTAL' as chnl_cd
         , sum(RYT) as RYT
         , sum(LGT_CST) as LGT_CST
         , sum(STRG_CST) as STRG_CST
         , sum(CARD_CMS) as CARD_CMS
         , sum(SHOP_RNT) as SHOP_RNT
         , sum(SHOP_DEPRC_CST) as SHOP_DEPRC_CST
         , sum(ALNC_ONLN_CMS) as ALNC_ONLN_CMS
         , sum(SM_CMS) as SM_CMS
         , sum(DF_SALE_STFF_CMS) as DF_SALE_STFF_CMS
         , sum(DMGMT_SALE_STFF_CMS) as DMGMT_SALE_STFF_CMS
         , sum(RYT) + sum(LGT_CST) + sum(STRG_CST) + sum(CARD_CMS) + sum(SHOP_RNT) + sum(SHOP_DEPRC_CST) + sum(ALNC_ONLN_CMS) + sum(SM_CMS) + sum(DF_SALE_STFF_CMS) + sum(DMGMT_SALE_STFF_CMS) as DIRECT_COST_TOTAL
    from channel_summary
)
select chnl_cd as CHNL_CD
    , round(RYT / 1000000) as RYT
    , round(LGT_CST / 1000000) as LGT_CST
    , round(STRG_CST / 1000000) as STRG_CST
    , round(CARD_CMS / 1000000) as CARD_CMS
    , round(SHOP_RNT / 1000000) as SHOP_RNT
    , round(SHOP_DEPRC_CST / 1000000) as SHOP_DEPRC_CST
    , round(ALNC_ONLN_CMS / 1000000) as ALNC_ONLN_CMS
    , round(SM_CMS / 1000000) as SM_CMS
    , round(DF_SALE_STFF_CMS / 1000000) as DF_SALE_STFF_CMS
    , round(DMGMT_SALE_STFF_CMS / 1000000) as DMGMT_SALE_STFF_CMS
    , round(DIRECT_COST_TOTAL / 1000000) as DIRECT_COST_TOTAL
from channel_summary
union all
select chnl_cd as CHNL_CD
    , round(RYT / 1000000) as RYT
    , round(LGT_CST / 1000000) as LGT_CST
    , round(STRG_CST / 1000000) as STRG_CST
    , round(CARD_CMS / 1000000) as CARD_CMS
    , round(SHOP_RNT / 1000000) as SHOP_RNT
    , round(SHOP_DEPRC_CST / 1000000) as SHOP_DEPRC_CST
    , round(ALNC_ONLN_CMS / 1000000) as ALNC_ONLN_CMS
    , round(SM_CMS / 1000000) as SM_CMS
    , round(DF_SALE_STFF_CMS / 1000000) as DF_SALE_STFF_CMS
    , round(DMGMT_SALE_STFF_CMS / 1000000) as DMGMT_SALE_STFF_CMS
    , round(DIRECT_COST_TOTAL / 1000000) as DIRECT_COST_TOTAL
from total_summary
order by 
    case CHNL_CD
        when 'TOTAL' then 0
        when '1' then 1
        when '2' then 2
        when '3' then 3
        when '4' then 4
        when '5' then 5
        when '6' then 6
        when '7' then 7
        when '8' then 8
        when '11' then 9
        else 99
    end
`;

    const rows = await executeQuery<{
      CHNL_CD: string;
      RYT: number;
      LGT_CST: number;
      STRG_CST: number;
      CARD_CMS: number;
      SHOP_RNT: number;
      SHOP_DEPRC_CST: number;
      ALNC_ONLN_CMS: number;
      SM_CMS: number;
      DF_SALE_STFF_CMS: number;
      DMGMT_SALE_STFF_CMS: number;
      DIRECT_COST_TOTAL: number;
    }>(query);

    // 총합 계산 (전체 행 제외)
    const channelData = rows.filter((row) => row.CHNL_CD !== 'TOTAL');
    const totalRow = rows.find((row) => row.CHNL_CD === 'TOTAL');

    // 총합계
    const totals = {
      RYT: totalRow?.RYT || 0,
      LGT_CST: totalRow?.LGT_CST || 0,
      STRG_CST: totalRow?.STRG_CST || 0,
      CARD_CMS: totalRow?.CARD_CMS || 0,
      SHOP_RNT: totalRow?.SHOP_RNT || 0,
      SHOP_DEPRC_CST: totalRow?.SHOP_DEPRC_CST || 0,
      ALNC_ONLN_CMS: totalRow?.ALNC_ONLN_CMS || 0,
      SM_CMS: totalRow?.SM_CMS || 0,
      DF_SALE_STFF_CMS: totalRow?.DF_SALE_STFF_CMS || 0,
      DMGMT_SALE_STFF_CMS: totalRow?.DMGMT_SALE_STFF_CMS || 0,
      DSTRB_CMS: 0,
      DIRECT_COST_TOTAL: totalRow?.DIRECT_COST_TOTAL || 0,
    };

    return NextResponse.json({
      success: true,
      brandCode,
      season,
      period: { start: periodStart, end: periodEnd, currentSeasonStart },
      data: channelData,  // 채널코드별 데이터
      totals
    });
  } catch (error) {
    console.error('Direct Cost API Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
