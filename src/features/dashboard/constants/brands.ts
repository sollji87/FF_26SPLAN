export interface Brand {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  color: string;
  gradient: string;
  snowflakeCode?: string;
}

export const BRANDS: Brand[] = [
  {
    id: 'mlb',
    name: 'MLB',
    nameKo: '엠엘비',
    description: '글로벌 스트리트 패션 브랜드',
    color: '#C8102E',
    gradient: 'from-red-600 to-red-800',
    snowflakeCode: 'M',
  },
  {
    id: 'mlb-kids',
    name: 'MLB KIDS',
    nameKo: '엠엘비 키즈',
    description: '키즈 스트리트 패션 브랜드',
    color: '#FF6B6B',
    gradient: 'from-pink-500 to-red-500',
    snowflakeCode: 'I',
  },
  {
    id: 'discovery',
    name: 'DISCOVERY',
    nameKo: '디스커버리',
    description: '프리미엄 아웃도어 라이프스타일',
    color: '#FF8C00',
    gradient: 'from-orange-500 to-amber-600',
    snowflakeCode: 'X',
  },
  {
    id: 'duvetica',
    name: 'DUVETICA',
    nameKo: '듀베티카',
    description: '이탈리안 프리미엄 다운웨어',
    color: '#1E3A5F',
    gradient: 'from-slate-700 to-slate-900',
    snowflakeCode: 'V',
  },
  {
    id: 'sergio-tacchini',
    name: 'SERGIO TACCHINI',
    nameKo: '세르지오 타키니',
    description: '이탈리안 스포츠 헤리티지',
    color: '#003DA5',
    gradient: 'from-blue-600 to-blue-800',
    snowflakeCode: 'ST',
  },
];

export const getBrandById = (id: string): Brand | undefined => {
  return BRANDS.find((brand) => brand.id === id);
};

export const BRAND_IDS = BRANDS.map((brand) => brand.id);



