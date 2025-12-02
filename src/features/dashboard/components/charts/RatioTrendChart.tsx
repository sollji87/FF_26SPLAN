'use client';

import { Card } from '@/components/ui/card';
import { SeasonData } from '../../constants/mockData';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RatioTrendChartProps {
  seasons: SeasonData[];
}

export const RatioTrendChart = ({ seasons }: RatioTrendChartProps) => {
  const chartData = seasons.map((season) => ({
    name: season.season,
    매출총이익률: Number(season.grossProfitRate.toFixed(1)),
    영업이익률: Number(season.operatingProfitRate.toFixed(1)),
    원가율: Number(season.costRate.toFixed(1)),
    할인율: Number(season.discountRate.toFixed(1)),
  }));

  return (
    <Card className="p-6">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 'auto']}
          />
          <Tooltip
            formatter={(value: number) => [`${value}%`, '']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="매출총이익률"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 5, fill: '#3b82f6' }}
            activeDot={{ r: 7 }}
          />
          <Line
            type="monotone"
            dataKey="영업이익률"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 5, fill: '#10b981' }}
            activeDot={{ r: 7 }}
          />
          <Line
            type="monotone"
            dataKey="원가율"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 5, fill: '#f59e0b' }}
            activeDot={{ r: 7 }}
          />
          <Line
            type="monotone"
            dataKey="할인율"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 5, fill: '#ef4444' }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};



