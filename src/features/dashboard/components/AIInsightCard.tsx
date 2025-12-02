'use client';

import { useState, useImperativeHandle, forwardRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Brand } from '../constants/brands';
import { RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface PnlData {
  endStock?: number;
  orderAmount?: number;
  salesRate?: number;
  salesTag?: number;
  actualSales?: number;
  discountRate?: number;
  vatExcSales?: number;
  shippingPrice?: number;
  cogs?: number;
  inventoryValuationReversal?: number;
  inventoryValuationAddition?: number;
  cogsTotal?: number;
  grossProfit?: number;
  directCost?: {
    royalty?: number;
    logistics?: number;
    storage?: number;
    cardCommission?: number;
    shopRent?: number;
    shopDepreciation?: number;
    onlineCommission?: number;
    storeManagerCommission?: number;
    dutyFreeCommission?: number;
    directlyManagedCommission?: number;
    total?: number;
  };
  directProfit?: number;
  operatingExpense?: {
    adExpense?: number;
    hrCost?: number;
    etcTotal?: number;
    selfRent?: number;
    commonCost?: number;
    mfcIndirect?: number;
    total?: number;
  };
  operatingProfit?: number;
  salesTagChannels?: Array<{ CHNL_NM: string; SALE_TAG_AMT: number }>;
  actualSalesChannels?: Array<{ CHNL_NM: string; ACT_SALE_AMT: number }>;
}

interface AIInsightCardProps {
  brand: Brand;
  pnlData: {
    '23S'?: PnlData;
    '24S'?: PnlData;
    '25S'?: PnlData;
  };
  onLoadingChange?: (loading: boolean) => void;
  onInsightChange?: (insight: string | null) => void;
}

export interface AIInsightCardRef {
  fetchInsight: () => void;
}

export const AIInsightCard = forwardRef<AIInsightCardRef, AIInsightCardProps>(
  ({ brand, pnlData, onLoadingChange, onInsightChange }, ref) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = async () => {
    setLoading(true);
    setError(null);
    onLoadingChange?.(true);

    try {
      const response = await fetch('/api/ai/historical-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: brand.name,
          brandKo: brand.nameKo,
          pnlData,
        }),
      });

      if (!response.ok) {
        throw new Error('AI 인사이트 생성에 실패했습니다.');
      }

      const data = await response.json();
      setInsight(data.insight);
      onInsightChange?.(data.insight);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchInsight,
  }));

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardContent>
        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">오류 발생</p>
              <p className="text-sm mt-1">{error}</p>
              <p className="text-xs mt-2 text-red-500">
                OpenAI API Key가 설정되어 있는지 확인해주세요.
              </p>
            </div>
          </div>
        )}

        {!insight && !error && !loading && (
          <div className="text-center py-8 text-amber-700">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">AI 인사이트를 생성해보세요</p>
            <p className="text-sm mt-1 text-amber-600">
              3개 시즌 실적 데이터를 기반으로 FP&A 관점의 분석을 제공합니다.
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-amber-700">
            <RefreshCw className="w-12 h-12 mx-auto mb-3 animate-spin opacity-50" />
            <p className="font-medium">AI가 실적을 분석하고 있습니다...</p>
            <p className="text-sm mt-1 text-amber-600">잠시만 기다려주세요.</p>
          </div>
        )}

        {insight && !loading && (
          <div className="prose prose-sm max-w-none text-slate-700">
            <div className="whitespace-pre-wrap leading-relaxed">{insight}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});



