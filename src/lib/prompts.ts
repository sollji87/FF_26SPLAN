import { SeasonData } from '@/features/dashboard/constants/mockData';

export interface HistoricalInsightInput {
  brand: string;
  brandKo: string;
  seasons: SeasonData[];
}

export const buildHistoricalPrompt = (input: HistoricalInsightInput): string => {
  const seasonSummary = input.seasons
    .map(
      (s) => `
[${s.season}]
- 매출: ${(s.revenue / 10000).toFixed(1)}억원
- 매출총이익률: ${s.grossProfitRate.toFixed(1)}%
- 광고선전비: ${(s.adExpense / 10000).toFixed(1)}억원 (매출 대비 ${((s.adExpense / s.revenue) * 100).toFixed(1)}%)
- 인건비: ${(s.hrCost / 10000).toFixed(1)}억원 (매출 대비 ${((s.hrCost / s.revenue) * 100).toFixed(1)}%)
- 영업이익: ${(s.operatingProfit / 10000).toFixed(1)}억원
- 영업이익률: ${s.operatingProfitRate.toFixed(1)}%
- 할인율: ${s.discountRate.toFixed(1)}%
- 원가율: ${s.costRate.toFixed(1)}%`
    )
    .join('\n');

  return `당신은 패션 리테일 FP&A(Financial Planning & Analysis) 전문가입니다.
아래는 ${input.brandKo}(${input.brand}) 브랜드의 최근 3개 시즌(23S, 24S, 25S) 실적 요약입니다.

${seasonSummary}

위 데이터를 분석하여 다음 항목에 대해 FP&A 관점의 인사이트를 제공해주세요:

1. **매출 트렌드 분석**: 3개 시즌 매출 성장 추이와 주요 요인
2. **수익성 분석**: 매출총이익률과 영업이익률 변화 및 원인
3. **비용 구조 분석**: 광고비, 인건비 등 주요 비용 항목의 변화
4. **26SS 사업계획 시사점**: 다음 시즌 계획 수립 시 고려해야 할 핵심 포인트

각 항목을 2-3문장으로 간결하게 작성해주세요. 한국어로 답변해주세요.`;
};

export const SYSTEM_PROMPT = `당신은 패션 리테일 FP&A 담당자를 위한 사업계획 분석 어시스턴트입니다.
F&F 그룹의 브랜드(MLB, MLB KIDS, DISCOVERY, DUVETICA, SERGIO TACCHINI) 실적을 분석하고 
인사이트를 제공합니다. 분석은 항상 데이터 기반으로 진행하며, 실무적으로 활용 가능한 
구체적인 시사점을 도출합니다.`;



