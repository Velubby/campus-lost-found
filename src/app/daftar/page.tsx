'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail, UserRound } from 'lucide-react';
import { signUpUser } from '@/lib/supabase/auth';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { toast } from 'sonner';
import { z } from 'zod';

function getRegistrationError(error: { code?: string; status?: number; name?: string }) {
  if (error.code === 'user_already_exists' || error.code === 'email_exists') {
    return 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.';
  }
  if (error.status === 429 || error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit') {
    return 'Terlalu banyak percobaan pendaftaran. Tunggu beberapa saat sebelum mencoba lagi.';
  }
  if (error.code === 'weak_password') {
    return 'Password belum memenuhi ketentuan keamanan. Gunakan password yang lebih kuat.';
  }
  if (error.code === 'email_address_invalid') {
    return 'Alamat email belum valid. Periksa kembali email kamu.';
  }
  if (error.code === 'signup_disabled' || error.code === 'email_provider_disabled' || error.code === 'email_address_not_authorized') {
    return 'Pendaftaran belum tersedia untuk email ini. Hubungi petugas melalui halaman bantuan.';
  }
  if (error.name === 'AuthRetryableFetchError' || error.status === 0 || error.code === 'request_timeout' || (error.status && error.status >= 500)) {
    return 'Layanan pendaftaran belum dapat dihubungi. Periksa koneksi internet dan coba lagi nanti.';
  }
  return 'Pendaftaran belum berhasil. Coba lagi nanti atau hubungi petugas melalui halaman bantuan.';
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [faculty, setFaculty] = useState('');
  const [studyProgram, setStudyProgram] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const isSubmitting = useRef(false);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting.current || confirmationEmail) return;

    const normalizedEmail = email.trim().toLowerCase();
    let validationError = '';
    if (!name.trim()) validationError = 'Nama lengkap wajib diisi.';
    else if (!normalizedEmail) validationError = 'Email wajib diisi.';
    else if (!z.email().safeParse(normalizedEmail).success) {
      validationError = 'Masukkan alamat email yang valid, misalnya nama@contoh.com.';
    } else if (password.length < 8) validationError = 'Password harus berisi minimal 8 karakter.';
    else if (!confirmPassword) validationError = 'Konfirmasi password wajib diisi.';
    else if (password !== confirmPassword) validationError = 'Konfirmasi password belum sama dengan password.';

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    isSubmitting.current = true;
    setIsLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await signUpUser({
        email: normalizedEmail,
        password,
        fullName: name.trim(),
        studentNumber: studentNumber.trim() || undefined,
        faculty: faculty.trim() || undefined,
        studyProgram: studyProgram.trim() || undefined,
      });

      if (signUpError) {
        const message = getRegistrationError(signUpError);
        setError(message);
        toast.error(message);
        return;
      }

      if (!data.user) {
        const message = 'Pendaftaran belum dapat dipastikan. Coba masuk atau hubungi petugas melalui halaman bantuan.';
        setError(message);
        toast.error(message);
        return;
      }

      if (data.user.identities?.length === 0) {
        const message = 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.';
        setError(message);
        toast.error(message);
        return;
      }

      setPassword('');
      setConfirmPassword('');
      if (data.session) {
        toast.success('Pendaftaran berhasil. Kamu sudah masuk ke akun.');
        router.push('/dashboard');
        return;
      }

      setConfirmationEmail(normalizedEmail);
    } catch {
      const message = 'Pendaftaran belum dapat diselesaikan. Periksa koneksi internet dan coba lagi nanti.';
      setError(message);
      toast.error(message);
    } finally {
      isSubmitting.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-lg apple-card bg-white p-8 sm:p-10">
        <div className="space-y-2 mb-8">
          <span className="text-xs font-bold text-sky-700 uppercase tracking-widest">Registrasi akun</span>
          <h1 className="text-2xl font-extrabold text-[#123356]">Buat akun</h1>
          <p className="text-xs text-slate-500">Daftar dengan email yang aktif untuk mengirim laporan dan mengikuti proses klaim.</p>
        </div>


        {confirmationEmail ? (
          <div role="status" className="space-y-4 rounded-xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-900">
            <h2 className="font-bold">Cek email kamu</h2>
            <p className="break-words">Jika pendaftaran dapat diproses, tautan konfirmasi akan dikirim ke {confirmationEmail}. Periksa kotak masuk dan folder spam, lalu konfirmasi email sebelum masuk.</p>
            <Link href="/masuk" className="btn-primary min-h-11 justify-center">Lanjut ke halaman masuk</Link>
          </div>
        ) : (
        <form onSubmit={handleRegister} className="space-y-4" noValidate aria-busy={isLoading} aria-describedby={error ? 'registration-error' : undefined}>
          {error && (
            <div id="registration-error" role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </div>
          )}

          <fieldset disabled={isLoading} className="space-y-4">
          <label className="space-y-1.5 block">
            <span className="text-xs font-bold text-slate-700">Nama lengkap</span>
            <div className="flex items-center gap-2 form-input w-full focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20">
              <UserRound className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="flex-1 bg-transparent outline-none text-sm min-w-0" placeholder="Nama lengkap" />
            </div>
          </label>


          <label className="space-y-1.5 block">
            <span className="text-xs font-bold text-slate-700">Email</span>
            <div className="flex items-center gap-2 form-input w-full focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20">
              <Mail className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <input required type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)} className="flex-1 bg-transparent outline-none text-sm min-w-0" placeholder="nama@contoh.com" />
            </div>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-bold text-slate-700">Password</span>
            <div className="flex items-center gap-2 form-input w-full focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20">
              <Lock className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="flex-1 bg-transparent outline-none text-sm min-w-0" placeholder="Minimal 8 karakter" />
            </div>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-bold text-slate-700">Konfirmasi password</span>
            <div className="flex items-center gap-2 form-input w-full focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20">
              <Lock className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <input required type="password" minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="flex-1 bg-transparent outline-none text-sm min-w-0" placeholder="Ulangi password" />
            </div>
          </label>

          <details>
            <summary className="min-h-11 cursor-pointer py-3 text-xs font-medium text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">Data akademik (opsional)</summary>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1.5 block"><span className="text-xs font-bold text-slate-700">NIM (opsional)</span><input value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} className="form-input w-full" placeholder="Nomor induk mahasiswa" /></label>
                <label className="space-y-1.5 block"><span className="text-xs font-bold text-slate-700">Fakultas (opsional)</span><input value={faculty} onChange={(event) => setFaculty(event.target.value)} className="form-input w-full" placeholder="Nama fakultas" /></label>
              </div>
              <label className="space-y-1.5 block"><span className="text-xs font-bold text-slate-700">Program studi (opsional)</span><input value={studyProgram} onChange={(event) => setStudyProgram(event.target.value)} className="form-input w-full" placeholder="Program studi" /></label>
            </div>
          </details>

          <button type="submit" disabled={isLoading} className="w-full btn-primary py-3 justify-center disabled:opacity-50">
            <span>{isLoading ? 'Mendaftarkan akun...' : 'Buat Akun'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          </fieldset>
        </form>
        )}

        {!confirmationEmail && <div className="mt-5"><GoogleSignInButton disabled={isLoading} /></div>}

        <p className="text-xs text-center text-slate-500 mt-6">
          Sudah punya akun?{' '}
          <Link href="/masuk" className="font-bold text-sky-700 hover:underline">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
