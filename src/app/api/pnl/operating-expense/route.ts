import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const brandCode = searchParams.get('brandCode') || 'M';
  const season = searchParams.get('season') || '23S';

  try {
    // 시즌에서 연도 추출
    const year = parseInt(season.slice(0, 2));
    const seasonType = season.slice(2); // S or F
    
    // SS시즌: 3-8월, FW시즌: 9월~차기년도 2월
    let periodStart: string;
    let periodEnd: string;
    let pyPeriodStart: string;
    let pyPeriodEnd: string;
    
    if (seasonType === 'S') {
      // SS시즌: 해당연도 3-8월
      periodStart = `20${year}03`;
      periodEnd = `20${year}08`;
      pyPeriodStart = `20${year - 1}03`;
      pyPeriodEnd = `20${year - 1}08`;
    } else {
      // FW시즌: 9월~차기년도 2월
      periodStart = `20${year}09`;
      periodEnd = `20${year + 1}02`;
      pyPeriodStart = `20${year - 1}09`;
      pyPeriodEnd = `20${year}02`;
    }

    const query = `
-- 영업비 (시즌: ${season}, 기간: ${periodStart} ~ ${periodEnd})
with main as (
    select case when ctgr1 = '인건비' then '인건비'
                when ctgr1 = '공통비' then '공통비'
                when ctgr2 = '저장품사용(쇼핑백/사은품)' then '저장품'
                when ctgr2 = '감가상각비(매장외)' then '감가상각비'
                when ctgr1 = '자가임차료(사옥)' then '자가임차료'
                when ctgr1 = 'VMD/ 매장보수대' then 'VMD/매장보수'
                when ctgr1 = '광고선전비' then '광고비'
                when ctgr1 = '제간비' then '지급수수료'
                when ctgr1 = '지급수수료' then '지급수수료'
                when ctgr1 = '샘플대(제작/구입)' then '샘플비'
                when ctgr1 = '기타영업비' and ctgr2 = '여비교통비' then '여비교통비'
                when ctgr1 = '기타영업비' and ctgr2 = '복리비/차량/핸드폰' then '복리비/차량/핸드폰'
                when ctgr1 = '기타영업비' and ctgr2 in ('복리후생비', '복리비', '차량유지비', '차량관리비', '통신비', '핸드폰비', '차량비') then '복리비/차량/핸드폰'
                else '기타'
            end as item_nm
         , sum(case when pst_yyyymm between '${periodStart}' and '${periodEnd}' then ttl_use_amt else 0 end) as amt_cy
         , sum(case when pst_yyyymm between '${pyPeriodStart}' and '${pyPeriodEnd}' then ttl_use_amt else 0 end) as amt_py
    from sap_fnf.dm_idcst_cctr_m
    where brd_cd = '${brandCode}'
      and (pst_yyyymm between '${periodStart}' and '${periodEnd}'
           or pst_yyyymm between '${pyPeriodStart}' and '${pyPeriodEnd}')
    group by 1
    union all
    select '제조간접비' as item_nm
         , abs(sum(case when pst_yyyymm between '${periodStart}' and '${periodEnd}' then mfc_dept_use_amt else 0 end)) * (-1) as amt_cy
         , abs(sum(case when pst_yyyymm between '${pyPeriodStart}' and '${pyPeriodEnd}' then mfc_dept_use_amt else 0 end)) * (-1) as amt_py
    from sap_fnf.dm_idcst_cctr_m
    where brd_cd = '${brandCode}'
      and (pst_yyyymm between '${periodStart}' and '${periodEnd}'
           or pst_yyyymm between '${pyPeriodStart}' and '${pyPeriodEnd}')
), main_excp_comm as (
    select '브랜드 영업비' as item_nm
         , sum(amt_cy) amt_cy
         , sum(amt_py) amt_py
    from main
    where item_nm <> '공통비'
), total as (
    select amt_cy + mfac_amt_cy as amt_cy
         , amt_py + mfac_amt_py as amt_py
    from (
        select sum(case when item_nm <> '제조간접비' then amt_cy else 0 end) amt_cy
             , sum(case when item_nm <> '제조간접비' then amt_py else 0 end) amt_py
             , sum(case when item_nm = '제조간접비' then amt_cy else 0 end) mfac_amt_cy
             , sum(case when item_nm = '제조간접비' then amt_py else 0 end) mfac_amt_py
        from main
    )
)
select case item_nm
         when '인건비' then 1
         when '광고비' then 2
         when '지급수수료' then 3
         when 'VMD/매장보수' then 4
         when '저장품' then 5
         when '샘플비' then 6
         when '감가상각비' then 7
         when '기타영업비' then 8
         when '자가임차료' then 9
         when '공통비' then 11 
         when '제조간접비' then 12
         else 999
     end as SEQ
     , item_nm as ITEM_NM
     , round(amt_cy / 1000000) as AMT_CY
     , round(amt_py / 1000000) as AMT_PY
     , case when amt_py = 0 then null else round(amt_cy / amt_py * 100) end as YOY
from main
union all
select 10 as SEQ
     , item_nm as ITEM_NM
     , round(amt_cy / 1000000) as AMT_CY
     , round(amt_py / 1000000) as AMT_PY
     , case when amt_py = 0 then null else round(amt_cy / amt_py * 100) end as YOY
from main_excp_comm
union all
select 0 as SEQ
     , '전체' as ITEM_NM
     , round(amt_cy / 1000000) as AMT_CY
     , round(amt_py / 1000000) as AMT_PY
     , case when amt_py = 0 then null else round(amt_cy / amt_py * 100) end as YOY
from total
order by SEQ
`;

    const rows = await executeQuery<{
      SEQ: number;
      ITEM_NM: string;
      AMT_CY: number;
      AMT_PY: number;
      YOY: number | null;
    }>(query);

    // 항목별로 분류
    const items: Record<string, { amt: number; amtPy: number; yoy: number | null }> = {};
    let total = { amt: 0, amtPy: 0, yoy: null as number | null };
    let brandTotal = { amt: 0, amtPy: 0, yoy: null as number | null };

    rows.forEach(row => {
      if (row.ITEM_NM === '전체') {
        total = { amt: row.AMT_CY, amtPy: row.AMT_PY, yoy: row.YOY };
      } else if (row.ITEM_NM === '브랜드 영업비') {
        brandTotal = { amt: row.AMT_CY, amtPy: row.AMT_PY, yoy: row.YOY };
      } else {
        items[row.ITEM_NM] = { amt: row.AMT_CY, amtPy: row.AMT_PY, yoy: row.YOY };
      }
    });

    // 기타영업비 계산 (기타영업비 카테고리에 포함되는 항목들)
    const mainItems = ['인건비', '광고비', '자가임차료', '공통비', '제조간접비'];
    const etcItems = ['지급수수료', 'VMD/매장보수', '저장품', '샘플비', '감가상각비', '복리비/차량/핸드폰', '여비교통비', '기타'];
    
    // 기타영업비 합계 계산
    let etcTotal = { amt: 0, amtPy: 0 };
    etcItems.forEach(itemName => {
      if (items[itemName]) {
        etcTotal.amt += items[itemName].amt;
        etcTotal.amtPy += items[itemName].amtPy;
      }
    });

    return NextResponse.json({
      success: true,
      brandCode,
      season,
      period: { start: periodStart, end: periodEnd },
      pyPeriod: { start: pyPeriodStart, end: pyPeriodEnd },
      data: rows,
      items,
      total,
      brandTotal,
      etcTotal: {
        amt: etcTotal.amt,
        amtPy: etcTotal.amtPy,
        yoy: etcTotal.amtPy > 0 ? Math.round(etcTotal.amt / etcTotal.amtPy * 100) : null
      },
      // 주요 항목들 직접 접근용
      hrCost: items['인건비'] || { amt: 0, amtPy: 0, yoy: null },
      adExpense: items['광고비'] || { amt: 0, amtPy: 0, yoy: null },
      selfRent: items['자가임차료'] || { amt: 0, amtPy: 0, yoy: null },
      commonCost: items['공통비'] || { amt: 0, amtPy: 0, yoy: null },
      mfcIndirect: items['제조간접비'] || { amt: 0, amtPy: 0, yoy: null },
      // 기타영업비 세부 항목
      etcItems: {
        commission: items['지급수수료'] || { amt: 0, amtPy: 0, yoy: null },
        vmd: items['VMD/매장보수'] || { amt: 0, amtPy: 0, yoy: null },
        storage: items['저장품'] || { amt: 0, amtPy: 0, yoy: null },
        sample: items['샘플비'] || { amt: 0, amtPy: 0, yoy: null },
        depreciation: items['감가상각비'] || { amt: 0, amtPy: 0, yoy: null },
        welfare: items['복리비/차량/핸드폰'] || { amt: 0, amtPy: 0, yoy: null },
        travel: items['여비교통비'] || { amt: 0, amtPy: 0, yoy: null },
        other: items['기타'] || { amt: 0, amtPy: 0, yoy: null },
      }
    });
  } catch (error) {
    console.error('Operating Expense API Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

