'use client';

import { useQuery } from '@tanstack/react-query';

interface OrderAmountData {
  endStockTagAmt: number;
  salesTagAmt: number;
  orderAmt: number;
  salesRate: number;
}

interface OrderAmountResponse {
  success: boolean;
  data: OrderAmountData;
  params: {
    brandCode: string;
    season: string;
    periodEnd: string;
    currentSeasonStart: string;
  };
}

async function fetchOrderAmountData(brandCode: string, season: string): Promise<OrderAmountData> {
  const response = await fetch(`/api/pnl/order-amount?brandCode=${brandCode}&season=${season}`);
  if (!response.ok) {
    throw new Error('Failed to fetch order amount data');
  }
  const result: OrderAmountResponse = await response.json();
  if (!result.success) {
    throw new Error('API returned error');
  }
  return result.data;
}

export function useOrderAmountData(brandCode: string, season: string) {
  return useQuery({
    queryKey: ['orderAmount', brandCode, season],
    queryFn: () => fetchOrderAmountData(brandCode, season),
    staleTime: 5 * 60 * 1000,
    enabled: !!brandCode && !!season,
  });
}

