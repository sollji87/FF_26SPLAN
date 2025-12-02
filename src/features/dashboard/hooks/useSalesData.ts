'use client';

import { useQuery } from '@tanstack/react-query';

export interface SalesChannelItem {
  CHNL_NM: string;
  SALE_TAG_AMT?: number;
  ACT_SALE_AMT?: number;
  YOY: number | null;
}

export interface SalesDataResponse {
  success: boolean;
  data: SalesChannelItem[];
  total: number;
  totalYOY: number | null;
  params: {
    brandCode: string;
    season: string;
    periodStart: string;
    periodEnd: string;
    currentSeasonStart: string;
  };
}

// 판매TAG 데이터 훅
export const useSalesTagData = (brandCode: string, season: string) => {
  return useQuery<SalesDataResponse>({
    queryKey: ['salesTag', brandCode, season],
    queryFn: async () => {
      const response = await fetch(
        `/api/pnl/sales-tag?brandCode=${brandCode}&season=${season}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch sales tag data');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5분 캐시
    enabled: !!brandCode && !!season,
  });
};

// 실판가 데이터 훅
export const useActualSalesData = (brandCode: string, season: string) => {
  return useQuery<SalesDataResponse>({
    queryKey: ['actualSales', brandCode, season],
    queryFn: async () => {
      const response = await fetch(
        `/api/pnl/actual-sales?brandCode=${brandCode}&season=${season}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch actual sales data');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!brandCode && !!season,
  });
};

// 채널 순서 정의
export const CHANNEL_ORDER = [
  '플래그쉽',
  '백화점',
  '대리점',
  '직영(가두)',
  '온라인(직)',
  '온라인(제휴)',
  '면세점',
  'RF',
  '사입',
  '기타',
];

// 채널별 데이터 정렬 함수
export const sortByChannelOrder = (data: SalesChannelItem[]): SalesChannelItem[] => {
  return [...data].sort((a, b) => {
    const indexA = CHANNEL_ORDER.indexOf(a.CHNL_NM);
    const indexB = CHANNEL_ORDER.indexOf(b.CHNL_NM);
    const orderA = indexA === -1 ? 999 : indexA;
    const orderB = indexB === -1 ? 999 : indexB;
    return orderA - orderB;
  });
};

