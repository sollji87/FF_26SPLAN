import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const brandCode = searchParams.get('brandCode') || 'M';
  const periodStart = searchParams.get('periodStart') || '202303';
  const periodEnd = searchParams.get('periodEnd') || '202308';
  
  try {
    // DM_IDCST_CCTR_M 테이블 데이터 샘플 조회
    const query = `
      select distinct CTGR1, CTGR2, CTGR3, GL_CD, GL_NM
      from SAP_FNF.DM_IDCST_CCTR_M
      where BRD_CD = '${brandCode}'
        and PST_YYYYMM between '${periodStart}' and '${periodEnd}'
      order by CTGR1, CTGR2, CTGR3
      limit 100
    `;

    const rows = await executeQuery(query);

    return NextResponse.json({
      success: true,
      brandCode,
      period: { start: periodStart, end: periodEnd },
      data: rows
    });
  } catch (error) {
    console.error('Check Data API Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

