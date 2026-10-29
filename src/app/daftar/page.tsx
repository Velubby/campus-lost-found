'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail, UserRound } from 'lucide-react';
import { signUpUser } from '@/lib/supabase/auth';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [faculty, setFaculty] = useState('');
  const [studyProgram, setStudyProgram] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.endsWith('@kampus.ac.id') && !email.endsWith('@mahasiswa.kampus.ac.id')) {
      setError('Gunakan email institusi kampus untuk membuat akun.');
      toast.error('Gunakan email institusi kampus untuk membuat akun.');
      return;
    }

    if (password.length < 8) {
      setError('Password harus berisi minimal 8 karakter.');
      toast.error('Password harus berisi minimal 8 karakter.');
      return;
    }

    setIsLoading(true);
    setError('');

    const { error: signUpError } = await signUpUser({
      email,
      password,
      fullName: name,
      studentNumber,
      faculty,
      studyProgram,
    });

    if (signUpError) {
      setError(signUpError.message);
      toast.error(signUpError.message);
      setIsLoading(false);
      return;
    }

    toast.success('Pendaftaran akun berhasil! Silakan masuk.');
    router.push('/masuk?registered=1');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-lg apple-card bg-white p-8 sm:p-10">
        <div className="space-y-2 mb-8">
          <span className="text-xs font-bold text-sky-700 uppercase tracking-widest">Registrasi akun</span>
          <h1 className="text-2xl font-extrabold text-[#123356]">Buat akun kampus</h1>
          <p className="text-xs text-slate-500">Gunakan email institusi untuk mengirim laporan dan mengikuti proses klaim.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </div>
          )}

          <label className="space-y-1.5 block">
            <span className="text-xs font-bold text-slate-700">Nama lengkap</span>
            <div className="flex items-center gap-2 form-input w-full">
              <UserRound className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <input required value={name} onChange={(event) => setName(event.target.value)} className="flex-1 bg-transparent outline-none text-sm min-w-0" placeholder="Nama lengkap" />
            </div>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5 block"><span className="text-xs font-bold text-slate-700">NIM</span><input required value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} className="form-input w-full" placeholder="Nomor induk mahasiswa" /></label>
            <label className="space-y-1.5 block"><span className="text-xs font-bold text-slate-700">Fakultas</span><input required value={faculty} onChange={(event) => setFaculty(event.target.value)} className="form-input w-full" placeholder="Nama fakultas" /></label>
          </div>

          <label className="space-y-1.5 block"><span className="text-xs font-bold text-slate-700">Program studi</span><input required value={studyProgram} onChange={(event) => setStudyProgram(event.target.value)} className="form-input w-full" placeholder="Program studi" /></label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-bold text-slate-700">Email institusi</span>
            <div className="flex items-center gap-2 form-input w-full">
              <Mail className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="flex-1 bg-transparent outline-none text-sm min-w-0" placeholder="nama@kampus.ac.id" />
            </div>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-bold text-slate-700">Password</span>
            <div className="flex items-center gap-2 form-input w-full">
              <Lock className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="flex-1 bg-transparent outline-none text-sm min-w-0" placeholder="Minimal 8 karakter" />
            </div>
          </label>

          <button type="submit" disabled={isLoading} className="w-full btn-primary py-3 justify-center disabled:opacity-50">
            <span>{isLoading ? 'Mendaftarkan akun...' : 'Buat Akun'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>

        <p className="text-xs text-center text-slate-500 mt-6">
          Sudah punya akun?{' '}
          <Link href="/masuk" className="font-bold text-sky-700 hover:underline">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
