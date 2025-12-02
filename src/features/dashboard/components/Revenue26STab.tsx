'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandMockData } from '../constants/mockData';
import { Brand } from '../constants/brands';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { ScenarioManager } from './ScenarioManager';
import { ScenarioData } from '../hooks/useScenarios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Revenue26STabProps {
  brand: Brand;
  data: BrandMockData;
}

export const Revenue26STab = ({ brand, data }: Revenue26STabProps) => {
  const [channelRevenues, setChannelRevenues] = useState(
    data.channels.map((ch) => ({
      ...ch,
      revenue26S: ch.revenue25S * 1.05,
      growthRate: 5,
    }))
  );

  const totalRevenue25S = data.channels.reduce((sum, ch) => sum + ch.revenue25S, 0);
  const totalRevenue26S = channelRevenues.reduce((sum, ch) => sum + ch.revenue26S, 0);
  const totalGrowthRate = ((totalRevenue26S - totalRevenue25S) / totalRevenue25S) * 100;

  const updateChannelRevenue = (channel: string, value: number) => {
    setChannelRevenues((prev) =>
      prev.map((ch) =>
        ch.channel === channel
          ? {
              ...ch,
              revenue26S: value,
              growthRate: ((value - ch.revenue25S) / ch.revenue25S) * 100,
            }
          : ch
      )
    );
  };

  const chartData = channelRevenues.map((ch) => ({
    name: ch.channelKo,
    '25S': Math.round(ch.revenue25S / 10000),
    '26S': Math.round(ch.revenue26S / 10000),
  }));

  const handleLoadScenario = (scenario: ScenarioData) => {
    if (scenario.revenue && scenario.revenue.channelRevenues) {
      setChannelRevenues(scenario.revenue.channelRevenues);
    }
  };

  const currentScenarioData: Partial<ScenarioData> = {
    revenue: {
      channelRevenues,
      totalRevenue: totalRevenue26S,
    },
  };

  return (
    <div className="space-y-6">
      <ScenarioManager
        brandId={brand.id}
        currentData={currentScenarioData}
        onLoadScenario={handleLoadScenario}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">25S 총 매출</div>
            <div className="text-2xl font-bold text-slate-900">
              {(totalRevenue25S / 10000).toFixed(1)}억
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">26S 목표 매출</div>
            <div className="text-2xl font-bold text-blue-600">
              {(totalRevenue26S / 10000).toFixed(1)}억
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">성장률</div>
            <div className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {totalGrowthRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>채널별 매출 계획</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {channelRevenues.map((ch) => (
              <div key={ch.channel} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div>
                  <Label className="font-medium">{ch.channelKo}</Label>
                  <p className="text-xs text-slate-400">
                    25S: {(ch.revenue25S / 10000).toFixed(1)}억
                  </p>
                </div>
                <div>
                  <Label htmlFor={`revenue-${ch.channel}`} className="text-sm">
                    26S 목표 매출 (백만원)
                  </Label>
                  <Input
                    id={`revenue-${ch.channel}`}
                    type="number"
                    value={ch.revenue26S}
                    onChange={(e) => updateChannelRevenue(ch.channel, Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <div className="text-sm text-slate-500">증감액</div>
                  <div
                    className={`text-lg font-semibold ${
                      ch.revenue26S > ch.revenue25S ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {ch.revenue26S > ch.revenue25S ? '+' : ''}
                    {((ch.revenue26S - ch.revenue25S) / 10000).toFixed(1)}억
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">성장률</div>
                  <div
                    className={`text-lg font-semibold ${
                      ch.growthRate > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {ch.growthRate > 0 ? '+' : ''}
                    {ch.growthRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>채널별 매출 비교</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend />
              <Bar dataKey="25S" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={60} />
              <Bar dataKey="26S" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

