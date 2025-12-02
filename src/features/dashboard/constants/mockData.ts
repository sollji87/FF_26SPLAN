export interface SeasonData {
  season: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossProfitRate: number;
  adExpense: number;
  hrCost: number;
  operatingProfit: number;
  operatingProfitRate: number;
  discountRate: number;
  costRate: number;
}

export interface ChannelData {
  channel: string;
  channelKo: string;
  revenue25S: number;
}

export interface BrandMockData {
  brandId: string;
  seasons: SeasonData[];
  channels: ChannelData[];
}

const createSeasonData = (
  season: string,
  revenue: number,
  costRate: number,
  adRate: number,
  hrRate: number,
  discountRate: number
): SeasonData => {
  const cogs = revenue * costRate;
  const grossProfit = revenue - cogs;
  const adExpense = revenue * adRate;
  const hrCost = revenue * hrRate;
  const operatingProfit = grossProfit - adExpense - hrCost;

  return {
    season,
    revenue,
    cogs,
    grossProfit,
    grossProfitRate: (grossProfit / revenue) * 100,
    adExpense,
    hrCost,
    operatingProfit,
    operatingProfitRate: (operatingProfit / revenue) * 100,
    discountRate,
    costRate: costRate * 100,
  };
};

const CHANNELS: Omit<ChannelData, 'revenue25S'>[] = [
  { channel: 'department', channelKo: '백화점' },
  { channel: 'outlet', channelKo: '아울렛' },
  { channel: 'online', channelKo: '온라인' },
  { channel: 'street', channelKo: '가두점' },
  { channel: 'wholesale', channelKo: '도매' },
];

export const MOCK_DATA: Record<string, BrandMockData> = {
  mlb: {
    brandId: 'mlb',
    seasons: [
      createSeasonData('23S', 850000, 0.42, 0.08, 0.12, 25),
      createSeasonData('24S', 920000, 0.40, 0.09, 0.11, 23),
      createSeasonData('25S', 980000, 0.38, 0.10, 0.10, 22),
    ],
    channels: [
      { ...CHANNELS[0], revenue25S: 280000 },
      { ...CHANNELS[1], revenue25S: 180000 },
      { ...CHANNELS[2], revenue25S: 320000 },
      { ...CHANNELS[3], revenue25S: 150000 },
      { ...CHANNELS[4], revenue25S: 50000 },
    ],
  },
  'mlb-kids': {
    brandId: 'mlb-kids',
    seasons: [
      createSeasonData('23S', 320000, 0.44, 0.07, 0.13, 28),
      createSeasonData('24S', 380000, 0.42, 0.08, 0.12, 26),
      createSeasonData('25S', 420000, 0.40, 0.09, 0.11, 24),
    ],
    channels: [
      { ...CHANNELS[0], revenue25S: 130000 },
      { ...CHANNELS[1], revenue25S: 85000 },
      { ...CHANNELS[2], revenue25S: 140000 },
      { ...CHANNELS[3], revenue25S: 50000 },
      { ...CHANNELS[4], revenue25S: 15000 },
    ],
  },
  discovery: {
    brandId: 'discovery',
    seasons: [
      createSeasonData('23S', 680000, 0.45, 0.10, 0.11, 20),
      createSeasonData('24S', 720000, 0.43, 0.11, 0.10, 19),
      createSeasonData('25S', 750000, 0.41, 0.12, 0.09, 18),
    ],
    channels: [
      { ...CHANNELS[0], revenue25S: 220000 },
      { ...CHANNELS[1], revenue25S: 130000 },
      { ...CHANNELS[2], revenue25S: 250000 },
      { ...CHANNELS[3], revenue25S: 120000 },
      { ...CHANNELS[4], revenue25S: 30000 },
    ],
  },
  duvetica: {
    brandId: 'duvetica',
    seasons: [
      createSeasonData('23S', 180000, 0.50, 0.06, 0.14, 15),
      createSeasonData('24S', 195000, 0.48, 0.07, 0.13, 14),
      createSeasonData('25S', 210000, 0.46, 0.08, 0.12, 13),
    ],
    channels: [
      { ...CHANNELS[0], revenue25S: 95000 },
      { ...CHANNELS[1], revenue25S: 35000 },
      { ...CHANNELS[2], revenue25S: 55000 },
      { ...CHANNELS[3], revenue25S: 20000 },
      { ...CHANNELS[4], revenue25S: 5000 },
    ],
  },
  'sergio-tacchini': {
    brandId: 'sergio-tacchini',
    seasons: [
      createSeasonData('23S', 120000, 0.48, 0.09, 0.15, 30),
      createSeasonData('24S', 145000, 0.46, 0.10, 0.14, 28),
      createSeasonData('25S', 165000, 0.44, 0.11, 0.13, 26),
    ],
    channels: [
      { ...CHANNELS[0], revenue25S: 45000 },
      { ...CHANNELS[1], revenue25S: 35000 },
      { ...CHANNELS[2], revenue25S: 55000 },
      { ...CHANNELS[3], revenue25S: 25000 },
      { ...CHANNELS[4], revenue25S: 5000 },
    ],
  },
};

export const getBrandMockData = (brandId: string): BrandMockData | undefined => {
  return MOCK_DATA[brandId];
};

export const formatCurrency = (value: number): string => {
  return `${Math.round(value).toLocaleString()}`;
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};



