'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, UserRound } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [faculty, setFaculty] = useState('');
  const [studyProgram, setStudyProgram] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/masuk');
        return;
      }

      setEmail(user.email || '');
      setName(user.user_metadata?.full_name || '');
      const supabase = createClient();
      const { data: profile } = await supabase.from('profiles').select('full_name, phone, student_number, faculty, study_program').eq('id', user.id).maybeSingle();
      if (profile) {
        setName(profile.full_name);
        setPhone(profile.phone || '');
        setStudentNumber(profile.student_number || '');
        setFaculty(profile.faculty || '');
        setStudyProgram(profile.study_program || '');
      }
    };

    loadProfile();
  }, [router]);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');
    const user = await getCurrentUser();

    if (!user) {
      router.replace('/masuk');
      return;
    }

    const supabase = createClient();
    const [{ error: profileError }, { error: authError }] = await Promise.all([
      supabase.from('profiles').upsert({ id: user.id, full_name: name, phone, student_number: studentNumber, faculty, study_program: studyProgram }, { onConflict: 'id' }),
      supabase.auth.updateUser({ data: { full_name: name, student_number: studentNumber, faculty, study_program: studyProgram } }),
    ]);

    if (profileError || authError) {
      setError('Profil belum dapat disimpan. Coba lagi nanti.');
      toast.error('Profil belum dapat disimpan. Coba lagi nanti.');
      return;
    }

    setMessage('Pengaturan akun berhasil disimpan.');
    toast.success('Pengaturan akun berhasil disimpan.');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="apple-card bg-white p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center"><UserRound className="w-5 h-5" /></div>
          <div><h1 className="text-2xl font-extrabold text-[#123356]">Pengaturan akun</h1><p className="text-sm text-slate-500 mt-1">Perbarui informasi kontak yang digunakan petugas.</p></div>
        </div>

        {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>}
        {message && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{message}</div>}

        <form onSubmit={saveProfile} className="space-y-4">
          <label className="block space-y-1.5"><span className="text-xs font-bold text-slate-700">Nama lengkap</span><input required value={name} onChange={(event) => setName(event.target.value)} className="form-input w-full" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-bold text-slate-700">Email</span><input value={email} disabled className="form-input w-full bg-slate-50 text-slate-500" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-bold text-slate-700">Nomor telepon</span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="form-input w-full" placeholder="Nomor yang bisa dihubungi petugas" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-bold text-slate-700">NIM</span><input required value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} className="form-input w-full" /></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><label className="block space-y-1.5"><span className="text-xs font-bold text-slate-700">Fakultas</span><input required value={faculty} onChange={(event) => setFaculty(event.target.value)} className="form-input w-full" /></label><label className="block space-y-1.5"><span className="text-xs font-bold text-slate-700">Program studi</span><input required value={studyProgram} onChange={(event) => setStudyProgram(event.target.value)} className="form-input w-full" /></label></div>
          <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> Simpan Pengaturan</button>
        </form>
      </div>
    </div>
  );
}
