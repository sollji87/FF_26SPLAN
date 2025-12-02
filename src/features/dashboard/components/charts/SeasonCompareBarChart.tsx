'use client';

import { Card } from '@/components/ui/card';
import { SeasonData } from '../../constants/mockData';
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

interface SeasonCompareBarChartProps {
  seasons: SeasonData[];
}

export const SeasonCompareBarChart = ({ seasons }: SeasonCompareBarChartProps) => {
  const chartData = seasons.map((season) => ({
    name: season.season,
    매출: Math.round(season.revenue / 10000),
    영업이익: Math.round(season.operatingProfit / 10000),
  }));

  return (
    <Card className="p-6">
      <ResponsiveContainer width="100%" height={300}>
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
          <Bar
            dataKey="매출"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
          <Bar
            dataKey="영업이익"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};



