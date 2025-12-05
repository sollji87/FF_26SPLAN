'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Scenario26S, 
  SalesInputRow, 
  createEmptyScenario,
  ChannelSummary,
  SeasonSummary,
  ItemCategorySummary,
  CHANNELS,
  SEASONS,
  ITEM_CATEGORIES,
} from '../types/plan26s';

interface Plan26SStore {
  // 시나리오 데이터
  scenarios: Record<string, Scenario26S[]>; // brandCode -> scenarios
  activeScenarioId: Record<string, string | null>; // brandCode -> scenarioId
  
  // 25S 실적 데이터 (과거실적에서 로드)
  season25SData: Record<string, number>; // brandCode -> 총 실판매출액 (천원)

  // Actions
  createScenario: (brandCode: string, name?: string) => string;
  deleteScenario: (brandCode: string, scenarioId: string) => void;
  duplicateScenario: (brandCode: string, scenarioId: string) => string;
  setActiveScenario: (brandCode: string, scenarioId: string | null) => void;
  updateScenarioName: (brandCode: string, scenarioId: string, name: string) => void;
  
  // 매출 입력 업데이트
  updateSalesInput: (
    brandCode: string, 
    scenarioId: string, 
    rowId: string, 
    updates: Partial<SalesInputRow>
  ) => void;
  
  // 대량 업데이트 (엑셀 업로드용)
  bulkUpdateSalesInputs: (
    brandCode: string, 
    scenarioId: string, 
    inputs: SalesInputRow[]
  ) => void;
  
  // 비용 계획 업데이트
  updateCostPlan: (
    brandCode: string, 
    scenarioId: string, 
    updates: Partial<Pick<Scenario26S, 'orderAmount' | 'targetMU' | 'adExpense' | 'headcount' | 'hrCostPerPerson'>>
  ) => void;

  // 25S 데이터 설정
  setSeason25SData: (brandCode: string, totalActualSales: number) => void;

  // Getters
  getScenarios: (brandCode: string) => Scenario26S[];
  getActiveScenario: (brandCode: string) => Scenario26S | null;
  getSeason25STotal: (brandCode: string) => number;

  // 집계 데이터 계산
  getChannelSummary: (brandCode: string, scenarioId: string) => ChannelSummary[];
  getSeasonSummary: (brandCode: string, scenarioId: string) => SeasonSummary[];
  getItemCategorySummary: (brandCode: string, scenarioId: string) => ItemCategorySummary[];
  getTotalSales26S: (brandCode: string, scenarioId: string) => number;
}

export const usePlan26SStore = create<Plan26SStore>()(
  persist(
    (set, get) => ({
      scenarios: {},
      activeScenarioId: {},
      season25SData: {},

      createScenario: (brandCode, name) => {
        const newScenario = createEmptyScenario(brandCode);
        if (name) {
          newScenario.name = name;
        }
        
        set((state) => ({
          scenarios: {
            ...state.scenarios,
            [brandCode]: [...(state.scenarios[brandCode] || []), newScenario],
          },
          activeScenarioId: {
            ...state.activeScenarioId,
            [brandCode]: newScenario.id,
          },
        }));
        
        return newScenario.id;
      },

      deleteScenario: (brandCode, scenarioId) => {
        set((state) => {
          const scenarios = (state.scenarios[brandCode] || []).filter(
            (s) => s.id !== scenarioId
          );
          const activeId = state.activeScenarioId[brandCode];
          
          return {
            scenarios: {
              ...state.scenarios,
              [brandCode]: scenarios,
            },
            activeScenarioId: {
              ...state.activeScenarioId,
              [brandCode]: activeId === scenarioId 
                ? (scenarios[0]?.id || null) 
                : activeId,
            },
          };
        });
      },

      duplicateScenario: (brandCode, scenarioId) => {
        const state = get();
        const original = (state.scenarios[brandCode] || []).find(
          (s) => s.id === scenarioId
        );
        
        if (!original) return '';
        
        const newId = `scenario-${Date.now()}`;
        const duplicated: Scenario26S = {
          ...original,
          id: newId,
          name: `${original.name} (복사본)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          salesInputs: original.salesInputs.map((input, idx) => ({
            ...input,
            id: `row-${Date.now()}-${idx}`,
          })),
        };
        
        set((state) => ({
          scenarios: {
            ...state.scenarios,
            [brandCode]: [...(state.scenarios[brandCode] || []), duplicated],
          },
          activeScenarioId: {
            ...state.activeScenarioId,
            [brandCode]: newId,
          },
        }));
        
        return newId;
      },

      setActiveScenario: (brandCode, scenarioId) => {
        set((state) => ({
          activeScenarioId: {
            ...state.activeScenarioId,
            [brandCode]: scenarioId,
          },
        }));
      },

      updateScenarioName: (brandCode, scenarioId, name) => {
        set((state) => ({
          scenarios: {
            ...state.scenarios,
            [brandCode]: (state.scenarios[brandCode] || []).map((s) =>
              s.id === scenarioId
                ? { ...s, name, updatedAt: new Date().toISOString() }
                : s
            ),
          },
        }));
      },

      updateSalesInput: (brandCode, scenarioId, rowId, updates) => {
        set((state) => ({
          scenarios: {
            ...state.scenarios,
            [brandCode]: (state.scenarios[brandCode] || []).map((s) => {
              if (s.id !== scenarioId) return s;
              
              return {
                ...s,
                updatedAt: new Date().toISOString(),
                salesInputs: s.salesInputs.map((input) => {
                  if (input.id !== rowId) return input;
                  
                  const updated = { ...input, ...updates };
                  
                  // 할인율이 변경되면 실판매출액 자동 계산
                  if (updates.discountRate !== undefined && updates.actualSalesAmt === undefined) {
                    updated.actualSalesAmt = Math.round(
                      updated.salesTagAmt * (1 - updated.discountRate / 100)
                    );
                  }
                  
                  // 판매TAG가 변경되면 실판매출액 자동 계산
                  if (updates.salesTagAmt !== undefined && updates.actualSalesAmt === undefined) {
                    updated.actualSalesAmt = Math.round(
                      updated.salesTagAmt * (1 - updated.discountRate / 100)
                    );
                  }
                  
                  return updated;
                }),
              };
            }),
          },
        }));
      },

      bulkUpdateSalesInputs: (brandCode, scenarioId, inputs) => {
        set((state) => ({
          scenarios: {
            ...state.scenarios,
            [brandCode]: (state.scenarios[brandCode] || []).map((s) =>
              s.id === scenarioId
                ? { ...s, salesInputs: inputs, updatedAt: new Date().toISOString() }
                : s
            ),
          },
        }));
      },

      updateCostPlan: (brandCode, scenarioId, updates) => {
        set((state) => ({
          scenarios: {
            ...state.scenarios,
            [brandCode]: (state.scenarios[brandCode] || []).map((s) =>
              s.id === scenarioId
                ? { ...s, ...updates, updatedAt: new Date().toISOString() }
                : s
            ),
          },
        }));
      },

      setSeason25SData: (brandCode, totalActualSales) => {
        set((state) => ({
          season25SData: {
            ...state.season25SData,
            [brandCode]: totalActualSales,
          },
        }));
      },

      getScenarios: (brandCode) => {
        return get().scenarios[brandCode] || [];
      },

      getActiveScenario: (brandCode) => {
        const state = get();
        const activeId = state.activeScenarioId[brandCode];
        if (!activeId) return null;
        return (state.scenarios[brandCode] || []).find((s) => s.id === activeId) || null;
      },

      getSeason25STotal: (brandCode) => {
        return get().season25SData[brandCode] || 0;
      },

      getChannelSummary: (brandCode, scenarioId) => {
        const scenario = (get().scenarios[brandCode] || []).find(
          (s) => s.id === scenarioId
        );
        if (!scenario) return [];

        const sales25STotal = get().season25SData[brandCode] || 0;
        const channelCount = CHANNELS.length;
        const sales25SPerChannel = sales25STotal / channelCount; // 임시 균등 분배

        return CHANNELS.map((channel) => {
          const channelInputs = scenario.salesInputs.filter(
            (input) => input.channelCode === channel.code
          );
          const sales26S = channelInputs.reduce(
            (sum, input) => sum + input.actualSalesAmt,
            0
          );
          const sales25S = sales25SPerChannel; // TODO: 실제 채널별 25S 데이터 연동

          return {
            channelCode: channel.code,
            channelName: channel.name,
            sales25S,
            sales26S,
            change: sales26S - sales25S,
            changeRate: sales25S > 0 ? ((sales26S - sales25S) / sales25S) * 100 : 0,
          };
        });
      },

      getSeasonSummary: (brandCode, scenarioId) => {
        const scenario = (get().scenarios[brandCode] || []).find(
          (s) => s.id === scenarioId
        );
        if (!scenario) return [];

        return SEASONS.map((season) => {
          const seasonInputs = scenario.salesInputs.filter(
            (input) => input.seasonCode === season
          );
          const sales26S = seasonInputs.reduce(
            (sum, input) => sum + input.actualSalesAmt,
            0
          );

          return {
            seasonCode: season,
            seasonName: season,
            sales25S: 0, // TODO: 실제 시즌별 25S 데이터 연동
            sales26S,
            change: sales26S,
            changeRate: 0,
          };
        });
      },

      getItemCategorySummary: (brandCode, scenarioId) => {
        const scenario = (get().scenarios[brandCode] || []).find(
          (s) => s.id === scenarioId
        );
        if (!scenario) return [];

        return ITEM_CATEGORIES.map((category) => {
          const categoryInputs = scenario.salesInputs.filter(
            (input) => input.categoryCode === category.code
          );
          const sales26S = categoryInputs.reduce(
            (sum, input) => sum + input.actualSalesAmt,
            0
          );

          return {
            categoryCode: category.code,
            categoryName: category.name,
            sales25S: 0, // TODO: 실제 카테고리별 25S 데이터 연동
            sales26S,
            change: sales26S,
            changeRate: 0,
          };
        });
      },

      getTotalSales26S: (brandCode, scenarioId) => {
        const scenario = (get().scenarios[brandCode] || []).find(
          (s) => s.id === scenarioId
        );
        if (!scenario) return 0;

        return scenario.salesInputs.reduce(
          (sum, input) => sum + input.actualSalesAmt,
          0
        );
      },
    }),
    {
      name: 'ff-plan26s-storage',
    }
  )
);

