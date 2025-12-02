'use client';

import { useState, useMemo } from 'react';
import { BrandMockData } from '../constants/mockData';
import { SimulationInputForm } from './SimulationInputForm';
import { SimulationResult } from './SimulationResult';
import {
  SimulationInput,
  SimulationResult as SimulationResultType,
  calculateSimulation,
  getDefaultSimulationInput,
} from '../lib/calc';
import { Brand } from '../constants/brands';

interface Plan26STabProps {
  brand: Brand;
  data: BrandMockData;
}

export const Plan26STab = ({ brand, data }: Plan26STabProps) => {
  const season25S = data.seasons.find((s) => s.season === '25S');
  const [input, setInput] = useState<SimulationInput>(() =>
    getDefaultSimulationInput(data.channels)
  );

  const result: SimulationResultType | null = useMemo(() => {
    if (!season25S) return null;
    return calculateSimulation(data.channels, input);
  }, [data.channels, input, season25S]);

  if (!season25S || !result) {
    return (
      <div className="text-center py-12 text-slate-500">
        25S 시즌 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
          시뮬레이션 입력
        </h2>
        <SimulationInputForm
          channels={data.channels}
          input={input}
          onInputChange={setInput}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full" />
          시뮬레이션 결과
        </h2>
        <SimulationResult
          brand={brand}
          season25S={season25S}
          result={result}
        />
      </section>
    </div>
  );
};



