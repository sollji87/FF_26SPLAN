'use client';

import { useQuery } from '@tanstack/react-query';

export interface DirectCostChannelItem {
  CHNL_NM: string;
  RYT: number;
  LGT_CST: number;
  STRG_CST: number;
  CARD_CMS: number;
  SHOP_RNT: number;
  SHOP_DEPRC_CST: number;
  ALNC_ONLN_CMS: number;
  SM_CMS: number;
  DF_SALE_STFF_CMS: number;
  DMGMT_SALE_STFF_CMS: number;
  DSTRB_CMS: number;
  DIRECT_COST_TOTAL: number;
}

export interface DirectCostTotals {
  RYT: number;
  LGT_CST: number;
  STRG_CST: number;
  CARD_CMS: number;
  SHOP_RNT: number;
  SHOP_DEPRC_CST: number;
  ALNC_ONLN_CMS: number;
  SM_CMS: number;
  DF_SALE_STFF_CMS: number;
  DMGMT_SALE_STFF_CMS: number;
  DSTRB_CMS: number;
  DIRECT_COST_TOTAL: number;
}

export interface DirectCostResponse {
  success: boolean;
  brandCode: string;
  season: string;
  period: { start: string; end: string };
  data: DirectCostChannelItem[];
  totals: DirectCostTotals;
}

// 직접비 항목 라벨
export const DIRECT_COST_LABELS: Record<string, string> = {
  RYT: '로열티',
  LGT_CST: '물류비',
  STRG_CST: '보관료',
  CARD_CMS: '카드수수료',
  SHOP_RNT: '매장임차료',
  SHOP_DEPRC_CST: '감가상각비(매장)',
  ALNC_ONLN_CMS: '온라인수수료(제휴)',
  SM_CMS: '중간관리자 수수료',
  DF_SALE_STFF_CMS: '면세 판매직수수료',
  DMGMT_SALE_STFF_CMS: '직영 판매직수수료',
};

// 직접비 항목 순서
export const DIRECT_COST_ORDER = [
  'RYT',
  'LGT_CST',
  'STRG_CST',
  'CARD_CMS',
  'SHOP_RNT',
  'SHOP_DEPRC_CST',
  'ALNC_ONLN_CMS',
  'SM_CMS',
  'DF_SALE_STFF_CMS',
  'DMGMT_SALE_STFF_CMS',
];

const fetchDirectCostData = async (brandCode: string, season: string): Promise<DirectCostResponse> => {
  const response = await fetch(`/api/pnl/direct-cost?brandCode=${brandCode}&season=${season}`);
  if (!response.ok) {
    throw new Error('Failed to fetch direct cost data');
  }
  return response.json();
};

export const useDirectCostData = (brandCode: string, season: string) => {
  return useQuery({
    queryKey: ['directCost', brandCode, season],
    queryFn: () => fetchDirectCostData(brandCode, season),
    staleTime: 1000 * 60 * 5, // 5분
  });
};

