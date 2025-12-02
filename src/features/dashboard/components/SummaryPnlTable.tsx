'use client';

import { useState, useImperativeHandle, forwardRef, Fragment } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '../constants/mockData';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { EndStockTooltip } from './EndStockTooltip';
import { EndStockItem } from '../hooks/useEndStockData';
import { SalesChannelItem, CHANNEL_ORDER } from '../hooks/useSalesData';
import { OperatingExpenseResponse } from '../hooks/useOperatingExpenseData';

interface ChnlCdItem {
  CHNL_NM: string;
  CHNL_CD: string;
  ACT_SALE_AMT?: number;
}

interface ChannelSalesData {
  retailActSaleAmt?: number;  // 채널코드 3,4,5,7,11 실판가 합계 (로열티 계산용)
  chnlCdData?: ChnlCdItem[];  // 채널코드별 실판가 데이터
  total: number;
  channels: SalesChannelItem[];
}

interface OrderAmountData {
  endStockTagAmt: number;
  salesTagAmt: number;
  orderAmt: number;
  salesRate: number;
}

interface VatExcSalesChannelItem {
  CHNL_NM: string;
  VAT_EXC_SALE_AMT: number;
  ACT_SALE_AMT: number;
  SHIPPING_PRICE: number;
}

interface VatExcSalesData {
  total: number;
  shippingTotal: number;
  channels: VatExcSalesChannelItem[];
}

interface CostOfSalesData {
  cogsBase: number;           // 기초 COGS (DM_PL_SHOP_PRDT_M)
  stkAsstAprctAmt: number;    // 재고평가감(환입)
  vltnAmt: number;            // 재고평가감(추가)
  cogsActual: number;         // 매출원가(실적) = COGS - 환입
  cogsTotal: number;          // 매출원가 소계 = 매출원가(실적) + 환입 + 추가
}

interface DirectCostTotals {
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

interface DirectCostChannelItem {
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

interface DirectCostData {
  totals: DirectCostTotals;
  channels: DirectCostChannelItem[];
}

interface SummaryPnlTableProps {
  onExpandedAllChange?: (expanded: boolean) => void;
  endStockData?: {
    '23S'?: number;
    '24S'?: number;
    '25S'?: number;
  };
  endStockDetails?: {
    '23S'?: EndStockItem[];
    '24S'?: EndStockItem[];
    '25S'?: EndStockItem[];
  };
  salesTagData?: {
    '23S'?: ChannelSalesData;
    '24S'?: ChannelSalesData;
    '25S'?: ChannelSalesData;
  };
  actualSalesData?: {
    '23S'?: ChannelSalesData;
    '24S'?: ChannelSalesData;
    '25S'?: ChannelSalesData;
  };
  orderAmountData?: {
    '23S'?: OrderAmountData;
    '24S'?: OrderAmountData;
    '25S'?: OrderAmountData;
  };
  vatExcSalesData?: {
    '23S'?: VatExcSalesData;
    '24S'?: VatExcSalesData;
    '25S'?: VatExcSalesData;
  };
  costOfSalesData?: {
    '23S'?: CostOfSalesData;
    '24S'?: CostOfSalesData;
    '25S'?: CostOfSalesData;
  };
  directCostData?: {
    '23S'?: DirectCostData;
    '24S'?: DirectCostData;
    '25S'?: DirectCostData;
  };
  operatingExpenseData?: {
    '23S'?: OperatingExpenseResponse;
    '24S'?: OperatingExpenseResponse;
    '25S'?: OperatingExpenseResponse;
  };
  brandCode?: string; // M, I, X, V, ST
}

export interface SummaryPnlTableRef {
  toggleAll: () => void;
  isExpandedAll: () => boolean;
}

const TrendIndicator = ({ current, previous }: { current: number; previous?: number }) => {
  if (!previous) return null;

  const change = ((current - previous) / previous) * 100;

  if (Math.abs(change) < 0.5) {
    return <Minus className="w-3 h-3 text-slate-400 inline ml-1" />;
  }

  if (change > 0) {
    return (
      <span className="text-emerald-600 text-xs ml-1 inline-flex items-center">
        <TrendingUp className="w-3 h-3" />
        {change.toFixed(1)}%
      </span>
    );
  }

  return (
    <span className="text-red-600 text-xs ml-1 inline-flex items-center">
      <TrendingDown className="w-3 h-3" />
      {Math.abs(change).toFixed(1)}%
    </span>
  );
};

export const SummaryPnlTable = forwardRef<SummaryPnlTableRef, SummaryPnlTableProps>(
  ({ onExpandedAllChange, endStockData, endStockDetails, salesTagData, actualSalesData, orderAmountData, vatExcSalesData, costOfSalesData, directCostData, operatingExpenseData, brandCode }, ref) => {
    const [expandedAll, setExpandedAll] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    
    // 시즌 목록 하드코딩
    const seasons: Array<{ season: '23S' | '24S' | '25S' }> = [
      { season: '23S' },
      { season: '24S' },
      { season: '25S' },
    ];

    const toggleSection = (key: string) => {
      setExpandedSections((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    };

    const toggleAll = () => {
      const newState = !expandedAll;
      setExpandedAll(newState);
      onExpandedAllChange?.(newState);
      setExpandedSections({
        salesTag: newState,
        actualSales: newState,
        shippingPrice: newState,
        cogs: newState,
        directCost: newState,
        operatingExpense: newState,
      });
    };

    useImperativeHandle(ref, () => ({
      toggleAll,
      isExpandedAll: () => expandedAll,
    }));

    const isExpanded = (key: string) => expandedSections[key] || false;

  // 채널 순서 (플래그쉽, 백화점, 대리점, 직영(가두), 온라인(직), 온라인(제휴), 면세점, RF, 사입, 기타)
  const channels = CHANNEL_ORDER;

  const renderValueAndPercent = (
    value: number,
    previousValue: number | undefined,
    className: string = 'font-medium'
  ) => {
    const percent = previousValue ? ((value - previousValue) / previousValue) * 100 : null;
    return (
      <>
        <TableCell className="text-right">
          <span className={className}>{formatCurrency(value)}</span>
        </TableCell>
        <TableCell className="text-right">
          {percent !== null ? (
            <span className={`text-xs ${percent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {percent >= 0 ? '+' : ''}{percent.toFixed(1)}%
            </span>
          ) : (
            <span className="text-xs text-slate-500">-</span>
          )}
        </TableCell>
      </>
    );
  };

  // YOY 형식 (당년/전년*100%) - 판매TAG까지 사용
  const renderValueAndYOY = (
    value: number,
    previousValue: number | undefined,
    className: string = 'font-medium'
  ) => {
    const yoy = previousValue && previousValue > 0 ? (value / previousValue) * 100 : null;
    return (
      <>
        <TableCell className="text-right">
          <span className={className}>{formatCurrency(value)}</span>
        </TableCell>
        <TableCell className="text-right">
          {yoy !== null ? (
            <span className="text-xs text-slate-600">
              {yoy.toFixed(1)}%
            </span>
          ) : (
            <span className="text-xs text-slate-500">-</span>
          )}
        </TableCell>
      </>
    );
  };

  const renderYOYColumns = (currentValue: number, previousValue: number | undefined, firstValue: number | undefined) => {
    const yoyVsPrevious = previousValue ? ((currentValue / previousValue) * 100).toFixed(1) : '-';
    const yoyVsFirst = firstValue && seasons.length > 2 ? ((currentValue / firstValue) * 100).toFixed(1) : '-';
    
    return (
      <>
        <TableCell className="text-right">
          <span className="text-xs text-slate-700">{yoyVsPrevious}%</span>
        </TableCell>
        {seasons.length > 2 && (
          <TableCell className="text-right">
            <span className="text-xs text-slate-700">{yoyVsFirst}%</span>
          </TableCell>
        )}
      </>
    );
  };

      return (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto relative">
            <Table className="sticky-table [&_td]:py-1.5 [&_th]:py-1.5 [&_td]:text-sm [&_th]:text-sm min-w-full">
        <TableHeader>
          <TableRow className="bg-slate-50 border-b-0">
            <TableHead className="w-48 font-semibold py-0.5 h-auto" rowSpan={2}>항목(백만원)</TableHead>
            {seasons.map((season, idx) => (
              <Fragment key={season.season}>
                <TableHead className="text-center font-semibold py-0.5 h-auto" colSpan={2}>
                  {season.season}
                </TableHead>
                {idx === seasons.length - 1 && (
                  <>
                    <TableHead className="text-center font-semibold py-0.5 h-auto leading-tight" rowSpan={2}>
                      <div className="text-xs">YOY(%)</div>
                      <div className="text-xs font-normal">vs {seasons[idx - 1]?.season}</div>
                    </TableHead>
                    {seasons.length > 2 && (
                      <TableHead className="text-center font-semibold py-0.5 h-auto leading-tight" rowSpan={2}>
                        <div className="text-xs">YOY(%)</div>
                        <div className="text-xs font-normal">vs {seasons[0]?.season}</div>
                      </TableHead>
                    )}
                  </>
                )}
              </Fragment>
            ))}
          </TableRow>
          <TableRow className="bg-slate-50 border-b">
            {seasons.map((season) => (
              <Fragment key={season.season}>
                <TableHead className="text-center font-semibold w-32 py-0.5 h-auto">금액</TableHead>
                <TableHead className="text-center font-semibold w-24 py-0.5 h-auto">(%)</TableHead>
              </Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* 기말재고TAG금액 */}
          <TableRow>
            <TableCell className="font-medium text-slate-700">기말재고TAG금액</TableCell>
            {seasons.map((season, idx) => {
              // Snowflake 데이터 사용 (백만원 단위로 변환)
              const value = endStockData?.[season.season] 
                ? endStockData[season.season] / 1000000 
                : 0;
              const previousValue = idx > 0 
                ? (endStockData?.[seasons[idx - 1].season] 
                    ? endStockData[seasons[idx - 1].season]! / 1000000 
                    : 0)
                : undefined;
              const yoy = previousValue && previousValue > 0 ? (value / previousValue) * 100 : null;
              const hasDetails = endStockDetails?.[season.season] && endStockData?.[season.season];
              
              return (
                <Fragment key={season.season}>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {hasDetails && (
                        <EndStockTooltip
                          season={season.season}
                          data={endStockDetails[season.season]!}
                          total={endStockData[season.season]!}
                        />
                      )}
                      <span className="font-medium">{formatCurrency(value)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {yoy !== null ? (
                      <span className="text-xs text-slate-600">
                        {yoy.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </TableCell>
                </Fragment>
              );
            })}
            {(() => {
              const currentValue = endStockData?.[seasons[seasons.length - 1].season]
                ? endStockData[seasons[seasons.length - 1].season]! / 1000000
                : 0;
              const previousValue = seasons.length > 1 && endStockData?.[seasons[seasons.length - 2].season]
                ? endStockData[seasons[seasons.length - 2].season]! / 1000000
                : (seasons.length > 1 ? 0 : undefined);
              const firstValue = endStockData?.[seasons[0].season]
                ? endStockData[seasons[0].season]! / 1000000
                : 0;
              return renderYOYColumns(currentValue, previousValue, firstValue);
            })()}
          </TableRow>

          {/* 발주금액(당시즌의류) - 항상 표시 */}
          <TableRow>
            <TableCell className="font-semibold text-slate-900">
              당시즌의류 발주액 (판매율)
            </TableCell>
            {seasons.map((season) => {
              const orderData = orderAmountData?.[season.season as '23S' | '24S' | '25S'];
              const orderAmt = orderData?.orderAmt ?? 0;
              const salesRate = orderData?.salesRate ?? 0;
              return (
                <Fragment key={season.season}>
                  <TableCell className="text-right">
                    <span className="font-semibold">{formatCurrency(orderAmt)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs text-slate-600">
                      {salesRate.toFixed(1)}%
                    </span>
                  </TableCell>
                </Fragment>
              );
            })}
            {(() => {
              const currentOrderData = orderAmountData?.[seasons[seasons.length - 1].season as '23S' | '24S' | '25S'];
              const prevOrderData = seasons.length > 1 
                ? orderAmountData?.[seasons[seasons.length - 2].season as '23S' | '24S' | '25S']
                : undefined;
              const firstOrderData = orderAmountData?.[seasons[0].season as '23S' | '24S' | '25S'];
              
              const currentValue = currentOrderData?.orderAmt ?? 0;
              const previousValue = prevOrderData?.orderAmt ?? (seasons.length > 1 ? 0 : undefined);
              const firstValue = firstOrderData?.orderAmt ?? 0;
              
              return renderYOYColumns(currentValue, previousValue, firstValue);
            })()}
          </TableRow>

          {/* 판매TAG - 펼치기 가능 */}
          <TableRow
            className="cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => toggleSection('salesTag')}
          >
            <TableCell className="font-medium text-slate-700 hover:font-bold hover:underline">
              판매TAG
            </TableCell>
            {seasons.map((season, idx) => {
              const value = salesTagData?.[season.season]?.total ?? 0;
              const previousValue = idx > 0 
                ? (salesTagData?.[seasons[idx - 1].season]?.total ?? 0)
                : undefined;
              return (
                <Fragment key={season.season}>
                  {renderValueAndYOY(value, previousValue, 'font-medium')}
                </Fragment>
              );
            })}
            {(() => {
              const currentValue = salesTagData?.[seasons[seasons.length - 1].season]?.total ?? 0;
              const previousValue = seasons.length > 1 
                ? (salesTagData?.[seasons[seasons.length - 2].season]?.total ?? 0)
                : undefined;
              const firstValue = salesTagData?.[seasons[0].season]?.total ?? 0;
              return renderYOYColumns(currentValue, previousValue, firstValue);
            })()}
          </TableRow>

          {/* 판매TAG 채널별 */}
          {isExpanded('salesTag') &&
            channels.map((channel) => {
              // 해당 채널의 데이터가 하나라도 있는지 확인
              const hasData = seasons.some(season => 
                salesTagData?.[season.season]?.channels?.find(c => c.CHNL_NM === channel)
              );
              if (!hasData && salesTagData) return null;
              
              return (
                <TableRow key={`salesTag-${channel}`} className="bg-slate-50">
                  <TableCell className="pl-8 text-slate-600 text-sm">{channel}</TableCell>
                  {seasons.map((season, idx) => {
                    const channelData = salesTagData?.[season.season]?.channels?.find(c => c.CHNL_NM === channel);
                    const value = channelData?.SALE_TAG_AMT ?? 0;
                    const prevChannelData = idx > 0 
                      ? salesTagData?.[seasons[idx - 1].season]?.channels?.find(c => c.CHNL_NM === channel)
                      : undefined;
                    const previousValue = prevChannelData?.SALE_TAG_AMT;
                    return (
                      <Fragment key={season.season}>
                        {renderValueAndYOY(value, previousValue, 'text-sm')}
                      </Fragment>
                    );
                  })}
                  {(() => {
                    const currentChannel = salesTagData?.[seasons[seasons.length - 1].season]?.channels?.find(c => c.CHNL_NM === channel);
                    const prevChannel = seasons.length > 1 
                      ? salesTagData?.[seasons[seasons.length - 2].season]?.channels?.find(c => c.CHNL_NM === channel)
                      : undefined;
                    const firstChannel = salesTagData?.[seasons[0].season]?.channels?.find(c => c.CHNL_NM === channel);
                    return renderYOYColumns(
                      currentChannel?.SALE_TAG_AMT ?? 0,
                      prevChannel?.SALE_TAG_AMT,
                      firstChannel?.SALE_TAG_AMT
                    );
                  })()}
                </TableRow>
              );
            })}

          {/* 판매TAG 소계 */}
          {isExpanded('salesTag') && (
            <TableRow className="bg-slate-100">
              <TableCell className="pl-8 font-semibold text-slate-800">판매TAG</TableCell>
              {seasons.map((season, idx) => {
                const value = salesTagData?.[season.season]?.total ?? 0;
                const previousValue = idx > 0 
                  ? (salesTagData?.[seasons[idx - 1].season]?.total ?? 0)
                  : undefined;
                return (
                  <Fragment key={season.season}>
                    {renderValueAndYOY(value, previousValue, 'font-semibold')}
                  </Fragment>
                );
              })}
              {(() => {
                const currentValue = salesTagData?.[seasons[seasons.length - 1].season]?.total ?? 0;
                const previousValue = seasons.length > 1 
                  ? (salesTagData?.[seasons[seasons.length - 2].season]?.total ?? 0)
                  : undefined;
                const firstValue = salesTagData?.[seasons[0].season]?.total ?? 0;
                return renderYOYColumns(currentValue, previousValue, firstValue);
              })()}
            </TableRow>
          )}

          {/* 실판가 - 펼치기 가능 */}
          <TableRow
            className="cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => toggleSection('actualSales')}
          >
            <TableCell className="font-medium text-slate-700 hover:font-bold hover:underline">
              실판가
            </TableCell>
            {seasons.map((season) => {
              const actualValue = actualSalesData?.[season.season]?.total ?? 0;
              const tagValue = salesTagData?.[season.season]?.total ?? 0;
              const discountRate = tagValue > 0 ? (1 - actualValue / tagValue) * 100 : 0;
              return (
                <Fragment key={season.season}>
                  <TableCell className="text-right">
                    <span className="font-medium">{formatCurrency(actualValue)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs text-slate-600">
                      {discountRate.toFixed(1)}%
                    </span>
                  </TableCell>
                </Fragment>
              );
            })}
            {(() => {
              // 할인율 계산
              const currentActual = actualSalesData?.[seasons[seasons.length - 1].season]?.total ?? 0;
              const currentTag = salesTagData?.[seasons[seasons.length - 1].season]?.total ?? 0;
              const currentDiscountRate = currentTag > 0 ? (1 - currentActual / currentTag) * 100 : 0;

              const prevActual = seasons.length > 1 
                ? (actualSalesData?.[seasons[seasons.length - 2].season]?.total ?? 0)
                : undefined;
              const prevTag = seasons.length > 1
                ? (salesTagData?.[seasons[seasons.length - 2].season]?.total ?? 0)
                : undefined;
              const prevDiscountRate = prevTag && prevTag > 0 ? (1 - (prevActual ?? 0) / prevTag) * 100 : undefined;

              const firstActual = actualSalesData?.[seasons[0].season]?.total ?? 0;
              const firstTag = salesTagData?.[seasons[0].season]?.total ?? 0;
              const firstDiscountRate = firstTag > 0 ? (1 - firstActual / firstTag) * 100 : 0;

              const diffVsPrev = prevDiscountRate !== undefined ? currentDiscountRate - prevDiscountRate : undefined;
              const diffVsFirst = seasons.length > 2 ? currentDiscountRate - firstDiscountRate : undefined;

              return (
                <>
                  <TableCell className="text-right">
                    {diffVsPrev !== undefined ? (
                      <span className={`text-xs ${diffVsPrev >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </TableCell>
                  {seasons.length > 2 && (
                    <TableCell className="text-right">
                      {diffVsFirst !== undefined ? (
                        <span className={`text-xs ${diffVsFirst >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </TableCell>
                  )}
                </>
              );
            })()}
          </TableRow>

          {/* 실판가 채널별 */}
          {isExpanded('actualSales') &&
            channels.map((channel) => {
              // 해당 채널의 데이터가 하나라도 있는지 확인
              const hasData = seasons.some(season => 
                actualSalesData?.[season.season]?.channels?.find(c => c.CHNL_NM === channel)
              );
              if (!hasData && actualSalesData) return null;
              
              return (
                <TableRow key={`actualSales-${channel}`} className="bg-slate-50">
                  <TableCell className="pl-8 text-slate-600 text-sm">{channel}</TableCell>
                  {seasons.map((season) => {
                    const channelActualData = actualSalesData?.[season.season]?.channels?.find(c => c.CHNL_NM === channel);
                    const channelTagData = salesTagData?.[season.season]?.channels?.find(c => c.CHNL_NM === channel);
                    const actualValue = channelActualData?.ACT_SALE_AMT ?? 0;
                    const tagValue = channelTagData?.SALE_TAG_AMT ?? 0;
                    const discountRate = tagValue > 0 ? (1 - actualValue / tagValue) * 100 : 0;
                    return (
                      <Fragment key={season.season}>
                        <TableCell className="text-right">
                          <span className="text-sm">{formatCurrency(actualValue)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-xs text-slate-600">
                            {discountRate.toFixed(1)}%
                          </span>
                        </TableCell>
                      </Fragment>
                    );
                  })}
                  {(() => {
                    // 채널별 할인율 계산
                    const currentActualCh = actualSalesData?.[seasons[seasons.length - 1].season]?.channels?.find(c => c.CHNL_NM === channel);
                    const currentTagCh = salesTagData?.[seasons[seasons.length - 1].season]?.channels?.find(c => c.CHNL_NM === channel);
                    const currentDiscountRateCh = (currentTagCh?.SALE_TAG_AMT ?? 0) > 0 
                      ? (1 - (currentActualCh?.ACT_SALE_AMT ?? 0) / (currentTagCh?.SALE_TAG_AMT ?? 1)) * 100 
                      : 0;

                    const prevActualCh = seasons.length > 1 
                      ? actualSalesData?.[seasons[seasons.length - 2].season]?.channels?.find(c => c.CHNL_NM === channel)
                      : undefined;
                    const prevTagCh = seasons.length > 1
                      ? salesTagData?.[seasons[seasons.length - 2].season]?.channels?.find(c => c.CHNL_NM === channel)
                      : undefined;
                    const prevDiscountRateCh = prevTagCh && (prevTagCh.SALE_TAG_AMT ?? 0) > 0 
                      ? (1 - (prevActualCh?.ACT_SALE_AMT ?? 0) / (prevTagCh.SALE_TAG_AMT ?? 1)) * 100 
                      : undefined;

                    const firstActualCh = actualSalesData?.[seasons[0].season]?.channels?.find(c => c.CHNL_NM === channel);
                    const firstTagCh = salesTagData?.[seasons[0].season]?.channels?.find(c => c.CHNL_NM === channel);
                    const firstDiscountRateCh = (firstTagCh?.SALE_TAG_AMT ?? 0) > 0 
                      ? (1 - (firstActualCh?.ACT_SALE_AMT ?? 0) / (firstTagCh?.SALE_TAG_AMT ?? 1)) * 100 
                      : 0;

                    const diffVsPrevCh = prevDiscountRateCh !== undefined ? currentDiscountRateCh - prevDiscountRateCh : undefined;
                    const diffVsFirstCh = seasons.length > 2 ? currentDiscountRateCh - firstDiscountRateCh : undefined;

                    return (
                      <>
                        <TableCell className="text-right">
                          {diffVsPrevCh !== undefined ? (
                            <span className={`text-xs ${diffVsPrevCh >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {diffVsPrevCh >= 0 ? '+' : ''}{diffVsPrevCh.toFixed(1)}%p
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </TableCell>
                        {seasons.length > 2 && (
                          <TableCell className="text-right">
                            {diffVsFirstCh !== undefined ? (
                              <span className={`text-xs ${diffVsFirstCh >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {diffVsFirstCh >= 0 ? '+' : ''}{diffVsFirstCh.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                        )}
                      </>
                    );
                  })()}
                </TableRow>
              );
            })}

          {/* 실판가 소계 */}
          {isExpanded('actualSales') && (
            <TableRow className="bg-slate-100">
              <TableCell className="pl-8 font-semibold text-slate-800">실판가</TableCell>
              {seasons.map((season) => {
                const actualValue = actualSalesData?.[season.season]?.total ?? 0;
                const tagValue = salesTagData?.[season.season]?.total ?? 0;
                const discountRate = tagValue > 0 ? (1 - actualValue / tagValue) * 100 : 0;
                return (
                  <Fragment key={season.season}>
                    <TableCell className="text-right">
                      <span className="font-semibold">{formatCurrency(actualValue)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs text-slate-600">
                        {discountRate.toFixed(1)}%
                      </span>
                    </TableCell>
                  </Fragment>
                );
              })}
              {(() => {
                // 할인율 계산 (소계)
                const currentActual = actualSalesData?.[seasons[seasons.length - 1].season]?.total ?? 0;
                const currentTag = salesTagData?.[seasons[seasons.length - 1].season]?.total ?? 0;
                const currentDiscountRate = currentTag > 0 ? (1 - currentActual / currentTag) * 100 : 0;

                const prevActual = seasons.length > 1 
                  ? (actualSalesData?.[seasons[seasons.length - 2].season]?.total ?? 0)
                  : undefined;
                const prevTag = seasons.length > 1
                  ? (salesTagData?.[seasons[seasons.length - 2].season]?.total ?? 0)
                  : undefined;
                const prevDiscountRate = prevTag && prevTag > 0 ? (1 - (prevActual ?? 0) / prevTag) * 100 : undefined;

                const firstActual = actualSalesData?.[seasons[0].season]?.total ?? 0;
                const firstTag = salesTagData?.[seasons[0].season]?.total ?? 0;
                const firstDiscountRate = firstTag > 0 ? (1 - firstActual / firstTag) * 100 : 0;

                const diffVsPrev = prevDiscountRate !== undefined ? currentDiscountRate - prevDiscountRate : undefined;
                const diffVsFirst = seasons.length > 2 ? currentDiscountRate - firstDiscountRate : undefined;

                return (
                  <>
                    <TableCell className="text-right">
                      {diffVsPrev !== undefined ? (
                        <span className={`text-xs ${diffVsPrev >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </TableCell>
                    {seasons.length > 2 && (
                      <TableCell className="text-right">
                        {diffVsFirst !== undefined ? (
                          <span className={`text-xs ${diffVsFirst >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                    )}
                  </>
                );
              })()}
            </TableRow>
          )}

          {/* 출고가(V+) - 펼치기 가능 */}
          <TableRow
            className="cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => toggleSection('shippingPrice')}
          >
            <TableCell className="font-medium text-slate-700 hover:font-bold hover:underline">
              출고가(V+)
            </TableCell>
            {seasons.map((season) => {
              const shippingValue = vatExcSalesData?.[season.season as '23S' | '24S' | '25S']?.shippingTotal ?? 0;
              const actualValue = actualSalesData?.[season.season as '23S' | '24S' | '25S']?.total ?? 0;
              const shippingToActualRatio = actualValue > 0 ? (shippingValue / actualValue) * 100 : 0;
              
              return (
                <Fragment key={season.season}>
                  <TableCell className="text-right">
                    <span className="font-medium">{formatCurrency(shippingValue)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs text-slate-600">
                      {shippingToActualRatio.toFixed(1)}%
                    </span>
                  </TableCell>
                </Fragment>
              );
            })}
            {(() => {
              // 출고가(V+)/실판가 비율 계산
              const currentShipping = vatExcSalesData?.[seasons[seasons.length - 1].season as '23S' | '24S' | '25S']?.shippingTotal ?? 0;
              const currentActual = actualSalesData?.[seasons[seasons.length - 1].season as '23S' | '24S' | '25S']?.total ?? 1;
              const currentRatio = currentActual > 0 ? (currentShipping / currentActual) * 100 : 0;

              const prevShipping = seasons.length > 1 
                ? (vatExcSalesData?.[seasons[seasons.length - 2].season as '23S' | '24S' | '25S']?.shippingTotal ?? 0)
                : 0;
              const prevActual = seasons.length > 1 
                ? (actualSalesData?.[seasons[seasons.length - 2].season as '23S' | '24S' | '25S']?.total ?? 1)
                : 1;
              const prevRatio = prevActual > 0 ? (prevShipping / prevActual) * 100 : 0;

              const firstShipping = vatExcSalesData?.[seasons[0].season as '23S' | '24S' | '25S']?.shippingTotal ?? 0;
              const firstActual = actualSalesData?.[seasons[0].season as '23S' | '24S' | '25S']?.total ?? 1;
              const firstRatio = firstActual > 0 ? (firstShipping / firstActual) * 100 : 0;

              const diffVsPrev = currentRatio - prevRatio;
              const diffVsFirst = seasons.length > 2 ? currentRatio - firstRatio : undefined;

              return (
                <>
                  <TableCell className="text-right">
                    {prevRatio > 0 ? (
                      <span className={`text-xs ${diffVsPrev >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </TableCell>
                  {seasons.length > 2 && (
                    <TableCell className="text-right">
                      {diffVsFirst !== undefined && firstRatio > 0 ? (
                        <span className={`text-xs ${diffVsFirst >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </TableCell>
                  )}
                </>
              );
            })()}
          </TableRow>

          {/* 출고가 채널별 */}
          {isExpanded('shippingPrice') &&
            channels.map((channel) => {
              // 해당 채널의 데이터가 하나라도 있는지 확인
              const hasData = seasons.some(season => 
                vatExcSalesData?.[season.season as '23S' | '24S' | '25S']?.channels?.find(c => c.CHNL_NM === channel)
              );
              if (!hasData && vatExcSalesData) return null;

              return (
                <TableRow key={`shippingPrice-${channel}`} className="bg-slate-50">
                  <TableCell className="pl-8 text-slate-600 text-sm">{channel}</TableCell>
                  {seasons.map((season) => {
                    const channelData = vatExcSalesData?.[season.season as '23S' | '24S' | '25S']?.channels?.find(c => c.CHNL_NM === channel);
                    const shippingValue = channelData?.SHIPPING_PRICE ?? 0;
                    const actualChannelData = actualSalesData?.[season.season as '23S' | '24S' | '25S']?.channels?.find(c => c.CHNL_NM === channel);
                    const actualValue = actualChannelData?.ACT_SALE_AMT ?? 0;
                    const shippingToActualRatio = actualValue > 0 ? (shippingValue / actualValue) * 100 : 0;
                    
                    return (
                      <Fragment key={season.season}>
                        <TableCell className="text-right">
                          <span className="text-sm">{formatCurrency(shippingValue)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-xs text-slate-600">
                            {shippingToActualRatio.toFixed(1)}%
                          </span>
                        </TableCell>
                      </Fragment>
                    );
                  })}
                  {(() => {
                    // 채널별 출고가(V+)/실판가 비율 계산
                    const currentChannel = vatExcSalesData?.[seasons[seasons.length - 1].season as '23S' | '24S' | '25S']?.channels?.find(c => c.CHNL_NM === channel);
                    const currentActualChannel = actualSalesData?.[seasons[seasons.length - 1].season as '23S' | '24S' | '25S']?.channels?.find(c => c.CHNL_NM === channel);
                    const currentShipping = currentChannel?.SHIPPING_PRICE ?? 0;
                    const currentActual = currentActualChannel?.ACT_SALE_AMT ?? 1;
                    const currentRatio = currentActual > 0 ? (currentShipping / currentActual) * 100 : 0;

                    const prevChannel = seasons.length > 1 
                      ? vatExcSalesData?.[seasons[seasons.length - 2].season as '23S' | '24S' | '25S']?.channels?.find(c => c.CHNL_NM === channel)
                      : undefined;
                    const prevActualChannel = seasons.length > 1 
                      ? actualSalesData?.[seasons[seasons.length - 2].season as '23S' | '24S' | '25S']?.channels?.find(c => c.CHNL_NM === channel)
                      : undefined;
                    const prevShipping = prevChannel?.SHIPPING_PRICE ?? 0;
                    const prevActual = prevActualChannel?.ACT_SALE_AMT ?? 1;
                    const prevRatio = prevActual > 0 ? (prevShipping / prevActual) * 100 : 0;

                    const firstChannel = vatExcSalesData?.[seasons[0].season as '23S' | '24S' | '25S']?.channels?.find(c => c.CHNL_NM === channel);
                    const firstActualChannel = actualSalesData?.[seasons[0].season as '23S' | '24S' | '25S']?.channels?.find(c => c.CHNL_NM === channel);
                    const firstShipping = firstChannel?.SHIPPING_PRICE ?? 0;
                    const firstActual = firstActualChannel?.ACT_SALE_AMT ?? 1;
                    const firstRatio = firstActual > 0 ? (firstShipping / firstActual) * 100 : 0;

                    const diffVsPrev = currentRatio - prevRatio;
                    const diffVsFirst = seasons.length > 2 ? currentRatio - firstRatio : undefined;

                    return (
                      <>
                        <TableCell className="text-right">
                          {prevRatio > 0 ? (
                            <span className={`text-xs ${diffVsPrev >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </TableCell>
                        {seasons.length > 2 && (
                          <TableCell className="text-right">
                            {diffVsFirst !== undefined && firstRatio > 0 ? (
                              <span className={`text-xs ${diffVsFirst >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                        )}
                      </>
                    );
                  })()}
                </TableRow>
              );
            })}

          {/* 출고가 소계 */}
          {isExpanded('shippingPrice') && (
            <TableRow className="bg-slate-100">
              <TableCell className="pl-8 font-semibold text-slate-800">출고가(V+) 소계</TableCell>
              {seasons.map((season) => {
                const shippingValue = vatExcSalesData?.[season.season as '23S' | '24S' | '25S']?.shippingTotal ?? 0;
                const actualValue = actualSalesData?.[season.season as '23S' | '24S' | '25S']?.total ?? 0;
                const shippingToActualRatio = actualValue > 0 ? (shippingValue / actualValue) * 100 : 0;
                
                return (
                  <Fragment key={season.season}>
                    <TableCell className="text-right">
                      <span className="font-semibold">{formatCurrency(shippingValue)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs text-slate-600">
                        {shippingToActualRatio.toFixed(1)}%
                      </span>
                    </TableCell>
                  </Fragment>
                );
              })}
              {(() => {
                // 출고가(V+)/실판가 비율 계산
                const currentShipping = vatExcSalesData?.[seasons[seasons.length - 1].season as '23S' | '24S' | '25S']?.shippingTotal ?? 0;
                const currentActual = actualSalesData?.[seasons[seasons.length - 1].season as '23S' | '24S' | '25S']?.total ?? 1;
                const currentRatio = currentActual > 0 ? (currentShipping / currentActual) * 100 : 0;

                const prevShipping = seasons.length > 1 
                  ? (vatExcSalesData?.[seasons[seasons.length - 2].season as '23S' | '24S' | '25S']?.shippingTotal ?? 0)
                  : 0;
                const prevActual = seasons.length > 1 
                  ? (actualSalesData?.[seasons[seasons.length - 2].season as '23S' | '24S' | '25S']?.total ?? 1)
                  : 1;
                const prevRatio = prevActual > 0 ? (prevShipping / prevActual) * 100 : 0;

                const firstShipping = vatExcSalesData?.[seasons[0].season as '23S' | '24S' | '25S']?.shippingTotal ?? 0;
                const firstActual = actualSalesData?.[seasons[0].season as '23S' | '24S' | '25S']?.total ?? 1;
                const firstRatio = firstActual > 0 ? (firstShipping / firstActual) * 100 : 0;

                const diffVsPrev = currentRatio - prevRatio;
                const diffVsFirst = seasons.length > 2 ? currentRatio - firstRatio : undefined;

                return (
                  <>
                    <TableCell className="text-right">
                      {prevRatio > 0 ? (
                        <span className={`text-xs ${diffVsPrev >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </TableCell>
                    {seasons.length > 2 && (
                      <TableCell className="text-right">
                        {diffVsFirst !== undefined && firstRatio > 0 ? (
                          <span className={`text-xs ${diffVsFirst >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                    )}
                  </>
                );
              })()}
            </TableRow>
          )}

          {/* 부가세차감(출고)매출 - 항상 표시 */}
          <TableRow>
            <TableCell className="font-medium text-slate-700">부가세차감(출고)매출</TableCell>
            {seasons.map((season) => {
              const value = vatExcSalesData?.[season.season as '23S' | '24S' | '25S']?.total ?? 0;
              // 출고가(V+)/실판가 비율 계산 (출고가(V+)의 percentage와 동일)
              const shippingValue = vatExcSalesData?.[season.season as '23S' | '24S' | '25S']?.shippingTotal ?? 0;
              const actualValue = actualSalesData?.[season.season as '23S' | '24S' | '25S']?.total ?? 0;
              const shippingToActualRatio = actualValue > 0 ? (shippingValue / actualValue) * 100 : 0;
              
              return (
                <Fragment key={season.season}>
                  <TableCell className="text-right">
                    <span className="font-medium">{formatCurrency(value)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs text-slate-600">
                      {shippingToActualRatio.toFixed(1)}%
                    </span>
                  </TableCell>
                </Fragment>
              );
            })}
            {(() => {
              // 출고가(V+)/실판가 비율 계산 (출고가(V+)의 YOY와 동일)
              const currentShipping = vatExcSalesData?.[seasons[seasons.length - 1].season as '23S' | '24S' | '25S']?.shippingTotal ?? 0;
              const currentActual = actualSalesData?.[seasons[seasons.length - 1].season as '23S' | '24S' | '25S']?.total ?? 1;
              const currentRatio = currentActual > 0 ? (currentShipping / currentActual) * 100 : 0;

              const prevShipping = seasons.length > 1 
                ? (vatExcSalesData?.[seasons[seasons.length - 2].season as '23S' | '24S' | '25S']?.shippingTotal ?? 0)
                : 0;
              const prevActual = seasons.length > 1 
                ? (actualSalesData?.[seasons[seasons.length - 2].season as '23S' | '24S' | '25S']?.total ?? 1)
                : 1;
              const prevRatio = prevActual > 0 ? (prevShipping / prevActual) * 100 : 0;

              const firstShipping = vatExcSalesData?.[seasons[0].season as '23S' | '24S' | '25S']?.shippingTotal ?? 0;
              const firstActual = actualSalesData?.[seasons[0].season as '23S' | '24S' | '25S']?.total ?? 1;
              const firstRatio = firstActual > 0 ? (firstShipping / firstActual) * 100 : 0;

              const diffVsPrev = currentRatio - prevRatio;
              const diffVsFirst = seasons.length > 2 ? currentRatio - firstRatio : undefined;

              return (
                <>
                  <TableCell className="text-right">
                    {prevRatio > 0 ? (
                      <span className={`text-xs ${diffVsPrev >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </TableCell>
                  {seasons.length > 2 && (
                    <TableCell className="text-right">
                      {diffVsFirst !== undefined && firstRatio > 0 ? (
                        <span className={`text-xs ${diffVsFirst >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </TableCell>
                  )}
                </>
              );
            })()}
          </TableRow>

          {/* 매출원가 - 펼치기 가능 */}
          {(() => {
            const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];

            return (
              <TableRow
                className="cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleSection('cogs')}
              >
                <TableCell className="font-semibold text-slate-900 hover:font-bold hover:underline">
                  매출원가
                </TableCell>
                {seasonKeys.map((seasonKey) => {
                  const value = costOfSalesData?.[seasonKey]?.cogsTotal ?? 0;
                  // 실판가 총액
                  const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                  // (매출원가/실판가)*1.1*100%
                  const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                  
                  return (
                    <Fragment key={seasonKey}>
                      <TableCell className="text-right">
                        <span className="font-semibold text-slate-900">{formatCurrency(value)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-slate-600 font-semibold">
                          {percentValue.toFixed(1)}%
                        </span>
                      </TableCell>
                    </Fragment>
                  );
                })}
                {(() => {
                  // YOY (%) 차이 계산 - (매출원가/실판가)*1.1*100%
                  const currentCogs = costOfSalesData?.[seasonKeys[2]]?.cogsTotal ?? 0;
                  const currentActual = actualSalesData?.[seasonKeys[2]]?.total ?? 0;
                  const currentPercent = currentActual > 0 ? ((currentCogs / currentActual) * 1.1 * 100) : 0;

                  const prevCogs = seasonKeys.length > 1 ? (costOfSalesData?.[seasonKeys[1]]?.cogsTotal ?? 0) : 0;
                  const prevActual = seasonKeys.length > 1 ? (actualSalesData?.[seasonKeys[1]]?.total ?? 0) : 0;
                  const prevPercent = prevActual > 0 ? ((prevCogs / prevActual) * 1.1 * 100) : 0;

                  const firstCogs = costOfSalesData?.[seasonKeys[0]]?.cogsTotal ?? 0;
                  const firstActual = actualSalesData?.[seasonKeys[0]]?.total ?? 0;
                  const firstPercent = firstActual > 0 ? ((firstCogs / firstActual) * 1.1 * 100) : 0;

                  const diffVsPrev = currentPercent - prevPercent;
                  const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                  return (
                    <>
                      <TableCell className="text-right">
                        {prevPercent > 0 ? (
                          <span className={`text-xs font-semibold ${diffVsPrev >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                      {seasonKeys.length > 2 && (
                        <TableCell className="text-right">
                          {diffVsFirst !== undefined && firstPercent > 0 ? (
                            <span className={`text-xs font-semibold ${diffVsFirst >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </TableCell>
                      )}
                    </>
                  );
                })()}
              </TableRow>
            );
          })()}

          {/* 매출원가 하위 항목 */}
          {isExpanded('cogs') && (
            <>
              {/* 매출원가(실적) = COGS */}
              {(() => {
                const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
                
                return (
                  <TableRow className="bg-slate-50">
                    <TableCell className="pl-8 text-slate-600">매출원가(실적)</TableCell>
                    {seasonKeys.map((seasonKey) => {
                      const value = costOfSalesData?.[seasonKey]?.cogsActual ?? 0;
                      // 판매TAG 총액
                      const salesTagTotal = salesTagData?.[seasonKey]?.total ?? 0;
                      // (매출원가(실적)/판매TAG)*1.1*100%
                      const percentValue = salesTagTotal > 0 ? ((value / salesTagTotal) * 1.1 * 100) : 0;
                      
                      return (
                        <Fragment key={seasonKey}>
                          <TableCell className="text-right">
                            <span className="text-slate-700">{formatCurrency(value)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-slate-600">
                              {percentValue.toFixed(1)}%
                            </span>
                          </TableCell>
                        </Fragment>
                      );
                    })}
                    {(() => {
                      // YOY (%) 차이 계산
                      const currentCogs = costOfSalesData?.[seasonKeys[2]]?.cogsActual ?? 0;
                      const currentSalesTag = salesTagData?.[seasonKeys[2]]?.total ?? 0;
                      const currentPercent = currentSalesTag > 0 ? ((currentCogs / currentSalesTag) * 1.1 * 100) : 0;

                      const prevCogs = seasonKeys.length > 1 ? (costOfSalesData?.[seasonKeys[1]]?.cogsActual ?? 0) : 0;
                      const prevSalesTag = seasonKeys.length > 1 ? (salesTagData?.[seasonKeys[1]]?.total ?? 0) : 0;
                      const prevPercent = prevSalesTag > 0 ? ((prevCogs / prevSalesTag) * 1.1 * 100) : 0;

                      const firstCogs = costOfSalesData?.[seasonKeys[0]]?.cogsActual ?? 0;
                      const firstSalesTag = salesTagData?.[seasonKeys[0]]?.total ?? 0;
                      const firstPercent = firstSalesTag > 0 ? ((firstCogs / firstSalesTag) * 1.1 * 100) : 0;

                      const diffVsPrev = currentPercent - prevPercent;
                      const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                      return (
                        <>
                          <TableCell className="text-right">
                            {prevPercent > 0 ? (
                              <span className={`text-xs ${diffVsPrev >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                          {seasonKeys.length > 2 && (
                            <TableCell className="text-right">
                              {diffVsFirst !== undefined && firstPercent > 0 ? (
                                <span className={`text-xs ${diffVsFirst >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">-</span>
                              )}
                            </TableCell>
                          )}
                        </>
                      );
                    })()}
                  </TableRow>
                );
              })()}

              {/* 재고평가감(환입) */}
              {(() => {
                const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
                
                return (
                  <TableRow className="bg-slate-50">
                    <TableCell className="pl-8 text-slate-600">재고평가감(환입)</TableCell>
                    {seasonKeys.map((seasonKey) => {
                      const value = costOfSalesData?.[seasonKey]?.stkAsstAprctAmt ?? 0;
                      // 판매TAG 총액
                      const salesTagTotal = salesTagData?.[seasonKey]?.total ?? 0;
                      // (재고평가감(환입)/판매TAG)*1.1*100%
                      const percentValue = salesTagTotal > 0 ? ((value / salesTagTotal) * 1.1 * 100) : 0;
                      
                      return (
                        <Fragment key={seasonKey}>
                          <TableCell className="text-right">
                            <span className="text-slate-700">{formatCurrency(value)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-slate-600">
                              {percentValue.toFixed(1)}%
                            </span>
                          </TableCell>
                        </Fragment>
                      );
                    })}
                    {(() => {
                      // YOY (%) 차이 계산
                      const currentStkAsst = costOfSalesData?.[seasonKeys[2]]?.stkAsstAprctAmt ?? 0;
                      const currentSalesTag = salesTagData?.[seasonKeys[2]]?.total ?? 0;
                      const currentPercent = currentSalesTag > 0 ? ((currentStkAsst / currentSalesTag) * 1.1 * 100) : 0;

                      const prevStkAsst = seasonKeys.length > 1 ? (costOfSalesData?.[seasonKeys[1]]?.stkAsstAprctAmt ?? 0) : 0;
                      const prevSalesTag = seasonKeys.length > 1 ? (salesTagData?.[seasonKeys[1]]?.total ?? 0) : 0;
                      const prevPercent = prevSalesTag > 0 ? ((prevStkAsst / prevSalesTag) * 1.1 * 100) : 0;

                      const firstStkAsst = costOfSalesData?.[seasonKeys[0]]?.stkAsstAprctAmt ?? 0;
                      const firstSalesTag = salesTagData?.[seasonKeys[0]]?.total ?? 0;
                      const firstPercent = firstSalesTag > 0 ? ((firstStkAsst / firstSalesTag) * 1.1 * 100) : 0;

                      const diffVsPrev = currentPercent - prevPercent;
                      const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                      return (
                        <>
                          <TableCell className="text-right">
                            {seasonKeys.length > 1 && (prevSalesTag > 0 || currentSalesTag > 0) ? (
                              <span className={`text-xs ${diffVsPrev >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                          {seasonKeys.length > 2 && (
                            <TableCell className="text-right">
                              {(firstSalesTag > 0 || currentSalesTag > 0) ? (
                                <span className={`text-xs ${diffVsFirst !== undefined && diffVsFirst >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {diffVsFirst !== undefined && diffVsFirst >= 0 ? '+' : ''}{diffVsFirst !== undefined ? diffVsFirst.toFixed(1) : '0.0'}%p
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">-</span>
                              )}
                            </TableCell>
                          )}
                        </>
                      );
                    })()}
                  </TableRow>
                );
              })()}

              {/* 재고평가감(추가) */}
              {(() => {
                const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
                
                return (
                  <TableRow className="bg-slate-50">
                    <TableCell className="pl-8 text-slate-600">재고평가감(추가)</TableCell>
                    {seasonKeys.map((seasonKey) => {
                      const value = costOfSalesData?.[seasonKey]?.vltnAmt ?? 0;
                      // 실판가 총액
                      const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                      // (재고평가감(추가)/실판가)*1.1*100%
                      const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                      
                      return (
                        <Fragment key={seasonKey}>
                          <TableCell className="text-right">
                            <span className="text-slate-700">{formatCurrency(value)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-slate-600">
                              {percentValue.toFixed(1)}%
                            </span>
                          </TableCell>
                        </Fragment>
                      );
                    })}
                    {(() => {
                      // YOY (%) 차이 계산
                      const currentVltn = costOfSalesData?.[seasonKeys[2]]?.vltnAmt ?? 0;
                      const currentActual = actualSalesData?.[seasonKeys[2]]?.total ?? 0;
                      const currentPercent = currentActual > 0 ? ((currentVltn / currentActual) * 1.1 * 100) : 0;

                      const prevVltn = seasonKeys.length > 1 ? (costOfSalesData?.[seasonKeys[1]]?.vltnAmt ?? 0) : 0;
                      const prevActual = seasonKeys.length > 1 ? (actualSalesData?.[seasonKeys[1]]?.total ?? 0) : 0;
                      const prevPercent = prevActual > 0 ? ((prevVltn / prevActual) * 1.1 * 100) : 0;

                      const firstVltn = costOfSalesData?.[seasonKeys[0]]?.vltnAmt ?? 0;
                      const firstActual = actualSalesData?.[seasonKeys[0]]?.total ?? 0;
                      const firstPercent = firstActual > 0 ? ((firstVltn / firstActual) * 1.1 * 100) : 0;

                      const diffVsPrev = currentPercent - prevPercent;
                      const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                      return (
                        <>
                          <TableCell className="text-right">
                            {prevPercent > 0 ? (
                              <span className={`text-xs ${diffVsPrev >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                          {seasonKeys.length > 2 && (
                            <TableCell className="text-right">
                              {diffVsFirst !== undefined && firstPercent > 0 ? (
                                <span className={`text-xs ${diffVsFirst >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">-</span>
                              )}
                            </TableCell>
                          )}
                        </>
                      );
                    })()}
                  </TableRow>
                );
              })()}

              {/* 소계 = 매출원가(실적) + 환입 + 추가 */}
              {(() => {
                const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
                
                return (
                  <TableRow className="bg-slate-100">
                    <TableCell className="pl-8 font-semibold text-slate-800">소계</TableCell>
                    {seasonKeys.map((seasonKey) => {
                      const value = costOfSalesData?.[seasonKey]?.cogsTotal ?? 0;
                      // 실판가 총액
                      const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                      // (매출원가 소계/실판가)*1.1*100%
                      const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                      
                      return (
                        <Fragment key={seasonKey}>
                          <TableCell className="text-right">
                            <span className="font-semibold text-slate-800">{formatCurrency(value)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-slate-600 font-semibold">
                              {percentValue.toFixed(1)}%
                            </span>
                          </TableCell>
                        </Fragment>
                      );
                    })}
                    {(() => {
                      // YOY (%) 차이 계산 - (매출원가 소계/실판가)*1.1*100%
                      const currentCogsTotal = costOfSalesData?.[seasonKeys[2]]?.cogsTotal ?? 0;
                      const currentActual = actualSalesData?.[seasonKeys[2]]?.total ?? 0;
                      const currentPercent = currentActual > 0 ? ((currentCogsTotal / currentActual) * 1.1 * 100) : 0;

                      const prevCogsTotal = seasonKeys.length > 1 ? (costOfSalesData?.[seasonKeys[1]]?.cogsTotal ?? 0) : 0;
                      const prevActual = seasonKeys.length > 1 ? (actualSalesData?.[seasonKeys[1]]?.total ?? 0) : 0;
                      const prevPercent = prevActual > 0 ? ((prevCogsTotal / prevActual) * 1.1 * 100) : 0;

                      const firstCogsTotal = costOfSalesData?.[seasonKeys[0]]?.cogsTotal ?? 0;
                      const firstActual = actualSalesData?.[seasonKeys[0]]?.total ?? 0;
                      const firstPercent = firstActual > 0 ? ((firstCogsTotal / firstActual) * 1.1 * 100) : 0;

                      const diffVsPrev = currentPercent - prevPercent;
                      const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                      return (
                        <>
                          <TableCell className="text-right">
                            {prevPercent > 0 ? (
                              <span className={`text-xs font-semibold ${diffVsPrev >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                          {seasonKeys.length > 2 && (
                            <TableCell className="text-right">
                              {diffVsFirst !== undefined && firstPercent > 0 ? (
                                <span className={`text-xs font-semibold ${diffVsFirst >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">-</span>
                              )}
                            </TableCell>
                          )}
                        </>
                      );
                    })()}
                  </TableRow>
                );
              })()}
            </>
          )}

          {/* 매출총이익 = 부가세차감(출고)매출 - 매출원가 */}
          {(() => {
            const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
            
            return (
              <TableRow className="bg-blue-50/30">
                <TableCell className="font-bold text-slate-900">매출총이익</TableCell>
                {seasonKeys.map((seasonKey) => {
                  // 부가세차감(출고)매출
                  const vatExcSales = vatExcSalesData?.[seasonKey]?.total ?? 0;
                  // 매출원가
                  const cogsTotal = costOfSalesData?.[seasonKey]?.cogsTotal ?? 0;
                  // 매출총이익 = 부가세차감(출고)매출 - 매출원가
                  const grossProfit = vatExcSales - cogsTotal;
                  // 실판가 총액
                  const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                  // (매출총이익/실판가)*1.1*100%
                  const percentValue = actualSalesTotal > 0 ? ((grossProfit / actualSalesTotal) * 1.1 * 100) : 0;
                  
                  return (
                    <Fragment key={seasonKey}>
                      <TableCell className="text-right">
                        <span className="font-bold text-blue-700">{formatCurrency(grossProfit)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-slate-600 font-bold">
                          {percentValue.toFixed(1)}%
                        </span>
                      </TableCell>
                    </Fragment>
                  );
                })}
                {(() => {
                  // YOY (%) 차이 계산
                  const currentVatExc = vatExcSalesData?.[seasonKeys[2]]?.total ?? 0;
                  const currentCogs = costOfSalesData?.[seasonKeys[2]]?.cogsTotal ?? 0;
                  const currentGrossProfit = currentVatExc - currentCogs;
                  const currentActual = actualSalesData?.[seasonKeys[2]]?.total ?? 0;
                  const currentPercent = currentActual > 0 ? ((currentGrossProfit / currentActual) * 1.1 * 100) : 0;

                  const prevVatExc = seasonKeys.length > 1 ? (vatExcSalesData?.[seasonKeys[1]]?.total ?? 0) : 0;
                  const prevCogs = seasonKeys.length > 1 ? (costOfSalesData?.[seasonKeys[1]]?.cogsTotal ?? 0) : 0;
                  const prevGrossProfit = prevVatExc - prevCogs;
                  const prevActual = seasonKeys.length > 1 ? (actualSalesData?.[seasonKeys[1]]?.total ?? 0) : 0;
                  const prevPercent = prevActual > 0 ? ((prevGrossProfit / prevActual) * 1.1 * 100) : 0;

                  const firstVatExc = vatExcSalesData?.[seasonKeys[0]]?.total ?? 0;
                  const firstCogs = costOfSalesData?.[seasonKeys[0]]?.cogsTotal ?? 0;
                  const firstGrossProfit = firstVatExc - firstCogs;
                  const firstActual = actualSalesData?.[seasonKeys[0]]?.total ?? 0;
                  const firstPercent = firstActual > 0 ? ((firstGrossProfit / firstActual) * 1.1 * 100) : 0;

                  const diffVsPrev = currentPercent - prevPercent;
                  const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                  return (
                    <>
                      <TableCell className="text-right">
                        {prevPercent > 0 ? (
                          <span className={`text-xs font-bold ${diffVsPrev >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                      {seasonKeys.length > 2 && (
                        <TableCell className="text-right">
                          {diffVsFirst !== undefined && firstPercent > 0 ? (
                            <span className={`text-xs font-bold ${diffVsFirst >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </TableCell>
                      )}
                    </>
                  );
                })()}
              </TableRow>
            );
          })()}

          {/* 직접비 - 펼치기 가능 */}
          {(() => {
            const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
            
            return (
              <TableRow
                className="cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleSection('directCost')}
              >
                <TableCell className="font-semibold text-slate-900 hover:font-bold hover:underline">
                  직접비
                </TableCell>
                {seasonKeys.map((seasonKey) => {
                  const value = directCostData?.[seasonKey]?.totals?.DIRECT_COST_TOTAL ?? 0;
                  // 실판가 총액
                  const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                  // (직접비/실판가)*1.1*100%
                  const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                  
                  return (
                    <Fragment key={seasonKey}>
                      <TableCell className="text-right">
                        <span className="font-semibold text-slate-900">{formatCurrency(value)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-slate-600 font-semibold">
                          {percentValue.toFixed(1)}%
                        </span>
                      </TableCell>
                    </Fragment>
                  );
                })}
                {(() => {
                  // YOY (%) 차이 계산 - (직접비/실판가)*1.1*100%
                  const currentDirectCost = directCostData?.[seasonKeys[2]]?.totals?.DIRECT_COST_TOTAL ?? 0;
                  const currentActual = actualSalesData?.[seasonKeys[2]]?.total ?? 0;
                  const currentPercent = currentActual > 0 ? ((currentDirectCost / currentActual) * 1.1 * 100) : 0;

                  const prevDirectCost = seasonKeys.length > 1 ? (directCostData?.[seasonKeys[1]]?.totals?.DIRECT_COST_TOTAL ?? 0) : 0;
                  const prevActual = seasonKeys.length > 1 ? (actualSalesData?.[seasonKeys[1]]?.total ?? 0) : 0;
                  const prevPercent = prevActual > 0 ? ((prevDirectCost / prevActual) * 1.1 * 100) : 0;

                  const firstDirectCost = directCostData?.[seasonKeys[0]]?.totals?.DIRECT_COST_TOTAL ?? 0;
                  const firstActual = actualSalesData?.[seasonKeys[0]]?.total ?? 0;
                  const firstPercent = firstActual > 0 ? ((firstDirectCost / firstActual) * 1.1 * 100) : 0;

                  const diffVsPrev = currentPercent - prevPercent;
                  const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                  return (
                    <>
                      <TableCell className="text-right">
                        {prevPercent > 0 || currentPercent > 0 ? (
                          <span className={`text-xs font-semibold ${diffVsPrev >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                      {seasonKeys.length > 2 && (
                        <TableCell className="text-right">
                          {diffVsFirst !== undefined && (firstPercent > 0 || currentPercent > 0) ? (
                            <span className={`text-xs font-semibold ${diffVsFirst >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </TableCell>
                      )}
                    </>
                  );
                })()}
              </TableRow>
            );
          })()}

          {/* 직접비 하위 항목 */}
          {isExpanded('directCost') && (
            <>
              {/* 로열티 - 특별 계산 로직 */}
              {(() => {
                const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
                const isMLBBrand = brandCode === 'M' || brandCode === 'I'; // MLB, MLB KIDS
                
                // 로열티 비율 계산 함수
                // MLB/MLB KIDS: 로열티 / [출고가(V+) - (채널 3,4,5,7,11 실판가)*35%] * 1.1 * 100%
                // 다른 브랜드: (로열티 / 실판가(V+)) * 1.1 * 100%
                const calculateRoyaltyPercent = (seasonKey: '23S' | '24S' | '25S') => {
                  const royalty = directCostData?.[seasonKey]?.totals?.RYT ?? 0;
                  
                  if (isMLBBrand) {
                    // MLB, MLB KIDS
                    const shippingTotal = vatExcSalesData?.[seasonKey]?.shippingTotal ?? 0;
                    
                    // 채널 3,4,5,7,11 실판가 합계 (API에서 직접 계산된 값 사용)
                    const retailActualSales = actualSalesData?.[seasonKey]?.retailActSaleAmt ?? 0;
                    
                    // 로열티 / [출고가(V+) - (채널 3,4,5,7,11 실판가 * 35%)] * 1.1 * 100%
                    const denominator = shippingTotal - (retailActualSales * 0.35);
                    return denominator > 0 ? ((royalty / denominator) * 1.1 * 100) : 0;
                  } else {
                    // DISCOVERY, DUVETICA, SERGIO TACCHINI: (로열티 / 실판가(V+)) * 1.1 * 100%
                    const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                    return actualSalesTotal > 0 ? ((royalty / actualSalesTotal) * 1.1 * 100) : 0;
                  }
                };

                const percentValues = seasonKeys.map(sk => calculateRoyaltyPercent(sk));
                const currentPercent = percentValues[2];
                const prevPercent = percentValues[1];
                const firstPercent = percentValues[0];

                return (
                  <TableRow className="bg-slate-50">
                    <TableCell className="pl-8 text-slate-600">로열티</TableCell>
                    {seasonKeys.map((seasonKey) => {
                      const value = directCostData?.[seasonKey]?.totals?.RYT ?? 0;
                      const percentValue = calculateRoyaltyPercent(seasonKey);
                      
                      return (
                        <Fragment key={seasonKey}>
                          <TableCell className="text-right">
                            <span className="text-slate-700">{formatCurrency(value)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-slate-600">
                              {percentValue.toFixed(1)}%
                            </span>
                          </TableCell>
                        </Fragment>
                      );
                    })}
                    {(() => {
                      const diffVsPrev = currentPercent - prevPercent;
                      const diffVsFirst = currentPercent - firstPercent;

                      return (
                        <>
                          <TableCell className="text-right">
                            {prevPercent > 0 || currentPercent > 0 ? (
                              <span className={`text-xs ${diffVsPrev >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                          {seasonKeys.length > 2 && (
                            <TableCell className="text-right">
                              {firstPercent > 0 || currentPercent > 0 ? (
                                <span className={`text-xs ${diffVsFirst >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">-</span>
                              )}
                            </TableCell>
                          )}
                        </>
                      );
                    })()}
                  </TableRow>
                );
              })()}

              {/* 나머지 직접비 항목별 행 */}
              {[
                { key: 'LGT_CST', label: '물류비', useActualSalesPercent: true },
                { key: 'STRG_CST', label: '보관료', useActualSalesPercent: true },
                { key: 'CARD_CMS', label: '카드수수료', useActualSalesPercent: false, useChnlCdPercent: ['3', '4', '7', '11'] },
                { key: 'SHOP_RNT', label: '매장임차료', useActualSalesPercent: false, useChnlCdPercent: ['3', '7', '11'] },
                { key: 'SHOP_DEPRC_CST', label: '감가상각비(매장)', useActualSalesPercent: true },
                { key: 'ALNC_ONLN_CMS', label: '온라인수수료(제휴)', useActualSalesPercent: false, useChnlCdPercent: ['5'] },
                { key: 'SM_CMS', label: '중간관리자 수수료', useActualSalesPercent: false, useChnlCdPercent: ['1'] },
                { key: 'DF_SALE_STFF_CMS', label: '면세 판매직수수료', useActualSalesPercent: false, useChnlCdPercent: ['2'] },
                { key: 'DMGMT_SALE_STFF_CMS', label: '직영 판매직수수료', useActualSalesPercent: false, useChnlCdPercent: ['3', '4'] },
              ].map(({ key, label, useActualSalesPercent, useChnlCdPercent }) => {
                const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
                const values = seasonKeys.map(sk => directCostData?.[sk]?.totals?.[key as keyof DirectCostTotals] ?? 0);
                const currentValue = values[2];
                const prevValue = values[1];
                const firstValue = values[0];

                // 실판가 대비 비율 계산 함수 (물류비, 보관료, 감가상각비(매장)용)
                const calculateActualSalesPercent = (seasonKey: '23S' | '24S' | '25S') => {
                  const costValue = directCostData?.[seasonKey]?.totals?.[key as keyof DirectCostTotals] ?? 0;
                  const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                  return actualSalesTotal > 0 ? ((costValue / actualSalesTotal) * 1.1 * 100) : 0;
                };

                // 특정 채널코드들의 실판가 합계 대비 비율 계산 함수
                const calculateChnlCdPercent = (seasonKey: '23S' | '24S' | '25S', chnlCds: string[]) => {
                  const costValue = directCostData?.[seasonKey]?.totals?.[key as keyof DirectCostTotals] ?? 0;
                  // chnlCdData에서 해당 채널코드들의 실판가 합계
                  const chnlCdSales = actualSalesData?.[seasonKey]?.chnlCdData
                    ?.filter((ch: { CHNL_CD: string; ACT_SALE_AMT?: number }) => chnlCds.includes(ch.CHNL_CD))
                    ?.reduce((sum: number, ch: { ACT_SALE_AMT?: number }) => sum + (ch.ACT_SALE_AMT || 0), 0) ?? 0;
                  return chnlCdSales > 0 ? ((costValue / chnlCdSales) * 1.1 * 100) : 0;
                };

                // 비율 계산이 필요한 항목인지 확인
                const needsPercentCalc = useActualSalesPercent || useChnlCdPercent;

                return (
                  <TableRow key={key} className="bg-slate-50">
                    <TableCell className="pl-8 text-slate-600">{label}</TableCell>
                    {seasonKeys.map((seasonKey, idx) => {
                      const value = directCostData?.[seasonKey]?.totals?.[key as keyof DirectCostTotals] ?? 0;
                      
                      if (useActualSalesPercent) {
                        // 물류비, 보관료, 감가상각비(매장): (금액/실판가)*1.1*100%
                        const percentValue = calculateActualSalesPercent(seasonKey);
                        return (
                          <Fragment key={seasonKey}>
                            <TableCell className="text-right">
                              <span className="text-slate-700">{formatCurrency(value)}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-xs text-slate-600">
                                {percentValue.toFixed(1)}%
                              </span>
                            </TableCell>
                          </Fragment>
                        );
                      } else if (useChnlCdPercent) {
                        // 채널코드별 실판가 대비 비율: (금액/해당 채널코드 실판가 합계)*1.1*100%
                        const percentValue = calculateChnlCdPercent(seasonKey, useChnlCdPercent);
                        return (
                          <Fragment key={seasonKey}>
                            <TableCell className="text-right">
                              <span className="text-slate-700">{formatCurrency(value)}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-xs text-slate-600">
                                {percentValue.toFixed(1)}%
                              </span>
                            </TableCell>
                          </Fragment>
                        );
                      } else {
                        // 기타 항목: 기존 로직 (전기 대비 증감률)
                        const previousValue = idx > 0 ? (directCostData?.[seasonKeys[idx - 1]]?.totals?.[key as keyof DirectCostTotals] ?? 0) : undefined;
                        return (
                          <Fragment key={seasonKey}>
                            {renderValueAndPercent(value, previousValue)}
                          </Fragment>
                        );
                      }
                    })}
                    {needsPercentCalc ? (
                      // 비율 계산 항목: YOY는 %p 차이
                      (() => {
                        const calcPercent = useChnlCdPercent 
                          ? (sk: '23S' | '24S' | '25S') => calculateChnlCdPercent(sk, useChnlCdPercent)
                          : calculateActualSalesPercent;
                        
                        const currentPercent = calcPercent('25S');
                        const prevPercent = calcPercent('24S');
                        const firstPercent = calcPercent('23S');
                        const diffVsPrev = currentPercent - prevPercent;
                        const diffVsFirst = currentPercent - firstPercent;

                        return (
                          <>
                            <TableCell className="text-right">
                              {(prevPercent > 0 || currentPercent > 0) ? (
                                <span className={`text-xs ${diffVsPrev >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {(firstPercent > 0 || currentPercent > 0) ? (
                                <span className={`text-xs ${diffVsFirst >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">-</span>
                              )}
                            </TableCell>
                          </>
                        );
                      })()
                    ) : (
                      renderYOYColumns(currentValue, prevValue, firstValue)
                    )}
                  </TableRow>
                );
              })}

              {/* 직접비 소계 */}
              {(() => {
                const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
                
                return (
                  <TableRow className="bg-slate-100">
                    <TableCell className="pl-8 font-semibold text-slate-800">직접비 소계</TableCell>
                    {seasonKeys.map((seasonKey) => {
                      const value = directCostData?.[seasonKey]?.totals?.DIRECT_COST_TOTAL ?? 0;
                      // 실판가 총액
                      const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                      // (직접비 소계/실판가)*1.1*100%
                      const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                      
                      return (
                        <Fragment key={seasonKey}>
                          <TableCell className="text-right">
                            <span className="font-semibold text-slate-800">{formatCurrency(value)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-slate-600 font-semibold">
                              {percentValue.toFixed(1)}%
                            </span>
                          </TableCell>
                        </Fragment>
                      );
                    })}
                    {(() => {
                      // YOY (%) 차이 계산
                      const currentDirectCost = directCostData?.[seasonKeys[2]]?.totals?.DIRECT_COST_TOTAL ?? 0;
                      const currentActual = actualSalesData?.[seasonKeys[2]]?.total ?? 0;
                      const currentPercent = currentActual > 0 ? ((currentDirectCost / currentActual) * 1.1 * 100) : 0;

                      const prevDirectCost = seasonKeys.length > 1 ? (directCostData?.[seasonKeys[1]]?.totals?.DIRECT_COST_TOTAL ?? 0) : 0;
                      const prevActual = seasonKeys.length > 1 ? (actualSalesData?.[seasonKeys[1]]?.total ?? 0) : 0;
                      const prevPercent = prevActual > 0 ? ((prevDirectCost / prevActual) * 1.1 * 100) : 0;

                      const firstDirectCost = directCostData?.[seasonKeys[0]]?.totals?.DIRECT_COST_TOTAL ?? 0;
                      const firstActual = actualSalesData?.[seasonKeys[0]]?.total ?? 0;
                      const firstPercent = firstActual > 0 ? ((firstDirectCost / firstActual) * 1.1 * 100) : 0;

                      const diffVsPrev = currentPercent - prevPercent;
                      const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                      return (
                        <>
                          <TableCell className="text-right">
                            {prevPercent > 0 || currentPercent > 0 ? (
                              <span className={`text-xs font-semibold ${diffVsPrev >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                          {seasonKeys.length > 2 && (
                            <TableCell className="text-right">
                              {diffVsFirst !== undefined && (firstPercent > 0 || currentPercent > 0) ? (
                                <span className={`text-xs font-semibold ${diffVsFirst >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">-</span>
                              )}
                            </TableCell>
                          )}
                        </>
                      );
                    })()}
                  </TableRow>
                );
              })()}
            </>
          )}

          {/* 직접이익 = 매출총이익 - 직접비 */}
          {(() => {
            const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
            
            return (
              <TableRow className="bg-indigo-50/30">
                <TableCell className="font-bold text-slate-900">직접이익</TableCell>
                {seasonKeys.map((seasonKey) => {
                  // 매출총이익
                  const vatExcSales = vatExcSalesData?.[seasonKey]?.total ?? 0;
                  const cogsTotal = costOfSalesData?.[seasonKey]?.cogsTotal ?? 0;
                  const grossProfit = vatExcSales - cogsTotal;
                  
                  // 직접비
                  const directCostTotal = directCostData?.[seasonKey]?.totals?.DIRECT_COST_TOTAL ?? 0;
                  
                  // 직접이익 = 매출총이익 - 직접비
                  const directProfit = grossProfit - directCostTotal;
                  
                  // 실판가 총액
                  const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                  // (직접이익/실판가)*1.1*100%
                  const percentValue = actualSalesTotal > 0 ? ((directProfit / actualSalesTotal) * 1.1 * 100) : 0;
                  
                  return (
                    <Fragment key={seasonKey}>
                      <TableCell className="text-right">
                        <span className="font-bold text-indigo-700">{formatCurrency(directProfit)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-slate-600 font-bold">
                          {percentValue.toFixed(1)}%
                        </span>
                      </TableCell>
                    </Fragment>
                  );
                })}
                {(() => {
                  // YOY (%) 계산: 25S/24S 금액 * 100%, 25S/23S 금액 * 100%
                  const currentGross = (vatExcSalesData?.[seasonKeys[2]]?.total ?? 0) - (costOfSalesData?.[seasonKeys[2]]?.cogsTotal ?? 0);
                  const currentDirectCost = directCostData?.[seasonKeys[2]]?.totals?.DIRECT_COST_TOTAL ?? 0;
                  const currentDirectProfit = currentGross - currentDirectCost;

                  const prevGross = seasonKeys.length > 1 ? ((vatExcSalesData?.[seasonKeys[1]]?.total ?? 0) - (costOfSalesData?.[seasonKeys[1]]?.cogsTotal ?? 0)) : 0;
                  const prevDirectCost = seasonKeys.length > 1 ? (directCostData?.[seasonKeys[1]]?.totals?.DIRECT_COST_TOTAL ?? 0) : 0;
                  const prevDirectProfit = prevGross - prevDirectCost;

                  const firstGross = (vatExcSalesData?.[seasonKeys[0]]?.total ?? 0) - (costOfSalesData?.[seasonKeys[0]]?.cogsTotal ?? 0);
                  const firstDirectCost = directCostData?.[seasonKeys[0]]?.totals?.DIRECT_COST_TOTAL ?? 0;
                  const firstDirectProfit = firstGross - firstDirectCost;

                  const yoyVsPrev = prevDirectProfit > 0 ? (currentDirectProfit / prevDirectProfit * 100) : null;
                  const yoyVsFirst = firstDirectProfit > 0 ? (currentDirectProfit / firstDirectProfit * 100) : null;

                  return (
                    <>
                      <TableCell className="text-right">
                        {yoyVsPrev !== null ? (
                          <span className={`text-xs font-bold ${yoyVsPrev >= 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {yoyVsPrev.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {yoyVsFirst !== null ? (
                          <span className={`text-xs font-bold ${yoyVsFirst >= 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {yoyVsFirst.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                    </>
                  );
                })()}
              </TableRow>
            );
          })()}

          {/* 광고비 */}
          {(() => {
            const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
            
            return (
              <TableRow>
                <TableCell className="font-medium text-slate-700">광고비</TableCell>
                {seasonKeys.map((seasonKey) => {
                  const value = operatingExpenseData?.[seasonKey]?.adExpense?.amt ?? 0;
                  const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                  const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                  
                  return (
                    <Fragment key={seasonKey}>
                      <TableCell className="text-right">
                        <span className="text-slate-900">{formatCurrency(value)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-slate-600">
                          {percentValue.toFixed(1)}%
                        </span>
                      </TableCell>
                    </Fragment>
                  );
                })}
                {(() => {
                  // YOY (%) 계산: 25S/24S 금액 * 100%, 25S/23S 금액 * 100%
                  const currentValue = operatingExpenseData?.[seasonKeys[2]]?.adExpense?.amt ?? 0;
                  const prevValue = seasonKeys.length > 1 ? (operatingExpenseData?.[seasonKeys[1]]?.adExpense?.amt ?? 0) : 0;
                  const firstValue = operatingExpenseData?.[seasonKeys[0]]?.adExpense?.amt ?? 0;

                  const yoyVsPrev = prevValue > 0 ? (currentValue / prevValue * 100) : null;
                  const yoyVsFirst = firstValue > 0 ? (currentValue / firstValue * 100) : null;

                  return (
                    <>
                      <TableCell className="text-right">
                        {yoyVsPrev !== null ? (
                          <span className={`text-xs ${yoyVsPrev >= 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {yoyVsPrev.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {yoyVsFirst !== null ? (
                          <span className={`text-xs ${yoyVsFirst >= 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {yoyVsFirst.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                    </>
                  );
                })()}
              </TableRow>
            );
          })()}

          {/* 인건비 */}
          {(() => {
            const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
            
            return (
              <TableRow>
                <TableCell className="font-medium text-slate-700">인건비</TableCell>
                {seasonKeys.map((seasonKey) => {
                  const value = operatingExpenseData?.[seasonKey]?.hrCost?.amt ?? 0;
                  const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                  const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                  
                  return (
                    <Fragment key={seasonKey}>
                      <TableCell className="text-right">
                        <span className="text-slate-900">{formatCurrency(value)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-slate-600">
                          {percentValue.toFixed(1)}%
                        </span>
                      </TableCell>
                    </Fragment>
                  );
                })}
                {(() => {
                  // YOY (%) 계산: 25S/24S 금액 * 100%, 25S/23S 금액 * 100%
                  const currentValue = operatingExpenseData?.[seasonKeys[2]]?.hrCost?.amt ?? 0;
                  const prevValue = seasonKeys.length > 1 ? (operatingExpenseData?.[seasonKeys[1]]?.hrCost?.amt ?? 0) : 0;
                  const firstValue = operatingExpenseData?.[seasonKeys[0]]?.hrCost?.amt ?? 0;

                  const yoyVsPrev = prevValue > 0 ? (currentValue / prevValue * 100) : null;
                  const yoyVsFirst = firstValue > 0 ? (currentValue / firstValue * 100) : null;

                  return (
                    <>
                      <TableCell className="text-right">
                        {yoyVsPrev !== null ? (
                          <span className={`text-xs ${yoyVsPrev >= 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {yoyVsPrev.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {yoyVsFirst !== null ? (
                          <span className={`text-xs ${yoyVsFirst >= 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {yoyVsFirst.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                    </>
                  );
                })()}
              </TableRow>
            );
          })()}

          {/* 기타영업비 - 펼치기 가능 */}
          {(() => {
            const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
            
            return (
              <TableRow
                className="cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleSection('operatingExpense')}
              >
                <TableCell className="font-semibold text-slate-900 hover:font-bold hover:underline">
                  기타영업비
                </TableCell>
                {seasonKeys.map((seasonKey) => {
                  const value = operatingExpenseData?.[seasonKey]?.etcTotal?.amt ?? 0;
                  const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                  const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                  
                  return (
                    <Fragment key={seasonKey}>
                      <TableCell className="text-right">
                        <span className="font-semibold text-slate-900">{formatCurrency(value)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-slate-600 font-semibold">
                          {percentValue.toFixed(1)}%
                        </span>
                      </TableCell>
                    </Fragment>
                  );
                })}
                {(() => {
                  // YOY (%) 계산: 25S/24S 금액 * 100%, 25S/23S 금액 * 100%
                  const currentValue = operatingExpenseData?.[seasonKeys[2]]?.etcTotal?.amt ?? 0;
                  const prevValue = seasonKeys.length > 1 ? (operatingExpenseData?.[seasonKeys[1]]?.etcTotal?.amt ?? 0) : 0;
                  const firstValue = operatingExpenseData?.[seasonKeys[0]]?.etcTotal?.amt ?? 0;

                  const yoyVsPrev = prevValue > 0 ? (currentValue / prevValue * 100) : null;
                  const yoyVsFirst = firstValue > 0 ? (currentValue / firstValue * 100) : null;

                  return (
                    <>
                      <TableCell className="text-right">
                        {yoyVsPrev !== null ? (
                          <span className={`text-xs font-semibold ${yoyVsPrev >= 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {yoyVsPrev.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {yoyVsFirst !== null ? (
                          <span className={`text-xs font-semibold ${yoyVsFirst >= 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {yoyVsFirst.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                    </>
                  );
                })()}
              </TableRow>
            );
          })()}

          {/* 기타영업비 하위 항목 */}
          {isExpanded('operatingExpense') && (
            <>
              {/* 지급수수료 */}
              {(() => {
                const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
                return (
                  <TableRow className="bg-slate-50">
                    <TableCell className="pl-8 text-slate-600">지급수수료</TableCell>
                    {seasonKeys.map((seasonKey) => {
                      const value = operatingExpenseData?.[seasonKey]?.etcItems?.commission?.amt ?? 0;
                      const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                      const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                      
                      return (
                        <Fragment key={seasonKey}>
                          <TableCell className="text-right">
                            <span className="text-slate-700">{formatCurrency(value)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-slate-600">
                              {percentValue.toFixed(1)}%
                            </span>
                          </TableCell>
                        </Fragment>
                      );
                    })}
                    {(() => {
                      const currentValue = operatingExpenseData?.[seasonKeys[2]]?.etcItems?.commission?.amt ?? 0;
                      const currentActual = actualSalesData?.[seasonKeys[2]]?.total ?? 0;
                      const currentPercent = currentActual > 0 ? ((currentValue / currentActual) * 1.1 * 100) : 0;

                      const prevValue = seasonKeys.length > 1 ? (operatingExpenseData?.[seasonKeys[1]]?.etcItems?.commission?.amt ?? 0) : 0;
                      const prevActual = seasonKeys.length > 1 ? (actualSalesData?.[seasonKeys[1]]?.total ?? 0) : 0;
                      const prevPercent = prevActual > 0 ? ((prevValue / prevActual) * 1.1 * 100) : 0;

                      const firstValue = operatingExpenseData?.[seasonKeys[0]]?.etcItems?.commission?.amt ?? 0;
                      const firstActual = actualSalesData?.[seasonKeys[0]]?.total ?? 0;
                      const firstPercent = firstActual > 0 ? ((firstValue / firstActual) * 1.1 * 100) : 0;

                      const diffVsPrev = currentPercent - prevPercent;
                      const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                      return (
                        <>
                          <TableCell className="text-right">
                            {prevPercent > 0 || currentPercent > 0 ? (
                              <span className={`text-xs ${diffVsPrev >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {diffVsFirst !== undefined ? (
                              <span className={`text-xs ${diffVsFirst >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                        </>
                      );
                    })()}
                  </TableRow>
                );
              })()}
              {/* VMD/매장보수 */}
              {(() => {
                const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
                return (
                  <TableRow className="bg-slate-50">
                    <TableCell className="pl-8 text-slate-600">VMD/매장보수</TableCell>
                    {seasonKeys.map((seasonKey) => {
                      const value = operatingExpenseData?.[seasonKey]?.etcItems?.vmd?.amt ?? 0;
                      const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                      const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                      
                      return (
                        <Fragment key={seasonKey}>
                          <TableCell className="text-right">
                            <span className="text-slate-700">{formatCurrency(value)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-slate-600">
                              {percentValue.toFixed(1)}%
                            </span>
                          </TableCell>
                        </Fragment>
                      );
                    })}
                    {(() => {
                      const currentValue = operatingExpenseData?.[seasonKeys[2]]?.etcItems?.vmd?.amt ?? 0;
                      const currentActual = actualSalesData?.[seasonKeys[2]]?.total ?? 0;
                      const currentPercent = currentActual > 0 ? ((currentValue / currentActual) * 1.1 * 100) : 0;

                      const prevValue = seasonKeys.length > 1 ? (operatingExpenseData?.[seasonKeys[1]]?.etcItems?.vmd?.amt ?? 0) : 0;
                      const prevActual = seasonKeys.length > 1 ? (actualSalesData?.[seasonKeys[1]]?.total ?? 0) : 0;
                      const prevPercent = prevActual > 0 ? ((prevValue / prevActual) * 1.1 * 100) : 0;

                      const firstValue = operatingExpenseData?.[seasonKeys[0]]?.etcItems?.vmd?.amt ?? 0;
                      const firstActual = actualSalesData?.[seasonKeys[0]]?.total ?? 0;
                      const firstPercent = firstActual > 0 ? ((firstValue / firstActual) * 1.1 * 100) : 0;

                      const diffVsPrev = currentPercent - prevPercent;
                      const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                      return (
                        <>
                          <TableCell className="text-right">
                            {prevPercent > 0 || currentPercent > 0 ? (
                              <span className={`text-xs ${diffVsPrev >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {diffVsFirst !== undefined ? (
                              <span className={`text-xs ${diffVsFirst >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                        </>
                      );
                    })()}
                  </TableRow>
                );
              })()}
              {/* 저장품 */}
              {(() => {
                const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
                return (
                  <TableRow className="bg-slate-50">
                    <TableCell className="pl-8 text-slate-600">저장품</TableCell>
                    {seasonKeys.map((seasonKey) => {
                      const value = operatingExpenseData?.[seasonKey]?.etcItems?.storage?.amt ?? 0;
                      const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                      const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                      
                      return (
                        <Fragment key={seasonKey}>
                          <TableCell className="text-right">
                            <span className="text-slate-700">{formatCurrency(value)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-slate-600">
                              {percentValue.toFixed(1)}%
                            </span>
                          </TableCell>
                        </Fragment>
                      );
                    })}
                    {(() => {
                      const currentValue = operatingExpenseData?.[seasonKeys[2]]?.etcItems?.storage?.amt ?? 0;
                      const currentActual = actualSalesData?.[seasonKeys[2]]?.total ?? 0;
                      const currentPercent = currentActual > 0 ? ((currentValue / currentActual) * 1.1 * 100) : 0;

                      const prevValue = seasonKeys.length > 1 ? (operatingExpenseData?.[seasonKeys[1]]?.etcItems?.storage?.amt ?? 0) : 0;
                      const prevActual = seasonKeys.length > 1 ? (actualSalesData?.[seasonKeys[1]]?.total ?? 0) : 0;
                      const prevPercent = prevActual > 0 ? ((prevValue / prevActual) * 1.1 * 100) : 0;

                      const firstValue = operatingExpenseData?.[seasonKeys[0]]?.etcItems?.storage?.amt ?? 0;
                      const firstActual = actualSalesData?.[seasonKeys[0]]?.total ?? 0;
                      const firstPercent = firstActual > 0 ? ((firstValue / firstActual) * 1.1 * 100) : 0;

                      const diffVsPrev = currentPercent - prevPercent;
                      const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                      return (
                        <>
                          <TableCell className="text-right">
                            {prevPercent > 0 || currentPercent > 0 ? (
                              <span className={`text-xs ${diffVsPrev >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {diffVsFirst !== undefined ? (
                              <span className={`text-xs ${diffVsFirst >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                        </>
                      );
                    })()}
                  </TableRow>
                );
              })()}
              {/* 샘플비 */}
              {(() => {
                const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
                return (
                  <TableRow className="bg-slate-50">
                    <TableCell className="pl-8 text-slate-600">샘플비</TableCell>
                    {seasonKeys.map((seasonKey) => {
                      const value = operatingExpenseData?.[seasonKey]?.etcItems?.sample?.amt ?? 0;
                      const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                      const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                      
                      return (
                        <Fragment key={seasonKey}>
                          <TableCell className="text-right">
                            <span className="text-slate-700">{formatCurrency(value)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-slate-600">
                              {percentValue.toFixed(1)}%
                            </span>
                          </TableCell>
                        </Fragment>
                      );
                    })}
                    {(() => {
                      const currentValue = operatingExpenseData?.[seasonKeys[2]]?.etcItems?.sample?.amt ?? 0;
                      const currentActual = actualSalesData?.[seasonKeys[2]]?.total ?? 0;
                      const currentPercent = currentActual > 0 ? ((currentValue / currentActual) * 1.1 * 100) : 0;

                      const prevValue = seasonKeys.length > 1 ? (operatingExpenseData?.[seasonKeys[1]]?.etcItems?.sample?.amt ?? 0) : 0;
                      const prevActual = seasonKeys.length > 1 ? (actualSalesData?.[seasonKeys[1]]?.total ?? 0) : 0;
                      const prevPercent = prevActual > 0 ? ((prevValue / prevActual) * 1.1 * 100) : 0;

                      const firstValue = operatingExpenseData?.[seasonKeys[0]]?.etcItems?.sample?.amt ?? 0;
                      const firstActual = actualSalesData?.[seasonKeys[0]]?.total ?? 0;
                      const firstPercent = firstActual > 0 ? ((firstValue / firstActual) * 1.1 * 100) : 0;

                      const diffVsPrev = currentPercent - prevPercent;
                      const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                      return (
                        <>
                          <TableCell className="text-right">
                            {prevPercent > 0 || currentPercent > 0 ? (
                              <span className={`text-xs ${diffVsPrev >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {diffVsFirst !== undefined ? (
                              <span className={`text-xs ${diffVsFirst >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                        </>
                      );
                    })()}
                  </TableRow>
                );
              })()}
              {/* 감가상각비 */}
              {(() => {
                const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
                return (
                  <TableRow className="bg-slate-50">
                    <TableCell className="pl-8 text-slate-600">감가상각비</TableCell>
                    {seasonKeys.map((seasonKey) => {
                      const value = operatingExpenseData?.[seasonKey]?.etcItems?.depreciation?.amt ?? 0;
                      const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                      const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                      
                      return (
                        <Fragment key={seasonKey}>
                          <TableCell className="text-right">
                            <span className="text-slate-700">{formatCurrency(value)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-slate-600">
                              {percentValue.toFixed(1)}%
                            </span>
                          </TableCell>
                        </Fragment>
                      );
                    })}
                    {(() => {
                      const currentValue = operatingExpenseData?.[seasonKeys[2]]?.etcItems?.depreciation?.amt ?? 0;
                      const currentActual = actualSalesData?.[seasonKeys[2]]?.total ?? 0;
                      const currentPercent = currentActual > 0 ? ((currentValue / currentActual) * 1.1 * 100) : 0;

                      const prevValue = seasonKeys.length > 1 ? (operatingExpenseData?.[seasonKeys[1]]?.etcItems?.depreciation?.amt ?? 0) : 0;
                      const prevActual = seasonKeys.length > 1 ? (actualSalesData?.[seasonKeys[1]]?.total ?? 0) : 0;
                      const prevPercent = prevActual > 0 ? ((prevValue / prevActual) * 1.1 * 100) : 0;

                      const firstValue = operatingExpenseData?.[seasonKeys[0]]?.etcItems?.depreciation?.amt ?? 0;
                      const firstActual = actualSalesData?.[seasonKeys[0]]?.total ?? 0;
                      const firstPercent = firstActual > 0 ? ((firstValue / firstActual) * 1.1 * 100) : 0;

                      const diffVsPrev = currentPercent - prevPercent;
                      const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                      return (
                        <>
                          <TableCell className="text-right">
                            {prevPercent > 0 || currentPercent > 0 ? (
                              <span className={`text-xs ${diffVsPrev >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {diffVsFirst !== undefined ? (
                              <span className={`text-xs ${diffVsFirst >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                        </>
                      );
                    })()}
                  </TableRow>
                );
              })()}
              {/* 복리비/차량/핸드폰 */}
              {(() => {
                const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
                return (
                  <TableRow className="bg-slate-50">
                    <TableCell className="pl-8 text-slate-600">복리비/차량/핸드폰</TableCell>
                    {seasonKeys.map((seasonKey) => {
                      const value = operatingExpenseData?.[seasonKey]?.etcItems?.welfare?.amt ?? 0;
                      const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                      const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                      
                      return (
                        <Fragment key={seasonKey}>
                          <TableCell className="text-right">
                            <span className="text-slate-700">{formatCurrency(value)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-slate-600">
                              {percentValue.toFixed(1)}%
                            </span>
                          </TableCell>
                        </Fragment>
                      );
                    })}
                    {(() => {
                      const currentValue = operatingExpenseData?.[seasonKeys[2]]?.etcItems?.welfare?.amt ?? 0;
                      const currentActual = actualSalesData?.[seasonKeys[2]]?.total ?? 0;
                      const currentPercent = currentActual > 0 ? ((currentValue / currentActual) * 1.1 * 100) : 0;

                      const prevValue = seasonKeys.length > 1 ? (operatingExpenseData?.[seasonKeys[1]]?.etcItems?.welfare?.amt ?? 0) : 0;
                      const prevActual = seasonKeys.length > 1 ? (actualSalesData?.[seasonKeys[1]]?.total ?? 0) : 0;
                      const prevPercent = prevActual > 0 ? ((prevValue / prevActual) * 1.1 * 100) : 0;

                      const firstValue = operatingExpenseData?.[seasonKeys[0]]?.etcItems?.welfare?.amt ?? 0;
                      const firstActual = actualSalesData?.[seasonKeys[0]]?.total ?? 0;
                      const firstPercent = firstActual > 0 ? ((firstValue / firstActual) * 1.1 * 100) : 0;

                      const diffVsPrev = currentPercent - prevPercent;
                      const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                      return (
                        <>
                          <TableCell className="text-right">
                            {prevPercent > 0 || currentPercent > 0 ? (
                              <span className={`text-xs ${diffVsPrev >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {diffVsFirst !== undefined ? (
                              <span className={`text-xs ${diffVsFirst >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                        </>
                      );
                    })()}
                  </TableRow>
                );
              })()}
              {/* 여비교통비 */}
              {(() => {
                const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
                return (
                  <TableRow className="bg-slate-50">
                    <TableCell className="pl-8 text-slate-600">여비교통비</TableCell>
                    {seasonKeys.map((seasonKey) => {
                      const value = operatingExpenseData?.[seasonKey]?.etcItems?.travel?.amt ?? 0;
                      const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                      const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                      
                      return (
                        <Fragment key={seasonKey}>
                          <TableCell className="text-right">
                            <span className="text-slate-700">{formatCurrency(value)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-slate-600">
                              {percentValue.toFixed(1)}%
                            </span>
                          </TableCell>
                        </Fragment>
                      );
                    })}
                    {(() => {
                      const currentValue = operatingExpenseData?.[seasonKeys[2]]?.etcItems?.travel?.amt ?? 0;
                      const currentActual = actualSalesData?.[seasonKeys[2]]?.total ?? 0;
                      const currentPercent = currentActual > 0 ? ((currentValue / currentActual) * 1.1 * 100) : 0;

                      const prevValue = seasonKeys.length > 1 ? (operatingExpenseData?.[seasonKeys[1]]?.etcItems?.travel?.amt ?? 0) : 0;
                      const prevActual = seasonKeys.length > 1 ? (actualSalesData?.[seasonKeys[1]]?.total ?? 0) : 0;
                      const prevPercent = prevActual > 0 ? ((prevValue / prevActual) * 1.1 * 100) : 0;

                      const firstValue = operatingExpenseData?.[seasonKeys[0]]?.etcItems?.travel?.amt ?? 0;
                      const firstActual = actualSalesData?.[seasonKeys[0]]?.total ?? 0;
                      const firstPercent = firstActual > 0 ? ((firstValue / firstActual) * 1.1 * 100) : 0;

                      const diffVsPrev = currentPercent - prevPercent;
                      const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                      return (
                        <>
                          <TableCell className="text-right">
                            {prevPercent > 0 || currentPercent > 0 ? (
                              <span className={`text-xs ${diffVsPrev >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {diffVsFirst !== undefined ? (
                              <span className={`text-xs ${diffVsFirst >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                        </>
                      );
                    })()}
                  </TableRow>
                );
              })()}
              {/* 기타 */}
              {(() => {
                const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
                return (
                  <TableRow className="bg-slate-50">
                    <TableCell className="pl-8 text-slate-600">기타</TableCell>
                    {seasonKeys.map((seasonKey) => {
                      const value = operatingExpenseData?.[seasonKey]?.etcItems?.other?.amt ?? 0;
                      const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                      const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                      
                      return (
                        <Fragment key={seasonKey}>
                          <TableCell className="text-right">
                            <span className="text-slate-700">{formatCurrency(value)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-slate-600">
                              {percentValue.toFixed(1)}%
                            </span>
                          </TableCell>
                        </Fragment>
                      );
                    })}
                    {(() => {
                      const currentValue = operatingExpenseData?.[seasonKeys[2]]?.etcItems?.other?.amt ?? 0;
                      const currentActual = actualSalesData?.[seasonKeys[2]]?.total ?? 0;
                      const currentPercent = currentActual > 0 ? ((currentValue / currentActual) * 1.1 * 100) : 0;

                      const prevValue = seasonKeys.length > 1 ? (operatingExpenseData?.[seasonKeys[1]]?.etcItems?.other?.amt ?? 0) : 0;
                      const prevActual = seasonKeys.length > 1 ? (actualSalesData?.[seasonKeys[1]]?.total ?? 0) : 0;
                      const prevPercent = prevActual > 0 ? ((prevValue / prevActual) * 1.1 * 100) : 0;

                      const firstValue = operatingExpenseData?.[seasonKeys[0]]?.etcItems?.other?.amt ?? 0;
                      const firstActual = actualSalesData?.[seasonKeys[0]]?.total ?? 0;
                      const firstPercent = firstActual > 0 ? ((firstValue / firstActual) * 1.1 * 100) : 0;

                      const diffVsPrev = currentPercent - prevPercent;
                      const diffVsFirst = seasonKeys.length > 2 ? currentPercent - firstPercent : undefined;

                      return (
                        <>
                          <TableCell className="text-right">
                            {prevPercent > 0 || currentPercent > 0 ? (
                              <span className={`text-xs ${diffVsPrev >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsPrev >= 0 ? '+' : ''}{diffVsPrev.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {diffVsFirst !== undefined ? (
                              <span className={`text-xs ${diffVsFirst >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diffVsFirst >= 0 ? '+' : ''}{diffVsFirst.toFixed(1)}%p
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </TableCell>
                        </>
                      );
                    })()}
                  </TableRow>
                );
              })()}
            </>
          )}

          {/* 자가임차료 */}
          {(() => {
            const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
            
            return (
              <TableRow>
                <TableCell className="font-medium text-slate-700">자가임차료</TableCell>
                {seasonKeys.map((seasonKey) => {
                  const value = operatingExpenseData?.[seasonKey]?.selfRent?.amt ?? 0;
                  const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                  const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                  
                  return (
                    <Fragment key={seasonKey}>
                      <TableCell className="text-right">
                        <span className="text-slate-900">{formatCurrency(value)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-slate-600">
                          {percentValue.toFixed(1)}%
                        </span>
                      </TableCell>
                    </Fragment>
                  );
                })}
                {(() => {
                  // YOY (%) 계산: 25S/24S 금액 * 100%, 25S/23S 금액 * 100%
                  const currentValue = operatingExpenseData?.[seasonKeys[2]]?.selfRent?.amt ?? 0;
                  const prevValue = seasonKeys.length > 1 ? (operatingExpenseData?.[seasonKeys[1]]?.selfRent?.amt ?? 0) : 0;
                  const firstValue = operatingExpenseData?.[seasonKeys[0]]?.selfRent?.amt ?? 0;

                  const yoyVsPrev = prevValue > 0 ? (currentValue / prevValue * 100) : null;
                  const yoyVsFirst = firstValue > 0 ? (currentValue / firstValue * 100) : null;

                  return (
                    <>
                      <TableCell className="text-right">
                        {yoyVsPrev !== null ? (
                          <span className={`text-xs ${yoyVsPrev >= 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {yoyVsPrev.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {yoyVsFirst !== null ? (
                          <span className={`text-xs ${yoyVsFirst >= 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {yoyVsFirst.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                    </>
                  );
                })()}
              </TableRow>
            );
          })()}

          {/* 공통비 배부 */}
          {(() => {
            const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
            
            return (
              <TableRow>
                <TableCell className="font-medium text-slate-700">공통비 배부</TableCell>
                {seasonKeys.map((seasonKey) => {
                  const value = operatingExpenseData?.[seasonKey]?.commonCost?.amt ?? 0;
                  const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                  const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                  
                  return (
                    <Fragment key={seasonKey}>
                      <TableCell className="text-right">
                        <span className="text-slate-900">{formatCurrency(value)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-slate-600">
                          {percentValue.toFixed(1)}%
                        </span>
                      </TableCell>
                    </Fragment>
                  );
                })}
                {(() => {
                  // YOY (%) 계산: 25S/24S 금액 * 100%, 25S/23S 금액 * 100%
                  const currentValue = operatingExpenseData?.[seasonKeys[2]]?.commonCost?.amt ?? 0;
                  const prevValue = seasonKeys.length > 1 ? (operatingExpenseData?.[seasonKeys[1]]?.commonCost?.amt ?? 0) : 0;
                  const firstValue = operatingExpenseData?.[seasonKeys[0]]?.commonCost?.amt ?? 0;

                  const yoyVsPrev = prevValue > 0 ? (currentValue / prevValue * 100) : null;
                  const yoyVsFirst = firstValue > 0 ? (currentValue / firstValue * 100) : null;

                  return (
                    <>
                      <TableCell className="text-right">
                        {yoyVsPrev !== null ? (
                          <span className={`text-xs ${yoyVsPrev >= 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {yoyVsPrev.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {yoyVsFirst !== null ? (
                          <span className={`text-xs ${yoyVsFirst >= 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {yoyVsFirst.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                    </>
                  );
                })()}
              </TableRow>
            );
          })()}

          {/* 제조간접비 차감 */}
          {(() => {
            const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
            
            return (
              <TableRow>
                <TableCell className="font-medium text-slate-700">제조간접비 차감</TableCell>
                {seasonKeys.map((seasonKey) => {
                  const value = operatingExpenseData?.[seasonKey]?.mfcIndirect?.amt ?? 0;
                  const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                  const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                  
                  return (
                    <Fragment key={seasonKey}>
                      <TableCell className="text-right">
                        <span className="text-slate-900">{formatCurrency(value)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-slate-600">
                          {percentValue.toFixed(1)}%
                        </span>
                      </TableCell>
                    </Fragment>
                  );
                })}
                {(() => {
                  // YOY (%) 계산: 절대값으로 비교 (25S/24S 금액 * 100%, 25S/23S 금액 * 100%)
                  const currentValue = Math.abs(operatingExpenseData?.[seasonKeys[2]]?.mfcIndirect?.amt ?? 0);
                  const prevValue = seasonKeys.length > 1 ? Math.abs(operatingExpenseData?.[seasonKeys[1]]?.mfcIndirect?.amt ?? 0) : 0;
                  const firstValue = Math.abs(operatingExpenseData?.[seasonKeys[0]]?.mfcIndirect?.amt ?? 0);

                  const yoyVsPrev = prevValue > 0 ? (currentValue / prevValue * 100) : null;
                  const yoyVsFirst = firstValue > 0 ? (currentValue / firstValue * 100) : null;

                  return (
                    <>
                      <TableCell className="text-right">
                        {yoyVsPrev !== null ? (
                          <span className={`text-xs ${yoyVsPrev >= 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {yoyVsPrev.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {yoyVsFirst !== null ? (
                          <span className={`text-xs ${yoyVsFirst >= 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {yoyVsFirst.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                    </>
                  );
                })()}
              </TableRow>
            );
          })()}

          {/* 영업비 합계 */}
          {(() => {
            const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
            
            return (
              <TableRow className="bg-slate-100">
                <TableCell className="font-semibold text-slate-800">영업비 합계</TableCell>
                {seasonKeys.map((seasonKey) => {
                  const value = operatingExpenseData?.[seasonKey]?.total?.amt ?? 0;
                  const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                  const percentValue = actualSalesTotal > 0 ? ((value / actualSalesTotal) * 1.1 * 100) : 0;
                  
                  return (
                    <Fragment key={seasonKey}>
                      <TableCell className="text-right">
                        <span className="font-semibold text-slate-900">{formatCurrency(value)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-slate-600 font-semibold">
                          {percentValue.toFixed(1)}%
                        </span>
                      </TableCell>
                    </Fragment>
                  );
                })}
                {(() => {
                  // YOY (%) 계산: 25S/24S 금액 * 100%, 25S/23S 금액 * 100%
                  const currentValue = operatingExpenseData?.[seasonKeys[2]]?.total?.amt ?? 0;
                  const prevValue = seasonKeys.length > 1 ? (operatingExpenseData?.[seasonKeys[1]]?.total?.amt ?? 0) : 0;
                  const firstValue = operatingExpenseData?.[seasonKeys[0]]?.total?.amt ?? 0;

                  const yoyVsPrev = prevValue > 0 ? (currentValue / prevValue * 100) : null;
                  const yoyVsFirst = firstValue > 0 ? (currentValue / firstValue * 100) : null;

                  return (
                    <>
                      <TableCell className="text-right">
                        {yoyVsPrev !== null ? (
                          <span className={`text-xs font-semibold ${yoyVsPrev >= 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {yoyVsPrev.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {yoyVsFirst !== null ? (
                          <span className={`text-xs font-semibold ${yoyVsFirst >= 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {yoyVsFirst.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                    </>
                  );
                })()}
              </TableRow>
            );
          })()}

          {/* 영업이익 = 직접이익 - 영업비 합계 */}
          {(() => {
            const seasonKeys: ('23S' | '24S' | '25S')[] = ['23S', '24S', '25S'];
            
            return (
              <TableRow className="bg-emerald-50/50 border-t-2 border-emerald-200">
                <TableCell className="font-bold text-slate-900">영업이익</TableCell>
                {seasonKeys.map((seasonKey) => {
                  // 직접이익 계산
                  const vatExcSales = vatExcSalesData?.[seasonKey]?.total ?? 0;
                  const cogsTotal = costOfSalesData?.[seasonKey]?.cogsTotal ?? 0;
                  const grossProfit = vatExcSales - cogsTotal;
                  const directCostTotal = directCostData?.[seasonKey]?.totals?.DIRECT_COST_TOTAL ?? 0;
                  const directProfit = grossProfit - directCostTotal;
                  
                  // 영업비 합계
                  const opExpTotal = operatingExpenseData?.[seasonKey]?.total?.amt ?? 0;
                  
                  // 영업이익 = 직접이익 - 영업비 합계
                  const operatingProfit = directProfit - opExpTotal;
                  
                  // 실판가 총액
                  const actualSalesTotal = actualSalesData?.[seasonKey]?.total ?? 0;
                  // (영업이익/실판가)*1.1*100%
                  const percentValue = actualSalesTotal > 0 ? ((operatingProfit / actualSalesTotal) * 1.1 * 100) : 0;
                  
                  return (
                    <Fragment key={seasonKey}>
                      <TableCell className="text-right">
                        <span className="font-bold text-emerald-700">{formatCurrency(operatingProfit)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-slate-600 font-bold">
                          {percentValue.toFixed(1)}%
                        </span>
                      </TableCell>
                    </Fragment>
                  );
                })}
                {(() => {
                  // YOY (%) 계산: 25S/24S 금액 * 100%, 25S/23S 금액 * 100%
                  const currentGross = (vatExcSalesData?.[seasonKeys[2]]?.total ?? 0) - (costOfSalesData?.[seasonKeys[2]]?.cogsTotal ?? 0);
                  const currentDirectCost = directCostData?.[seasonKeys[2]]?.totals?.DIRECT_COST_TOTAL ?? 0;
                  const currentDirectProfit = currentGross - currentDirectCost;
                  const currentOpExp = operatingExpenseData?.[seasonKeys[2]]?.total?.amt ?? 0;
                  const currentOperatingProfit = currentDirectProfit - currentOpExp;

                  const prevGross = seasonKeys.length > 1 ? ((vatExcSalesData?.[seasonKeys[1]]?.total ?? 0) - (costOfSalesData?.[seasonKeys[1]]?.cogsTotal ?? 0)) : 0;
                  const prevDirectCost = seasonKeys.length > 1 ? (directCostData?.[seasonKeys[1]]?.totals?.DIRECT_COST_TOTAL ?? 0) : 0;
                  const prevDirectProfit = prevGross - prevDirectCost;
                  const prevOpExp = seasonKeys.length > 1 ? (operatingExpenseData?.[seasonKeys[1]]?.total?.amt ?? 0) : 0;
                  const prevOperatingProfit = prevDirectProfit - prevOpExp;

                  const firstGross = (vatExcSalesData?.[seasonKeys[0]]?.total ?? 0) - (costOfSalesData?.[seasonKeys[0]]?.cogsTotal ?? 0);
                  const firstDirectCost = directCostData?.[seasonKeys[0]]?.totals?.DIRECT_COST_TOTAL ?? 0;
                  const firstDirectProfit = firstGross - firstDirectCost;
                  const firstOpExp = operatingExpenseData?.[seasonKeys[0]]?.total?.amt ?? 0;
                  const firstOperatingProfit = firstDirectProfit - firstOpExp;

                  const yoyVsPrev = prevOperatingProfit > 0 ? (currentOperatingProfit / prevOperatingProfit * 100) : null;
                  const yoyVsFirst = firstOperatingProfit > 0 ? (currentOperatingProfit / firstOperatingProfit * 100) : null;

                  return (
                    <>
                      <TableCell className="text-right">
                        {yoyVsPrev !== null ? (
                          <span className={`text-xs font-bold ${yoyVsPrev >= 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {yoyVsPrev.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {yoyVsFirst !== null ? (
                          <span className={`text-xs font-bold ${yoyVsFirst >= 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {yoyVsFirst.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                    </>
                  );
                })()}
              </TableRow>
            );
          })()}
            </TableBody>
          </Table>
          </div>
        </Card>
  );
});

SummaryPnlTable.displayName = 'SummaryPnlTable';



