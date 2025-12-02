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
import { SeasonData, formatCurrency, formatPercent } from '../constants/mockData';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { EndStockTooltip } from './EndStockTooltip';
import { EndStockItem } from '../hooks/useEndStockData';
import { SalesChannelItem, CHANNEL_ORDER } from '../hooks/useSalesData';

interface ChannelSalesData {
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

interface SummaryPnlTableProps {
  seasons: SeasonData[];
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
  ({ seasons, onExpandedAllChange, endStockData, endStockDetails, salesTagData, actualSalesData, orderAmountData, vatExcSalesData, costOfSalesData }, ref) => {
    const [expandedAll, setExpandedAll] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

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
                : season.revenue * 0.15;
              const previousValue = idx > 0 
                ? (endStockData?.[seasons[idx - 1].season] 
                    ? endStockData[seasons[idx - 1].season]! / 1000000 
                    : seasons[idx - 1].revenue * 0.15)
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
                : seasons[seasons.length - 1].revenue * 0.15;
              const previousValue = seasons.length > 1 && endStockData?.[seasons[seasons.length - 2].season]
                ? endStockData[seasons[seasons.length - 2].season]! / 1000000
                : (seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.15 : undefined);
              const firstValue = endStockData?.[seasons[0].season]
                ? endStockData[seasons[0].season]! / 1000000
                : seasons[0].revenue * 0.15;
              return renderYOYColumns(currentValue, previousValue, firstValue);
            })()}
          </TableRow>

          {/* 발주금액(당시즌의류) - 항상 표시 */}
          <TableRow>
            <TableCell className="font-semibold text-slate-900">
              발주금액(당시즌의류)
            </TableCell>
            {seasons.map((season) => {
              const orderData = orderAmountData?.[season.season as '23S' | '24S' | '25S'];
              const orderAmt = orderData?.orderAmt ?? season.revenue * 1.2;
              const salesRate = orderData?.salesRate ?? 0;
              return (
                <Fragment key={season.season}>
                  <TableCell className="text-right">
                    <span className="font-semibold">{formatCurrency(orderAmt)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs text-slate-600">
                      판매율 {salesRate.toFixed(1)}%
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
              
              const currentValue = currentOrderData?.orderAmt ?? seasons[seasons.length - 1].revenue * 1.2;
              const previousValue = prevOrderData?.orderAmt ?? (seasons.length > 1 ? seasons[seasons.length - 2].revenue * 1.2 : undefined);
              const firstValue = firstOrderData?.orderAmt ?? seasons[0].revenue * 1.2;
              
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
              const value = salesTagData?.[season.season]?.total ?? season.revenue * 1.3;
              const previousValue = idx > 0 
                ? (salesTagData?.[seasons[idx - 1].season]?.total ?? seasons[idx - 1].revenue * 1.3)
                : undefined;
              return (
                <Fragment key={season.season}>
                  {renderValueAndYOY(value, previousValue, 'font-medium')}
                </Fragment>
              );
            })}
            {(() => {
              const currentValue = salesTagData?.[seasons[seasons.length - 1].season]?.total ?? seasons[seasons.length - 1].revenue * 1.3;
              const previousValue = seasons.length > 1 
                ? (salesTagData?.[seasons[seasons.length - 2].season]?.total ?? seasons[seasons.length - 2].revenue * 1.3)
                : undefined;
              const firstValue = salesTagData?.[seasons[0].season]?.total ?? seasons[0].revenue * 1.3;
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
                const value = salesTagData?.[season.season]?.total ?? season.revenue * 1.3;
                const previousValue = idx > 0 
                  ? (salesTagData?.[seasons[idx - 1].season]?.total ?? seasons[idx - 1].revenue * 1.3)
                  : undefined;
                return (
                  <Fragment key={season.season}>
                    {renderValueAndYOY(value, previousValue, 'font-semibold')}
                  </Fragment>
                );
              })}
              {(() => {
                const currentValue = salesTagData?.[seasons[seasons.length - 1].season]?.total ?? seasons[seasons.length - 1].revenue * 1.3;
                const previousValue = seasons.length > 1 
                  ? (salesTagData?.[seasons[seasons.length - 2].season]?.total ?? seasons[seasons.length - 2].revenue * 1.3)
                  : undefined;
                const firstValue = salesTagData?.[seasons[0].season]?.total ?? seasons[0].revenue * 1.3;
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
              const actualValue = actualSalesData?.[season.season]?.total ?? season.revenue;
              const tagValue = salesTagData?.[season.season]?.total ?? season.revenue * 1.3;
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
              const currentActual = actualSalesData?.[seasons[seasons.length - 1].season]?.total ?? seasons[seasons.length - 1].revenue;
              const currentTag = salesTagData?.[seasons[seasons.length - 1].season]?.total ?? seasons[seasons.length - 1].revenue * 1.3;
              const currentDiscountRate = currentTag > 0 ? (1 - currentActual / currentTag) * 100 : 0;

              const prevActual = seasons.length > 1 
                ? (actualSalesData?.[seasons[seasons.length - 2].season]?.total ?? seasons[seasons.length - 2].revenue)
                : undefined;
              const prevTag = seasons.length > 1
                ? (salesTagData?.[seasons[seasons.length - 2].season]?.total ?? seasons[seasons.length - 2].revenue * 1.3)
                : undefined;
              const prevDiscountRate = prevTag && prevTag > 0 ? (1 - (prevActual ?? 0) / prevTag) * 100 : undefined;

              const firstActual = actualSalesData?.[seasons[0].season]?.total ?? seasons[0].revenue;
              const firstTag = salesTagData?.[seasons[0].season]?.total ?? seasons[0].revenue * 1.3;
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
                const actualValue = actualSalesData?.[season.season]?.total ?? season.revenue;
                const tagValue = salesTagData?.[season.season]?.total ?? season.revenue * 1.3;
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
                const currentActual = actualSalesData?.[seasons[seasons.length - 1].season]?.total ?? seasons[seasons.length - 1].revenue;
                const currentTag = salesTagData?.[seasons[seasons.length - 1].season]?.total ?? seasons[seasons.length - 1].revenue * 1.3;
                const currentDiscountRate = currentTag > 0 ? (1 - currentActual / currentTag) * 100 : 0;

                const prevActual = seasons.length > 1 
                  ? (actualSalesData?.[seasons[seasons.length - 2].season]?.total ?? seasons[seasons.length - 2].revenue)
                  : undefined;
                const prevTag = seasons.length > 1
                  ? (salesTagData?.[seasons[seasons.length - 2].season]?.total ?? seasons[seasons.length - 2].revenue * 1.3)
                  : undefined;
                const prevDiscountRate = prevTag && prevTag > 0 ? (1 - (prevActual ?? 0) / prevTag) * 100 : undefined;

                const firstActual = actualSalesData?.[seasons[0].season]?.total ?? seasons[0].revenue;
                const firstTag = salesTagData?.[seasons[0].season]?.total ?? seasons[0].revenue * 1.3;
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
              const shippingValue = vatExcSalesData?.[season.season as '23S' | '24S' | '25S']?.shippingTotal ?? season.revenue * 0.95;
              const actualValue = actualSalesData?.[season.season as '23S' | '24S' | '25S']?.total ?? season.revenue * 0.9;
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
                    const shippingValue = channelData?.SHIPPING_PRICE ?? season.revenue * 0.085;
                    const actualChannelData = actualSalesData?.[season.season as '23S' | '24S' | '25S']?.channels?.find(c => c.CHNL_NM === channel);
                    const actualValue = actualChannelData?.ACT_SALE_AMT ?? season.revenue * 0.08;
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
                const shippingValue = vatExcSalesData?.[season.season as '23S' | '24S' | '25S']?.shippingTotal ?? season.revenue * 0.95;
                const actualValue = actualSalesData?.[season.season as '23S' | '24S' | '25S']?.total ?? season.revenue * 0.9;
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
              const value = vatExcSalesData?.[season.season as '23S' | '24S' | '25S']?.total ?? season.revenue * 0.91;
              // 출고가(V+)/실판가 비율 계산 (출고가(V+)의 percentage와 동일)
              const shippingValue = vatExcSalesData?.[season.season as '23S' | '24S' | '25S']?.shippingTotal ?? season.revenue * 0.95;
              const actualValue = actualSalesData?.[season.season as '23S' | '24S' | '25S']?.total ?? season.revenue * 0.9;
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

          {/* 매출총이익 */}
          <TableRow className="bg-blue-50/30">
            <TableCell className="font-bold text-slate-900">매출총이익</TableCell>
            {seasons.map((season, idx) => {
              const value = season.grossProfit;
              const previousValue = idx > 0 ? seasons[idx - 1].grossProfit : undefined;
              return (
                <Fragment key={season.season}>
                  <TableCell className="text-right">
                    <span className="font-bold text-blue-700">{formatCurrency(value)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {previousValue ? (
                      <span className={`text-xs ${((value - previousValue) / previousValue) * 100 >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {((value - previousValue) / previousValue) * 100 >= 0 ? '+' : ''}{(((value - previousValue) / previousValue) * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </TableCell>
                </Fragment>
              );
            })}
            {renderYOYColumns(
              seasons[seasons.length - 1].grossProfit,
              seasons.length > 1 ? seasons[seasons.length - 2].grossProfit : undefined,
              seasons[0].grossProfit
            )}
          </TableRow>

          {/* 직접비 - 펼치기 가능 */}
          <TableRow
            className="cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => toggleSection('directCost')}
          >
            <TableCell className="font-semibold text-slate-900 hover:font-bold hover:underline">
              직접비
            </TableCell>
            {seasons.map((season, idx) => {
              const value = season.revenue * 0.25;
              const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.25 : undefined;
              return (
                <Fragment key={season.season}>
                  {renderValueAndPercent(value, previousValue, 'font-semibold')}
                </Fragment>
              );
            })}
            {renderYOYColumns(
              seasons[seasons.length - 1].revenue * 0.25,
              seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.25 : undefined,
              seasons[0].revenue * 0.25
            )}
          </TableRow>

          {/* 직접비 하위 항목 */}
          {isExpanded('directCost') && (
            <>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">로열티</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.05;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.05 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.05,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.05 : undefined,
                  seasons[0].revenue * 0.05
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">물류비</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.03;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.03 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.03,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.03 : undefined,
                  seasons[0].revenue * 0.03
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">보관료</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.01;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.01 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.01,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.01 : undefined,
                  seasons[0].revenue * 0.01
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">카드수수료</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.02;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.02 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.02,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.02 : undefined,
                  seasons[0].revenue * 0.02
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">매장임차료</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.06;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.06 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.06,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.06 : undefined,
                  seasons[0].revenue * 0.06
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">감가상각비(매장)</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.015;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.015 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.015,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.015 : undefined,
                  seasons[0].revenue * 0.015
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">온라인수수료(제휴)</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.025;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.025 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.025,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.025 : undefined,
                  seasons[0].revenue * 0.025
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">중간관리자 수수료</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.01;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.01 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.01,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.01 : undefined,
                  seasons[0].revenue * 0.01
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">면세 판매직수수료</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.015;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.015 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.015,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.015 : undefined,
                  seasons[0].revenue * 0.015
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">직영 판매직수수료</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.02;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.02 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.02,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.02 : undefined,
                  seasons[0].revenue * 0.02
                )}
              </TableRow>
              <TableRow className="bg-slate-100">
                <TableCell className="pl-8 font-semibold text-slate-800">직접비 소계</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.25;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.25 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue, 'font-semibold')}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.25,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.25 : undefined,
                  seasons[0].revenue * 0.25
                )}
              </TableRow>
            </>
          )}

          {/* 직접이익 */}
          <TableRow className="bg-indigo-50/30">
            <TableCell className="font-bold text-slate-900">직접이익</TableCell>
            {seasons.map((season, idx) => {
              const value = season.grossProfit * 0.75;
              const previousValue = idx > 0 ? seasons[idx - 1].grossProfit * 0.75 : undefined;
              return (
                <Fragment key={season.season}>
                  <TableCell className="text-right">
                    <span className="font-bold text-indigo-700">{formatCurrency(value)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {previousValue ? (
                      <span className={`text-xs ${((value - previousValue) / previousValue) * 100 >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {((value - previousValue) / previousValue) * 100 >= 0 ? '+' : ''}{(((value - previousValue) / previousValue) * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </TableCell>
                </Fragment>
              );
            })}
            {renderYOYColumns(
              seasons[seasons.length - 1].grossProfit * 0.75,
              seasons.length > 1 ? seasons[seasons.length - 2].grossProfit * 0.75 : undefined,
              seasons[0].grossProfit * 0.75
            )}
          </TableRow>

          {/* 광고선전비 */}
          <TableRow>
            <TableCell className="font-medium text-slate-700">광고선전비</TableCell>
            {seasons.map((season, idx) => {
              const value = season.adExpense;
              const previousValue = idx > 0 ? seasons[idx - 1].adExpense : undefined;
              return (
                <Fragment key={season.season}>
                  {renderValueAndPercent(value, previousValue)}
                </Fragment>
              );
            })}
            {renderYOYColumns(
              seasons[seasons.length - 1].adExpense,
              seasons.length > 1 ? seasons[seasons.length - 2].adExpense : undefined,
              seasons[0].adExpense
            )}
          </TableRow>

          {/* 인건비 */}
          <TableRow>
            <TableCell className="font-medium text-slate-700">인건비</TableCell>
            {seasons.map((season, idx) => {
              const value = season.hrCost;
              const previousValue = idx > 0 ? seasons[idx - 1].hrCost : undefined;
              return (
                <Fragment key={season.season}>
                  {renderValueAndPercent(value, previousValue)}
                </Fragment>
              );
            })}
            {renderYOYColumns(
              seasons[seasons.length - 1].hrCost,
              seasons.length > 1 ? seasons[seasons.length - 2].hrCost : undefined,
              seasons[0].hrCost
            )}
          </TableRow>

          {/* 기타영업비 - 펼치기 가능 */}
          <TableRow
            className="cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => toggleSection('operatingExpense')}
          >
            <TableCell className="font-semibold text-slate-900 hover:font-bold hover:underline">
              기타영업비
            </TableCell>
            {seasons.map((season, idx) => {
              const value = season.revenue * 0.03;
              const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.03 : undefined;
              return (
                <Fragment key={season.season}>
                  {renderValueAndPercent(value, previousValue, 'font-semibold')}
                </Fragment>
              );
            })}
            {renderYOYColumns(
              seasons[seasons.length - 1].revenue * 0.03,
              seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.03 : undefined,
              seasons[0].revenue * 0.03
            )}
          </TableRow>

          {/* 기타영업비 하위 항목 */}
          {isExpanded('operatingExpense') && (
            <>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">소계</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.03;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.03 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.03,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.03 : undefined,
                  seasons[0].revenue * 0.03
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">기타수수료</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.004;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.004 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.004,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.004 : undefined,
                  seasons[0].revenue * 0.004
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">소모품비</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.005;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.005 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.005,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.005 : undefined,
                  seasons[0].revenue * 0.005
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">감가상각비(기타)</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.003;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.003 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.003,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.003 : undefined,
                  seasons[0].revenue * 0.003
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">VMD/매장보수대</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.004;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.004 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.004,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.004 : undefined,
                  seasons[0].revenue * 0.004
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">수선비</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.002;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.002 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.002,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.002 : undefined,
                  seasons[0].revenue * 0.002
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">복리후생비</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.006;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.006 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.006,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.006 : undefined,
                  seasons[0].revenue * 0.006
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">여비교통비</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.003;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.003 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.003,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.003 : undefined,
                  seasons[0].revenue * 0.003
                )}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="pl-8 text-slate-600">기타</TableCell>
                {seasons.map((season, idx) => {
                  const value = season.revenue * 0.007;
                  const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.007 : undefined;
                  return (
                    <Fragment key={season.season}>
                      {renderValueAndPercent(value, previousValue)}
                    </Fragment>
                  );
                })}
                {renderYOYColumns(
                  seasons[seasons.length - 1].revenue * 0.007,
                  seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.007 : undefined,
                  seasons[0].revenue * 0.007
                )}
              </TableRow>
            </>
          )}

          {/* 자가임차료 */}
          <TableRow>
            <TableCell className="font-medium text-slate-700">자가임차료</TableCell>
            {seasons.map((season, idx) => {
              const value = season.revenue * 0.01;
              const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.01 : undefined;
              return (
                <Fragment key={season.season}>
                  {renderValueAndPercent(value, previousValue)}
                </Fragment>
              );
            })}
            {renderYOYColumns(
              seasons[seasons.length - 1].revenue * 0.01,
              seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.01 : undefined,
              seasons[0].revenue * 0.01
            )}
          </TableRow>

          {/* 공통비 배부 */}
          <TableRow>
            <TableCell className="font-medium text-slate-700">공통비 배부</TableCell>
            {seasons.map((season, idx) => {
              const value = season.revenue * 0.015;
              const previousValue = idx > 0 ? seasons[idx - 1].revenue * 0.015 : undefined;
              return (
                <Fragment key={season.season}>
                  {renderValueAndPercent(value, previousValue)}
                </Fragment>
              );
            })}
            {renderYOYColumns(
              seasons[seasons.length - 1].revenue * 0.015,
              seasons.length > 1 ? seasons[seasons.length - 2].revenue * 0.015 : undefined,
              seasons[0].revenue * 0.015
            )}
          </TableRow>

          {/* 영업비 합계 */}
          <TableRow className="bg-slate-100">
            <TableCell className="font-semibold text-slate-800">영업비 합계</TableCell>
            {seasons.map((season, idx) => {
              const value = season.adExpense + season.hrCost + season.revenue * 0.055;
              const previousValue = idx > 0 ? seasons[idx - 1].adExpense + seasons[idx - 1].hrCost + seasons[idx - 1].revenue * 0.055 : undefined;
              return (
                <Fragment key={season.season}>
                  {renderValueAndPercent(value, previousValue, 'font-semibold')}
                </Fragment>
              );
            })}
            {renderYOYColumns(
              seasons[seasons.length - 1].adExpense + seasons[seasons.length - 1].hrCost + seasons[seasons.length - 1].revenue * 0.055,
              seasons.length > 1 ? seasons[seasons.length - 2].adExpense + seasons[seasons.length - 2].hrCost + seasons[seasons.length - 2].revenue * 0.055 : undefined,
              seasons[0].adExpense + seasons[0].hrCost + seasons[0].revenue * 0.055
            )}
          </TableRow>

          {/* 영업이익 */}
          <TableRow className="bg-emerald-50/50 border-t-2 border-emerald-200">
            <TableCell className="font-bold text-slate-900">영업이익</TableCell>
            {seasons.map((season, idx) => {
              const value = season.operatingProfit;
              const previousValue = idx > 0 ? seasons[idx - 1].operatingProfit : undefined;
              return (
                <Fragment key={season.season}>
                  <TableCell className="text-right">
                    <span className="font-bold text-emerald-700">{formatCurrency(value)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {previousValue ? (
                      <span className={`text-xs ${((value - previousValue) / previousValue) * 100 >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {((value - previousValue) / previousValue) * 100 >= 0 ? '+' : ''}{(((value - previousValue) / previousValue) * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </TableCell>
                </Fragment>
              );
            })}
            {renderYOYColumns(
              seasons[seasons.length - 1].operatingProfit,
              seasons.length > 1 ? seasons[seasons.length - 2].operatingProfit : undefined,
              seasons[0].operatingProfit
            )}
          </TableRow>
            </TableBody>
          </Table>
          </div>
        </Card>
  );
});

SummaryPnlTable.displayName = 'SummaryPnlTable';



