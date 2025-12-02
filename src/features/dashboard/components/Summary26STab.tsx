'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandMockData } from '../constants/mockData';
import { Brand } from '../constants/brands';
import { FileText, TrendingUp, TrendingDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface Summary26STabProps {
  brand: Brand;
  data: BrandMockData;
}

export const Summary26STab = ({ brand, data }: Summary26STabProps) => {
  const season25S = data.seasons.find((s) => s.season === '25S');
  
  const revenue26S = 1029000;
  const cogs26S = 370000;
  const gp26S = revenue26S - cogs26S;
  const adExpense26S = 50000;
  const hrCost26S = 60000;
  const op26S = gp26S - adExpense26S - hrCost26S;

  const gpRate26S = (gp26S / revenue26S) * 100;
  const opRate26S = (op26S / revenue26S) * 100;

  const revenueGrowth = season25S ? ((revenue26S - season25S.revenue) / season25S.revenue) * 100 : 0;
  const opGrowth = season25S ? ((op26S - season25S.operatingProfit) / season25S.operatingProfit) * 100 : 0;

  const comparisonData = [
    {
      metric: '매출',
      '25S': season25S ? Math.round(season25S.revenue / 10000) : 0,
      '26S': Math.round(revenue26S / 10000),
    },
    {
      metric: '매출총이익',
      '25S': season25S ? Math.round(season25S.grossProfit / 10000) : 0,
      '26S': Math.round(gp26S / 10000),
    },
    {
      metric: '영업이익',
      '25S': season25S ? Math.round(season25S.operatingProfit / 10000) : 0,
      '26S': Math.round(op26S / 10000),
    },
  ];

  const trendData = [
    { season: '23S', revenue: 85, op: 32 },
    { season: '24S', revenue: 92, op: 37 },
    { season: '25S', revenue: 98, op: 41 },
    { season: '26S(계획)', revenue: 102.9, op: 54.9 },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <FileText className="w-5 h-5" />
            26S 사업계획 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="text-sm text-slate-500 mb-1">목표 매출</div>
              <div className="text-2xl font-bold text-slate-900">
                {(revenue26S / 10000).toFixed(1)}억
              </div>
              <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +{revenueGrowth.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-sm text-slate-500 mb-1">매출총이익</div>
              <div className="text-2xl font-bold text-blue-600">
                {(gp26S / 10000).toFixed(1)}억
              </div>
              <div className="text-xs text-slate-500 mt-1">GP율 {gpRate26S.toFixed(1)}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-sm text-slate-500 mb-1">영업이익</div>
              <div className="text-2xl font-bold text-emerald-600">
                {(op26S / 10000).toFixed(1)}억
              </div>
              <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +{opGrowth.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-sm text-slate-500 mb-1">영업이익률</div>
              <div className="text-2xl font-bold text-purple-600">{opRate26S.toFixed(1)}%</div>
              <div className="text-xs text-slate-500 mt-1">
                25S 대비 +{(opRate26S - (season25S?.operatingProfitRate || 0)).toFixed(1)}%p
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>25S vs 26S 비교</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="metric"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(value) => `${value}억`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}억`, '']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="25S" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="26S" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>시즌별 트렌드</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="season"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(value) => `${value}억`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}억`, '']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="매출"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="op"
                  name="영업이익"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>주요 지표 상세</CardTitle>
        </CardHeader>
        <CardContent>
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
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium">매출</td>
                  <td className="text-right py-3 px-4">{season25S ? (season25S.revenue / 10000).toFixed(1) : 0}억</td>
                  <td className="text-right py-3 px-4 font-medium text-blue-600">{(revenue26S / 10000).toFixed(1)}억</td>
                  <td className="text-right py-3 px-4 text-emerald-600">+{season25S ? ((revenue26S - season25S.revenue) / 10000).toFixed(1) : 0}억</td>
                  <td className="text-right py-3 px-4 text-emerald-600">+{revenueGrowth.toFixed(1)}%</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium">매출원가</td>
                  <td className="text-right py-3 px-4">{season25S ? (season25S.cogs / 10000).toFixed(1) : 0}억</td>
                  <td className="text-right py-3 px-4 font-medium">{(cogs26S / 10000).toFixed(1)}억</td>
                  <td className="text-right py-3 px-4">{season25S ? ((cogs26S - season25S.cogs) / 10000).toFixed(1) : 0}억</td>
                  <td className="text-right py-3 px-4">{season25S ? (((cogs26S - season25S.cogs) / season25S.cogs) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="border-b border-slate-100 bg-blue-50">
                  <td className="py-3 px-4 font-medium">매출총이익</td>
                  <td className="text-right py-3 px-4">{season25S ? (season25S.grossProfit / 10000).toFixed(1) : 0}억</td>
                  <td className="text-right py-3 px-4 font-medium text-blue-600">{(gp26S / 10000).toFixed(1)}억</td>
                  <td className="text-right py-3 px-4 text-emerald-600">+{season25S ? ((gp26S - season25S.grossProfit) / 10000).toFixed(1) : 0}억</td>
                  <td className="text-right py-3 px-4 text-emerald-600">+{season25S ? (((gp26S - season25S.grossProfit) / season25S.grossProfit) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium">광고선전비</td>
                  <td className="text-right py-3 px-4">{season25S ? (season25S.adExpense / 10000).toFixed(1) : 0}억</td>
                  <td className="text-right py-3 px-4 font-medium">{(adExpense26S / 10000).toFixed(1)}억</td>
                  <td className="text-right py-3 px-4">{season25S ? ((adExpense26S - season25S.adExpense) / 10000).toFixed(1) : 0}억</td>
                  <td className="text-right py-3 px-4">{season25S ? (((adExpense26S - season25S.adExpense) / season25S.adExpense) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium">인건비</td>
                  <td className="text-right py-3 px-4">{season25S ? (season25S.hrCost / 10000).toFixed(1) : 0}억</td>
                  <td className="text-right py-3 px-4 font-medium">{(hrCost26S / 10000).toFixed(1)}억</td>
                  <td className="text-right py-3 px-4 text-red-600">{season25S ? ((hrCost26S - season25S.hrCost) / 10000).toFixed(1) : 0}억</td>
                  <td className="text-right py-3 px-4 text-red-600">{season25S ? (((hrCost26S - season25S.hrCost) / season25S.hrCost) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="bg-emerald-50">
                  <td className="py-3 px-4 font-medium">영업이익</td>
                  <td className="text-right py-3 px-4">{season25S ? (season25S.operatingProfit / 10000).toFixed(1) : 0}억</td>
                  <td className="text-right py-3 px-4 font-medium text-emerald-600">{(op26S / 10000).toFixed(1)}억</td>
                  <td className="text-right py-3 px-4 text-emerald-600">+{season25S ? ((op26S - season25S.operatingProfit) / 10000).toFixed(1) : 0}억</td>
                  <td className="text-right py-3 px-4 text-emerald-600">+{opGrowth.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

