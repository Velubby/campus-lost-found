'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, UserRound } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/client';
import { validateIndonesianPhone, sanitizePhoneInput, validateFullName, validateNIM } from '@/lib/validation';
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
  const [isSaving, setIsSaving] = useState(false);

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
    if (isSaving) return;
    setMessage('');
    setError('');

    // Validasi nama lengkap
    const nameCheck = validateFullName(name);
    if (!nameCheck.isValid) {
      const err = nameCheck.error || 'Nama lengkap belum valid.';
      setError(err);
      toast.error(err);
      return;
    }

    // Validasi nomor telepon (opsional, tapi jika diisi harus valid)
    const phoneCheck = validateIndonesianPhone(phone, { required: false });
    if (!phoneCheck.isValid) {
      const err = phoneCheck.error || 'Nomor telepon tidak valid.';
      setError(err);
      toast.error(err);
      return;
    }

    // Validasi NIM (opsional, tapi jika diisi harus 7-20 alfanumerik)
    const nimCheck = validateNIM(studentNumber);
    if (!nimCheck.isValid) {
      const err = nimCheck.error || 'NIM tidak valid.';
      setError(err);
      toast.error(err);
      return;
    }

    const user = await getCurrentUser();
    if (!user) {
      router.replace('/masuk');
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const profileData = {
        full_name: name.trim(),
        student_number: studentNumber.trim() || null,
        faculty: faculty.trim() || null,
        study_program: studyProgram.trim() || null,
      };
      const [{ error: profileError }, { error: authError }] = await Promise.all([
        supabase.from('profiles').upsert({ id: user.id, ...profileData, phone: phoneCheck.normalized || null }, { onConflict: 'id' }),
        supabase.auth.updateUser({ data: profileData }),
      ]);

      if (profileError || authError) {
        setError('Profil belum dapat disimpan. Coba lagi nanti.');
        toast.error('Profil belum dapat disimpan. Coba lagi nanti.');
        return;
      }

      setMessage('Pengaturan akun berhasil disimpan.');
      toast.success('Pengaturan akun berhasil disimpan.');
    } catch {
      setError('Terjadi kendala saat menyimpan. Coba lagi nanti.');
      toast.error('Terjadi kendala saat menyimpan. Coba lagi nanti.');
    } finally {
      setIsSaving(false);
    }
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
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-700">Nama lengkap</span>
            <input
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="form-input w-full"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-700">Email</span>
            <input value={email} disabled className="form-input w-full bg-slate-50 text-slate-500" />
          </label>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Nomor telepon / WhatsApp</label>
            <input
              type="tel"
              maxLength={16}
              value={phone}
              onChange={(event) => setPhone(sanitizePhoneInput(event.target.value))}
              className="form-input w-full"
              placeholder="Contoh: 081234567890"
            />
            <span className="text-[10px] text-slate-400 block">
              Awalan 08 atau 628 dengan 10–15 digit agar dapat dihubungi via WhatsApp.
            </span>
          </div>
          <p className="text-xs text-slate-600">Data akademik bersifat opsional. Kamu bisa menambahkan atau menghapusnya kapan saja.</p>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">NIM (opsional)</label>
            <input
              maxLength={20}
              value={studentNumber}
              onChange={(event) => setStudentNumber(event.target.value)}
              className="form-input w-full"
              placeholder="Contoh: 2110512001"
            />
            <span className="text-[10px] text-slate-400 block">
              7–20 karakter alfanumerik.
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700">Fakultas (opsional)</span>
              <input maxLength={100} value={faculty} onChange={(event) => setFaculty(event.target.value)} className="form-input w-full" placeholder="Nama fakultas" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700">Program studi (opsional)</span>
              <input maxLength={100} value={studyProgram} onChange={(event) => setStudyProgram(event.target.value)} className="form-input w-full" placeholder="Program studi" />
            </label>
          </div>
          <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-50 flex items-center gap-2">
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
