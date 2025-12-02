'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandMockData } from '../constants/mockData';
import { Brand } from '../constants/brands';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Package } from 'lucide-react';

interface Order26STabProps {
  brand: Brand;
  data: BrandMockData;
}

export const Order26STab = ({ brand, data }: Order26STabProps) => {
  const [orderAmount, setOrderAmount] = useState(500000);
  const [categoryOrders, setCategoryOrders] = useState([
    { category: '상의', categoryKo: '상의', amount: 150000, ratio: 30 },
    { category: '하의', categoryKo: '하의', amount: 120000, ratio: 24 },
    { category: '아우터', categoryKo: '아우터', amount: 100000, ratio: 20 },
    { category: '모자', categoryKo: '모자', amount: 80000, ratio: 16 },
    { category: '기타', categoryKo: '기타', amount: 50000, ratio: 10 },
  ]);

  const totalCategoryAmount = categoryOrders.reduce((sum, cat) => sum + cat.amount, 0);

  const updateCategoryAmount = (category: string, value: number) => {
    setCategoryOrders((prev) =>
      prev.map((cat) =>
        cat.category === category
          ? {
              ...cat,
              amount: value,
              ratio: (value / totalCategoryAmount) * 100,
            }
          : cat
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">총 발주액</div>
            <div className="text-3xl font-bold text-slate-900">
              {(orderAmount / 10000).toFixed(1)}억
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">카테고리별 발주 합계</div>
            <div className="text-3xl font-bold text-blue-600">
              {(totalCategoryAmount / 10000).toFixed(1)}억
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            총 발주액 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label htmlFor="total-order">26S 총 발주액 (백만원)</Label>
            <Input
              id="total-order"
              type="number"
              value={orderAmount}
              onChange={(e) => setOrderAmount(Number(e.target.value))}
              className="mt-2 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>카테고리별 발주 계획</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryOrders.map((cat) => (
              <div key={cat.category} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <Label className="font-medium">{cat.categoryKo}</Label>
                </div>
                <div>
                  <Label htmlFor={`order-${cat.category}`} className="text-sm">
                    발주액 (백만원)
                  </Label>
                  <Input
                    id={`order-${cat.category}`}
                    type="number"
                    value={cat.amount}
                    onChange={(e) => updateCategoryAmount(cat.category, Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <div className="text-sm text-slate-500">구성비</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {((cat.amount / totalCategoryAmount) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Package className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">발주 계획 가이드</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 총 발주액은 예상 매출의 40-50% 수준이 적정합니다</li>
                <li>• 카테고리별 발주 비율은 과거 판매 실적을 참고하세요</li>
                <li>• 시즌 특성(봄/여름)을 고려한 상품 구성이 필요합니다</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

