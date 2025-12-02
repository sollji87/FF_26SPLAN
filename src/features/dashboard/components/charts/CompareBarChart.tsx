'use client';

import { SeasonData } from '../../constants/mockData';
import { SimulationResult } from '../../lib/calc';
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

interface CompareBarChartProps {
  season25S: SeasonData;
  result: SimulationResult;
}

export const CompareBarChart = ({ season25S, result }: CompareBarChartProps) => {
  const chartData = [
    {
      name: '매출',
      '25S': Math.round(season25S.revenue / 10000),
      '26S': Math.round(result.totalRevenue / 10000),
    },
    {
      name: '매출총이익',
      '25S': Math.round(season25S.grossProfit / 10000),
      '26S': Math.round(result.grossProfit / 10000),
    },
    {
      name: '영업이익',
      '25S': Math.round(season25S.operatingProfit / 10000),
      '26S': Math.round(result.operatingProfit / 10000),
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
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
          dataKey="25S"
          fill="#94a3b8"
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        />
        <Bar
          dataKey="26S"
          fill="#8b5cf6"
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};



