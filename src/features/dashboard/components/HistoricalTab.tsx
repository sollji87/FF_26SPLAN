'use client';

import { useRef, useState } from 'react';
import { BrandMockData } from '../constants/mockData';
import { SummaryPnlTable, SummaryPnlTableRef } from './SummaryPnlTable';
import { SeasonCompareBarChart } from './charts/SeasonCompareBarChart';
import { RatioTrendChart } from './charts/RatioTrendChart';
import { AIInsightCard } from './AIInsightCard';
import { Brand } from '../constants/brands';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEndStockData } from '../hooks/useEndStockData';
import { useSalesTagData, useActualSalesData, CHANNEL_ORDER, sortByChannelOrder } from '../hooks/useSalesData';
import { useOrderAmountData } from '../hooks/useOrderAmountData';
import { useVatExcludedSalesData, VatExcludedSalesItem, calculateShippingPrice, RETAIL_CHANNELS } from '../hooks/useVatExcludedSalesData';
import { useCostOfSalesData } from '../hooks/useCostOfSalesData';

interface HistoricalTabProps {
  brand: Brand;
  data: BrandMockData;
}

export const HistoricalTab = ({ brand, data }: HistoricalTabProps) => {
  const tableRef = useRef<SummaryPnlTableRef>(null);
  const [expandedAll, setExpandedAll] = useState(false);

  const brandCode = brand.snowflakeCode || 'M';

  // Snowflake 데이터 가져오기 - 기말재고
  const { data: endStock25S } = useEndStockData(brandCode, '25S');
  const { data: endStock24S } = useEndStockData(brandCode, '24S');
  const { data: endStock23S } = useEndStockData(brandCode, '23S');

  // 판매TAG 데이터
  const { data: salesTag23S } = useSalesTagData(brandCode, '23S');
  const { data: salesTag24S } = useSalesTagData(brandCode, '24S');
  const { data: salesTag25S } = useSalesTagData(brandCode, '25S');

  // 실판가 데이터
  const { data: actualSales23S } = useActualSalesData(brandCode, '23S');
  const { data: actualSales24S } = useActualSalesData(brandCode, '24S');
  const { data: actualSales25S } = useActualSalesData(brandCode, '25S');

  // 발주금액(당시즌의류) 데이터
  const { data: orderAmount23S } = useOrderAmountData(brandCode, '23S');
  const { data: orderAmount24S } = useOrderAmountData(brandCode, '24S');
  const { data: orderAmount25S } = useOrderAmountData(brandCode, '25S');

  // 부가세차감(출고)매출 데이터
  const { data: vatExcSales23S } = useVatExcludedSalesData(brandCode, '23S');
  const { data: vatExcSales24S } = useVatExcludedSalesData(brandCode, '24S');
  const { data: vatExcSales25S } = useVatExcludedSalesData(brandCode, '25S');

  // 매출원가 데이터
  const { data: costOfSales23S } = useCostOfSalesData(brandCode, '23S');
  const { data: costOfSales24S } = useCostOfSalesData(brandCode, '24S');
  const { data: costOfSales25S } = useCostOfSalesData(brandCode, '25S');

  // 기말재고 TAG금액 합계 계산 (아이템별 데이터만 합산, 시즌별 데이터 제외)
  const endStockTotals = {
    '23S': endStock23S?.success 
      ? endStock23S.data
          .filter(item => !item.ITEM_STD.startsWith('SEASON_'))
          .reduce((sum, item) => sum + item.CY_END_STOCK_TAG_AMT, 0)
      : undefined,
    '24S': endStock24S?.success 
      ? endStock24S.data
          .filter(item => !item.ITEM_STD.startsWith('SEASON_'))
          .reduce((sum, item) => sum + item.CY_END_STOCK_TAG_AMT, 0)
      : undefined,
    '25S': endStock25S?.success 
      ? endStock25S.data
          .filter(item => !item.ITEM_STD.startsWith('SEASON_'))
          .reduce((sum, item) => sum + item.CY_END_STOCK_TAG_AMT, 0)
      : undefined,
  };

  // 기말재고 TAG금액 상세 데이터
  const endStockDetails = {
    '23S': endStock23S?.success ? endStock23S.data : undefined,
    '24S': endStock24S?.success ? endStock24S.data : undefined,
    '25S': endStock25S?.success ? endStock25S.data : undefined,
  };

  // 판매TAG 채널별 데이터
  const salesTagData = {
    '23S': salesTag23S?.success ? { 
      total: salesTag23S.total, 
      channels: sortByChannelOrder(salesTag23S.data) 
    } : undefined,
    '24S': salesTag24S?.success ? { 
      total: salesTag24S.total, 
      channels: sortByChannelOrder(salesTag24S.data) 
    } : undefined,
    '25S': salesTag25S?.success ? { 
      total: salesTag25S.total, 
      channels: sortByChannelOrder(salesTag25S.data) 
    } : undefined,
  };

  // 실판가 채널별 데이터
  const actualSalesData = {
    '23S': actualSales23S?.success ? { 
      total: actualSales23S.total, 
      channels: sortByChannelOrder(actualSales23S.data) 
    } : undefined,
    '24S': actualSales24S?.success ? { 
      total: actualSales24S.total, 
      channels: sortByChannelOrder(actualSales24S.data) 
    } : undefined,
    '25S': actualSales25S?.success ? { 
      total: actualSales25S.total, 
      channels: sortByChannelOrder(actualSales25S.data) 
    } : undefined,
  };

  // 발주금액(당시즌의류) 데이터
  const orderAmountData = {
    '23S': orderAmount23S,
    '24S': orderAmount24S,
    '25S': orderAmount25S,
  };

  // 부가세차감(출고)매출 및 출고가(V+) 계산 헬퍼
  const processVatExcSalesData = (vatExcData: typeof vatExcSales23S) => {
    if (!vatExcData?.success) return undefined;
    
    // 채널별 출고가(V+) 계산
    const channelsWithShipping = vatExcData.data.map((item: VatExcludedSalesItem) => ({
      ...item,
      SHIPPING_PRICE: Math.round(calculateShippingPrice(item.VAT_EXC_SALE_AMT, item.ACT_SALE_AMT, item.CHNL_NM))
    }));

    // 출고가(V+) 합계 계산
    const shippingTotal = channelsWithShipping.reduce((sum: number, item: any) => sum + item.SHIPPING_PRICE, 0);

    return {
      total: vatExcData.total,
      shippingTotal,
      channels: channelsWithShipping
    };
  };

  // 부가세차감(출고)매출 및 출고가(V+) 데이터
  const vatExcSalesData = {
    '23S': processVatExcSalesData(vatExcSales23S),
    '24S': processVatExcSalesData(vatExcSales24S),
    '25S': processVatExcSalesData(vatExcSales25S),
  };

  // 매출원가 데이터
  const costOfSalesData = {
    '23S': costOfSales23S?.success ? costOfSales23S.data : undefined,
    '24S': costOfSales24S?.success ? costOfSales24S.data : undefined,
    '25S': costOfSales25S?.success ? costOfSales25S.data : undefined,
  };

  const handleToggleAll = () => {
    tableRef.current?.toggleAll();
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
            요약 손익계산서 (23S / 24S / 25S)
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleAll}
            className="gap-2"
          >
            {expandedAll ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {expandedAll ? '모두 접기' : '모두 펼치기'}
          </Button>
        </div>
        <SummaryPnlTable
          ref={tableRef}
          seasons={data.seasons}
          onExpandedAllChange={setExpandedAll}
          endStockData={endStockTotals}
          endStockDetails={endStockDetails}
          salesTagData={salesTagData}
          actualSalesData={actualSalesData}
          orderAmountData={orderAmountData}
          vatExcSalesData={vatExcSalesData}
          costOfSalesData={costOfSalesData}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h3 className="text-md font-semibold text-slate-800 mb-4">
            시즌별 매출 / 영업이익 비교
          </h3>
          <SeasonCompareBarChart seasons={data.seasons} />
        </section>

        <section>
          <h3 className="text-md font-semibold text-slate-800 mb-4">
            주요 비율 트렌드
          </h3>
          <RatioTrendChart seasons={data.seasons} />
        </section>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
          AI 인사이트
        </h2>
        <AIInsightCard brand={brand} seasons={data.seasons} />
      </section>
    </div>
  );
};



