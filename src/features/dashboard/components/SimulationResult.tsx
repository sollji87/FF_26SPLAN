'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Brand } from '../constants/brands';
import { SeasonData, formatCurrency, formatPercent } from '../constants/mockData';
import { SimulationResult as SimulationResultType, compare25Svs26S } from '../lib/calc';
import { CompareBarChart } from './charts/CompareBarChart';
import { CostDonutChart } from './charts/CostDonutChart';
import { ChannelRevenueChart } from './charts/ChannelRevenueChart';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SimulationResultProps {
  brand: Brand;
  season25S: SeasonData;
  result: SimulationResultType;
}

export const SimulationResult = ({
  brand,
  season25S,
  result,
}: SimulationResultProps) => {
  const comparison = compare25Svs26S(season25S, result);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="26S 매출"
          value={formatCurrency(result.totalRevenue)}
          change={comparison.find((c) => c.metric === '매출')?.changeRate ?? 0}
        />
        <MetricCard
          label="26S 매출총이익"
          value={formatCurrency(result.grossProfit)}
          subValue={`GP율 ${formatPercent(result.grossProfitRate)}`}
          change={comparison.find((c) => c.metric === '매출총이익')?.changeRate ?? 0}
        />
        <MetricCard
          label="26S 영업이익"
          value={formatCurrency(result.operatingProfit)}
          subValue={`OP율 ${formatPercent(result.operatingProfitRate)}`}
          change={comparison.find((c) => c.metric === '영업이익')?.changeRate ?? 0}
          highlight
        />
        <MetricCard
          label="26S 원가"
          value={formatCurrency(result.totalCogs)}
          subValue={`원가율 ${formatPercent((result.totalCogs / result.totalRevenue) * 100)}`}
          change={comparison.find((c) => c.metric === '매출원가')?.changeRate ?? 0}
          inverse
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-slate-800 mb-4">25S vs 26S 손익 비교</h3>
            <CompareBarChart season25S={season25S} result={result} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-slate-800 mb-4">26S 비용 구성</h3>
            <CostDonutChart result={result} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-slate-800 mb-4">채널별 매출 계획</h3>
          <ChannelRevenueChart channelRevenues={result.channelRevenues} />
        </CardContent>
      </Card>

      <Card className="bg-slate-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-slate-800 mb-4">상세 비교 테이블</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold">항목</th>
                  <th className="text-right py-3 px-4 font-semibold">25S</th>
                  <th className="text-right py-3 px-4 font-semibold">26S (계획)</th>
                  <th className="text-right py-3 px-4 font-semibold">증감</th>
                  <th className="text-right py-3 px-4 font-semibold">증감률</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.metric} className="border-b border-slate-100">
                    <td className="py-3 px-4 font-medium">{row.metric}</td>
                    <td className="text-right py-3 px-4">
                      {formatCurrency(row.value25S)}
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-blue-600">
                      {formatCurrency(row.value26S)}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span
                        className={
                          row.change > 0
                            ? 'text-emerald-600'
                            : row.change < 0
                              ? 'text-red-600'
                              : 'text-slate-500'
                        }
                      >
                        {row.change > 0 ? '+' : ''}
                        {formatCurrency(row.change)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span
                        className={
                          row.changeRate > 0
                            ? 'text-emerald-600'
                            : row.changeRate < 0
                              ? 'text-red-600'
                              : 'text-slate-500'
                        }
                      >
                        {row.changeRate > 0 ? '+' : ''}
                        {row.changeRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  change: number;
  highlight?: boolean;
  inverse?: boolean;
}

function MetricCard({
  label,
  value,
  subValue,
  change,
  highlight,
  inverse,
}: MetricCardProps) {
  const isPositive = inverse ? change < 0 : change > 0;
  const isNegative = inverse ? change > 0 : change < 0;

  return (
    <Card className={highlight ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200' : ''}>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className={`text-xl font-bold ${highlight ? 'text-purple-700' : 'text-slate-900'}`}>
          {value}
        </p>
        {subValue && (
          <p className="text-xs text-slate-400 mt-1">{subValue}</p>
        )}
        <div className="mt-2 flex items-center gap-1">
          {Math.abs(change) < 0.5 ? (
            <>
              <Minus className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">변동 없음</span>
            </>
          ) : isPositive ? (
            <>
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-xs text-emerald-600">+{change.toFixed(1)}%</span>
            </>
          ) : isNegative ? (
            <>
              <TrendingDown className="w-3 h-3 text-red-500" />
              <span className="text-xs text-red-600">{change.toFixed(1)}%</span>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}



