'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Brand } from '../constants/brands';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface BrandCardProps {
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

export const BrandCard = ({ brand }: BrandCardProps) => {
  const initial = getBrandInitial(brand.name);
  const bgColor = getBrandBgColor(brand.id);

  return (
    <Link href={`/${brand.id}`}>
      <Card className="group relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200/60 bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <CardContent className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div
              className={`${bgColor} w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform group-hover:scale-110`}
            >
              {initial}
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:bg-slate-800">
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-slate-800 transition-colors">
              {brand.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>대시보드 보기</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
