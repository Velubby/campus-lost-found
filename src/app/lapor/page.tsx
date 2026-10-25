'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert, Upload, CheckCircle2, ArrowRight, ArrowLeft, Copy, CheckCheck, X } from 'lucide-react';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';

async function blurImageFile(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = reject;
      element.src = objectUrl;
    });
    const padding = 24;
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth + padding * 2;
    canvas.height = image.naturalHeight + padding * 2;
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.filter = 'blur(18px)';
    context.drawImage(image, padding, padding, image.naturalWidth, image.naturalHeight);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.type || 'image/jpeg', 0.86));
    return blob ? new File([blob], file.name, { type: file.type || 'image/jpeg' }) : file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function ReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryType =
    searchParams.get('type') === 'temuan'
      ? 'temuan'
      : searchParams.get('type') === 'hilang'
      ? 'hilang'
      : null;

  const [selectedType, setSelectedType] = useState<'hilang' | 'temuan'>('hilang');
  const reportType = queryType || selectedType;

  const handleSwitchType = (type: 'hilang' | 'temuan') => {
    setSelectedType(type);
    router.replace(`/lapor?type=${type}`, { scroll: false });
  };
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedReportCode, setSubmittedReportCode] = useState('');
  const [submittedReportId, setSubmittedReportId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [authChecked, setAuthChecked] = useState(!isSupabaseConfigured);
  const predefinedCategories = ['Elektronik', 'Dokumen', 'Aksesoris', 'Tas & Pakaian', 'Lainnya'];

  const toJakartaIso = (date: string, time: string) =>
    new Date(`${date}T${time}:00+07:00`).toISOString();

  const [formData, setFormData] = useState({
    namaBarang: '',
    kategori: 'Elektronik',
    lokasi: '',
    tanggal: '2026-10-23',
    waktu: '10:00',
    deskripsiPublik: '',
    ciriRahasia: '',
    namaPelapor: '',
    email: '',
    telepon: '',
    setuju: true
  });

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/masuk?next=/lapor');
        setAuthChecked(true);
        return;
      }
      setFormData((current) => ({
        ...current,
        namaPelapor: user.user_metadata?.full_name || current.namaPelapor,
        email: user.email || current.email,
      }));
      createClient().from('profiles').select('phone').eq('id', user.id).maybeSingle().then(({ data: profile }) => {
        setFormData((current) => ({ ...current, telepon: profile?.phone || '' }));
        setAuthChecked(true);
      });
    });
  }, [router]);

  if (!authChecked) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-500">Memeriksa sesi akun...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.setuju) {
      toast.error('Harap setujui pernyataan sebelum mengirim laporan.');
      return;
    }

    const reportCode = `LNF-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (isSupabaseConfigured) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setSubmitError('Silakan masuk terlebih dahulu sebelum mengirim laporan.');
        toast.error('Silakan masuk terlebih dahulu sebelum mengirim laporan.');
        return;
      }

      let imageUrl: string | null = null;
      if (imageFile) {
        const uploadFile = reportType === 'temuan' ? await blurImageFile(imageFile) : imageFile;
        const extension = uploadFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const imagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('item-images').upload(imagePath, uploadFile, { contentType: uploadFile.type, upsert: false });
        if (uploadError) {
          setSubmitError('Foto belum dapat diunggah. Pastikan bucket item-images sudah dibuat.');
          toast.error('Foto belum dapat diunggah. Pastikan bucket item-images sudah dibuat.');
          return;
        }
        imageUrl = supabase.storage.from('item-images').getPublicUrl(imagePath).data.publicUrl;
      }

      const { data: savedReport, error } = await supabase.from('reports').insert({
        report_code: reportCode,
        user_id: user.id,
        type: reportType,
        item_title: formData.namaBarang,
        category: formData.kategori,
        location: formData.lokasi,
        incident_at: toJakartaIso(formData.tanggal, formData.waktu),
        public_description: formData.deskripsiPublik,
        private_description: formData.ciriRahasia,
        image_url: imageUrl,
        contact_phone: formData.telepon,
      }).select('id').single();

      if (error || !savedReport) {
        setSubmitError('Laporan belum dapat disimpan. Periksa koneksi lalu coba lagi.');
        toast.error('Laporan belum dapat disimpan. Periksa koneksi lalu coba lagi.');
        return;
      }

      setSubmittedReportId(savedReport.id);

    }

    setSubmittedReportCode(reportCode);
    setSubmitError('');
    setIsSuccess(true);
    toast.success('Laporan berhasil dikirim!');
    setFormData((prev) => ({
      ...prev,
      namaBarang: '',
      lokasi: '',
      deskripsiPublik: '',
      ciriRahasia: '',
    }));
    setImageFile(null);
    setCurrentStep(1);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-sky-700 uppercase tracking-widest block">
          Formulir Terpadu
        </span>
        <h1 className="text-3xl font-extrabold text-[#123356]">
          {reportType === 'hilang' ? 'Laporkan Barang Hilang' : 'Laporkan Barang Temuan'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Isi detail informasi barang. Petugas keamanan kampus akan memverifikasi dan mencocokkan data di sistem.
        </p>
      </div>

      {/* Type switcher */}
      <div className="flex justify-center">
        <div className="segmented-control p-1 bg-slate-200/70 rounded-2xl">
          <button
            type="button"
            onClick={() => handleSwitchType('hilang')}
            className={`segmented-control-btn px-6 py-2 ${reportType === 'hilang' ? 'active' : ''}`}
          >
            Barang Hilang
          </button>
          <button
            type="button"
            onClick={() => handleSwitchType('temuan')}
            className={`segmented-control-btn px-6 py-2 ${reportType === 'temuan' ? 'active' : ''}`}
          >
            Barang Ditemukan
          </button>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
        <span className={`px-3 py-1 rounded-full ${currentStep === 1 ? 'bg-[#123356] text-white' : 'bg-slate-200'}`}>
          1. Detail Barang
        </span>
        <span className="text-slate-300">→</span>
        <span className={`px-3 py-1 rounded-full ${currentStep === 2 ? 'bg-[#123356] text-white' : 'bg-slate-200'}`}>
          2. Ciri Spesifik
        </span>
        <span className="text-slate-300">→</span>
        <span className={`px-3 py-1 rounded-full ${currentStep === 3 ? 'bg-[#123356] text-white' : 'bg-slate-200'}`}>
          3. Konfirmasi
        </span>
      </div>

      {/* Main Card Form */}
      <div className="apple-card p-6 sm:p-8 bg-white">
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {submitError}
            </div>
          )}
            
            {/* Step 1: Detail Barang */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-[#123356]">Informasi Dasar Barang</h2>
                  <p className="text-xs text-slate-500">Tentukan nama dan lokasi kejadian sejelas mungkin.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Nama Barang</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dompet Kulit Cokelat, Kunci Motor Honda..."
                    value={formData.namaBarang}
                    onChange={(e) => setFormData({ ...formData, namaBarang: e.target.value })}
                       className="form-input w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Kategori</label>
                    <select
                      value={predefinedCategories.includes(formData.kategori) ? formData.kategori : '__custom__'}
                      onChange={(e) => setFormData({ ...formData, kategori: e.target.value === '__custom__' ? '' : e.target.value })}
                      className="form-input w-full"
                    >
                      <option>Elektronik</option>
                      <option>Dokumen</option>
                      <option>Aksesoris</option>
                      <option>Tas & Pakaian</option>
                      <option>Lainnya</option>
                      <option value="__custom__">Isi sendiri</option>
                    </select>
                    {!predefinedCategories.includes(formData.kategori) && (
                      <input
                        type="text"
                        required
                        value={formData.kategori}
                        onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                        className="form-input w-full mt-2"
                        placeholder="Tulis kategori barang"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Lokasi Kejadian</label>
                    <input
                      type="text"
                      required
                      placeholder="Gedung A, Perpustakaan, Kantin..."
                      value={formData.lokasi}
                      onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                      className="form-input w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Tanggal Kejadian</label>
                    <input
                      type="date"
                      required
                      value={formData.tanggal}
                      onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                      className="form-input w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Perkiraan Waktu</label>
                    <input
                      type="time"
                      value={formData.waktu}
                      onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                      className="form-input w-full"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.namaBarang.trim() || !formData.lokasi.trim()) {
                        toast.error('Harap isi nama barang dan lokasi terlebih dahulu.');
                        return;
                      }
                      setCurrentStep(2);
                    }}
                    className="btn-primary text-xs"
                  >
                    <span>Lanjut ke Ciri Spesifik</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Ciri Spesifik & Rahasia */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-[#123356]">Deskripsi &amp; Ciri Khusus</h2>
                  <p className="text-xs text-slate-500">Ciri privat digunakan untuk memverifikasi pemilik sah.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Deskripsi Publik (Bisa dibaca umum)
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Sebutkan warna utama, bentuk, dan kondisi luar yang wajar diketahui umum..."
                    value={formData.deskripsiPublik}
                    onChange={(e) => setFormData({ ...formData, deskripsiPublik: e.target.value })}
                    className="form-input w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">
                      Ciri Rahasia / Bukti Kepemilikan (Privat)
                    </label>
                    <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Hanya dilihat petugas</span>
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Contoh: ada stiker di bagian bawah, foto di dalam dompet, wallpaper kunci layar..."
                    value={formData.ciriRahasia}
                    onChange={(e) => setFormData({ ...formData, ciriRahasia: e.target.value })}
                    className="form-input w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Foto Barang (Opsional)</label>
                  <label className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors block">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-700 block">{imageFile ? imageFile.name : 'Pilih foto barang'}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Format PNG, JPG, atau WEBP maks 5MB{reportType === 'temuan' ? ' · foto akan diburamkan untuk privasi' : ''}</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      if (file && file.size > 5 * 1024 * 1024) {
                        setSubmitError('Ukuran foto maksimal 5MB.');
                        toast.error('Ukuran foto maksimal 5MB.');
                        return;
                      }
                      setSubmitError('');
                      setImageFile(file);
                    }} />
                  </label>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="btn-secondary text-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.deskripsiPublik.trim()) {
                        toast.error('Harap isi deskripsi publik terlebih dahulu.');
                        return;
                      }
                      setCurrentStep(3);
                    }}
                    className="btn-primary text-xs"
                  >
                    <span>Lanjut ke Konfirmasi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Kontak & Konfirmasi */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-[#123356]">Kontak Pelapor &amp; Pernyataan</h2>
                  <p className="text-xs text-slate-500">Pastikan informasi kontak Anda dapat dihubungi.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={formData.namaPelapor}
                      onChange={(e) => setFormData({ ...formData, namaPelapor: e.target.value })}
                      className="form-input w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Email Kampus</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-input w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Nomor WhatsApp / Telepon</label>
                  <input
                    type="tel"
                    required
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    className="form-input w-full"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="setuju"
                    checked={formData.setuju}
                    onChange={(e) => setFormData({ ...formData, setuju: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600 border-slate-300 mt-0.5"
                  />
                  <label htmlFor="setuju" className="select-none leading-relaxed">
                    Saya menyatakan informasi di atas benar dan bersedia dihubungi petugas posko untuk keperluan verifikasi pengembalian barang.
                  </label>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="btn-secondary text-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs py-2.5 px-6 shadow-md"
                  >
                    Kirim Laporan Resmi
                  </button>
                </div>
              </div>
            )}

          </form>

      </div>

      {/* Success Modal Pop-up */}
      <Dialog open={isSuccess} onOpenChange={setIsSuccess}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in-0" />
          <DialogContent className="fixed left-[50%] top-[50%] z-50 w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] bg-white rounded-3xl shadow-2xl p-6 sm:p-7 border border-slate-100 text-center space-y-5 animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 ring-6 ring-emerald-50/70 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-widest block">
                Laporan Berhasil Disimpan
              </span>
              <DialogTitle className="text-xl sm:text-2xl font-black text-[#123356] tracking-tight">
                Laporan Anda Telah Terdaftar
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Petugas posko keamanan akan memverifikasi dan mencocokkan ciri barang Anda di sistem kampus.
              </DialogDescription>
            </div>

            {/* Dedicated Ticket Code Card */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-left">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Nomor Tiket Resmi
                </span>
                <span className="font-mono text-base sm:text-lg font-extrabold text-[#123356] tracking-wider block truncate select-all">
                  {submittedReportCode || 'Menunggu kode laporan'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!submittedReportCode) return;
                  navigator.clipboard.writeText(submittedReportCode);
                  setIsCopied(true);
                  toast.success(`Nomor tiket ${submittedReportCode} disalin`);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                title="Salin nomor tiket"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all bg-white hover:bg-sky-50 text-sky-800 border border-slate-200 shadow-2xs hover:border-sky-300 min-h-[38px] shrink-0"
              >
                {isCopied ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2.5">
              <button
                type="button"
                onClick={() => router.push(submittedReportId ? `/lacak?report=${submittedReportId}` : '/lacak')}
                className="btn-primary text-xs py-2.5 px-4 shadow-sm min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 font-bold"
              >
                <span>Lacak Status Laporan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="btn-secondary text-xs py-2.5 px-4 min-h-[44px] flex-1 font-semibold"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>

    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-500">Memuat formulir laporan...</div>}>
      <ReportForm />
    </Suspense>
  );
}
