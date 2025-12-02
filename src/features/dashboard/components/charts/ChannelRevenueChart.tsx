'use client';

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

interface ChannelRevenue {
  channel: string;
  channelKo: string;
  revenue25S: number;
  revenue26S: number;
  growthRate: number;
}

interface ChannelRevenueChartProps {
  channelRevenues: ChannelRevenue[];
}

export const ChannelRevenueChart = ({ channelRevenues }: ChannelRevenueChartProps) => {
  const chartData = channelRevenues.map((ch) => ({
    name: ch.channelKo,
    '25S': Math.round(ch.revenue25S / 10000),
    '26S': Math.round(ch.revenue26S / 10000),
    성장률: ch.growthRate,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          type="number"
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={{ stroke: '#cbd5e1' }}
          tickFormatter={(value) => `${value}억`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={{ stroke: '#cbd5e1' }}
          width={60}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === '성장률') return [`${value}%`, name];
            return [`${value}억`, name];
          }}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Legend />
        <Bar dataKey="25S" fill="#94a3b8" radius={[0, 4, 4, 0]} maxBarSize={25} />
        <Bar dataKey="26S" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={25} />
      </BarChart>
    </ResponsiveContainer>
  );
};



