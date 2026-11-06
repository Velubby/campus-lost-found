import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ResponsiveToaster } from '@/components/providers/ResponsiveToaster';
import MicrosoftClarity from '@/components/MicrosoftClarity';

export const metadata: Metadata = {
  title: 'Campus Lost & Found | Layanan Resmi Kampus',
  description: 'Portal resmi Lost & Found Kampus untuk mencari, melaporkan, dan mengklaim barang hilang dengan aman, transparan, dan terpercaya.',
  applicationName: 'Campus Lost & Found',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Campus L&F',
  },
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#123356',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-[#f5f5f7] text-[#1d1d1f] antialiased selection:bg-sky-500 selection:text-white touch-manipulation">
        <MicrosoftClarity />
        <QueryProvider>
          <Suspense fallback={<div className="h-16 bg-white/80" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 w-full">
            {children}
          </main>
          <Footer />
          <ResponsiveToaster />
        </QueryProvider>
      </body>
    </html>
  );
}
