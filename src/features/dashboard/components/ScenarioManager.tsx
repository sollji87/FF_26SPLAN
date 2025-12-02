'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, FolderOpen, Trash2 } from 'lucide-react';
import { useScenarios, ScenarioData } from '../hooks/useScenarios';
import { Card, CardContent } from '@/components/ui/card';

interface ScenarioManagerProps {
  brandId: string;
  currentData: Partial<ScenarioData>;
  onLoadScenario?: (scenario: ScenarioData) => void;
}

export const ScenarioManager = ({ brandId, currentData, onLoadScenario }: ScenarioManagerProps) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');

  const { scenarios, activeScenario, addScenario, deleteScenario, setActiveScenario, getScenarios } = useScenarios();
  const brandScenarios = getScenarios(brandId);
  const activeScenarioId = activeScenario[brandId];

  const handleSave = () => {
    if (!scenarioName.trim()) return;

    const newScenario: ScenarioData = {
      id: `scenario-${Date.now()}`,
      name: scenarioName,
      createdAt: new Date().toISOString(),
      revenue: currentData.revenue || { channelRevenues: [], totalRevenue: 0 },
      order: currentData.order || { totalAmount: 0, categories: [] },
      markup: currentData.markup || { targetMU: 250, categoryMUs: [] },
      adExpense: currentData.adExpense || { totalAmount: 0, channels: [] },
      headcount: currentData.headcount || { totalHeadcount: 0, avgSalary: 0, departments: [] },
    };

    addScenario(brandId, newScenario);
    setActiveScenario(brandId, newScenario.id);
    setScenarioName('');
    setSaveDialogOpen(false);
  };

  const handleLoad = (scenarioId: string) => {
    const scenario = brandScenarios.find((s) => s.id === scenarioId);
    if (scenario && onLoadScenario) {
      onLoadScenario(scenario);
      setActiveScenario(brandId, scenarioId);
      setLoadDialogOpen(false);
    }
  };

  const handleDelete = (scenarioId: string) => {
    if (confirm('이 시나리오를 삭제하시겠습니까?')) {
      deleteScenario(brandId, scenarioId);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">시나리오 관리</h3>
            <p className="text-sm text-slate-600">
              {activeScenarioId
                ? `활성: ${brandScenarios.find((s) => s.id === activeScenarioId)?.name || '없음'}`
                : '저장된 시나리오가 없습니다'}
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Save className="w-4 h-4" />
                  저장
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>시나리오 저장</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="scenario-name">시나리오 이름</Label>
                    <Input
                      id="scenario-name"
                      placeholder="예: 보수적 시나리오, 공격적 시나리오"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleSave} disabled={!scenarioName.trim()}>
                    저장
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={brandScenarios.length === 0}>
                  <FolderOpen className="w-4 h-4" />
                  불러오기
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>시나리오 불러오기</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {brandScenarios.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      저장된 시나리오가 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {brandScenarios.map((scenario) => (
                        <div
                          key={scenario.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{scenario.name}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(scenario.createdAt).toLocaleString('ko-KR')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLoad(scenario.id)}
                            >
                              불러오기
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(scenario.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

