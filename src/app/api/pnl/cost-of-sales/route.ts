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
    let periodEndDate: string;
    let periodStartDate: string;
    
    if (seasonType === 'S') {
      periodEnd = `20${year}08`;
      periodStart = `20${year}03`;
      currentSeasonStart = `20${year - 1}01`;
      periodEndDate = `20${year}-08-31`;
      periodStartDate = `20${year}-03-01`;
    } else if (seasonType === 'F') {
      periodEnd = `20${year + 1}02`;
      periodStart = `20${year}09`;
      currentSeasonStart = `20${year}03`;
      periodEndDate = `20${year + 1}-02-28`;
      periodStartDate = `20${year}-09-01`;
    } else {
      periodEnd = `20${year}12`;
      periodStart = `20${year}01`;
      currentSeasonStart = `20${year - 1}07`;
      periodEndDate = `20${year}-12-31`;
      periodStartDate = `20${year}-01-01`;
    }

    // MLB 특수 조건: SESN='21S' AND 중분류코드 IN ('A0100A0140') 제외
    const mlbExcludeCondition = brandCode === 'M' 
      ? `and not (p.sesn = '21S' and p.middle_class_cd in ('A0100A0140'))` 
      : '';

    // 재고평가감(환입): stk_asst_aprct_amt
    // 재고평가감(추가): vltn_amt
    // dw_copa_d 테이블은 pst_dt (DATE)를 사용
    const inventoryValuationQuery = `
SELECT 
    ROUND(SUM(COALESCE(a.stk_asst_aprct_amt, 0)) / 1000000) AS stk_asst_aprct_amt,
    ROUND(SUM(COALESCE(a.vltn_amt, 0)) / 1000000) AS vltn_amt
FROM sap_fnf.dw_copa_d a
JOIN sap_fnf.mst_prdt p ON a.prdt_cd = p.prdt_cd
WHERE a.brd_cd = '${brandCode}'
  AND a.chnl_cd != '9'
  AND a.chnl_cd IS NOT NULL
  AND a.pst_dt BETWEEN '${periodStartDate}' AND '${periodEndDate}'
  ${mlbExcludeCondition}
`;

    // 3. COGS (매출원가 기초) - 당시즌 의류는 전년 1월부터
    // dw_copa_d 테이블의 ACT_COGS 사용
    const cogsQuery = `
-- 당시즌 의류 구분
WITH cy_item AS (
    SELECT a.prdt_cd  
         , a.sesn
         , a.prdt_hrrc1_nm
         , CASE 
                WHEN ('${periodEnd}'   BETWEEN b.start_yyyymm AND b.end_yyyymm) AND prdt_hrrc1_nm = '의류' 
                    THEN '당시즌 의류'
                WHEN ('${periodStart}' BETWEEN b.start_yyyymm AND b.end_yyyymm) AND prdt_hrrc1_nm = '의류'
                    THEN '전시즌 의류'
                WHEN (b.start_yyyymm > '${periodEnd}')   AND prdt_hrrc1_nm = '의류' 
                    THEN '차기시즌 의류'
                WHEN (b.start_yyyymm < '${periodStart}') AND prdt_hrrc1_nm = '의류'
                    THEN '과시즌 의류'
                WHEN prdt_hrrc1_nm = 'ACC' THEN 'ACC'
                ELSE '기타' 
           END AS item_std
    FROM sap_fnf.mst_prdt a
    LEFT JOIN comm.mst_sesn b
           ON a.sesn = b.sesn
    WHERE 1=1
      AND a.brd_cd = '${brandCode}'
)
-- 당시즌 의류 COGS (전년 1월부터 시즌 종료까지) - dw_copa_d / ACT_COGS 기준
, current_season_cogs AS (
    SELECT 
        ROUND(SUM(COALESCE(a.act_cogs, 0)) / 1000000) AS cogs
    FROM sap_fnf.dw_copa_d a
    JOIN cy_item c 
      ON a.prdt_cd = c.prdt_cd
    WHERE a.brd_cd  = '${brandCode}'
      AND a.corp_cd = '1000'
      AND a.chnl_cd NOT IN ('9')
      AND a.chnl_cd IS NOT NULL
      AND TO_CHAR(a.pst_dt, 'YYYYMM') BETWEEN '${currentSeasonStart}' AND '${periodEnd}'
      AND c.item_std = '당시즌 의류'
)
-- 과시즌/전시즌/ACC COGS (시즌 기간 내) - dw_copa_d / ACT_COGS 기준
, other_cogs AS (
    SELECT 
        ROUND(SUM(COALESCE(a.act_cogs, 0)) / 1000000) AS cogs
    FROM sap_fnf.dw_copa_d a
    JOIN cy_item c 
      ON a.prdt_cd = c.prdt_cd
    WHERE a.brd_cd  = '${brandCode}'
      AND a.corp_cd = '1000'
      AND a.chnl_cd NOT IN ('9')
      AND a.chnl_cd IS NOT NULL
      AND TO_CHAR(a.pst_dt, 'YYYYMM') BETWEEN '${periodStart}' AND '${periodEnd}'
      AND c.item_std NOT IN ('당시즌 의류', '차기시즌 의류')
)
SELECT 
    COALESCE((SELECT cogs FROM current_season_cogs), 0) 
  + COALESCE((SELECT cogs FROM other_cogs), 0) AS total_cogs
`;

    // 쿼리 실행
    const [inventoryResult, cogsResult] = await Promise.all([
      executeQuery(inventoryValuationQuery),
      executeQuery(cogsQuery)
    ]);

    const stkAsstAprctAmt = inventoryResult[0]?.STK_ASST_APRCT_AMT || 0; // 재고평가감(환입)
    const vltnAmt = inventoryResult[0]?.VLTN_AMT || 0; // 재고평가감(추가)
    const baseCogs = cogsResult[0]?.TOTAL_COGS || 0; // 기초 COGS

    // 매출원가(실적) = COGS
    const cogsActual = baseCogs;
    
    // 매출원가 소계 = 매출원가(실적) + 재고평가감(환입) + 재고평가감(추가)
    const cogsTotal = cogsActual + stkAsstAprctAmt + vltnAmt;

    return NextResponse.json({
      success: true,
      data: {
        cogsBase: baseCogs,                    // 기초 COGS (DM_PL_SHOP_PRDT_M)
        stkAsstAprctAmt: stkAsstAprctAmt,      // 재고평가감(환입)
        vltnAmt: vltnAmt,                       // 재고평가감(추가)
        cogsActual: cogsActual,                 // 매출원가(실적) = COGS - 환입
        cogsTotal: cogsTotal                    // 매출원가 소계 = COGS + 환입 + 추가
      },
      params: {
        brandCode,
        season,
        periodStart,
        periodEnd,
        currentSeasonStart
      }
    });
  } catch (error) {
    console.error('Cost of Sales API Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
