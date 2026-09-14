import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/Toast';
import { MotionProvider } from '@/components/providers/MotionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'OtherHalf',
  description: 'لعبة مناظرات جماعية عبر المتصفح',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-cairo antialiased">
        <MotionProvider>
          <ToastProvider>{children}</ToastProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
