import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tableName = searchParams.get('table') || 'DM_PL_SHOP_PRDT_M';
  const schema = searchParams.get('schema') || 'SAP_FNF';
  const listTables = searchParams.get('listTables') === 'true';
  const searchTable = searchParams.get('searchTable') || '';
  
  try {
    let query: string;
    
    if (listTables) {
      // 테이블 목록 조회
      query = `
        SELECT TABLE_NAME, TABLE_SCHEMA
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = '${schema}'
        ${searchTable ? `AND TABLE_NAME LIKE '%${searchTable}%'` : ''}
        ORDER BY TABLE_NAME
        LIMIT 100
      `;
    } else {
      // 컬럼 조회
      query = `
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${schema}' 
          AND TABLE_NAME = '${tableName}'
        ORDER BY ORDINAL_POSITION
      `;
    }

    const rows = await executeQuery(query);

    return NextResponse.json({
      success: true,
      table: tableName,
      schema: schema,
      data: rows
    });
  } catch (error) {
    console.error('Check Columns API Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

