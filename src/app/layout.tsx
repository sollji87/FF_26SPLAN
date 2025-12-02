import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'F&F 26SS 사업계획 네비게이터',
  description: 'F&F 브랜드별 과거 시즌 실적 분석과 26SS 사업계획 시뮬레이션 대시보드',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className="font-pretendard antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
