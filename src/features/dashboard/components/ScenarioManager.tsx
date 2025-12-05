'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Save,
  Copy,
  Trash2,
  MoreVertical,
  Edit2,
  FolderOpen,
} from 'lucide-react';
import { Scenario26S } from '../types/plan26s';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ScenarioManagerProps {
  scenarios: Scenario26S[];
  activeScenarioId: string | null;
  onCreateScenario: (name?: string) => void;
  onSelectScenario: (scenarioId: string) => void;
  onDuplicateScenario: (scenarioId: string) => void;
  onDeleteScenario: (scenarioId: string) => void;
  onRenameScenario: (scenarioId: string, name: string) => void;
}

export const ScenarioManager = ({
  scenarios,
  activeScenarioId,
  onCreateScenario,
  onSelectScenario,
  onDuplicateScenario,
  onDeleteScenario,
  onRenameScenario,
}: ScenarioManagerProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [targetScenarioId, setTargetScenarioId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);
  const targetScenario = scenarios.find((s) => s.id === targetScenarioId);

  const handleCreate = useCallback(() => {
    onCreateScenario(newScenarioName || undefined);
    setNewScenarioName('');
    setIsCreateDialogOpen(false);
  }, [newScenarioName, onCreateScenario]);

  const handleRename = useCallback(() => {
    if (targetScenarioId && renameValue.trim()) {
      onRenameScenario(targetScenarioId, renameValue.trim());
      setIsRenameDialogOpen(false);
      setTargetScenarioId(null);
      setRenameValue('');
    }
  }, [targetScenarioId, renameValue, onRenameScenario]);

  const handleDelete = useCallback(() => {
    if (targetScenarioId) {
      onDeleteScenario(targetScenarioId);
      setIsDeleteDialogOpen(false);
      setTargetScenarioId(null);
    }
  }, [targetScenarioId, onDeleteScenario]);

  const openRenameDialog = useCallback((scenarioId: string) => {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (scenario) {
      setTargetScenarioId(scenarioId);
      setRenameValue(scenario.name);
      setIsRenameDialogOpen(true);
    }
  }, [scenarios]);

  const openDeleteDialog = useCallback((scenarioId: string) => {
    setTargetScenarioId(scenarioId);
    setIsDeleteDialogOpen(true);
  }, []);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-amber-600" />
            시나리오 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {/* 시나리오 선택 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">현재 시나리오:</span>
              <Select
                value={activeScenarioId || ''}
                onValueChange={onSelectScenario}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="시나리오 선택" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.length === 0 ? (
                    <SelectItem value="" disabled>
                      시나리오가 없습니다
                    </SelectItem>
                  ) : (
                    scenarios.map((scenario) => (
                      <SelectItem key={scenario.id} value={scenario.id}>
                        <div className="flex flex-col">
                          <span>{scenario.name}</span>
                          <span className="text-xs text-slate-400">
                            {format(new Date(scenario.updatedAt), 'MM/dd HH:mm', { locale: ko })}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 액션 버튼들 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              새 시나리오
            </Button>

            {activeScenario && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openRenameDialog(activeScenario.id)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    이름 변경
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicateScenario(activeScenario.id)}>
                    <Copy className="w-4 h-4 mr-2" />
                    복제
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => openDeleteDialog(activeScenario.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* 시나리오 정보 */}
            {activeScenario && (
              <div className="flex-1 text-right text-xs text-slate-500">
                마지막 수정: {format(new Date(activeScenario.updatedAt), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
              </div>
            )}
          </div>

          {scenarios.length === 0 && (
            <div className="mt-4 p-6 text-center bg-slate-50 rounded-lg">
              <p className="text-slate-600 mb-2">아직 시나리오가 없습니다.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                첫 번째 시나리오 만들기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 새 시나리오 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 시나리오 만들기</DialogTitle>
            <DialogDescription>
              26S 사업계획 시나리오를 만들어 다양한 매출 계획을 시뮬레이션해보세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="시나리오 이름 (예: 보수적 시나리오)"
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreate}>만들기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 이름 변경 다이얼로그 */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>시나리오 이름 변경</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="새 이름"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleRename}>변경</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>시나리오 삭제</DialogTitle>
            <DialogDescription>
              "{targetScenario?.name}" 시나리오를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
