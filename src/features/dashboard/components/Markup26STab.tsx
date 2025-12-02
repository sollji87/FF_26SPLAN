'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandMockData } from '../constants/mockData';
import { Brand } from '../constants/brands';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Percent } from 'lucide-react';

interface Markup26STabProps {
  brand: Brand;
  data: BrandMockData;
}

export const Markup26STab = ({ brand, data }: Markup26STabProps) => {
  const [targetMU, setTargetMU] = useState(250);
  const [categoryMUs, setCategoryMUs] = useState([
    { category: '상의', categoryKo: '상의', mu: 260 },
    { category: '하의', categoryKo: '하의', mu: 250 },
    { category: '아우터', categoryKo: '아우터', mu: 280 },
    { category: '모자', categoryKo: '모자', mu: 300 },
    { category: '기타', categoryKo: '기타', mu: 240 },
  ]);

  const avgMU = categoryMUs.reduce((sum, cat) => sum + cat.mu, 0) / categoryMUs.length;
  const costRate = (100 / targetMU) * 100;
  const gpRate = 100 - costRate;

  const updateCategoryMU = (category: string, value: number) => {
    setCategoryMUs((prev) =>
      prev.map((cat) => (cat.category === category ? { ...cat, mu: value } : cat))
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">목표 M/U</div>
            <div className="text-3xl font-bold text-slate-900">{targetMU}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">예상 원가율</div>
            <div className="text-3xl font-bold text-orange-600">{costRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">예상 매출총이익률</div>
            <div className="text-3xl font-bold text-emerald-600">{gpRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            목표 M/U 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>전체 목표 M/U</Label>
                <span className="text-2xl font-bold text-blue-600">{targetMU}%</span>
              </div>
              <Slider
                value={[targetMU]}
                onValueChange={([value]) => setTargetMU(value)}
                min={150}
                max={400}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>150%</span>
                <span>275%</span>
                <span>400%</span>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600">
                <strong>M/U (Mark-Up)</strong>는 TAG 가격을 원가로 나눈 값입니다.
                <br />
                M/U = TAG(V+) / 원가 × 100
                <br />
                M/U가 높을수록 원가율이 낮아지고 매출총이익률이 높아집니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>카테고리별 M/U 계획</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {categoryMUs.map((cat) => {
              const catCostRate = (100 / cat.mu) * 100;
              const catGpRate = 100 - catCostRate;
              return (
                <div key={cat.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-medium">{cat.categoryKo}</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-500">
                        원가율: {catCostRate.toFixed(1)}%
                      </span>
                      <span className="text-lg font-semibold text-blue-600">{cat.mu}%</span>
                    </div>
                  </div>
                  <Slider
                    value={[cat.mu]}
                    onValueChange={([value]) => updateCategoryMU(cat.category, value)}
                    min={150}
                    max={400}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>GP율: {catGpRate.toFixed(1)}%</span>
                    <span>원가율: {catCostRate.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Percent className="w-6 h-6 text-amber-600 mt-1" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">M/U 설정 가이드</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• 일반적으로 패션 브랜드의 M/U는 250-300% 수준입니다</li>
                <li>• 아우터, 모자 등은 상대적으로 높은 M/U를 설정할 수 있습니다</li>
                <li>• 할인율을 고려하여 충분한 마진을 확보해야 합니다</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

