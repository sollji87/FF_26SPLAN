'use client';

import { Brand } from '../constants/brands';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface DashboardHeaderProps {
  brand: Brand;
}

const getBrandInitial = (name: string): string => {
  if (name === 'MLB') return 'M';
  if (name === 'MLB KIDS') return 'I';
  if (name === 'DISCOVERY') return 'X';
  if (name === 'DUVETICA') return 'V';
  if (name === 'SERGIO TACCHINI') return 'ST';
  return name.charAt(0);
};

const getBrandBgColor = (brandId: string): string => {
  const colors: Record<string, string> = {
    mlb: 'bg-gradient-to-br from-slate-700 to-slate-800',
    'mlb-kids': 'bg-[#6B9BD1]',
    discovery: 'bg-[#00A67E]',
    duvetica: 'bg-[#9B72AA]',
    'sergio-tacchini': 'bg-[#E2725B]',
  };
  return colors[brandId] || 'bg-slate-500';
};

export const DashboardHeader = ({ brand }: DashboardHeaderProps) => {
  const initial = getBrandInitial(brand.name);
  const bgColor = getBrandBgColor(brand.id);

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-slate-100">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">브랜드 선택</span>
              </Button>
            </Link>
            
            <div className="h-8 w-px bg-slate-200" />
            
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center text-white font-bold text-sm shadow-md`}
              >
                {initial}
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900">{brand.name}</h1>
                <p className="text-xs text-slate-500">
                  26SS 시즌 사업계획
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
