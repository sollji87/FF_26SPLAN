'use client';

import { useQuery } from '@tanstack/react-query';

export interface OperatingExpenseItem {
  amt: number;
  amtPy: number;
  yoy: number | null;
}

export interface OperatingExpenseEtcItems {
  commission: OperatingExpenseItem;  // 지급수수료
  vmd: OperatingExpenseItem;         // VMD/매장보수
  storage: OperatingExpenseItem;     // 저장품
  sample: OperatingExpenseItem;      // 샘플비
  depreciation: OperatingExpenseItem; // 감가상각비
  welfare: OperatingExpenseItem;     // 복리비/차량/핸드폰
  travel: OperatingExpenseItem;      // 여비교통비
  other: OperatingExpenseItem;       // 기타
}

export interface OperatingExpenseResponse {
  success: boolean;
  brandCode: string;
  season: string;
  period: { start: string; end: string };
  pyPeriod: { start: string; end: string };
  items: Record<string, OperatingExpenseItem>;
  total: OperatingExpenseItem;
  brandTotal: OperatingExpenseItem;
  etcTotal: OperatingExpenseItem;
  hrCost: OperatingExpenseItem;      // 인건비
  adExpense: OperatingExpenseItem;   // 광고비
  selfRent: OperatingExpenseItem;    // 자가임차료
  commonCost: OperatingExpenseItem;  // 공통비
  mfcIndirect: OperatingExpenseItem; // 제조간접비
  etcItems: OperatingExpenseEtcItems;
}

export const useOperatingExpenseData = (brandCode: string, season: string) => {
  return useQuery<OperatingExpenseResponse>({
    queryKey: ['operatingExpense', brandCode, season],
    queryFn: async () => {
      const response = await fetch(
        `/api/pnl/operating-expense?brandCode=${brandCode}&season=${season}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch operating expense data');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5분 캐시
    enabled: !!brandCode && !!season,
  });
};

