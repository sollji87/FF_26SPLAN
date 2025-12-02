import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ScenarioData {
  id: string;
  name: string;
  createdAt: string;
  revenue: {
    channelRevenues: Array<{
      channel: string;
      channelKo: string;
      revenue25S: number;
      revenue26S: number;
      growthRate: number;
    }>;
    totalRevenue: number;
  };
  order: {
    totalAmount: number;
    categories: Array<{
      category: string;
      categoryKo: string;
      amount: number;
      ratio: number;
    }>;
  };
  markup: {
    targetMU: number;
    categoryMUs: Array<{
      category: string;
      categoryKo: string;
      mu: number;
    }>;
  };
  adExpense: {
    totalAmount: number;
    channels: Array<{
      channel: string;
      channelKo: string;
      amount: number;
      ratio: number;
    }>;
  };
  headcount: {
    totalHeadcount: number;
    avgSalary: number;
    departments: Array<{
      dept: string;
      deptKo: string;
      headcount: number;
      salary: number;
    }>;
  };
}

interface ScenarioStore {
  scenarios: Record<string, ScenarioData[]>;
  activeScenario: Record<string, string | null>;
  
  addScenario: (brandId: string, scenario: ScenarioData) => void;
  updateScenario: (brandId: string, scenarioId: string, data: Partial<ScenarioData>) => void;
  deleteScenario: (brandId: string, scenarioId: string) => void;
  setActiveScenario: (brandId: string, scenarioId: string | null) => void;
  getScenarios: (brandId: string) => ScenarioData[];
  getActiveScenario: (brandId: string) => ScenarioData | null;
}

export const useScenarios = create<ScenarioStore>()(
  persist(
    (set, get) => ({
      scenarios: {},
      activeScenario: {},

      addScenario: (brandId, scenario) => {
        set((state) => ({
          scenarios: {
            ...state.scenarios,
            [brandId]: [...(state.scenarios[brandId] || []), scenario],
          },
        }));
      },

      updateScenario: (brandId, scenarioId, data) => {
        set((state) => ({
          scenarios: {
            ...state.scenarios,
            [brandId]: (state.scenarios[brandId] || []).map((s) =>
              s.id === scenarioId ? { ...s, ...data } : s
            ),
          },
        }));
      },

      deleteScenario: (brandId, scenarioId) => {
        set((state) => ({
          scenarios: {
            ...state.scenarios,
            [brandId]: (state.scenarios[brandId] || []).filter((s) => s.id !== scenarioId),
          },
          activeScenario: {
            ...state.activeScenario,
            [brandId]: state.activeScenario[brandId] === scenarioId ? null : state.activeScenario[brandId],
          },
        }));
      },

      setActiveScenario: (brandId, scenarioId) => {
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            [brandId]: scenarioId,
          },
        }));
      },

      getScenarios: (brandId) => {
        return get().scenarios[brandId] || [];
      },

      getActiveScenario: (brandId) => {
        const activeId = get().activeScenario[brandId];
        if (!activeId) return null;
        return (get().scenarios[brandId] || []).find((s) => s.id === activeId) || null;
      },
    }),
    {
      name: 'ff-scenarios-storage',
    }
  )
);

