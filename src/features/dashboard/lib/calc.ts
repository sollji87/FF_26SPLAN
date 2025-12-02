import { ChannelData, SeasonData } from '../constants/mockData';

export interface ChannelGrowthInput {
  channel: string;
  growthRate: number;
}

export interface SimulationInput {
  channelGrowthRates: ChannelGrowthInput[];
  commonGrowthRate: number;
  useCommonRate: boolean;
  orderAmount: number;
  targetMU: number;
  adExpense: number;
  headcount: number;
  hrCostPerPerson: number;
}

export interface SimulationResult {
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossProfitRate: number;
  adExpense: number;
  hrCost: number;
  operatingProfit: number;
  operatingProfitRate: number;
  channelRevenues: {
    channel: string;
    channelKo: string;
    revenue25S: number;
    revenue26S: number;
    growthRate: number;
  }[];
}

export const calculateSimulation = (
  channels: ChannelData[],
  input: SimulationInput
): SimulationResult => {
  const channelRevenues = channels.map((ch) => {
    const growthRate = input.useCommonRate
      ? input.commonGrowthRate
      : input.channelGrowthRates.find((g) => g.channel === ch.channel)?.growthRate ?? 0;

    const revenue26S = ch.revenue25S * (1 + growthRate / 100);

    return {
      channel: ch.channel,
      channelKo: ch.channelKo,
      revenue25S: ch.revenue25S,
      revenue26S,
      growthRate,
    };
  });

  const totalRevenue = channelRevenues.reduce((sum, ch) => sum + ch.revenue26S, 0);
  const totalCogs = totalRevenue / (input.targetMU / 100);
  const grossProfit = totalRevenue - totalCogs;
  const hrCost = input.headcount * input.hrCostPerPerson;
  const operatingProfit = grossProfit - input.adExpense - hrCost;

  return {
    totalRevenue,
    totalCogs,
    grossProfit,
    grossProfitRate: (grossProfit / totalRevenue) * 100,
    adExpense: input.adExpense,
    hrCost,
    operatingProfit,
    operatingProfitRate: (operatingProfit / totalRevenue) * 100,
    channelRevenues,
  };
};

export const getDefaultSimulationInput = (channels: ChannelData[]): SimulationInput => {
  return {
    channelGrowthRates: channels.map((ch) => ({
      channel: ch.channel,
      growthRate: 5,
    })),
    commonGrowthRate: 5,
    useCommonRate: true,
    orderAmount: 0,
    targetMU: 250,
    adExpense: 50000,
    headcount: 100,
    hrCostPerPerson: 600,
  };
};

export const compare25Svs26S = (
  season25S: SeasonData,
  result26S: SimulationResult
): {
  metric: string;
  value25S: number;
  value26S: number;
  change: number;
  changeRate: number;
}[] => {
  const metrics = [
    {
      metric: '매출',
      value25S: season25S.revenue,
      value26S: result26S.totalRevenue,
    },
    {
      metric: '매출원가',
      value25S: season25S.cogs,
      value26S: result26S.totalCogs,
    },
    {
      metric: '매출총이익',
      value25S: season25S.grossProfit,
      value26S: result26S.grossProfit,
    },
    {
      metric: '광고선전비',
      value25S: season25S.adExpense,
      value26S: result26S.adExpense,
    },
    {
      metric: '인건비',
      value25S: season25S.hrCost,
      value26S: result26S.hrCost,
    },
    {
      metric: '영업이익',
      value25S: season25S.operatingProfit,
      value26S: result26S.operatingProfit,
    },
  ];

  return metrics.map((m) => ({
    ...m,
    change: m.value26S - m.value25S,
    changeRate: ((m.value26S - m.value25S) / m.value25S) * 100,
  }));
};



