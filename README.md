# F&F 26SS 사업계획 네비게이터 (FP&A Web Dashboard)

F&F 주요 브랜드(MLB, MLB KIDS, DISCOVERY, DUVETICA, SERGIO TACCHINI)의  
과거 시즌 실적 분석과 26SS 사업계획 시뮬레이션을 지원하는 FP&A 전용 웹 대시보드입니다.

- **브랜드별 3개 시즌(23S/24S/25S) 실적 손익 요약**
- **AI 기반 3개년 실적 요약 인사이트**
- **26S 사업계획 입력 & 시뮬레이션**
- **채널별 매출 성장률/계획 반영 → 손익 구조 자동 계산**

---

## 1. 전체 아키텍처 개요

- **Frontend / Web App**
  - Next.js (EasyNext 기반 생성)
  - Tailwind CSS + shadcn/ui
  - Cursor AI로 개발/리팩토링 지원 전제

- **Backend API**
  - Next.js API Route (app/api 또는 pages/api)
  - Snowflake 쿼리용 API
  - 사업계획 시뮬레이션 계산용 API

- **Data / ETL**
  - Python 스크립트로 Snowflake 데이터 정제
  - 전처리 결과를 Snowflake 내 뷰/테이블로 재적재 또는 CSV 캐시

- **AI 분석**
  - OpenAI API (26SS 사업계획/과거 실적에 대한 요약·인사이트 생성)

---

## 2. 기능 요약

### 2.1 브랜드 선택 화면 (Landing)

- 5개 브랜드 카드/버튼 노출
  - MLB
  - MLB KIDS
  - DISCOVERY
  - DUVETICA
  - SERGIO TACCHINI
- 브랜드 선택 시 해당 브랜드 전용 대시보드로 진입

---

### 2.2 탭 1 - 과거 실적 분석 (23S / 24S / 25S)

**1) 요약 손익계산서 뷰**

- 시즌별 기본 지표:
  - 매출(실판매액 V+)  
  - 매출총이익 / 매출총이익률
  - 광고선전비
  - 인건비(인원 계획과 연결 가능 시)
  - 영업이익(간단 버전, 필요 시 EBITDA/OP 수준까지 확장)

- 테이블 + 간단 시각화:
  - 3개 시즌 컬럼 비교 테이블
  - 시즌별 매출/영업이익 Bar Chart
  - 주요 비율(할인율, 원가율 등) Trend Line

**2) AI 요약 인사이트**

- 입력: 브랜드, 시즌별 요약 데이터 (매출/GP/광고비/인건비 등)
- 출력: AI 인사이트 텍스트
  - 3개 시즌 트렌드 설명
  - 성장/역성장 요인
  - 비용 구조 변화 요약
- 구현 방식:
  - `/api/ai/historical-insight` (POST)
  - body에 요약 손익 데이터를 JSON으로 전송
  - OpenAI Chat Completions로 응답 후 프론트에 표시

---

### 2.3 탭 2 - 26S 사업계획 시뮬레이션

**1) 입력 항목**

- **매출 계획**
  - 기준 데이터: 25S 실적 (채널별 매출)
  - 옵션 1: 브랜드 전체 채널 공통 성장률(%) 입력
  - 옵션 2: 채널별 성장률(%) 개별 입력
- **발주액**
  - 시즌 총 발주액 또는 카테고리/아이템 단위 발주액(1차는 총액 기준)
- **M/U (마진율)**
  - 정의: `M/U = TAG(V+)/원가`
  - 목표 M/U % 직접 입력 (브랜드 레벨)
- **광고비**
  - 시즌 총 광고비
  - 또는 매출 대비 비율(%)로 입력 가능 (1차 버전은 절대 금액 입력)
- **인원계획**
  - 시즌 평균 인원 수 / 연간 인건비 총액(또는 인당 평균 인건비)

**2) 시뮬레이션 로직(개략)**

- 채널별 25S 매출 × (1 + 성장률) → 26S 매출 계획
- 26S 원가 = 26S TAG(V+) / M/U
- 매출총이익 = 26S 매출 - 26S 원가
- 영업이익 = 매출총이익 - 광고비 - 인건비 (단순 구조)

**3) 결과 대시보드**

- 요약 손익:
  - 매출 / 원가 / 매출총이익 / 광고비 / 인건비 / 영업이익 / 이익률
- 시각화:
  - 25S vs 26S 매출 비교 막대그래프
  - 26S 구성비(광고비/인건비/기타비용) Donut Chart
  - 채널별 매출 계획 막대그래프

---

## 3. 기술 스택

- **Framework**
  - Next.js (EasyNext CLI 기반)
- **언어**
  - TypeScript (Frontend & API)
  - Python (ETL/데이터 정제)
- **UI**
  - Tailwind CSS
  - shadcn/ui 컴포넌트
- **DB**
  - Snowflake (과거 실적, 마스터 데이터)
- **AI**
  - OpenAI API (Chat Completions)

---

## 4. 로컬 개발 환경 세팅

### 4.1 필수 설치

- Node.js (LTS)
- npm 또는 pnpm
- Python 3.x
- Snowflake 접속 권한 (Account / User / Role / Warehouse / DB / Schema)
- OpenAI API Key

### 4.2 EasyNext CLI 설치

```bash
npm i -g @easynext/cli
4.3 프로젝트 생성 (예시)
bash
코드 복사
# 새 프로젝트 폴더 생성
mkdir ff-26ss-navigator
cd ff-26ss-navigator

# EasyNext 기반 Next.js 프로젝트 생성
easynext create ff-26ss-navigator
# 또는 현재 폴더에 생성 시
# easynext create .
생성 과정에서 TypeScript / Tailwind / App Router 사용 옵션 선택 권장

5. 폴더 구조 제안
bash
코드 복사
ff-26ss-navigator/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx              # 브랜드 선택(랜딩)
│  ├─ [brand]/
│  │  ├─ page.tsx           # 브랜드별 기본 대시보드 (탭 구조)
│  │  ├─ components/
│  │  │  ├─ SummaryPnl.tsx  # 요약 손익 패널
│  │  │  ├─ HistoricalTab.tsx
│  │  │  ├─ Plan26STab.tsx
│  │  │  └─ Charts.tsx
│  ├─ api/
│  │  ├─ historical/route.ts        # 과거 실적 조회 API (Snowflake)
│  │  ├─ plan-simulate/route.ts     # 26S 시뮬레이션 API
│  │  └─ ai/historical-insight/route.ts  # AI 요약 인사이트 API
│
├─ lib/
│  ├─ snowflake.ts          # Snowflake 커넥션/쿼리 유틸
│  ├─ calc.ts               # 손익 계산/시뮬레이션 로직
│  └─ prompts.ts            # OpenAI 프롬프트 템플릿
│
├─ python/
│  ├─ etl_historical.py     # 과거 실적 데이터 정제/집계 스크립트
│  └─ requirements.txt
│
├─ .env.local.example
├─ package.json
└─ README.md
6. 환경 변수 설정
루트 경로에 .env.local 생성 (Vercel/Next.js 기준)

bash
코드 복사
SNOWFLAKE_ACCOUNT=xxxxxx
SNOWFLAKE_USER=xxxxxx
SNOWFLAKE_PASSWORD=xxxxxx
SNOWFLAKE_ROLE=xxxxxx
SNOWFLAKE_WAREHOUSE=xxxxxx
SNOWFLAKE_DATABASE=xxxxxx
SNOWFLAKE_SCHEMA=xxxxxx

OPENAI_API_KEY=sk-xxxxxx

# 기본 설정
NEXT_PUBLIC_APP_NAME=FNF 26SS Navigator
Python ETL용 .env 또는 동일 값 재활용 (예: python/.env)

7. Snowflake 연동 (Node.js)
lib/snowflake.ts (예시 스텁)

ts
코드 복사
import { createPool } from '@snowflake-sdk/whatever'; // 실제 사용 라이브러리로 교체

export async function querySnowflake<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  // TODO: Snowflake 연결/쿼리 유틸 구현
  // 1) 커넥션 풀 생성
  // 2) 쿼리 실행
  // 3) 결과 반환
  return [];
}
app/api/historical/route.ts (예시 스텁)

ts
코드 복사
import { NextResponse } from 'next/server';
import { querySnowflake } from '@/lib/snowflake';

export async function POST(req: Request) {
  const { brand } = await req.json();

  // TODO: 23S, 24S, 25S 시즌 요약 손익 집계 쿼리
  const rows = await querySnowflake(`
    -- 예시: 브랜드/시즌별 기본 손익 집계
    SELECT
      sesn,
      SUM(act_sale_amt) AS sale,
      SUM(gp_amt)       AS gp,
      SUM(ad_exp)       AS ad_exp,
      SUM(hr_cost)      AS hr_cost
    FROM ...
    WHERE brd_cd = ?
      AND sesn IN ('23S', '24S', '25S')
    GROUP BY sesn
  `, [brand]);

  return NextResponse.json({ data: rows });
}
8. Python ETL (개략)
python/etl_historical.py (개념)

Snowflake에서 상세 데이터 추출

시즌/브랜드/채널 단위로 집계

요약 테이블 또는 뷰로 재적재

프론트에서는 집계 뷰만 조회

bash
코드 복사
cd python
pip install -r requirements.txt

python etl_historical.py
9. OpenAI 기반 AI 분석 API (개략)
app/api/ai/historical-insight/route.ts 예시

ts
코드 복사
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildHistoricalPrompt } from '@/lib/prompts';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  const body = await req.json(); // { brand, seasons: [...] }
  const prompt = buildHistoricalPrompt(body);

  const completion = await client.chat.completions.create({
    model: 'gpt-5.1-mini',
    messages: [
      {
        role: 'system',
        content: '당신은 패션 리테일 FP&A 담당자를 위한 사업계획 분석 어시스턴트입니다.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? '';
  return NextResponse.json({ insight: text });
}
lib/prompts.ts 예시 (개요)

ts
코드 복사
export function buildHistoricalPrompt({
  brand,
  seasons,
}: {
  brand: string;
  seasons: any[];
}) {
  // 23S/24S/25S 매출/영업이익/비용 구조를 바탕으로
  // 한국어 FP&A 인사이트 생성용 프롬프트 구성
  return `
브랜드: ${brand}
시즌별 요약 데이터: ${JSON.stringify(seasons, null, 2)}

위 데이터를 기반으로,
1) 3개 시즌 매출/이익 트렌드
2) 비용 구조 변화
3) 26SS 사업계획 시 참고해야 할 시사점
을 FP&A 관점에서 요약해 주세요.
`;
}
10. 로컬 개발 명령어
bash
코드 복사
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
# http://localhost:3000 접속

# 프로덕션 빌드
npm run build
npm start
11. 향후 고도화 아이디어 (메모용)
채널·카테고리·아이템 단위 상세 시뮬레이션

임대료/OCC 반영한 BEP 분석 뷰

인원계획과 HR 데이터 연계 (FTE, 인건비/인당 생산성)

AI 기반 “리스크/업사이드 시나리오” 자동 생성

시나리오 저장/불러오기 기능 (Best / Base / Worst)

이 README는 1차 버전 기준 구조/흐름을 정의한 문서입니다.
실제 Snowflake 테이블명, 컬럼, 계산 로직은 FP&A 업무 규칙에 맞춰 세부 구현 시 보강하면 됩니다.