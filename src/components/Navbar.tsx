'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, ShieldCheck, LogOut, Settings } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{ name: string; initials: string } | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = createClient();
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
      setProfile(name ? { name, initials: name.slice(0, 2).toUpperCase() } : null);
      setAuthReady(true);
    };

    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadUser());
    return () => subscription.unsubscribe();
  }, []);

  const isCurrent = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const isAuthPage = pathname === '/masuk' || pathname === '/daftar';

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await createClient().auth.signOut();
    } else {
      window.localStorage.removeItem('campus-lnf-user');
    }
    setMenuOpen(false);
    window.location.assign('/masuk');
  };

  return (
    <header className="site-header">
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
        {!isAuthPage && authReady && (
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
            {profile && <Link
              href="/lapor"
              className={`px-3 py-1.5 rounded-lg text-[0.875rem] font-medium transition-all ${
                isCurrent('/lapor')
                  ? 'bg-white text-[#123356] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Lapor Barang
            </Link>}
            {profile && <Link
              href="/laporan-saya"
              className={`px-3 py-1.5 rounded-lg text-[0.875rem] font-medium transition-all ${
                isCurrent('/laporan-saya')
                  ? 'bg-white text-[#123356] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Laporan Saya
            </Link>}
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

          <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2.5 p-1 pl-2.5 pr-3 rounded-full bg-white border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
              {profile?.initials || '?'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">{profile?.name || 'Masuk'}</span>
              <span className="text-[10px] text-slate-500 leading-none">{profile ? 'Pengguna kampus' : 'Akun pengguna'}</span>
            </div>
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              {profile ? (
                <>
                  <Link href="/pengaturan" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"><Settings className="w-4 h-4" /> Pengaturan akun</Link>
                  <button type="button" role="menuitem" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-50"><LogOut className="w-4 h-4" /> Keluar</button>
                </>
              ) : <Link href="/masuk" role="menuitem" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">Masuk ke akun</Link>}
            </div>
          )}
          </div>
        </div>

      </div>
    </header>
  );
}
