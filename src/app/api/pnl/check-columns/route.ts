import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tableName = searchParams.get('table') || 'DM_PL_SHOP_PRDT_M';
  
  try {
    const query = `
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'SAP_FNF' 
        AND TABLE_NAME = '${tableName}'
      ORDER BY ORDINAL_POSITION
    `;

    const rows = await executeQuery(query);

    return NextResponse.json({
      success: true,
      columns: rows
    });
  } catch (error) {
    console.error('Check Columns API Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

