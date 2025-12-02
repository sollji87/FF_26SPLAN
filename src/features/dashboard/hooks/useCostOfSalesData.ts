'use client';

import { useQuery } from '@tanstack/react-query';

export interface CostOfSalesData {
  cogsBase: number;           // 기초 COGS (DM_PL_SHOP_PRDT_M)
  stkAsstAprctAmt: number;    // 재고평가감(환입)
  vltnAmt: number;            // 재고평가감(추가)
  cogsActual: number;         // 매출원가(실적) = COGS + 환입
  cogsTotal: number;          // 매출원가 소계 = COGS + 환입 + 추가
}

interface CostOfSalesResponse {
  success: boolean;
  data: CostOfSalesData;
  params: {
    brandCode: string;
    season: string;
    periodStart: string;
    periodEnd: string;
    currentSeasonStart: string;
  };
}

async function fetchCostOfSalesData(brandCode: string, season: string): Promise<CostOfSalesResponse> {
  const response = await fetch(`/api/pnl/cost-of-sales?brandCode=${brandCode}&season=${season}`);
  if (!response.ok) {
    throw new Error('Failed to fetch cost of sales data');
  }
  return response.json();
}

export function useCostOfSalesData(brandCode: string, season: string) {
  return useQuery({
    queryKey: ['costOfSales', brandCode, season],
    queryFn: () => fetchCostOfSalesData(brandCode, season),
    staleTime: 5 * 60 * 1000,
    enabled: !!brandCode && !!season,
  });
}

