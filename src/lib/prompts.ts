export interface HistoricalInsightInput {
  brand: string;
  brandKo: string;
  pnlData: {
    '23S'?: any;
    '24S'?: any;
    '25S'?: any;
  };
}

const formatCSVValue = (value: number | undefined): string => {
  if (value === undefined || value === null) return '';
  return value.toFixed(1);
};

const formatCSVPercent = (value: number | undefined): string => {
  if (value === undefined || value === null) return '';
  return value.toFixed(1);
};

export const buildHistoricalPrompt = (input: HistoricalInsightInput): string => {
  const seasons = ['23S', '24S', '25S'] as const;
  
  // CSV 헤더 생성
  const csvRows: string[] = [];
  
  // 헤더 행
  csvRows.push('항목,23S_금액(백만원),23S_비율(%),24S_금액(백만원),24S_비율(%),25S_금액(백만원),25S_비율(%)');
  
  // 각 항목을 CSV 행으로 변환
  const addRow = (label: string, getValue: (data: any) => { value?: number; percent?: number }) => {
    const values = seasons.map((season) => {
      const data = input.pnlData[season];
      if (!data) return ',,';
      const { value, percent } = getValue(data);
      return `${formatCSVValue(value)},${formatCSVPercent(percent)}`;
    });
    csvRows.push(`${label},${values.join(',')}`);
  };
  
  // 재고 및 발주
  addRow('기말재고 TAG금액', (d) => ({ value: d.endStock }));
  addRow('발주금액(당시즌의류)', (d) => ({ value: d.orderAmount, percent: d.salesRate }));
  
  // 매출
  addRow('판매TAG', (d) => ({ value: d.salesTag }));
  addRow('실판가', (d) => ({ value: d.actualSales }));
  addRow('할인율', (d) => ({ percent: d.discountRate }));
  addRow('부가세차감(출고)매출', (d) => ({ value: d.vatExcSales }));
  addRow('출고가(V+)', (d) => ({ value: d.shippingPrice }));
  
  // 매출원가
  addRow('매출원가(실적)', (d) => ({ value: d.cogs }));
  addRow('재고평가감(환입)', (d) => ({ value: d.inventoryValuationReversal }));
  addRow('재고평가감(추가)', (d) => ({ value: d.inventoryValuationAddition }));
  addRow('매출원가 소계', (d) => ({ value: d.cogsTotal }));
  
  // 수익성
  addRow('매출총이익', (d) => ({ value: d.grossProfit }));
  addRow('매출총이익률', (d) => ({ 
    percent: d.actualSales && d.grossProfit ? (d.grossProfit / d.actualSales) * 100 : undefined 
  }));
  
  // 직접비
  addRow('로열티', (d) => ({ value: d.directCost?.royalty }));
  addRow('물류비', (d) => ({ value: d.directCost?.logistics }));
  addRow('보관료', (d) => ({ value: d.directCost?.storage }));
  addRow('카드수수료', (d) => ({ value: d.directCost?.cardCommission }));
  addRow('매장임차료', (d) => ({ value: d.directCost?.shopRent }));
  addRow('감가상각비(매장)', (d) => ({ value: d.directCost?.shopDepreciation }));
  addRow('온라인수수료(제휴)', (d) => ({ value: d.directCost?.onlineCommission }));
  addRow('중간관리자 수수료', (d) => ({ value: d.directCost?.storeManagerCommission }));
  addRow('면세 판매직수수료', (d) => ({ value: d.directCost?.dutyFreeCommission }));
  addRow('직영 판매직수수료', (d) => ({ value: d.directCost?.directlyManagedCommission }));
  addRow('직접비 합계', (d) => ({ value: d.directCost?.total }));
  addRow('직접이익', (d) => ({ value: d.directProfit }));
  addRow('직접이익률', (d) => ({ 
    percent: d.actualSales && d.directProfit ? (d.directProfit / d.actualSales) * 100 : undefined 
  }));
  
  // 영업비
  addRow('광고비', (d) => ({ value: d.operatingExpense?.adExpense }));
  addRow('인건비', (d) => ({ value: d.operatingExpense?.hrCost }));
  addRow('기타영업비', (d) => ({ value: d.operatingExpense?.etcTotal }));
  addRow('자가임차료', (d) => ({ value: d.operatingExpense?.selfRent }));
  addRow('공통비 배부', (d) => ({ value: d.operatingExpense?.commonCost }));
  addRow('제조간접비 차감', (d) => ({ value: d.operatingExpense?.mfcIndirect }));
  addRow('영업비 합계', (d) => ({ value: d.operatingExpense?.total }));
  addRow('영업이익', (d) => ({ value: d.operatingProfit }));
  addRow('영업이익률', (d) => ({ 
    percent: d.actualSales && d.operatingProfit ? (d.operatingProfit / d.actualSales) * 100 : undefined 
  }));
  
  // 채널별 데이터
  const channelRows: string[] = [];
  channelRows.push('\n채널별 판매TAG (백만원)');
  channelRows.push('채널,23S,24S,25S');
  
  const allChannels = new Set<string>();
  seasons.forEach((season) => {
    const channels = input.pnlData[season]?.salesTagChannels || [];
    channels.forEach((ch: any) => allChannels.add(ch.CHNL_NM));
  });
  
  Array.from(allChannels).sort().forEach((channel) => {
    const values = seasons.map((season) => {
      const channels = input.pnlData[season]?.salesTagChannels || [];
      const ch = channels.find((c: any) => c.CHNL_NM === channel);
      return formatCSVValue(ch?.SALE_TAG_AMT);
    });
    channelRows.push(`${channel},${values.join(',')}`);
  });
  
  channelRows.push('\n채널별 실판가 (백만원)');
  channelRows.push('채널,23S,24S,25S');
  
  Array.from(allChannels).sort().forEach((channel) => {
    const values = seasons.map((season) => {
      const channels = input.pnlData[season]?.actualSalesChannels || [];
      const ch = channels.find((c: any) => c.CHNL_NM === channel);
      return formatCSVValue(ch?.ACT_SALE_AMT);
    });
    channelRows.push(`${channel},${values.join(',')}`);
  });
  
  const csvData = csvRows.join('\n') + '\n' + channelRows.join('\n');

  return `당신은 패션 리테일 FP&A(Financial Planning & Analysis) 전문가입니다.
아래는 ${input.brandKo}(${input.brand}) 브랜드의 최근 3개 시즌(23S, 24S, 25S) 요약 손익계산서 전체 데이터를 CSV 형식으로 정리한 것입니다.

[중요] 모든 금액은 백만원 단위입니다. 예를 들어, 237,734는 237,734백만원을 의미합니다.

${csvData}

위 CSV 데이터를 기반으로 CEO에게 보고할 수 있는 수준의 인사이트를 존댓말로 작성해주세요. 다음 항목에 대해 각각 3줄씩 분석해주세요:

1. 매출 트렌드 분석: 판매TAG, 실판가, 채널별 매출 성장 추이와 주요 요인
2. 수익성 분석: 매출총이익률, 직접이익률, 영업이익률 변화 및 원인 분석
3. 비용 구조 분석: 직접비(로열티, 물류비, 보관료 등)와 영업비(광고비, 인건비, 기타영업비 등)의 변화 추이
4. 재고 및 발주 분석: 기말재고, 발주금액, 판매율 변화와 재고 효율성
5. 채널별 성과 분석: 채널별 판매TAG와 실판가 비교를 통한 채널별 수익성
6. 26SS 사업계획 시사점: 다음 시즌 계획 수립 시 고려해야 할 핵심 포인트 및 개선 방안

각 항목을 3줄씩 작성해주세요. 한국어로 답변해주세요.
중요: 응답에서 별표(**)나 볼드 표시를 사용하지 말고, 순수 텍스트로만 작성해주세요.`;
};

export const SYSTEM_PROMPT = `당신은 패션 리테일 FP&A 담당자를 위한 사업계획 분석 어시스턴트입니다.
F&F 그룹의 브랜드(MLB, MLB KIDS, DISCOVERY, DUVETICA, SERGIO TACCHINI) 실적을 분석하고 
인사이트를 제공합니다. 분석은 항상 데이터 기반으로 진행하며, 실무적으로 활용 가능한 
구체적인 시사점을 도출합니다.`;



