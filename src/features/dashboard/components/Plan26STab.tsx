'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, DollarSign, BarChart3 } from 'lucide-react';
import { Brand } from '../constants/brands';
import { usePlan26SStore } from '../hooks/usePlan26SStore';
import { SalesInputTable } from './SalesInputTable';
import { ExcelUploader } from './ExcelUploader';
import { ScenarioManager } from './ScenarioManager';
import { SalesCompareCharts } from './charts/SalesCompareCharts';
import { SalesInputRow, CHANNELS, formatThousandWon } from '../types/plan26s';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Plan26STabProps {
  brand: Brand;
  season25SActualSales?: number; // 과거실적에서 가져온 25S 실판매출액 (천원)
  season25SSalesTag?: number; // 과거실적에서 가져온 25S 판매TAG (천원)
  baselineActualSalesChannels?: { CHNL_NM: string; ACT_SALE_AMT?: number }[];
  baselineSalesTagChannels?: { CHNL_NM: string; SALE_TAG_AMT?: number }[];
}

export const Plan26STab = ({
  brand,
  season25SActualSales = 0,
  season25SSalesTag = 0,
  baselineActualSalesChannels = [],
  baselineSalesTagChannels = [],
}: Plan26STabProps) => {
  const [activeTab, setActiveTab] = useState<'input' | 'result'>('input');
  const {
    scenarios,
    activeScenarioId,
    season25SData,
    createScenario,
    deleteScenario,
    duplicateScenario,
    setActiveScenario,
    updateScenarioName,
    updateSalesInput,
    bulkUpdateSalesInputs,
    setSeason25SData,
    getSeason25STotal,
    getChannelSummary,
    getSeasonSummary,
    getItemCategorySummary,
    getTotalSales26S,
  } = usePlan26SStore();

  const brandCode = brand.id;
  const currentActiveId = usePlan26SStore((state) => state.activeScenarioId[brandCode]);
  const brandScenarios = usePlan26SStore((state) => state.scenarios[brandCode] || []);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>(() =>
    currentActiveId ? [currentActiveId] : []
  );
  const activeScenario = useMemo(
    () => brandScenarios.find((s) => s.id === currentActiveId) || null,
    [brandScenarios, currentActiveId]
  );
  const season25STotal = getSeason25STotal(brandCode);

  // 25S 데이터 동기화
  useEffect(() => {
    if (season25SActualSales > 0 && season25SActualSales !== season25STotal) {
      setSeason25SData(brandCode, season25SActualSales);
    }
  }, [brandCode, season25SActualSales, season25STotal, setSeason25SData]);

  // 시나리오가 없으면 자동 생성
  useEffect(() => {
    if (brandScenarios.length === 0) {
      createScenario(brandCode, '기본 시나리오');
    }
  }, [brandCode, brandScenarios.length, createScenario]);

  const handleCreateScenario = useCallback(
    (name?: string) => {
      createScenario(brandCode, name);
    },
    [brandCode, createScenario]
  );

  const handleSelectScenario = useCallback(
    (scenarioId: string) => {
      setActiveScenario(brandCode, scenarioId);
    },
    [brandCode, setActiveScenario]
  );

  const handleDuplicateScenario = useCallback(
    (scenarioId: string) => {
      duplicateScenario(brandCode, scenarioId);
    },
    [brandCode, duplicateScenario]
  );

  const handleDeleteScenario = useCallback(
    (scenarioId: string) => {
      deleteScenario(brandCode, scenarioId);
    },
    [brandCode, deleteScenario]
  );

  const handleRenameScenario = useCallback(
    (scenarioId: string, name: string) => {
      updateScenarioName(brandCode, scenarioId, name);
    },
    [brandCode, updateScenarioName]
  );

  const handleUpdateInput = useCallback(
    (rowId: string, updates: Partial<SalesInputRow>) => {
      if (currentActiveId) {
        updateSalesInput(brandCode, currentActiveId, rowId, updates);
      }
    },
    [brandCode, currentActiveId, updateSalesInput]
  );

  const handleBulkUpdate = useCallback(
    (inputs: SalesInputRow[]) => {
      if (currentActiveId) {
        bulkUpdateSalesInputs(brandCode, currentActiveId, inputs);
      }
    },
    [brandCode, currentActiveId, bulkUpdateSalesInputs]
  );

  // 채널별 25S 기준값 맵 (백만원 → 천원 변환)
  const baselineByChannel = useMemo(() => {
    const map: Record<string, { salesTag: number; actual: number; discount: number }> = {};
    CHANNELS.forEach((ch) => {
      const tag = baselineSalesTagChannels?.find((c) => c.CHNL_NM === ch.name)?.SALE_TAG_AMT ?? 0;
      const act = baselineActualSalesChannels?.find((c) => c.CHNL_NM === ch.name)?.ACT_SALE_AMT ?? 0;
      const tagK = tag * 1000;
      const actK = act * 1000;
      const disc = tagK > 0 ? (1 - actK / tagK) * 100 : 0;
      map[ch.code] = { salesTag: tagK, actual: actK, discount: disc };
    });
    return map;
  }, [baselineActualSalesChannels, baselineSalesTagChannels]);

  // 채널별 전년비 성장률 입력: 성장률 적용 시 TAG/실판매출액 모두 곱하기
  const [channelGrowthRates, setChannelGrowthRates] = useState<Record<string, number>>({});

  // 시즌별 baseline (25S, 25N, 24S 등) 실판매 합계(천원) 가져오기
  const [seasonBaselineTotals, setSeasonBaselineTotals] = useState<Record<string, number>>({});
  const seasonsToFetch = ['26S', '25S', '25N', '25F', '24S', '24N', '24F', '23S', '23N', '23F'];

  useEffect(() => {
    const loadSeasonTotals = async () => {
      try {
        const entries = await Promise.all(
          seasonsToFetch.map(async (seasonCode) => {
            const brandCodeForApi = brand.snowflakeCode || brand.id || '';
            const res = await fetch(`/api/pnl/actual-sales?brandCode=${encodeURIComponent(brandCodeForApi)}&season=${seasonCode}`);
            if (!res.ok) return [seasonCode, 0] as const;
            const json = await res.json();
            // API total은 백만원 단위 → 천원 변환
            const totalThousand = json?.total ? json.total * 1000 : 0;
            return [seasonCode, totalThousand] as const;
          })
        );
        const map: Record<string, number> = {};
        entries.forEach(([k, v]) => {
          map[k] = v;
        });
        setSeasonBaselineTotals(map);
      } catch (e) {
        console.error('season baseline load error', e);
      }
    };
    loadSeasonTotals();
  }, [brand.snowflakeCode, brand.id]);

  // 시즌별 계획 합계(천원) 계산
  // 다중 시나리오 합산(선택된 시나리오)
  const selectedScenarios = useMemo(() => {
    const ids = selectedScenarioIds.length > 0 ? selectedScenarioIds : currentActiveId ? [currentActiveId] : [];
    return brandScenarios.filter((s) => ids.includes(s.id));
  }, [brandScenarios, currentActiveId, selectedScenarioIds]);

  const seasonPlanTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    selectedScenarios.forEach((scenario) => {
      scenario.salesInputs.forEach((row) => {
        totals[row.seasonCode] = (totals[row.seasonCode] || 0) + row.actualSalesAmt;
      });
    });
    return totals;
  }, [selectedScenarios]);

  // 전년 시즌 코드 매핑 (26S -> 25S, 25N -> 24N 등)
  const getPrevSeason = useCallback((code: string) => {
    if (code.length < 3) return code;
    const yy = parseInt(code.slice(0, 2), 10);
    const suf = code.slice(2);
    const prev = (yy - 1).toString().padStart(2, '0');
    return `${prev}${suf}`;
  }, []);

  // 시즌별 baseline: 계획 시즌의 전년 시즌 값을 매칭
  const baseSeasonData = useMemo(() => {
    return Object.keys(seasonPlanTotals).map((planSeason) => {
      const prev = getPrevSeason(planSeason);
      const base = seasonBaselineTotals[prev] || 0;
      return {
        seasonCode: planSeason,
        seasonName: planSeason,
        sales25S: base, // 전년 시즌 실적
        sales26S: 0,
        change: 0,
        changeRate: 0,
      };
    });
  }, [seasonPlanTotals, seasonBaselineTotals, getPrevSeason]);

  const applyChannelGrowth = useCallback(() => {
    if (!currentActiveId || !activeScenario) return;

    const rateMap = channelGrowthRates;
    if (Object.keys(rateMap).length === 0) return;

    const hasBaseline = Object.values(baselineByChannel).some((b) => b.actual > 0 || b.salesTag > 0);

    // 모든 입력이 0이고 baseline이 있으면 채널 단일 행으로 재구성
    const totalExisting = activeScenario.salesInputs.reduce(
      (sum, r) => sum + r.salesTagAmt + r.actualSalesAmt,
      0
    );

    let updated: SalesInputRow[] = [];

    if (totalExisting === 0 && hasBaseline) {
      updated = CHANNELS.map((ch, idx) => {
        const base = baselineByChannel[ch.code] || { salesTag: 0, actual: 0, discount: 0 };
        const rate = rateMap[ch.code] ?? 0;
        const factor = 1 + rate / 100;
        const salesTagAmt = Math.round(base.salesTag * factor);
        const actualSalesAmt = Math.round(base.actual * factor);
        return {
          id: `auto-${Date.now()}-${idx}`,
          channelCode: ch.code,
          seasonCode: '26S',
          categoryCode: 'WEAR',
          salesTagAmt,
          discountRate: base.salesTag > 0 ? (1 - base.actual / base.salesTag) * 100 : 0,
          actualSalesAmt,
        };
      });
    } else {
      updated = activeScenario.salesInputs.map((input) => {
        const rate = rateMap[input.channelCode] ?? 0;
        const factor = 1 + rate / 100;
        // baseline 보정: 기존 값이 0이고 baseline이 있으면 baseline부터 곱하기
        const base = baselineByChannel[input.channelCode];
        const baseTag = input.salesTagAmt === 0 && base ? base.salesTag : input.salesTagAmt;
        const baseAct = input.actualSalesAmt === 0 && base ? base.actual : input.actualSalesAmt;
        return {
          ...input,
          salesTagAmt: Math.round(baseTag * factor),
          actualSalesAmt: Math.round(baseAct * factor),
        };
      });
    }

    bulkUpdateSalesInputs(brandCode, currentActiveId, updated);
    // 적용 완료 알림
    alert('채널별 성장률이 적용되었습니다.');
  }, [activeScenario, baselineByChannel, brandCode, bulkUpdateSalesInputs, channelGrowthRates, currentActiveId]);

  // 채널별 집계 (25S: baseline, 26S: 입력값 합계)
  const channelSummary = useMemo(() => {
    if (!activeScenario) return [];

    const baseMap = baselineByChannel;
    const agg26: Record<string, number> = {};
    activeScenario.salesInputs.forEach((row) => {
      agg26[row.channelCode] = (agg26[row.channelCode] || 0) + row.actualSalesAmt;
    });

    return CHANNELS.map((ch) => {
      const baseActual = baseMap[ch.code]?.actual || 0;
      const planActual = agg26[ch.code] || 0;
      const change = planActual - baseActual;
      const changeRate =
        baseActual > 0 ? (change / baseActual) * 100 : planActual > 0 ? 100 : 0;

      return {
        channelCode: ch.code,
        channelName: ch.name,
        sales25S: baseActual,
        sales26S: planActual,
        change,
        changeRate,
      };
    }).filter((row) => row.sales25S !== 0 || row.sales26S !== 0);
  }, [activeScenario, baselineByChannel]);

  // 시즌별 비교: baseline(전년/실적) vs 계획(선택 시나리오)
  const seasonSummary = useMemo(() => {
    const unionSeasons = Array.from(
      new Set([
        ...Object.keys(seasonBaselineTotals || {}),
        ...Object.keys(seasonPlanTotals || {}),
      ])
    ).sort();

    return unionSeasons.map((code) => {
      const base = seasonBaselineTotals[code] || 0;
      const plan = seasonPlanTotals[code] || 0;
      const change = plan - base;
      const changeRate = base > 0 ? (change / base) * 100 : plan > 0 ? 100 : 0;
      return {
        seasonCode: code,
        seasonName: code,
        sales25S: base,   // baseline (실적)
        sales26S: plan,   // 계획
        change,
        changeRate,
      };
    }).filter((row) => row.sales25S !== 0 || row.sales26S !== 0);
  }, [seasonBaselineTotals, seasonPlanTotals]);

  const itemCategorySummary = useMemo(() => {
    if (!currentActiveId) return [];
    return getItemCategorySummary(brandCode, currentActiveId);
  }, [brandCode, currentActiveId, getItemCategorySummary, brandScenarios]);

  const totalSales26S = useMemo(() => {
    return selectedScenarios.reduce((sum, s) => {
      return sum + s.salesInputs.reduce((acc, row) => acc + row.actualSalesAmt, 0);
    }, 0);
  }, [selectedScenarios]);

  const discount25S =
    season25SSalesTag > 0 && season25SActualSales > 0
      ? (1 - season25SActualSales / season25SSalesTag) * 100
      : 0;

  // 시뮬레이션 결과 계산
  if (!activeScenario) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <p className="ml-3 text-lg text-slate-700">시나리오 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 시나리오 관리 */}
      <ScenarioManager
        scenarios={brandScenarios}
        activeScenarioId={currentActiveId}
        onCreateScenario={handleCreateScenario}
        onSelectScenario={handleSelectScenario}
        onDuplicateScenario={handleDuplicateScenario}
        onDeleteScenario={handleDeleteScenario}
        onRenameScenario={handleRenameScenario}
      />

      {/* 탭 전환 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'input' | 'result')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="input" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            매출 입력
          </TabsTrigger>
          <TabsTrigger value="result" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            비교 분석
          </TabsTrigger>
        </TabsList>

        {/* 매출 입력 탭 */}
        <TabsContent value="input" className="space-y-6 mt-6">
          {/* 안내 문구 */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="py-4 text-sm text-slate-700 space-y-1">
              <p>매출 입력은 두 가지 방식 중 하나를 사용하세요: ① 엑셀 업로드, ② 채널별 전년비 성장률 입력. 입력 후 TAG/실판매출액이 바로 반영됩니다.</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-600">
                <div className="p-2 bg-white border border-slate-200 rounded">
                  <p className="text-slate-500">25S 판매TAG</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {season25SSalesTag > 0 ? `${formatThousandWon(season25SSalesTag)} 천원` : '-'}
                  </p>
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded">
                  <p className="text-slate-500">25S 할인율</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {season25SSalesTag > 0 ? `${discount25S.toFixed(1)}%` : '-'}
                  </p>
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded">
                  <p className="text-slate-500">25S 실판매출액</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {season25SActualSales > 0 ? `${formatThousandWon(season25SActualSales)} 천원` : '-'}
                  </p>
                </div>
                <div className="p-2 bg-white border border-blue-200 rounded">
                  <p className="text-slate-500">현재 26S 계획</p>
                  <p className="text-sm font-semibold text-blue-700">
                    {totalSales26S > 0 ? `${formatThousandWon(totalSales26S)} 천원` : '0 천원'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 엑셀 업로드 */}
          <ExcelUploader
            onUpload={handleBulkUpdate}
            currentInputs={activeScenario.salesInputs}
          />

          {/* 채널별 전년비 성장률 입력 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                채널별 전년비 성장률 입력 (TAG/실판매출액 일괄 반영) - 방법 ②
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {CHANNELS.map((ch) => (
                  <div key={ch.code} className="flex items-center gap-3">
                    <div className="min-w-[96px] text-sm text-slate-700">{ch.name}</div>
                    <input
                      type="number"
                      className="h-9 w-28 rounded border border-slate-200 px-2 text-right"
                      value={channelGrowthRates[ch.code] ?? 0}
                      onChange={(e) =>
                        setChannelGrowthRates((prev) => ({
                          ...prev,
                          [ch.code]: Number(e.target.value),
                        }))
                      }
                    />
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setChannelGrowthRates({})}>
                  초기화
                </Button>
                <Button size="sm" onClick={applyChannelGrowth} className="bg-emerald-600 hover:bg-emerald-700">
                  성장률 적용
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                * 입력한 성장률이 해당 채널의 모든 시즌·카테고리 행에 곱해져 판매TAG/실판매출액을 동시에 반영합니다.
              </p>
            </CardContent>
          </Card>

          {/* 매출 입력 테이블 */}
          <SalesInputTable
            inputs={activeScenario.salesInputs}
            season25STotal={season25STotal}
            onUpdateInput={handleUpdateInput}
            baselineByChannel={baselineByChannel}
          />

          {/* 25S vs 26S 요약 (실판매출액 기준) */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-blue-900">
                25S vs 26S 요약 (실판매출액 기준)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500">25S 실판매출액</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatThousandWon(season25STotal)} 천원
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500">26S 계획 실판매출액</p>
                <p className="text-xl font-bold text-blue-700">
                  {formatThousandWon(totalSales26S)} 천원
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500">증감 (V+)</p>
                <p className={`text-xl font-bold ${totalSales26S - season25STotal >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {totalSales26S - season25STotal >= 0 ? '+' : ''}
                  {formatThousandWon(totalSales26S - season25STotal)} 천원
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {season25STotal > 0 ? ((totalSales26S - season25STotal) / season25STotal * 100).toFixed(1) : '0.0'}%
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 비교 분석 탭 */}
        <TabsContent value="result" className="space-y-6 mt-6">
      <Card className="border-slate-200">
        <CardHeader className="pb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <CardTitle className="text-base">시나리오별 비교 분석</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-500">시나리오 선택</span>
            <div className="flex flex-wrap gap-2">
              {brandScenarios.map((s) => (
                <label key={s.id} className="flex items-center gap-1 text-xs text-slate-600">
                  <Checkbox
                    checked={selectedScenarioIds.includes(s.id) || (!selectedScenarioIds.length && s.id === currentActiveId)}
                    onCheckedChange={(checked) => {
                      setSelectedScenarioIds((prev) => {
                        if (checked) {
                          return Array.from(new Set([...prev, s.id]));
                        }
                        return prev.filter((id) => id !== s.id);
                      });
                    }}
                  />
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">{s.name}</span>
                </label>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {totalSales26S > 0 ? (
            <SalesCompareCharts
              series={[
                {
                  label: '25S 실적',
                  channelData: channelSummary.map((c) => ({
                    ...c,
                    sales26S: 0,
                    change: 0,
                    changeRate: 0,
                  })),
                  seasonData: baseSeasonData,
                  itemCategoryData: itemCategorySummary.map((i) => ({
                    ...i,
                    sales26S: 0,
                    change: 0,
                    changeRate: 0,
                  })),
                },
                ...selectedScenarios.map((scenario, idx) => {
                  // 채널별
                  const channelAgg: Record<string, number> = {};
                  scenario.salesInputs.forEach((row) => {
                    channelAgg[row.channelCode] = (channelAgg[row.channelCode] || 0) + row.actualSalesAmt;
                  });
                  const channelData = CHANNELS.map((ch) => ({
                    channelCode: ch.code,
                    channelName: ch.name,
                    sales25S: 0,
                    sales26S: channelAgg[ch.code] || 0,
                    change: 0,
                    changeRate: 0,
                  })).filter((c) => c.sales26S !== 0);

                  // 시즌별
                  const seasonAgg: Record<string, number> = {};
                  scenario.salesInputs.forEach((row) => {
                    seasonAgg[row.seasonCode] = (seasonAgg[row.seasonCode] || 0) + row.actualSalesAmt;
                  });
                  const seasonData = Object.entries(seasonAgg).map(([code, val]) => ({
                    seasonCode: code,
                    seasonName: code,
                    sales25S: 0,
                    sales26S: val,
                    change: 0,
                    changeRate: 0,
                  }));

                  // 아이템별
                  const itemAgg: Record<string, number> = {};
                  scenario.salesInputs.forEach((row) => {
                    itemAgg[row.categoryCode] = (itemAgg[row.categoryCode] || 0) + row.actualSalesAmt;
                  });
                  const itemCategoryData = Object.entries(itemAgg).map(([code, val]) => ({
                    categoryCode: code,
                    categoryName: code,
                    sales25S: 0,
                    sales26S: val,
                    change: 0,
                    changeRate: 0,
                  }));

                  return {
                    label: scenario.name,
                    channelData,
                    seasonData,
                    itemCategoryData,
                  };
                }),
              ]}
              excludePurchase
            />
          ) : (
            <div className="p-8 text-center space-y-3">
              <p className="text-slate-500">
                선택된 시나리오에 매출 데이터가 없습니다.
              </p>
              <p className="text-slate-400 text-sm">
                엑셀 업로드나 성장률 적용 후 실판매출액이 계산되면 시나리오별 비교 차트가 표시됩니다.
              </p>
              <Button onClick={() => setActiveTab('input')}>매출 입력으로 이동</Button>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
