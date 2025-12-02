'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandMockData } from '../constants/mockData';
import { Brand } from '../constants/brands';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface AdExpense26STabProps {
  brand: Brand;
  data: BrandMockData;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const AdExpense26STab = ({ brand, data }: AdExpense26STabProps) => {
  const [totalAdExpense, setTotalAdExpense] = useState(50000);
  const [adChannels, setAdChannels] = useState([
    { channel: 'digital', channelKo: '디지털 광고', amount: 20000, ratio: 40 },
    { channel: 'tv', channelKo: 'TV/영상', amount: 15000, ratio: 30 },
    { channel: 'outdoor', channelKo: '옥외광고', amount: 8000, ratio: 16 },
    { channel: 'print', channelKo: '인쇄매체', amount: 5000, ratio: 10 },
    { channel: 'event', channelKo: '이벤트/프로모션', amount: 2000, ratio: 4 },
  ]);

  const totalChannelAmount = adChannels.reduce((sum, ch) => sum + ch.amount, 0);
  const season25S = data.seasons.find((s) => s.season === '25S');
  const adRatio = season25S ? (totalAdExpense / season25S.revenue) * 100 : 0;

  const updateChannelAmount = (channel: string, value: number) => {
    setAdChannels((prev) =>
      prev.map((ch) =>
        ch.channel === channel
          ? {
              ...ch,
              amount: value,
              ratio: (value / totalChannelAmount) * 100,
            }
          : ch
      )
    );
  };

  const chartData = adChannels.map((ch) => ({
    name: ch.channelKo,
    value: ch.amount,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">총 광고선전비</div>
            <div className="text-3xl font-bold text-slate-900">
              {(totalAdExpense / 10000).toFixed(1)}억
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">매출 대비 비율</div>
            <div className="text-3xl font-bold text-orange-600">{adRatio.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">채널별 합계</div>
            <div className="text-3xl font-bold text-blue-600">
              {(totalChannelAmount / 10000).toFixed(1)}억
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            총 광고선전비 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label htmlFor="total-ad">26S 총 광고선전비 (백만원)</Label>
            <Input
              id="total-ad"
              type="number"
              value={totalAdExpense}
              onChange={(e) => setTotalAdExpense(Number(e.target.value))}
              className="mt-2 text-lg"
            />
            <p className="text-sm text-slate-500 mt-2">
              25S 매출 기준 약 {adRatio.toFixed(1)}% 수준입니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>채널별 광고비 계획</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {adChannels.map((ch) => (
                <div key={ch.channel} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-medium">{ch.channelKo}</Label>
                    <span className="text-sm text-slate-500">
                      {((ch.amount / totalChannelAmount) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={ch.amount}
                    onChange={(e) => updateChannelAmount(ch.channel, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>광고비 구성</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${(value / 10000).toFixed(1)}억`, '']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Megaphone className="w-6 h-6 text-purple-600 mt-1" />
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">광고비 계획 가이드</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• 일반적으로 매출의 8-12% 수준이 적정합니다</li>
                <li>• 디지털 광고의 비중을 높이면 효율적인 집행이 가능합니다</li>
                <li>• 시즌 초반 집중 투자로 브랜드 인지도를 높이세요</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

