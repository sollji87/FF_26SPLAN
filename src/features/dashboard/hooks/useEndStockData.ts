import { useQuery } from '@tanstack/react-query';

export interface EndStockItem {
  ITEM_STD: string;
  SESN: string;
  CY_END_STOCK_TAG_AMT: number;
  YOY: number;
}

export interface EndStockResponse {
  success: boolean;
  data: EndStockItem[];
  season: string;
  targetYYYYMM: string;
  pyYYYYMM: string;
  error?: string;
}

const fetchEndStockData = async (
  brandCode: string,
  season: string
): Promise<EndStockResponse> => {
  const response = await fetch(
    `/api/pnl/end-stock?brandCode=${brandCode}&season=${season}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch end stock data');
  }

  return response.json();
};

export const useEndStockData = (brandCode: string, season: string) => {
  return useQuery({
    queryKey: ['endStock', brandCode, season],
    queryFn: () => fetchEndStockData(brandCode, season),
    staleTime: 1000 * 60 * 5, // 5분
  });
};

