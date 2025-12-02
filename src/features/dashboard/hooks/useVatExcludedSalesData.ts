'use client';

import { useQuery } from '@tanstack/react-query';

export interface VatExcludedSalesItem {
  CHNL_NM: string;
  VAT_EXC_SALE_AMT: number;
  ACT_SALE_AMT: number;
}

interface VatExcludedSalesResponse {
  success: boolean;
  data: VatExcludedSalesItem[];
  total: number;
  totalActSale: number;
  params: {
    brandCode: string;
    season: string;
    periodStart: string;
    periodEnd: string;
    currentSeasonStart: string;
  };
}

async function fetchVatExcludedSalesData(brandCode: string, season: string): Promise<VatExcludedSalesResponse> {
  const response = await fetch(`/api/pnl/vat-excluded-sales?brandCode=${brandCode}&season=${season}`);
  if (!response.ok) {
    throw new Error('Failed to fetch VAT excluded sales data');
  }
  return response.json();
}

export function useVatExcludedSalesData(brandCode: string, season: string) {
  return useQuery({
    queryKey: ['vatExcludedSales', brandCode, season],
    queryFn: () => fetchVatExcludedSalesData(brandCode, season),
    staleTime: 5 * 60 * 1000,
    enabled: !!brandCode && !!season,
  });
}

// 출고가(V+) 계산 로직
// 기본: 부가세차감(출고)매출 * 1.1
// 직영(가두), 온라인(직), 온라인(제휴), 아울렛(직), 사입, 기타 채널은 
// 출고가(V+)/실판가 > 100%이면 실판가 사용
export const RETAIL_CHANNELS = ['직영(가두)', '온라인(직)', '온라인(제휴)', '아울렛(직)', '사입', '기타'];

export function calculateShippingPrice(vatExcSaleAmt: number, actSaleAmt: number, channelName: string): number {
  const shippingPrice = vatExcSaleAmt * 1.1;
  
  // 소매 채널인 경우 출고가가 실판가보다 크면 실판가 사용
  if (RETAIL_CHANNELS.includes(channelName)) {
    if (actSaleAmt > 0 && shippingPrice > actSaleAmt) {
      return actSaleAmt;
    }
  }
  
  return shippingPrice;
}

