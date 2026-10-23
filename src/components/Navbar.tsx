'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, PlusCircle, Clock, ShieldCheck, User } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const isCurrent = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const isAuthPage = pathname === '/masuk' || pathname === '/daftar';

  return (
    <header className="macos-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#123356] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[1.05rem] text-[#123356] tracking-tight leading-none">
                Campus L&amp;F
              </span>
              <span className="text-[0.6875rem] font-medium text-slate-500 tracking-wider uppercase mt-0.5">
                Portal Resmi
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        {!isAuthPage && (
          <nav aria-label="Navigasi Utama" className="hidden md:flex items-center gap-1 bg-black/4 p-1 rounded-xl border border-black/5">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-[0.875rem] font-medium transition-all ${
                isCurrent('/') && pathname === '/'
                  ? 'bg-white text-[#123356] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-lg text-[0.875rem] font-medium transition-all ${
                isCurrent('/dashboard')
                  ? 'bg-white text-[#123356] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/cari"
              className={`px-3 py-1.5 rounded-lg text-[0.875rem] font-medium transition-all ${
                isCurrent('/cari')
                  ? 'bg-white text-[#123356] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Cari Barang
            </Link>
            <Link
              href="/lapor"
              className={`px-3 py-1.5 rounded-lg text-[0.875rem] font-medium transition-all ${
                isCurrent('/lapor')
                  ? 'bg-white text-[#123356] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Lapor Barang
            </Link>
            <Link
              href="/lacak"
              className={`px-3 py-1.5 rounded-lg text-[0.875rem] font-medium transition-all ${
                isCurrent('/lacak')
                  ? 'bg-white text-[#123356] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Lacak
            </Link>
            <Link
              href="/laporan-saya"
              className={`px-3 py-1.5 rounded-lg text-[0.875rem] font-medium transition-all ${
                isCurrent('/laporan-saya')
                  ? 'bg-white text-[#123356] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Laporan Saya
            </Link>
          </nav>
        )}

        {/* Right Action: Search icon + user profile pill */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/cari"
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-black/6 text-slate-500 transition-all"
            title="Cari Barang"
            aria-label="Cari Barang"
          >
            <Search className="w-4.5 h-4.5" />
          </Link>

          {/* Student Profile Pill from Figma */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 p-1 pl-2.5 pr-3 rounded-full bg-white border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
              AP
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">Alya Putri</span>
              <span className="text-[10px] text-slate-500 leading-none">Mahasiswa</span>
            </div>
          </Link>
        </div>

      </div>
    </header>
  );
}
