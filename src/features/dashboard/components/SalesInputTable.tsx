'use client';

import { useState, useMemo, useCallback, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SalesInputRow,
  CHANNELS,
  SEASONS,
  ITEM_CATEGORIES,
  ChannelCode,
  SeasonCode,
  ItemCategoryCode,
  formatThousandWon,
} from '../types/plan26s';
import { ChevronDown, ChevronRight, Filter, Search } from 'lucide-react';

interface SalesInputTableProps {
  inputs: SalesInputRow[];
  season25STotal: number;
  onUpdateInput: (rowId: string, updates: Partial<SalesInputRow>) => void;
  baselineByChannel?: Record<string, { salesTag: number; actual: number; discount: number }>;
}

type GroupByOption = 'channel' | 'season' | 'category' | 'none';

export const SalesInputTable = ({
  inputs,
  season25STotal,
  onUpdateInput,
  baselineByChannel = {},
}: SalesInputTableProps) => {
  const calculateGroupTotal = useCallback((items: SalesInputRow[]) => {
    return items.reduce(
      (acc, item) => ({
        salesTagAmt: acc.salesTagAmt + item.salesTagAmt,
        actualSalesAmt: acc.actualSalesAmt + item.actualSalesAmt,
      }),
      { salesTagAmt: 0, actualSalesAmt: 0 }
    );
  }, []);
  const [groupBy, setGroupBy] = useState<GroupByOption>('channel');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterSeason, setFilterSeason] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allKeys = new Set<string>();
    if (groupBy === 'channel') {
      CHANNELS.forEach((ch) => allKeys.add(ch.code));
    } else if (groupBy === 'season') {
      SEASONS.forEach((s) => allKeys.add(s));
    } else if (groupBy === 'category') {
      ITEM_CATEGORIES.forEach((c) => allKeys.add(c.code));
    }
    setExpandedGroups(allKeys);
  }, [groupBy]);

  const collapseAll = useCallback(() => {
    setExpandedGroups(new Set());
  }, []);

  // 정렬 우선순위 맵
  const channelOrder: Record<string, number> = useMemo(
    () => CHANNELS.reduce((acc, c, idx) => ({ ...acc, [c.code]: idx }), {}),
    []
  );
  const seasonOrder: Record<string, number> = useMemo(
    () => SEASONS.reduce((acc, s, idx) => ({ ...acc, [s]: idx }), {}),
    []
  );
  const categoryOrder: Record<string, number> = useMemo(
    () => ITEM_CATEGORIES.reduce((acc, c, idx) => ({ ...acc, [c.code]: idx }), {}),
    []
  );

  const filteredInputs = useMemo(() => {
    const list = inputs.filter((input) => {
      if (filterChannel !== 'all' && input.channelCode !== filterChannel) return false;
      if (filterSeason !== 'all' && input.seasonCode !== filterSeason) return false;
      if (filterCategory !== 'all' && input.categoryCode !== filterCategory) return false;
      return true;
    });

    // 일관된 정렬: 채널 > 시즌 > 카테고리
    return list.sort((a, b) => {
      const ch = (channelOrder[a.channelCode] ?? 999) - (channelOrder[b.channelCode] ?? 999);
      if (ch !== 0) return ch;
      const se = (seasonOrder[a.seasonCode] ?? 999) - (seasonOrder[b.seasonCode] ?? 999);
      if (se !== 0) return se;
      return (categoryOrder[a.categoryCode] ?? 999) - (categoryOrder[b.categoryCode] ?? 999);
    });
  }, [inputs, filterChannel, filterSeason, filterCategory, channelOrder, seasonOrder, categoryOrder]);

  const groupedData = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', label: '전체', items: filteredInputs }];
    }

    if (groupBy === 'channel') {
      return CHANNELS.map((ch) => {
        const items = filteredInputs.filter((i) => i.channelCode === ch.code);
        const baseline = baselineByChannel[ch.code];
        const totals = calculateGroupTotal(items);
        const hasData =
          items.length > 0 &&
          (totals.salesTagAmt !== 0 || totals.actualSalesAmt !== 0);
        const hasBaseline =
          baseline && (baseline.salesTag !== 0 || baseline.actual !== 0);

        // 데이터도 없고 기준값도 없으면 숨김 (예: 해당 브랜드에 없는 채널)
        if (!hasData && !hasBaseline) {
          return null;
        }

        return {
          key: ch.code,
          label: ch.name,
          items,
        };
      }).filter(Boolean) as { key: string; label: string; items: SalesInputRow[] }[];
    }

    if (groupBy === 'season') {
      return SEASONS.map((s) => ({
        key: s,
        label: s,
        items: filteredInputs.filter((i) => i.seasonCode === s),
      })).filter((g) => g.items.length > 0);
    }

    // category
    return ITEM_CATEGORIES.map((c) => ({
      key: c.code,
      label: c.name,
      items: filteredInputs.filter((i) => i.categoryCode === c.code),
    })).filter((g) => g.items.length > 0);
  }, [filteredInputs, groupBy]);

  const getItemLabel = (input: SalesInputRow, excludeGroupBy: GroupByOption): string => {
    const parts: string[] = [];

    if (excludeGroupBy !== 'channel') {
      const channel = CHANNELS.find((ch) => ch.code === input.channelCode);
      if (channel) parts.push(channel.name);
    }
    if (excludeGroupBy !== 'season') {
      parts.push(input.seasonCode);
    }
    if (excludeGroupBy !== 'category') {
      const category = ITEM_CATEGORIES.find((c) => c.code === input.categoryCode);
      if (category) parts.push(category.name);
    }

    return parts.join(' / ');
  };

  const handleInputChange = useCallback(
    (rowId: string, field: 'salesTagAmt' | 'discountRate' | 'actualSalesAmt', value: string) => {
      const numValue = parseFloat(value.replace(/,/g, '')) || 0;
      onUpdateInput(rowId, { [field]: numValue });
    },
    [onUpdateInput]
  );

  const totalSales26S = useMemo(() => {
    return filteredInputs.reduce((sum, input) => sum + input.actualSalesAmt, 0);
  }, [filteredInputs]);

  // 25S 총합 (baseline) 집계
  const baselineTotals = useMemo(() => {
    const values = Object.values(baselineByChannel || {});
    const salesTag = values.reduce((s, v) => s + v.salesTag, 0);
    const actual = values.reduce((s, v) => s + v.actual, 0);
    const discount = salesTag > 0 ? (1 - actual / salesTag) * 100 : 0;
    return { salesTag, actual, discount };
  }, [baselineByChannel]);

  const vsChange = totalSales26S - season25STotal;
  const vsChangeRate = season25STotal > 0 ? (vsChange / season25STotal) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-full" />
            26S 매출 계획 입력
          </CardTitle>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <span className="text-slate-600">25S 실판매출액:</span>
              <span className="font-semibold text-slate-900">
                {formatThousandWon(season25STotal)} 천원
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
              <span className="text-blue-600">26S 계획:</span>
              <span className="font-semibold text-blue-700">
                {formatThousandWon(totalSales26S)} 천원
              </span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              vsChange >= 0 ? 'bg-emerald-50' : 'bg-red-50'
            }`}>
              <span className={vsChange >= 0 ? 'text-emerald-600' : 'text-red-600'}>V+:</span>
              <span className={`font-semibold ${vsChange >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {vsChange >= 0 ? '+' : ''}{formatThousandWon(vsChange)} 천원
                ({vsChangeRate >= 0 ? '+' : ''}{vsChangeRate.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* 필터 및 그룹화 옵션 */}
        <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">그룹화:</span>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="channel">채널별</SelectItem>
                <SelectItem value="season">시즌별</SelectItem>
                <SelectItem value="category">카테고리별</SelectItem>
                <SelectItem value="none">그룹 없음</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">채널:</span>
            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {CHANNELS.map((ch) => (
                  <SelectItem key={ch.code} value={ch.code}>{ch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">시즌:</span>
            <Select value={filterSeason} onValueChange={setFilterSeason}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {SEASONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">카테고리:</span>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {ITEM_CATEGORIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              모두 펼치기
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              모두 접기
            </Button>
          </div>
        </div>

        {/* 테이블 */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100">
                <TableHead className="w-12"></TableHead>
                <TableHead className="min-w-[200px]">구분</TableHead>
                <TableHead className="text-right w-36">25S 판매TAG</TableHead>
                <TableHead className="text-right w-28">25S 할인율</TableHead>
                <TableHead className="text-right w-36">25S 실판매</TableHead>
                <TableHead className="text-right w-40">26S 판매TAG (천원)</TableHead>
                <TableHead className="text-right w-28">26S 할인율 (%)</TableHead>
                <TableHead className="text-right w-40">26S 실판매출액 (천원)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedData.map((group) => {
                const isExpanded = expandedGroups.has(group.key) || groupBy === 'none';
                const groupTotal = calculateGroupTotal(group.items);
                const avgDiscountRate = groupTotal.salesTagAmt > 0
                  ? ((1 - groupTotal.actualSalesAmt / groupTotal.salesTagAmt) * 100)
                  : 0;

                return (
                  <Fragment key={group.key}>
                    {/* 그룹 헤더 */}
                    {groupBy !== 'none' && (
                      <TableRow
                        className="bg-slate-50 hover:bg-slate-100 cursor-pointer"
                        onClick={() => toggleGroup(group.key)}
                      >
                        <TableCell className="py-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800">
                          {group.label}
                          <span className="ml-2 text-xs text-slate-500">
                            ({group.items.length}개 항목)
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {formatThousandWon(baselineByChannel[group.key]?.salesTag || 0)}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {(baselineByChannel[group.key]?.discount ?? 0).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {formatThousandWon(baselineByChannel[group.key]?.actual || 0)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700">
                          {formatThousandWon(groupTotal.salesTagAmt)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700">
                          {avgDiscountRate.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right font-medium text-blue-700">
                          {formatThousandWon(groupTotal.actualSalesAmt)}
                        </TableCell>
                      </TableRow>
                    )}

                    {/* 그룹 아이템 */}
                    {isExpanded &&
                      group.items.map((input) => (
                        <TableRow key={input.id} className="hover:bg-blue-50/50">
                          <TableCell></TableCell>
                          <TableCell className="text-sm text-slate-600 pl-8">
                            {getItemLabel(input, groupBy)}
                          </TableCell>
                          <TableCell className="text-right p-1">
                            <Input
                              type="text"
                              value={formatThousandWon(input.salesTagAmt)}
                              onChange={(e) => handleInputChange(input.id, 'salesTagAmt', e.target.value)}
                              className="text-right h-8 w-32 ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right p-1">
                            <Input
                              type="number"
                              value={input.discountRate}
                              onChange={(e) => handleInputChange(input.id, 'discountRate', e.target.value)}
                              className="text-right h-8 w-20 ml-auto"
                              step="0.1"
                              min="0"
                              max="100"
                            />
                          </TableCell>
                          <TableCell className="text-right p-1">
                            <Input
                              type="text"
                              value={formatThousandWon(input.actualSalesAmt)}
                              onChange={(e) => handleInputChange(input.id, 'actualSalesAmt', e.target.value)}
                              className="text-right h-8 w-32 ml-auto text-blue-600 font-medium"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </Fragment>
                );
              })}

              {/* 총계 */}
              <TableRow className="bg-blue-50 font-semibold">
                <TableCell></TableCell>
                <TableCell className="text-blue-800">총계</TableCell>
                <TableCell className="text-right text-slate-700">
                  {formatThousandWon(baselineTotals.salesTag)}
                </TableCell>
                <TableCell className="text-right text-slate-700">
                  {baselineTotals.discount.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right text-slate-700">
                  {formatThousandWon(baselineTotals.actual)}
                </TableCell>
                <TableCell className="text-right text-blue-800">
                  {formatThousandWon(filteredInputs.reduce((s, i) => s + i.salesTagAmt, 0))}
                </TableCell>
                <TableCell className="text-right text-blue-800">
                  {(() => {
                    const totalTag = filteredInputs.reduce((s, i) => s + i.salesTagAmt, 0);
                    const totalActual = filteredInputs.reduce((s, i) => s + i.actualSalesAmt, 0);
                    return totalTag > 0 ? ((1 - totalActual / totalTag) * 100).toFixed(1) : '0.0';
                  })()}%
                </TableCell>
                <TableCell className="text-right text-blue-800">
                  {formatThousandWon(totalSales26S)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

