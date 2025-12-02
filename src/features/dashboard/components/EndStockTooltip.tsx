'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EndStockItem } from '../hooks/useEndStockData';
import { Info } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface EndStockTooltipProps {
  season: string;
  data: EndStockItem[];
  total: number;
}

export const EndStockTooltip = ({ season, data, total }: EndStockTooltipProps) => {
  const [open, setOpen] = useState(false);

  // 아이템별 데이터, 시즌별 합계, 시즌별 아이템 상세 분리
  const { itemData, seasonData, seasonItemData } = useMemo(() => {
    const items: EndStockItem[] = [];
    const seasons: EndStockItem[] = [];
    const seasonItems: EndStockItem[] = [];

    data.forEach((item) => {
      if (item.ITEM_STD.startsWith('SEASON_ITEM_')) {
        seasonItems.push(item);
      } else if (item.ITEM_STD.startsWith('SEASON_')) {
        seasons.push(item);
      } else {
        items.push(item);
      }
    });

    return { itemData: items, seasonData: seasons, seasonItemData: seasonItems };
  }, [data]);

  // 아이템별 그룹화
  const itemGroups = useMemo(() => {
    const groups: Record<string, EndStockItem[]> = {
      '의류': [],
      'ACC': [],
      '기타': [],
    };

    itemData.forEach((item) => {
      if (item.ITEM_STD.includes('의류')) {
        groups['의류'].push(item);
      } else if (
        item.ITEM_STD === '모자' ||
        item.ITEM_STD === '신발' ||
        item.ITEM_STD === '가방' ||
        item.ITEM_STD === '기타ACC'
      ) {
        groups['ACC'].push(item);
      } else {
        groups['기타'].push(item);
      }
    });

    return groups;
  }, [itemData]);

  // 시즌별 그룹화 (연도별 시즌으로)
  const seasonGroups = useMemo(() => {
    const groups: Record<string, Record<string, number>> = {
      'S': {},
      'N': {},
      'F': {},
    };

    seasonItemData.forEach((item) => {
      // SEASON_ITEM_23S_당시즌 의류 형식에서 시즌 추출
      const parts = item.ITEM_STD.split('_');
      if (parts.length < 3) return;
      
      const fullSeason = parts[2]; // 21S, 22S, 23S 등
      const sesnType = fullSeason.slice(-1).toUpperCase(); // S, N, F
      
      if (sesnType === 'S' || sesnType === 'N' || sesnType === 'F') {
        if (!groups[sesnType][fullSeason]) {
          groups[sesnType][fullSeason] = 0;
        }
        groups[sesnType][fullSeason] += item.CY_END_STOCK_TAG_AMT;
      }
    });

    return groups;
  }, [seasonItemData]);

  const calculateGroupTotal = (items: EndStockItem[]) => {
    return items.reduce((sum, item) => sum + item.CY_END_STOCK_TAG_AMT, 0);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
      >
        <Info className="w-3 h-3" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dialog-right">
          <DialogHeader>
            <DialogTitle>기말재고TAG금액 상세 ({season})</DialogTitle>
            <DialogDescription>
              아이템별/시즌별 기말재고 TAG금액 내역
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="item" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="item">아이템별</TabsTrigger>
              <TabsTrigger value="season">시즌별</TabsTrigger>
            </TabsList>

            {/* 아이템별 뷰 */}
            <TabsContent value="item" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-6">
                {/* 왼쪽: 의류 */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 text-sm mb-2 pb-2 border-b">
                    의류
                  </h3>
                  {itemGroups['의류'].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between p-2 bg-slate-50 rounded text-sm"
                    >
                      <span className="text-slate-700">{item.ITEM_STD}</span>
                      <span className="text-slate-900 font-medium">
                        {Math.round(item.CY_END_STOCK_TAG_AMT / 1000000).toLocaleString()}백만원
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between p-2 bg-blue-50 rounded font-semibold text-sm">
                    <span className="text-blue-900">의류 합계</span>
                    <span className="text-blue-700">
                      {Math.round(calculateGroupTotal(itemGroups['의류']) / 1000000).toLocaleString()}백만원
                    </span>
                  </div>
                </div>

                {/* 오른쪽: ACC */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 text-sm mb-2 pb-2 border-b">
                    ACC
                  </h3>
                  {itemGroups['ACC'].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between p-2 bg-slate-50 rounded text-sm"
                    >
                      <span className="text-slate-700">{item.ITEM_STD}</span>
                      <span className="text-slate-900 font-medium">
                        {Math.round(item.CY_END_STOCK_TAG_AMT / 1000000).toLocaleString()}백만원
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between p-2 bg-blue-50 rounded font-semibold text-sm">
                    <span className="text-blue-900">ACC 합계</span>
                    <span className="text-blue-700">
                      {Math.round(calculateGroupTotal(itemGroups['ACC']) / 1000000).toLocaleString()}백만원
                    </span>
                  </div>

                  {/* 기타 */}
                  {itemGroups['기타'].length > 0 && (
                    <>
                      <h3 className="font-semibold text-slate-900 text-sm mb-2 pb-2 border-b mt-4">
                        기타
                      </h3>
                      {itemGroups['기타'].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between p-2 bg-slate-50 rounded text-sm"
                        >
                          <span className="text-slate-700">{item.ITEM_STD}</span>
                          <span className="text-slate-900 font-medium">
                            {Math.round(item.CY_END_STOCK_TAG_AMT / 1000000).toLocaleString()}백만원
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between p-2 bg-blue-50 rounded font-semibold text-sm">
                        <span className="text-blue-900">기타 합계</span>
                        <span className="text-blue-700">
                          {Math.round(calculateGroupTotal(itemGroups['기타']) / 1000000).toLocaleString()}백만원
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900">전체 합계</span>
                  <span className="text-lg font-bold text-blue-700">
                    {Math.round(total / 1000000).toLocaleString()}백만원
                  </span>
                </div>
              </div>
            </TabsContent>

            {/* 시즌별 뷰 - 3열 형식 */}
            <TabsContent value="season" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-6">
                {/* S시즌 */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 text-sm mb-2 pb-2 border-b">
                    S시즌
                  </h3>
                  {Object.entries(seasonGroups['S'])
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([season, amount]) => (
                      <div key={season} className="flex justify-between text-sm py-1">
                        <span className="text-slate-600">{season}</span>
                        <span className="font-medium text-slate-900">
                          {Math.round(amount / 1000000).toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>

                {/* N시즌 */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 text-sm mb-2 pb-2 border-b">
                    N시즌
                  </h3>
                  {Object.entries(seasonGroups['N'])
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([season, amount]) => (
                      <div key={season} className="flex justify-between text-sm py-1">
                        <span className="text-slate-600">{season}</span>
                        <span className="font-medium text-slate-900">
                          {Math.round(amount / 1000000).toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>

                {/* F시즌 */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 text-sm mb-2 pb-2 border-b">
                    F시즌
                  </h3>
                  {Object.entries(seasonGroups['F'])
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([season, amount]) => (
                      <div key={season} className="flex justify-between text-sm py-1">
                        <span className="text-slate-600">{season}</span>
                        <span className="font-medium text-slate-900">
                          {Math.round(amount / 1000000).toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* 시즌별 합계 - 동일한 행에 표시 */}
              <div className="grid grid-cols-3 gap-6 pt-2 border-t-2 border-slate-300">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-900">합계</span>
                  <span className="text-emerald-700">
                    {Math.round(
                      Object.values(seasonGroups['S']).reduce((sum, val) => sum + val, 0) / 1000000
                    ).toLocaleString()}백만원
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-900">합계</span>
                  <span className="text-amber-700">
                    {Math.round(
                      Object.values(seasonGroups['N']).reduce((sum, val) => sum + val, 0) / 1000000
                    ).toLocaleString()}백만원
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-900">합계</span>
                  <span className="text-indigo-700">
                    {Math.round(
                      Object.values(seasonGroups['F']).reduce((sum, val) => sum + val, 0) / 1000000
                    ).toLocaleString()}백만원
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900">전체 합계</span>
                  <span className="text-lg font-bold text-blue-700">
                    {Math.round(total / 1000000).toLocaleString()}백만원
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

