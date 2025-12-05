'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBrandById } from '@/features/dashboard/constants/brands';
import { getBrandMockData } from '@/features/dashboard/constants/mockData';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { HistoricalTab } from '@/features/dashboard/components/HistoricalTab';
import { Plan26STab } from '@/features/dashboard/components/Plan26STab';
import { Order26STab } from '@/features/dashboard/components/Order26STab';
import { Markup26STab } from '@/features/dashboard/components/Markup26STab';
import { AdExpense26STab } from '@/features/dashboard/components/AdExpense26STab';
import { Headcount26STab } from '@/features/dashboard/components/Headcount26STab';
import { PnL26STab } from '@/features/dashboard/components/PnL26STab';
import { useActualSalesData, useSalesTagData } from '@/features/dashboard/hooks/useSalesData';
import { BarChart3, DollarSign, Package, Percent, Megaphone, Users, FileText } from 'lucide-react';

interface BrandPageProps {
  params: Promise<{ brand: string }>;
}

export default function BrandPage({ params }: BrandPageProps) {
  const { brand: brandId } = use(params);
  const brand = getBrandById(brandId);
  const data = getBrandMockData(brandId);

  // 25S 실판매TAG/실판매출액 조회 (천원 단위로 변환) - 과거실적과 동일 소스 사용
  const brandCodeForApi = brand?.snowflakeCode || brand?.id || '';
  const { data: actualSales25S } = useActualSalesData(brandCodeForApi, '25S');
  const { data: salesTag25S } = useSalesTagData(brandCodeForApi, '25S');

  const season25SActualSales = actualSales25S?.total
    ? actualSales25S.total * 1000 // 백만원 -> 천원 변환
    : 0;
  const season25SSalesTag = salesTag25S?.total
    ? salesTag25S.total * 1000 // 백만원 -> 천원 변환
    : 0;

  if (!brand || !data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <DashboardHeader brand={brand} />

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <Tabs defaultValue="historical" className="w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-2 mb-8">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 h-auto bg-transparent gap-1">
              <TabsTrigger 
                value="historical" 
                className="gap-1.5 flex-col py-3 rounded-xl transition-all duration-200 hover:bg-blue-50/50 hover:text-blue-600 hover:scale-105 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-blue-200 data-[state=active]:scale-105"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-xs font-medium">과거 실적</span>
              </TabsTrigger>
            <TabsTrigger 
              value="revenue" 
              className="gap-1.5 flex-col py-3 rounded-xl transition-all duration-200 hover:bg-emerald-50/50 hover:text-emerald-600 hover:scale-105 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-emerald-200 data-[state=active]:scale-105"
            >
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium">26S 매출</span>
            </TabsTrigger>
            <TabsTrigger 
              value="order" 
              className="gap-1.5 flex-col py-3 rounded-xl transition-all duration-200 hover:bg-amber-50/50 hover:text-amber-600 hover:scale-105 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-amber-200 data-[state=active]:scale-105"
            >
              <Package className="w-4 h-4" />
              <span className="text-xs font-medium">26S 발주</span>
            </TabsTrigger>
            <TabsTrigger 
              value="markup" 
              className="gap-1.5 flex-col py-3 rounded-xl transition-all duration-200 hover:bg-purple-50/50 hover:text-purple-600 hover:scale-105 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-purple-200 data-[state=active]:scale-105"
            >
              <Percent className="w-4 h-4" />
              <span className="text-xs font-medium">26S M/U</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ad" 
              className="gap-1.5 flex-col py-3 rounded-xl transition-all duration-200 hover:bg-pink-50/50 hover:text-pink-600 hover:scale-105 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-pink-200 data-[state=active]:scale-105"
            >
              <Megaphone className="w-4 h-4" />
              <span className="text-xs font-medium">26S 광고비</span>
            </TabsTrigger>
            <TabsTrigger 
              value="headcount" 
              className="gap-1.5 flex-col py-3 rounded-xl transition-all duration-200 hover:bg-indigo-50/50 hover:text-indigo-600 hover:scale-105 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-indigo-200 data-[state=active]:scale-105"
            >
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">26S 인원</span>
            </TabsTrigger>
            <TabsTrigger 
              value="summary" 
              className="gap-1.5 flex-col py-3 rounded-xl transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 hover:scale-105 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-slate-300 data-[state=active]:scale-105"
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">손익계획</span>
            </TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="historical">
            <HistoricalTab brand={brand} data={data} />
          </TabsContent>

          <TabsContent value="revenue">
            <Plan26STab
              brand={brand}
              season25SActualSales={season25SActualSales}
              season25SSalesTag={season25SSalesTag}
              baselineActualSalesChannels={actualSales25S?.data || []}
              baselineSalesTagChannels={salesTag25S?.data || []}
            />
          </TabsContent>

          <TabsContent value="order">
            <Order26STab brand={brand} data={data} />
          </TabsContent>

          <TabsContent value="markup">
            <Markup26STab brand={brand} data={data} />
          </TabsContent>

          <TabsContent value="ad">
            <AdExpense26STab brand={brand} data={data} />
          </TabsContent>

          <TabsContent value="headcount">
            <Headcount26STab brand={brand} data={data} />
          </TabsContent>

          <TabsContent value="summary">
            <PnL26STab brand={brand} data={data} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}



