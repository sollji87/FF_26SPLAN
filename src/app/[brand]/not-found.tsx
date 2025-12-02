'use client';

import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-8xl font-bold text-white/10 mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          브랜드를 찾을 수 없습니다
        </h1>
        <p className="text-slate-400 mb-8">
          요청하신 브랜드 페이지가 존재하지 않습니다.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              이전으로
            </Button>
          </Link>
          <Link href="/">
            <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Home className="w-4 h-4" />
              홈으로 이동
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}



