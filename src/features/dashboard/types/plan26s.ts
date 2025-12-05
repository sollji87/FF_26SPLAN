// 26S 사업계획 매출 입력 관련 타입 정의

// 채널 목록 (지정된 명칭)
export const CHANNELS = [
  { code: 'RF', name: 'RF' },
  { code: 'DEPT', name: '백화점' },
  { code: 'FLAG', name: '플래그쉽' },
  { code: 'WHOLE', name: '사입' },
  { code: 'DF', name: '면세점' },
  { code: 'AGENCY', name: '대리점' },
  { code: 'DIRECT_STREET', name: '직영(가두)' },
  { code: 'ONLINE_PARTNER', name: '온라인(제휴)' },
  { code: 'ONLINE_DIRECT', name: '온라인(직)' },
  { code: 'OUTLET_DIRECT', name: '아울렛(직)' },
] as const;

// 시즌 코드 (연도 + N/S/F)
export const SEASONS = [
  '22N', '22S', '23F', '23N', '24F', '24N', '24S', '25F', '25N', '25S',
  '26F', '26N', '26S', '21S', '19F', '20F', '21F', '22F', '23S', '20S',
] as const;

// 아이템 카테고리 (중분류)
export const ITEM_CATEGORIES = [
  { code: 'HEAD', name: '모자' },
  { code: 'SHOES', name: '신발' },
  { code: 'BAG', name: '가방' },
  { code: 'EQ', name: '기타악세' },
  { code: 'WEAR', name: '의류' },
] as const;

export type ChannelCode = (typeof CHANNELS)[number]['code'];
export type SeasonCode = (typeof SEASONS)[number];
export type ItemCategoryCode = (typeof ITEM_CATEGORIES)[number]['code'];

// 개별 매출 입력 데이터 (채널 x 시즌 x 카테고리 조합)
export interface SalesInputRow {
  id: string;
  channelCode: ChannelCode;
  seasonCode: SeasonCode;
  categoryCode: ItemCategoryCode;
  salesTagAmt: number;    // 판매TAG (천원)
  discountRate: number;   // 할인율 (%)
  actualSalesAmt: number; // 실판매출액 (천원) - 자동 계산 또는 직접 입력
}

// 25S 실적 데이터 (과거실적 탭에서 가져온 데이터)
export interface Season25SData {
  channelCode: ChannelCode;
  categoryCode: ItemCategoryCode;
  salesTagAmt: number;    // 판매TAG (천원)
  actualSalesAmt: number; // 실판매출액 (천원)
  discountRate: number;   // 할인율 (%)
}

// 시나리오 데이터
export interface Scenario26S {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  brandCode: string;
  salesInputs: SalesInputRow[];
  // 비용 계획
  orderAmount: number;    // 발주액 (천원)
  targetMU: number;       // 목표 M/U (%)
  adExpense: number;      // 광고선전비 (천원)
  headcount: number;      // 인원 수
  hrCostPerPerson: number; // 인당 인건비 (천원)
}

// 채널별 집계 데이터
export interface ChannelSummary {
  channelCode: ChannelCode;
  channelName: string;
  sales25S: number;
  sales26S: number;
  change: number;
  changeRate: number;
}

// 시즌별 집계 데이터
export interface SeasonSummary {
  seasonCode: SeasonCode;
  seasonName: string;
  sales25S: number;
  sales26S: number;
  change: number;
  changeRate: number;
}

// 아이템별 집계 데이터
export interface ItemCategorySummary {
  categoryCode: ItemCategoryCode;
  categoryName: string;
  sales25S: number;
  sales26S: number;
  change: number;
  changeRate: number;
}

// 엑셀 업로드 데이터 형식
export interface ExcelUploadRow {
  채널: string;
  시즌: string;
  카테고리: string;
  '판매TAG(천원)': number;
  '할인율(%)': number;
  '실판매출액(천원)'?: number;
}

// 계산 헬퍼 함수들
export const calculateActualSales = (salesTag: number, discountRate: number): number => {
  return Math.round(salesTag * (1 - discountRate / 100));
};

export const calculateDiscountRate = (salesTag: number, actualSales: number): number => {
  if (salesTag === 0) return 0;
  return Math.round((1 - actualSales / salesTag) * 100 * 10) / 10;
};

// 채널명으로 채널코드 찾기
export const getChannelCode = (value: string): ChannelCode | null => {
  if (!value) return null;
  const v = value.trim();
  // 코드 매칭 우선
  const byCode = CHANNELS.find((ch) => ch.code.toLowerCase() === v.toLowerCase());
  if (byCode) return byCode.code;
  // 이름 매칭 (대소문자 무시)
  const byName = CHANNELS.find((ch) => ch.name.toLowerCase() === v.toLowerCase());
  return byName ? byName.code : null;
};

// 카테고리명으로 카테고리코드 찾기
export const getCategoryCode = (value: string): ItemCategoryCode | null => {
  if (!value) return null;
  const v = value.trim();
  // 코드 매칭
  const byCode = ITEM_CATEGORIES.find((cat) => cat.code.toLowerCase() === v.toLowerCase());
  if (byCode) return byCode.code;
  // 한글 이름 매칭 (대소문자 무시)
  const byName = ITEM_CATEGORIES.find((cat) => cat.name.toLowerCase() === v.toLowerCase());
  return byName ? byName.code : null;
};

// 시즌 코드 찾기
export const getSeasonCode = (seasonName: string): SeasonCode | null => {
  if (!seasonName) return null;
  const v = seasonName.trim().toUpperCase();
  const found = SEASONS.find((s) => s.toUpperCase() === v);
  return found ?? null;
};

// 빈 시나리오 생성
export const createEmptyScenario = (brandCode: string): Scenario26S => {
  const inputs: SalesInputRow[] = [];
  let id = 1;

  // 모든 조합에 대해 빈 입력 행 생성
  for (const channel of CHANNELS) {
    for (const season of SEASONS) {
      for (const category of ITEM_CATEGORIES) {
        inputs.push({
          id: `row-${id++}`,
          channelCode: channel.code,
          seasonCode: season,
          categoryCode: category.code,
          salesTagAmt: 0,
          discountRate: 0,
          actualSalesAmt: 0,
        });
      }
    }
  }

  return {
    id: `scenario-${Date.now()}`,
    name: '새 시나리오',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    brandCode,
    salesInputs: inputs,
    orderAmount: 0,
    targetMU: 250,
    adExpense: 0,
    headcount: 0,
    hrCostPerPerson: 0,
  };
};

// 천원 단위 포맷팅
export const formatThousandWon = (value: number): string => {
  return value.toLocaleString('ko-KR');
};

// 백만원 단위 포맷팅
export const formatMillionWon = (value: number): string => {
  return (value / 1000).toLocaleString('ko-KR', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 1 
  });
};

