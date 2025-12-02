'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandMockData } from '../constants/mockData';
import { Brand } from '../constants/brands';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Users } from 'lucide-react';

interface Headcount26STabProps {
  brand: Brand;
  data: BrandMockData;
}

export const Headcount26STab = ({ brand, data }: Headcount26STabProps) => {
  const [totalHeadcount, setTotalHeadcount] = useState(100);
  const [avgSalary, setAvgSalary] = useState(600);
  const [departments, setDepartments] = useState([
    { dept: 'sales', deptKo: '영업/판매', headcount: 40, salary: 500 },
    { dept: 'marketing', deptKo: '마케팅', headcount: 15, salary: 700 },
    { dept: 'design', deptKo: '디자인/기획', headcount: 20, salary: 650 },
    { dept: 'md', deptKo: 'MD/상품', headcount: 15, salary: 700 },
    { dept: 'support', deptKo: '지원/관리', headcount: 10, salary: 600 },
  ]);

  const totalDeptHeadcount = departments.reduce((sum, dept) => sum + dept.headcount, 0);
  const totalHrCost = totalHeadcount * avgSalary;
  const deptTotalCost = departments.reduce((sum, dept) => sum + dept.headcount * dept.salary, 0);
  
  const season25S = data.seasons.find((s) => s.season === '25S');
  const hrCostRatio = season25S ? (totalHrCost / season25S.revenue) * 100 : 0;

  const updateDeptHeadcount = (dept: string, value: number) => {
    setDepartments((prev) =>
      prev.map((d) => (d.dept === dept ? { ...d, headcount: value } : d))
    );
  };

  const updateDeptSalary = (dept: string, value: number) => {
    setDepartments((prev) =>
      prev.map((d) => (d.dept === dept ? { ...d, salary: value } : d))
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">총 인원</div>
            <div className="text-3xl font-bold text-slate-900">{totalHeadcount}명</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">인당 평균 인건비</div>
            <div className="text-3xl font-bold text-blue-600">{avgSalary}백만</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">총 인건비</div>
            <div className="text-3xl font-bold text-purple-600">
              {(totalHrCost / 10000).toFixed(1)}억
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">매출 대비 비율</div>
            <div className="text-3xl font-bold text-orange-600">{hrCostRatio.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            전체 인원 계획
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="total-headcount">26S 총 인원 (명)</Label>
              <Input
                id="total-headcount"
                type="number"
                value={totalHeadcount}
                onChange={(e) => setTotalHeadcount(Number(e.target.value))}
                className="mt-2 text-lg"
              />
            </div>
            <div>
              <Label htmlFor="avg-salary">인당 평균 인건비 (백만원/년)</Label>
              <Input
                id="avg-salary"
                type="number"
                value={avgSalary}
                onChange={(e) => setAvgSalary(Number(e.target.value))}
                className="mt-2 text-lg"
              />
            </div>
          </div>
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">총 인건비 (연간)</span>
              <span className="text-2xl font-bold text-purple-600">
                {(totalHrCost / 10000).toFixed(1)}억
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>부서별 인원 계획</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departments.map((dept) => (
              <div
                key={dept.dept}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-4 bg-slate-50 rounded-lg"
              >
                <div>
                  <Label className="font-medium">{dept.deptKo}</Label>
                  <p className="text-xs text-slate-400">
                    비중: {((dept.headcount / totalDeptHeadcount) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <Label htmlFor={`headcount-${dept.dept}`} className="text-sm">
                    인원 (명)
                  </Label>
                  <Input
                    id={`headcount-${dept.dept}`}
                    type="number"
                    value={dept.headcount}
                    onChange={(e) => updateDeptHeadcount(dept.dept, Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`salary-${dept.dept}`} className="text-sm">
                    인당 인건비 (백만/년)
                  </Label>
                  <Input
                    id={`salary-${dept.dept}`}
                    type="number"
                    value={dept.salary}
                    onChange={(e) => updateDeptSalary(dept.dept, Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <div className="text-sm text-slate-500">부서 총 인건비</div>
                  <div className="text-lg font-semibold text-purple-600">
                    {((dept.headcount * dept.salary) / 10000).toFixed(1)}억
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-purple-900">부서별 합계</span>
              <div className="text-right">
                <div className="text-sm text-purple-700">
                  {totalDeptHeadcount}명 / {(deptTotalCost / 10000).toFixed(1)}억
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-indigo-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Users className="w-6 h-6 text-indigo-600 mt-1" />
            <div>
              <h3 className="font-semibold text-indigo-900 mb-2">인원 계획 가이드</h3>
              <ul className="text-sm text-indigo-800 space-y-1">
                <li>• 일반적으로 인건비는 매출의 10-13% 수준이 적정합니다</li>
                <li>• 영업/판매 인력이 전체의 40-50%를 차지합니다</li>
                <li>• 시즌 특성에 따라 계약직/파트타임 인력을 활용하세요</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

