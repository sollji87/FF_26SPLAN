'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandMockData } from '../constants/mockData';
import { Brand } from '../constants/brands';
import { FileText, TrendingUp, GitCompare } from 'lucide-react';
import { useScenarios } from '../hooks/useScenarios';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { Label } from '@/components/ui/label';

interface PnL26STabProps {
  brand: Brand;
  data: BrandMockData;
}

export const PnL26STab = ({ brand, data }: PnL26STabProps) => {
  const season25S = data.seasons.find((s) => s.season === '25S');
  const { getScenarios } = useScenarios();
  const scenarios = getScenarios(brand.id);
  
  const [compareScenarios, setCompareScenarios] = useState<string[]>([]);

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

  const getScenarioComparison = () => {
    if (compareScenarios.length === 0) return [];
    
    return compareScenarios.map((scenarioId) => {
      const scenario = scenarios.find((s) => s.id === scenarioId);
      if (!scenario) return null;

      const revenue = scenario.revenue.totalRevenue;
      const cogs = revenue / (scenario.markup.targetMU / 100);
      const gp = revenue - cogs;
      const ad = scenario.adExpense.totalAmount;
      const hr = scenario.headcount.totalHeadcount * scenario.headcount.avgSalary;
      const op = gp - ad - hr;

      return {
        name: scenario.name,
        매출: Math.round(revenue / 10000),
        매출총이익: Math.round(gp / 10000),
        영업이익: Math.round(op / 10000),
        영업이익률: ((op / revenue) * 100).toFixed(1),
      };
    }).filter(Boolean);
  };

  const scenarioComparisonData = getScenarioComparison();

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <FileText className="w-5 h-5" />
            26S 손익계획 요약
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

      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <GitCompare className="w-5 h-5" />
            시나리오 비교 분석
          </CardTitle>
          <p className="text-sm text-blue-700 mt-2">
            {scenarios.length > 0
              ? '저장된 시나리오를 선택하여 비교 분석하세요'
              : '시나리오를 저장하려면 각 탭(매출, 발주, M/U 등)에서 데이터를 입력하고 "저장" 버튼을 클릭하세요'}
          </p>
        </CardHeader>
        <CardContent>
          {scenarios.length === 0 ? (
            <div className="text-center py-12">
              <GitCompare className="w-16 h-16 mx-auto mb-4 text-blue-300" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                저장된 시나리오가 없습니다
              </h3>
              <p className="text-sm text-blue-700 mb-6 max-w-md mx-auto">
                각 탭에서 26S 사업계획 데이터를 입력한 후 시나리오로 저장하면
                <br />
                여기서 여러 시나리오를 비교 분석할 수 있습니다.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-lg text-sm text-blue-800">
                💡 팁: "26S 매출" 탭부터 시작해보세요
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => (
                  <div key={index}>
                    <Label className="text-blue-900">시나리오 {index + 1}</Label>
                    <Select
                      value={compareScenarios[index] || ''}
                      onValueChange={(value) => {
                        const newCompare = [...compareScenarios];
                        if (value === '') {
                          newCompare.splice(index, 1);
                        } else {
                          newCompare[index] = value;
                        }
                        setCompareScenarios(newCompare);
                      }}
                    >
                      <SelectTrigger className="mt-2 bg-white">
                        <SelectValue placeholder="선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">선택 안함</SelectItem>
                        {scenarios.map((scenario) => (
                          <SelectItem key={scenario.id} value={scenario.id}>
                            {scenario.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {scenarioComparisonData.length > 0 && (
                <>
                  <div className="mt-6 bg-white rounded-xl p-4">
                    <h4 className="font-semibold text-slate-900 mb-4">시나리오별 손익 비교 차트</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={scenarioComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="name"
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
                        <Bar dataKey="매출" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="매출총이익" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="영업이익" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto bg-white rounded-xl p-4">
                    <h4 className="font-semibold text-slate-900 mb-4">시나리오별 주요 지표 비교</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-200 bg-slate-50">
                          <th className="text-left py-3 px-4 font-semibold">시나리오</th>
                          <th className="text-right py-3 px-4 font-semibold">매출</th>
                          <th className="text-right py-3 px-4 font-semibold">매출총이익</th>
                          <th className="text-right py-3 px-4 font-semibold">영업이익</th>
                          <th className="text-right py-3 px-4 font-semibold">영업이익률</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenarioComparisonData.map((scenario: any, index) => (
                          <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 font-semibold text-blue-900">{scenario.name}</td>
                            <td className="text-right py-3 px-4 font-medium">{scenario.매출}억</td>
                            <td className="text-right py-3 px-4 font-medium text-blue-600">{scenario.매출총이익}억</td>
                            <td className="text-right py-3 px-4 font-medium text-emerald-600">{scenario.영업이익}억</td>
                            <td className="text-right py-3 px-4 font-semibold text-purple-600">{scenario.영업이익률}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
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

