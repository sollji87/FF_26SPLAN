'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ChannelData, formatCurrency } from '../constants/mockData';
import { SimulationInput } from '../lib/calc';
import { Settings2, TrendingUp, DollarSign, Users } from 'lucide-react';

interface SimulationInputFormProps {
  channels: ChannelData[];
  input: SimulationInput;
  onInputChange: (input: SimulationInput) => void;
}

export const SimulationInputForm = ({
  channels,
  input,
  onInputChange,
}: SimulationInputFormProps) => {
  const updateField = <K extends keyof SimulationInput>(
    field: K,
    value: SimulationInput[K]
  ) => {
    onInputChange({ ...input, [field]: value });
  };

  const updateChannelGrowth = (channel: string, growthRate: number) => {
    const updated = input.channelGrowthRates.map((g) =>
      g.channel === channel ? { ...g, growthRate } : g
    );
    updateField('channelGrowthRates', updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            매출 계획 (성장률)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="useCommonRate" className="text-sm">
              전체 채널 공통 성장률 적용
            </Label>
            <Switch
              id="useCommonRate"
              checked={input.useCommonRate}
              onCheckedChange={(checked) => updateField('useCommonRate', checked)}
            />
          </div>

          {input.useCommonRate ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm text-slate-600">공통 성장률</Label>
                <span className="text-lg font-semibold text-emerald-600">
                  {input.commonGrowthRate}%
                </span>
              </div>
              <Slider
                value={[input.commonGrowthRate]}
                onValueChange={([value]) => updateField('commonGrowthRate', value)}
                min={-20}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>-20%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {channels.map((channel) => {
                const growth = input.channelGrowthRates.find(
                  (g) => g.channel === channel.channel
                );
                return (
                  <div key={channel.channel} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">
                        {channel.channelKo}
                        <span className="text-xs text-slate-400 ml-2">
                          (25S: {formatCurrency(channel.revenue25S)})
                        </span>
                      </Label>
                      <span className="text-sm font-medium text-emerald-600">
                        {growth?.growthRate ?? 0}%
                      </span>
                    </div>
                    <Slider
                      value={[growth?.growthRate ?? 0]}
                      onValueChange={([value]) =>
                        updateChannelGrowth(channel.channel, value)
                      }
                      min={-20}
                      max={50}
                      step={1}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-blue-600" />
            비용 및 마진 계획
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm text-slate-600">목표 M/U (마크업)</Label>
              <span className="text-lg font-semibold text-blue-600">
                {input.targetMU}%
              </span>
            </div>
            <Slider
              value={[input.targetMU]}
              onValueChange={([value]) => updateField('targetMU', value)}
              min={150}
              max={400}
              step={5}
            />
            <p className="text-xs text-slate-400">
              M/U = TAG(V+) / 원가. 높을수록 원가율이 낮아집니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adExpense" className="text-sm flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                광고선전비 (백만원)
              </Label>
              <Input
                id="adExpense"
                type="number"
                value={input.adExpense}
                onChange={(e) => updateField('adExpense', Number(e.target.value))}
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderAmount" className="text-sm flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                발주액 (백만원)
              </Label>
              <Input
                id="orderAmount"
                type="number"
                value={input.orderAmount}
                onChange={(e) => updateField('orderAmount', Number(e.target.value))}
                className="text-right"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-sm">인원 계획</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="headcount" className="text-sm">
                  인원 수 (명)
                </Label>
                <Input
                  id="headcount"
                  type="number"
                  value={input.headcount}
                  onChange={(e) => updateField('headcount', Number(e.target.value))}
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hrCostPerPerson" className="text-sm">
                  인당 인건비 (백만원/년)
                </Label>
                <Input
                  id="hrCostPerPerson"
                  type="number"
                  value={input.hrCostPerPerson}
                  onChange={(e) =>
                    updateField('hrCostPerPerson', Number(e.target.value))
                  }
                  className="text-right"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              총 인건비: {formatCurrency(input.headcount * input.hrCostPerPerson)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};



