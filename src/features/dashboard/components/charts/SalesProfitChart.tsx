'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SalesProfitChartProps {
  vatExcSalesData?: {
    '23S'?: { total: number };
    '24S'?: { total: number };
    '25S'?: { total: number };
  };
  costOfSalesData?: {
    '23S'?: { cogsTotal: number };
    '24S'?: { cogsTotal: number };
    '25S'?: { cogsTotal: number };
  };
  directCostData?: {
    '23S'?: { totals: { DIRECT_COST_TOTAL: number } };
    '24S'?: { totals: { DIRECT_COST_TOTAL: number } };
    '25S'?: { totals: { DIRECT_COST_TOTAL: number } };
  };
  operatingExpenseData?: {
    '23S'?: { total: { amt: number } };
    '24S'?: { total: { amt: number } };
    '25S'?: { total: { amt: number } };
  };
  salesTagData?: {
    '23S'?: { channels: Array<{ CHNL_NM: string }> };
    '24S'?: { channels: Array<{ CHNL_NM: string }> };
    '25S'?: { channels: Array<{ CHNL_NM: string }> };
  };
  endStockDetails?: {
    '23S'?: Array<{ ITEM_STD: string; CY_END_STOCK_TAG_AMT: number }>;
    '24S'?: Array<{ ITEM_STD: string; CY_END_STOCK_TAG_AMT: number }>;
    '25S'?: Array<{ ITEM_STD: string; CY_END_STOCK_TAG_AMT: number }>;
  };
  directCostDataByChannel?: {
    '23S'?: { channels: Array<{ CHNL_NM: string; DIRECT_COST_TOTAL: number }> };
    '24S'?: { channels: Array<{ CHNL_NM: string; DIRECT_COST_TOTAL: number }> };
    '25S'?: { channels: Array<{ CHNL_NM: string; DIRECT_COST_TOTAL: number }> };
  };
}

const ITEM_CATEGORIES = [
  { key: '23S 의류', label: '23S의류(당시즌)' },
  { key: '과시즌 의류', label: '과시즌의류' },
  { key: '신발', label: '신발' },
  { key: '가방', label: '가방' },
  { key: '모자', label: '모자' },
  { key: '기타ACC', label: '기타 ACC' },
];

export const SalesProfitChart = ({
  vatExcSalesData,
  costOfSalesData,
  directCostData,
  operatingExpenseData,
  salesTagData,
  endStockDetails,
  directCostDataByChannel,
}: SalesProfitChartProps) => {
  const [selectedChannel, setSelectedChannel] = useState<string>('전체');

  // 채널 목록 생성
  const allChannels = new Set<string>();
  ['23S', '24S', '25S'].forEach((season) => {
    const channels = salesTagData?.[season as '23S' | '24S' | '25S']?.channels;
    channels?.forEach((ch) => allChannels.add(ch.CHNL_NM));
  });
  const channelList = ['전체', ...Array.from(allChannels).sort()];

  // 시즌별 데이터 계산
  const chartData = ['23S', '24S', '25S'].map((season) => {
    const seasonKey = season as '23S' | '24S' | '25S';
    
    // 매출액 (부가세차감(출고)매출)
    const sales = (vatExcSalesData?.[seasonKey]?.total ?? 0) / 1000000; // 백만원 단위
    
    // 매출원가 소계
    const cogsTotal = (costOfSalesData?.[seasonKey]?.cogsTotal ?? 0) / 1000000;
    
    // 매출총이익
    const grossProfit = sales - cogsTotal;
    
    // 직접비
    const directCost = (directCostData?.[seasonKey]?.totals?.DIRECT_COST_TOTAL ?? 0);
    
    // 직접이익
    const directProfit = grossProfit - directCost;
    
    // 영업비 합계
    const opExpense = (operatingExpenseData?.[seasonKey]?.total?.amt ?? 0);
    
    // 영업이익
    const operatingProfit = directProfit - opExpense;
    
    // 영업이익률 (%)
    const operatingProfitRate = sales > 0 ? (operatingProfit / sales) * 100 : 0;

    // 채널별 직접이익 계산
    let channelDirectProfit = directProfit;
    if (selectedChannel !== '전체' && directCostDataByChannel) {
      const channelData = directCostDataByChannel[seasonKey]?.channels?.find(
        (ch) => ch.CHNL_NM === selectedChannel
      );
      if (channelData) {
        // 채널별 직접비를 빼야 하는데, 채널별 매출총이익이 필요함
        // 일단 전체 직접이익에서 채널별 직접비 비율을 적용하는 방식으로 근사치 계산
        const channelDirectCost = channelData.DIRECT_COST_TOTAL;
        const totalDirectCost = directCost;
        if (totalDirectCost > 0) {
          const channelRatio = channelDirectCost / totalDirectCost;
          channelDirectProfit = grossProfit * channelRatio - channelDirectCost;
        }
      }
    }

    return {
      name: season,
      매출액: Math.round(sales * 10) / 10, // 억원 단위로 변환
      영업이익: Math.round(operatingProfit * 10) / 10,
      영업이익률: Math.round(operatingProfitRate * 10) / 10,
      직접이익: Math.round(channelDirectProfit * 10) / 10,
    };
  });

  // 아이템별 직접이익 데이터 (채널 선택 시)
  const itemDirectProfitData = selectedChannel !== '전체' 
    ? ITEM_CATEGORIES.map((category) => {
        const itemData = ['23S', '24S', '25S'].map((season) => {
          const seasonKey = season as '23S' | '24S' | '25S';
          const items = endStockDetails?.[seasonKey]?.filter(
            (item) => item.ITEM_STD === category.key
          ) || [];
          
          // 아이템별 직접이익 계산 (기말재고 비율로 근사치 계산)
          // 실제로는 아이템별 매출과 직접비가 필요하지만, 현재는 기말재고 비율로 근사치 계산
          const totalEndStock = endStockDetails?.[seasonKey]?.reduce(
            (sum, item) => sum + item.CY_END_STOCK_TAG_AMT, 0
          ) || 0;
          const itemEndStock = items.reduce(
            (sum, item) => sum + item.CY_END_STOCK_TAG_AMT, 0
          );
          
          const itemRatio = totalEndStock > 0 ? itemEndStock / totalEndStock : 0;
          
          // 직접이익 (백만원 단위)
          const directProfit = (chartData.find((d) => d.name === season)?.직접이익 ?? 0) * itemRatio;
          
          return {
            name: season,
            value: Math.round(directProfit * 10) / 10,
          };
        });
        
        return {
          category: category.label,
          data: itemData,
        };
      }).filter((item) => 
        // 데이터가 있는 카테고리만 표시
        item.data.some((d) => d.value > 0)
      )
    : [];

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700">채널 선택</h4>
        <Select value={selectedChannel} onValueChange={setSelectedChannel}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {channelList.map((channel) => (
              <SelectItem key={channel} value={channel}>
                {channel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickFormatter={(value) => `${value}억`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === '영업이익률') {
                return [`${value}%`, name];
              }
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
          <Bar
            yAxisId="left"
            dataKey="매출액"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
          <Bar
            yAxisId="left"
            dataKey="영업이익"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="영업이익률"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {selectedChannel !== '전체' && itemDirectProfitData.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">아이템별 직접이익</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={['23S', '24S', '25S'].map((season) => {
                const dataPoint: Record<string, any> = { name: season };
                itemDirectProfitData.forEach((item) => {
                  const seasonData = item.data.find((d) => d.name === season);
                  dataPoint[item.category] = seasonData?.value ?? 0;
                });
                return dataPoint;
              })}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
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
                formatter={(value: number, name: string) => [`${value}억`, name]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend />
              {itemDirectProfitData.map((item, idx) => (
                <Bar
                  key={item.category}
                  dataKey={item.category}
                  fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][idx]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

