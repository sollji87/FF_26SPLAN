'use client';

import { useRef, useState } from 'react';
import { BrandMockData } from '../constants/mockData';
import { SummaryPnlTable, SummaryPnlTableRef } from './SummaryPnlTable';
import { AIInsightCard, AIInsightCardRef } from './AIInsightCard';
import { Brand } from '../constants/brands';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { useEndStockData } from '../hooks/useEndStockData';
import { useSalesTagData, useActualSalesData, CHANNEL_ORDER, sortByChannelOrder } from '../hooks/useSalesData';
import { useOrderAmountData } from '../hooks/useOrderAmountData';
import { useVatExcludedSalesData, VatExcludedSalesItem, calculateShippingPrice, RETAIL_CHANNELS } from '../hooks/useVatExcludedSalesData';
import { useCostOfSalesData } from '../hooks/useCostOfSalesData';
import { useDirectCostData } from '../hooks/useDirectCostData';
import { useOperatingExpenseData } from '../hooks/useOperatingExpenseData';

interface HistoricalTabProps {
  brand: Brand;
  data: BrandMockData;
}

export const HistoricalTab = ({ brand, data }: HistoricalTabProps) => {
  const tableRef = useRef<SummaryPnlTableRef>(null);
  const aiInsightRef = useRef<AIInsightCardRef>(null);
  const [expandedAll, setExpandedAll] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const brandCode = brand.snowflakeCode || 'M';

  // Snowflake 데이터 가져오기 - 기말재고
  const { data: endStock25S, isLoading: isLoadingEndStock25S } = useEndStockData(brandCode, '25S');
  const { data: endStock24S, isLoading: isLoadingEndStock24S } = useEndStockData(brandCode, '24S');
  const { data: endStock23S, isLoading: isLoadingEndStock23S } = useEndStockData(brandCode, '23S');

  // 판매TAG 데이터
  const { data: salesTag23S, isLoading: isLoadingSalesTag23S } = useSalesTagData(brandCode, '23S');
  const { data: salesTag24S, isLoading: isLoadingSalesTag24S } = useSalesTagData(brandCode, '24S');
  const { data: salesTag25S, isLoading: isLoadingSalesTag25S } = useSalesTagData(brandCode, '25S');

  // 실판가 데이터
  const { data: actualSales23S, isLoading: isLoadingActualSales23S } = useActualSalesData(brandCode, '23S');
  const { data: actualSales24S, isLoading: isLoadingActualSales24S } = useActualSalesData(brandCode, '24S');
  const { data: actualSales25S, isLoading: isLoadingActualSales25S } = useActualSalesData(brandCode, '25S');

  // 발주금액(당시즌의류) 데이터
  const { data: orderAmount23S, isLoading: isLoadingOrderAmount23S } = useOrderAmountData(brandCode, '23S');
  const { data: orderAmount24S, isLoading: isLoadingOrderAmount24S } = useOrderAmountData(brandCode, '24S');
  const { data: orderAmount25S, isLoading: isLoadingOrderAmount25S } = useOrderAmountData(brandCode, '25S');

  // 부가세차감(출고)매출 데이터
  const { data: vatExcSales23S, isLoading: isLoadingVatExcSales23S } = useVatExcludedSalesData(brandCode, '23S');
  const { data: vatExcSales24S, isLoading: isLoadingVatExcSales24S } = useVatExcludedSalesData(brandCode, '24S');
  const { data: vatExcSales25S, isLoading: isLoadingVatExcSales25S } = useVatExcludedSalesData(brandCode, '25S');

  // 매출원가 데이터
  const { data: costOfSales23S, isLoading: isLoadingCostOfSales23S } = useCostOfSalesData(brandCode, '23S');
  const { data: costOfSales24S, isLoading: isLoadingCostOfSales24S } = useCostOfSalesData(brandCode, '24S');
  const { data: costOfSales25S, isLoading: isLoadingCostOfSales25S } = useCostOfSalesData(brandCode, '25S');

  // 직접비 데이터
  const { data: directCost23S, isLoading: isLoadingDirectCost23S } = useDirectCostData(brandCode, '23S');
  const { data: directCost24S, isLoading: isLoadingDirectCost24S } = useDirectCostData(brandCode, '24S');
  const { data: directCost25S, isLoading: isLoadingDirectCost25S } = useDirectCostData(brandCode, '25S');

  // 영업비 데이터
  const { data: opExp23S, isLoading: isLoadingOpExp23S } = useOperatingExpenseData(brandCode, '23S');
  const { data: opExp24S, isLoading: isLoadingOpExp24S } = useOperatingExpenseData(brandCode, '24S');
  const { data: opExp25S, isLoading: isLoadingOpExp25S } = useOperatingExpenseData(brandCode, '25S');

  // 모든 데이터 로딩 상태 확인
  const isLoadingAll = 
    isLoadingEndStock23S || isLoadingEndStock24S || isLoadingEndStock25S ||
    isLoadingSalesTag23S || isLoadingSalesTag24S || isLoadingSalesTag25S ||
    isLoadingActualSales23S || isLoadingActualSales24S || isLoadingActualSales25S ||
    isLoadingOrderAmount23S || isLoadingOrderAmount24S || isLoadingOrderAmount25S ||
    isLoadingVatExcSales23S || isLoadingVatExcSales24S || isLoadingVatExcSales25S ||
    isLoadingCostOfSales23S || isLoadingCostOfSales24S || isLoadingCostOfSales25S ||
    isLoadingDirectCost23S || isLoadingDirectCost24S || isLoadingDirectCost25S ||
    isLoadingOpExp23S || isLoadingOpExp24S || isLoadingOpExp25S;

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
      channels: sortByChannelOrder(actualSales23S.data),
      chnlCdData: (actualSales23S as any)?.chnlCdData,
      retailActSaleAmt: (actualSales23S as any)?.retailActSaleAmt,
    } : undefined,
    '24S': actualSales24S?.success ? { 
      total: actualSales24S.total, 
      channels: sortByChannelOrder(actualSales24S.data),
      chnlCdData: (actualSales24S as any)?.chnlCdData,
      retailActSaleAmt: (actualSales24S as any)?.retailActSaleAmt,
    } : undefined,
    '25S': actualSales25S?.success ? { 
      total: actualSales25S.total, 
      channels: sortByChannelOrder(actualSales25S.data),
      chnlCdData: (actualSales25S as any)?.chnlCdData,
      retailActSaleAmt: (actualSales25S as any)?.retailActSaleAmt,
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

  // 직접비 데이터
  const directCostData = {
    '23S': directCost23S?.success ? { 
      totals: directCost23S.totals, 
      channels: directCost23S.data 
    } : undefined,
    '24S': directCost24S?.success ? { 
      totals: directCost24S.totals, 
      channels: directCost24S.data 
    } : undefined,
    '25S': directCost25S?.success ? { 
      totals: directCost25S.totals, 
      channels: directCost25S.data 
    } : undefined,
  };

  // 영업비 데이터
  const operatingExpenseData = {
    '23S': opExp23S?.success ? opExp23S : undefined,
    '24S': opExp24S?.success ? opExp24S : undefined,
    '25S': opExp25S?.success ? opExp25S : undefined,
  };

  const handleToggleAll = () => {
    tableRef.current?.toggleAll();
  };

  // AI 인사이트용 실제 데이터 수집
  const pnlDataForAI = {
    '23S': {
      endStock: endStockTotals['23S'] ? endStockTotals['23S'] / 1000000 : undefined,
      orderAmount: orderAmountData['23S']?.orderAmt,
      salesRate: orderAmountData['23S']?.salesRate,
      salesTag: salesTagData['23S']?.total, // 이미 백만원 단위
      actualSales: actualSalesData['23S']?.total, // 이미 백만원 단위
      discountRate: salesTagData['23S']?.total && actualSalesData['23S']?.total
        ? (1 - actualSalesData['23S'].total / salesTagData['23S'].total) * 100
        : undefined,
      vatExcSales: vatExcSalesData['23S']?.total, // 이미 백만원 단위
      shippingPrice: vatExcSalesData['23S']?.shippingTotal, // 이미 백만원 단위
      cogs: costOfSalesData['23S']?.cogsActual, // 이미 백만원 단위
      inventoryValuationReversal: costOfSalesData['23S']?.stkAsstAprctAmt, // 이미 백만원 단위
      inventoryValuationAddition: costOfSalesData['23S']?.vltnAmt, // 이미 백만원 단위
      cogsTotal: costOfSalesData['23S']?.cogsTotal, // 이미 백만원 단위
      grossProfit: vatExcSalesData['23S']?.total && costOfSalesData['23S']?.cogsTotal
        ? vatExcSalesData['23S'].total - costOfSalesData['23S'].cogsTotal // 둘 다 백만원 단위
        : undefined,
      directCost: directCostData['23S']?.totals
        ? {
            royalty: directCostData['23S'].totals.RYT, // 이미 백만원 단위
            logistics: directCostData['23S'].totals.LGT_CST,
            storage: directCostData['23S'].totals.STRG_CST,
            cardCommission: directCostData['23S'].totals.CARD_CMS,
            shopRent: directCostData['23S'].totals.SHOP_RNT,
            shopDepreciation: directCostData['23S'].totals.SHOP_DEPRC_CST,
            onlineCommission: directCostData['23S'].totals.ALNC_ONLN_CMS,
            storeManagerCommission: directCostData['23S'].totals.SM_CMS,
            dutyFreeCommission: directCostData['23S'].totals.DF_SALE_STFF_CMS,
            directlyManagedCommission: directCostData['23S'].totals.DMGMT_SALE_STFF_CMS,
            total: directCostData['23S'].totals.DIRECT_COST_TOTAL,
          }
        : undefined,
      directProfit: vatExcSalesData['23S']?.total &&
        costOfSalesData['23S']?.cogsTotal &&
        directCostData['23S']?.totals
        ? vatExcSalesData['23S'].total -
            costOfSalesData['23S'].cogsTotal -
            directCostData['23S'].totals.DIRECT_COST_TOTAL // 모두 백만원 단위
        : undefined,
      operatingExpense: operatingExpenseData['23S']
        ? {
            adExpense: operatingExpenseData['23S'].adExpense.amt,
            hrCost: operatingExpenseData['23S'].hrCost.amt,
            etcTotal: operatingExpenseData['23S'].etcTotal.amt,
            selfRent: operatingExpenseData['23S'].selfRent.amt,
            commonCost: operatingExpenseData['23S'].commonCost.amt,
            mfcIndirect: operatingExpenseData['23S'].mfcIndirect.amt,
            total: operatingExpenseData['23S'].total.amt,
          }
        : undefined,
      operatingProfit: vatExcSalesData['23S']?.total &&
        costOfSalesData['23S']?.cogsTotal &&
        directCostData['23S']?.totals &&
        operatingExpenseData['23S']
        ? vatExcSalesData['23S'].total -
            costOfSalesData['23S'].cogsTotal -
            directCostData['23S'].totals.DIRECT_COST_TOTAL -
            operatingExpenseData['23S'].total.amt // 모두 백만원 단위
        : undefined,
      salesTagChannels: salesTagData['23S']?.channels?.map(ch => ({ CHNL_NM: ch.CHNL_NM, SALE_TAG_AMT: ch.SALE_TAG_AMT || 0 })),
      actualSalesChannels: actualSalesData['23S']?.channels?.map(ch => ({ CHNL_NM: ch.CHNL_NM, ACT_SALE_AMT: ch.ACT_SALE_AMT || 0 })),
    },
    '24S': {
      endStock: endStockTotals['24S'] ? endStockTotals['24S'] / 1000000 : undefined,
      orderAmount: orderAmountData['24S']?.orderAmt,
      salesRate: orderAmountData['24S']?.salesRate,
      salesTag: salesTagData['24S']?.total, // 이미 백만원 단위
      actualSales: actualSalesData['24S']?.total, // 이미 백만원 단위
      discountRate: salesTagData['24S']?.total && actualSalesData['24S']?.total
        ? (1 - actualSalesData['24S'].total / salesTagData['24S'].total) * 100
        : undefined,
      vatExcSales: vatExcSalesData['24S']?.total, // 이미 백만원 단위
      shippingPrice: vatExcSalesData['24S']?.shippingTotal, // 이미 백만원 단위
      cogs: costOfSalesData['24S']?.cogsActual, // 이미 백만원 단위
      inventoryValuationReversal: costOfSalesData['24S']?.stkAsstAprctAmt, // 이미 백만원 단위
      inventoryValuationAddition: costOfSalesData['24S']?.vltnAmt, // 이미 백만원 단위
      cogsTotal: costOfSalesData['24S']?.cogsTotal, // 이미 백만원 단위
      grossProfit: vatExcSalesData['24S']?.total && costOfSalesData['24S']?.cogsTotal
        ? vatExcSalesData['24S'].total - costOfSalesData['24S'].cogsTotal // 둘 다 백만원 단위
        : undefined,
      directCost: directCostData['24S']?.totals
        ? {
            royalty: directCostData['24S'].totals.RYT, // 이미 백만원 단위
            logistics: directCostData['24S'].totals.LGT_CST,
            storage: directCostData['24S'].totals.STRG_CST,
            cardCommission: directCostData['24S'].totals.CARD_CMS,
            shopRent: directCostData['24S'].totals.SHOP_RNT,
            shopDepreciation: directCostData['24S'].totals.SHOP_DEPRC_CST,
            onlineCommission: directCostData['24S'].totals.ALNC_ONLN_CMS,
            storeManagerCommission: directCostData['24S'].totals.SM_CMS,
            dutyFreeCommission: directCostData['24S'].totals.DF_SALE_STFF_CMS,
            directlyManagedCommission: directCostData['24S'].totals.DMGMT_SALE_STFF_CMS,
            total: directCostData['24S'].totals.DIRECT_COST_TOTAL,
          }
        : undefined,
      directProfit: vatExcSalesData['24S']?.total &&
        costOfSalesData['24S']?.cogsTotal &&
        directCostData['24S']?.totals
        ? vatExcSalesData['24S'].total -
            costOfSalesData['24S'].cogsTotal -
            directCostData['24S'].totals.DIRECT_COST_TOTAL // 모두 백만원 단위
        : undefined,
      operatingExpense: operatingExpenseData['24S']
        ? {
            adExpense: operatingExpenseData['24S'].adExpense.amt,
            hrCost: operatingExpenseData['24S'].hrCost.amt,
            etcTotal: operatingExpenseData['24S'].etcTotal.amt,
            selfRent: operatingExpenseData['24S'].selfRent.amt,
            commonCost: operatingExpenseData['24S'].commonCost.amt,
            mfcIndirect: operatingExpenseData['24S'].mfcIndirect.amt,
            total: operatingExpenseData['24S'].total.amt,
          }
        : undefined,
      operatingProfit: vatExcSalesData['24S']?.total &&
        costOfSalesData['24S']?.cogsTotal &&
        directCostData['24S']?.totals &&
        operatingExpenseData['24S']
        ? vatExcSalesData['24S'].total -
            costOfSalesData['24S'].cogsTotal -
            directCostData['24S'].totals.DIRECT_COST_TOTAL -
            operatingExpenseData['24S'].total.amt // 모두 백만원 단위
        : undefined,
      salesTagChannels: salesTagData['24S']?.channels?.map(ch => ({ CHNL_NM: ch.CHNL_NM, SALE_TAG_AMT: ch.SALE_TAG_AMT || 0 })),
      actualSalesChannels: actualSalesData['24S']?.channels?.map(ch => ({ CHNL_NM: ch.CHNL_NM, ACT_SALE_AMT: ch.ACT_SALE_AMT || 0 })),
    },
    '25S': {
      endStock: endStockTotals['25S'] ? endStockTotals['25S'] / 1000000 : undefined,
      orderAmount: orderAmountData['25S']?.orderAmt,
      salesRate: orderAmountData['25S']?.salesRate,
      salesTag: salesTagData['25S']?.total, // 이미 백만원 단위
      actualSales: actualSalesData['25S']?.total, // 이미 백만원 단위
      discountRate: salesTagData['25S']?.total && actualSalesData['25S']?.total
        ? (1 - actualSalesData['25S'].total / salesTagData['25S'].total) * 100
        : undefined,
      vatExcSales: vatExcSalesData['25S']?.total, // 이미 백만원 단위
      shippingPrice: vatExcSalesData['25S']?.shippingTotal, // 이미 백만원 단위
      cogs: costOfSalesData['25S']?.cogsActual, // 이미 백만원 단위
      inventoryValuationReversal: costOfSalesData['25S']?.stkAsstAprctAmt, // 이미 백만원 단위
      inventoryValuationAddition: costOfSalesData['25S']?.vltnAmt, // 이미 백만원 단위
      cogsTotal: costOfSalesData['25S']?.cogsTotal, // 이미 백만원 단위
      grossProfit: vatExcSalesData['25S']?.total && costOfSalesData['25S']?.cogsTotal
        ? vatExcSalesData['25S'].total - costOfSalesData['25S'].cogsTotal // 둘 다 백만원 단위
        : undefined,
      directCost: directCostData['25S']?.totals
        ? {
            royalty: directCostData['25S'].totals.RYT, // 이미 백만원 단위
            logistics: directCostData['25S'].totals.LGT_CST,
            storage: directCostData['25S'].totals.STRG_CST,
            cardCommission: directCostData['25S'].totals.CARD_CMS,
            shopRent: directCostData['25S'].totals.SHOP_RNT,
            shopDepreciation: directCostData['25S'].totals.SHOP_DEPRC_CST,
            onlineCommission: directCostData['25S'].totals.ALNC_ONLN_CMS,
            storeManagerCommission: directCostData['25S'].totals.SM_CMS,
            dutyFreeCommission: directCostData['25S'].totals.DF_SALE_STFF_CMS,
            directlyManagedCommission: directCostData['25S'].totals.DMGMT_SALE_STFF_CMS,
            total: directCostData['25S'].totals.DIRECT_COST_TOTAL,
          }
        : undefined,
      directProfit: vatExcSalesData['25S']?.total &&
        costOfSalesData['25S']?.cogsTotal &&
        directCostData['25S']?.totals
        ? vatExcSalesData['25S'].total -
            costOfSalesData['25S'].cogsTotal -
            directCostData['25S'].totals.DIRECT_COST_TOTAL // 모두 백만원 단위
        : undefined,
      operatingExpense: operatingExpenseData['25S']
        ? {
            adExpense: operatingExpenseData['25S'].adExpense.amt,
            hrCost: operatingExpenseData['25S'].hrCost.amt,
            etcTotal: operatingExpenseData['25S'].etcTotal.amt,
            selfRent: operatingExpenseData['25S'].selfRent.amt,
            commonCost: operatingExpenseData['25S'].commonCost.amt,
            mfcIndirect: operatingExpenseData['25S'].mfcIndirect.amt,
            total: operatingExpenseData['25S'].total.amt,
          }
        : undefined,
      operatingProfit: vatExcSalesData['25S']?.total &&
        costOfSalesData['25S']?.cogsTotal &&
        directCostData['25S']?.totals &&
        operatingExpenseData['25S']
        ? vatExcSalesData['25S'].total -
            costOfSalesData['25S'].cogsTotal -
            directCostData['25S'].totals.DIRECT_COST_TOTAL -
            operatingExpenseData['25S'].total.amt // 모두 백만원 단위
        : undefined,
      salesTagChannels: salesTagData['25S']?.channels?.map(ch => ({ CHNL_NM: ch.CHNL_NM, SALE_TAG_AMT: ch.SALE_TAG_AMT || 0 })),
      actualSalesChannels: actualSalesData['25S']?.channels?.map(ch => ({ CHNL_NM: ch.CHNL_NM, ACT_SALE_AMT: ch.ACT_SALE_AMT || 0 })),
    },
  };

  // 로딩 중이면 로딩 화면 표시
  if (isLoadingAll) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600 text-sm">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

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
          onExpandedAllChange={setExpandedAll}
          endStockData={endStockTotals}
          endStockDetails={endStockDetails}
          salesTagData={salesTagData}
          actualSalesData={actualSalesData}
          orderAmountData={orderAmountData}
          vatExcSalesData={vatExcSalesData}
          costOfSalesData={costOfSalesData}
          directCostData={directCostData}
          operatingExpenseData={operatingExpenseData}
          brandCode={brandCode}
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
            AI 인사이트
          </h2>
          <Button
            onClick={() => aiInsightRef.current?.fetchInsight()}
            disabled={aiLoading}
            size="sm"
            variant="outline"
            className="gap-2 border-amber-300 hover:bg-amber-100"
          >
            {aiLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                분석 중...
              </>
            ) : aiInsight ? (
              <>
                <RefreshCw className="w-4 h-4" />
                다시 분석
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                인사이트 생성
              </>
            )}
          </Button>
        </div>
        <AIInsightCard
          ref={aiInsightRef}
          brand={brand}
          pnlData={pnlDataForAI}
          onLoadingChange={setAiLoading}
          onInsightChange={setAiInsight}
        />
      </section>
    </div>
  );
};



