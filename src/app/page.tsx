'use client';

import { BrandCard } from '@/features/dashboard/components/BrandCard';
import { BRANDS } from '@/features/dashboard/constants/brands';
import { Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <header className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  F&F 26SS 사업계획 네비게이터
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  브랜드별 실적 분석 및 사업계획 시뮬레이션
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm text-slate-600 font-medium">
                {BRANDS.length}개 브랜드
              </span>
            </div>
          </div>
        </header>

        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">브랜드 선택</h2>
              <p className="text-sm text-slate-500 mt-1">
                분석할 브랜드를 선택하세요
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {BRANDS.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
