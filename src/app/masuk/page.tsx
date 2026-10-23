'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupabaseConfigured) {
      const { error: signInError } = await createClient().auth.signInWithPassword({ email, password });
      if (signInError) {
        setError('Email atau password belum sesuai.');
        return;
      }
    } else {
      const savedUser = window.localStorage.getItem('campus-lnf-user');
      const user = savedUser ? JSON.parse(savedUser) as { email: string; password: string } : null;
      const isDemoAccount = email === 'alya.putri@mahasiswa.kampus.ac.id' && password === 'kampus123';

      if (!isDemoAccount && (!user || user.email !== email || user.password !== password)) {
        setError('Email atau password belum sesuai. Gunakan akun terdaftar atau akun demo.');
        return;
      }
    }

    setError('');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden apple-card bg-white shadow-2xl border border-slate-200">

        {/* Left Side: Campus photo with overlay */}
        <div className="md:col-span-6 relative hidden md:flex flex-col min-h-[480px] bg-slate-900">
          <Image
            src="/images/hero-lost-found.png"
            alt="Lobi Kampus"
            fill
            sizes="50vw"
            className="object-cover opacity-70"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

          {/* Pill top-left */}
          <div className="relative z-10 mt-6 ml-6 self-start px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold">
            Satu kampus, satu pusat informasi.
          </div>

          {/* Text card bottom */}
          <div className="relative z-10 mt-auto mx-6 mb-6 p-5 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/15 text-white space-y-1.5">
            <h3 className="font-bold text-base leading-snug">
              Kembali terhubung dengan barangmu.
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Masuk dengan akun institusi kampus untuk melacak laporan dan klaim secara aman.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:col-span-6 p-8 sm:p-10 flex flex-col justify-center gap-6">

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-[#123356]">
              Selamat datang kembali
            </h1>
            <p className="text-xs text-slate-500">
              Masuk untuk mengakses laporan dan status klaimmu.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            {error && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {error}
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-slate-700 block">
                Email Institusi
              </label>
              <div className="flex items-center gap-2 form-input w-full group focus-within:[box-shadow:0_0_0_3px_rgba(0,113,227,0.2)] focus-within:border-sky-500 transition-all">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@kampus.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[0.9375rem] text-slate-800 placeholder:text-slate-400 min-w-0"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold text-slate-700 block">
                  Password
                </label>
                <Link href="/bantuan#faq" className="text-[11px] text-sky-700 hover:underline">
                  Lupa password?
                </Link>
              </div>
              <div className="flex items-center gap-2 form-input w-full focus-within:[box-shadow:0_0_0_3px_rgba(0,113,227,0.2)] focus-within:border-sky-500 transition-all">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[0.9375rem] text-slate-800 placeholder:text-slate-400 min-w-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded accent-sky-600"
              />
              <span>Ingat saya di perangkat ini</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              className="w-full btn-primary py-3 justify-center shadow-md"
            >
              <span>Masuk ke Akun Kampus</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          <p className="text-xs text-center text-slate-500">
            Belum punya akun?{' '}
            <Link href="/daftar" className="font-bold text-sky-700 hover:underline">
              Buat akun baru
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
