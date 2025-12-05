'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  ChannelSummary,
  SeasonSummary,
  ItemCategorySummary,
  formatThousandWon,
  formatMillionWon,
} from '../../types/plan26s';

interface Series {
  label: string; // 시나리오명 또는 25S 실적
  channelData: ChannelSummary[];
  seasonData: SeasonSummary[];
  itemCategoryData: ItemCategorySummary[];
}

interface ChannelCompareChartProps {
  series: Series[];
  excludePurchase?: boolean;
}

interface SeasonCompareChartProps {
  series: Series[];
  showDetails?: boolean;
  onToggleDetails?: (value: boolean) => void;
}

interface ItemCategoryCompareChartProps {
  series: Series[];
}

const COLORS = [
  '#94a3b8', // baseline
  '#3b82f6',
  '#22c55e',
  '#f97316',
  '#a855f7',
  '#0ea5e9',
];

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
      <p className="font-semibold text-slate-800 mb-2">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-medium">{formatThousandWon(entry.value)} 천원</span>
        </div>
      ))}
    </div>
  );
};

export const ChannelCompareChart = ({ series, excludePurchase }: ChannelCompareChartProps) => {
  // 채널 목록
  const channelNames = useMemo(() => {
    const set = new Set<string>();
    series.forEach((s) => s.channelData.forEach((c) => set.add(c.channelName)));
    return Array.from(set);
  }, [series]);

  const chartData = useMemo(() => {
    return channelNames.map((name) => {
      const row: any = { name };
      series.forEach((s) => {
        const found = s.channelData.find((c) => c.channelName === name);
        row[s.label] = found ? found.sales26S || found.sales25S || 0 : 0;
      });
      return row;
    });
  }, [channelNames, series]);

  const totals = useMemo(() => {
    return series.map((s) => ({
      label: s.label,
      total: s.channelData.reduce((sum, d) => sum + (d.sales26S || d.sales25S || 0), 0),
    }));
  }, [series]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full" />
            채널별 매출 비교
          </span>
          <span className="text-sm font-normal text-slate-600">
            {totals.map((t, idx) => (
              <span key={t.label} className="inline-flex items-center gap-1 mr-3">
                <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                {t.label}: {formatMillionWon(t.total)}백만원
              </span>
            ))}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(value) => (value / 1000).toLocaleString('ko-KR')}
                label={{ value: '(백만원)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {series.map((s, idx) => (
                <Bar
                  key={s.label}
                  dataKey={s.label}
                  fill={COLORS[idx % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 채널별 증감 요약: 첫 번째 시리즈와 두 번째(있다면) 비교 */}
        {series.length >= 2 && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4 pt-4 border-t">
            {series[0].channelData.map((base) => {
              const target = series[1].channelData.find((c) => c.channelCode === base.channelCode);
              const change = target ? target.sales26S - (base.sales25S || 0) : 0;
              const changeRate = base.sales25S > 0 ? (change / base.sales25S) * 100 : change > 0 ? 100 : 0;
              return (
                <div
                  key={base.channelCode}
                  className="text-center p-2 rounded-lg bg-slate-50"
                >
                  <p className="text-xs text-slate-500">{base.channelName}</p>
                  <p className={`text-sm font-semibold ${
                    change >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {change >= 0 ? '+' : ''}{changeRate.toFixed(1)}%
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const SeasonCompareChart = ({ series, showDetails = true, onToggleDetails }: SeasonCompareChartProps) => {
  const seasonNames = useMemo(() => {
    const set = new Set<string>();
    series.forEach((s) => s.seasonData.forEach((c) => set.add(c.seasonName)));
    return Array.from(set);
  }, [series]);

  const chartData = useMemo(() => {
    return seasonNames.map((name) => {
      const row: any = { name };
      series.forEach((s) => {
        const found = s.seasonData.find((c) => c.seasonName === name);
        row[s.label] = found ? found.sales26S || found.sales25S || 0 : 0;
      });
      return row;
    });
  }, [seasonNames, series]);

  return (
    <Card>
      <CardHeader className="pb-2 flex items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full" />
          시즌별 매출 비교
        </CardTitle>
        {onToggleDetails && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>금액 표시</span>
            <Switch checked={showDetails} onCheckedChange={onToggleDetails} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(value) => (value / 1000).toLocaleString('ko-KR')}
                label={{ value: '(백만원)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {series.map((s, idx) => (
                <Bar
                  key={s.label}
                  dataKey={s.label}
                  fill={COLORS[idx % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={80}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
            {seasonNames.map((name) => {
              const s0 = series[0]?.seasonData.find((s) => s.seasonName === name);
              const totalPlan = series
                .slice(1)
                .reduce((sum, s) => {
                  const f = s.seasonData.find((v) => v.seasonName === name);
                  return sum + (f?.sales26S || 0);
                }, 0);
              const base = s0?.sales25S || 0;
              return (
                <div key={name} className="p-2 rounded bg-slate-50 border border-slate-100">
                  <p className="text-slate-600 font-semibold">{name}</p>
                  <p className="text-slate-500">25S 실적: {formatMillionWon(base)}백만원</p>
                  <p className="text-blue-600 font-semibold">계획: {formatMillionWon(totalPlan)}백만원</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const ItemCategoryCompareChart = ({ series }: ItemCategoryCompareChartProps) => {
  const catNames = useMemo(() => {
    const set = new Set<string>();
    series.forEach((s) => s.itemCategoryData.forEach((c) => set.add(c.categoryName)));
    return Array.from(set);
  }, [series]);

  const chartData = useMemo(() => {
    return catNames.map((name) => {
      const row: any = { name };
      series.forEach((s) => {
        const found = s.itemCategoryData.find((c) => c.categoryName === name);
        row[s.label] = found ? found.sales26S || found.sales25S || 0 : 0;
      });
      return row;
    });
  }, [catNames, series]);

  const total26S = series.reduce(
    (sum, s) => sum + s.itemCategoryData.reduce((acc, d) => acc + (d.sales26S || d.sales25S || 0), 0),
    0
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-teal-500 to-cyan-600 rounded-full" />
            아이템별 매출 비교
          </span>
          <span className="text-sm font-normal text-slate-600">
            총 {formatMillionWon(total26S)}백만원
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis 
                type="number"
                tick={{ fontSize: 12 }} 
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(value) => (value / 1000).toLocaleString('ko-KR')}
                label={{ value: '백만원', position: 'insideBottomRight', offset: -8, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#cbd5e1' }}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {series.map((s, idx) => (
                <Bar
                  key={s.label}
                  dataKey={s.label}
                  fill={COLORS[idx % COLORS.length]}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={30}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 카테고리별 비중 */}
        <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t">
          {chartData.map((category) => {
            const ratio = total26S > 0 ? (category[series[0].label] / total26S) * 100 : 0;
            return (
              <div
                key={category.name}
                className="text-center p-2 rounded-lg bg-slate-50"
              >
                <p className="text-xs text-slate-500">{category.name}</p>
                <p className="text-sm font-semibold text-blue-600">
                  {ratio.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400">
                  {formatMillionWon(category[series[0].label] || 0)}M
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

interface SalesCompareChartsProps {
  series: Series[];
  excludePurchase?: boolean; // 사입 제외
  showSeasonDetails?: boolean;
  onToggleSeasonDetails?: (value: boolean) => void;
}

export const SalesCompareCharts = ({
  series,
  excludePurchase = false,
  showSeasonDetails = true,
  onToggleSeasonDetails,
}: SalesCompareChartsProps) => {
  return (
    <div className="space-y-6">
      <ChannelCompareChart
        series={
          excludePurchase
            ? series.map((s) => ({
                ...s,
                channelData: s.channelData.filter((c) => c.channelCode !== 'WHOLE'),
              }))
            : series
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SeasonCompareChart
          series={series}
          showDetails={showSeasonDetails}
          onToggleDetails={onToggleSeasonDetails}
        />
        <ItemCategoryCompareChart series={series} />
      </div>
    </div>
  );
};

