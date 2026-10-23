import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Campus Lost & Found | Layanan Resmi Kampus',
  description: 'Portal resmi Lost & Found Kampus untuk mencari, melaporkan, dan mengklaim barang hilang dengan aman, transparan, dan terpercaya.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-[#f5f5f7] text-[#1d1d1f] antialiased selection:bg-sky-500 selection:text-white">
        <Suspense fallback={<div className="h-16 bg-white/80" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
