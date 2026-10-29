 'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/auth';

export default function Footer() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => setIsAuthenticated(Boolean(user)));
  }, []);

  return (
    <footer className="campus-footer py-14 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        
        {/* Col 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-white/10 p-0.5">
              <Image
                src="/logo.svg"
                alt="Campus Lost & Found Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-white text-lg">Campus L&amp;F</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Layanan resmi Direktorat Kemahasiswaan untuk kampus yang lebih aman, transparan, dan saling peduli.
          </p>
          <div className="pt-2 text-xs text-slate-500">
            © 2026 Campus Lost &amp; Found. All rights reserved.
          </div>
        </div>

        {/* Col 2 */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Bantuan</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              <Link href="/bantuan" className="hover:text-white transition-colors">
                Panduan klaim barang
              </Link>
            </li>
            <li>
              <Link href="/bantuan#faq" className="hover:text-white transition-colors">
                FAQ layanan Lost &amp; Found
              </Link>
            </li>
            <li>
              <Link href="/bantuan#privasi" className="hover:text-white transition-colors">
                Kebijakan privasi data mahasiswa
              </Link>
            </li>
            {isAuthenticated && <li>
              <Link href="/lacak" className="hover:text-white transition-colors">
                Lacak status laporan
              </Link>
            </li>}
          </ul>
        </div>

        {/* Col 3 */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Customer Service</h3>
          <div className="space-y-2.5 text-sm text-slate-400">
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Senin–Jumat, 08.00–17.00 WIB</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-400 shrink-0" />
              <a href="mailto:cs-lnf@kampus.ac.id" className="hover:text-white transition-colors">
                cs-lnf@kampus.ac.id
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-sky-400 shrink-0" />
              <span>(021) 555-0198</span>
            </p>
          </div>
        </div>

        {/* Col 4 */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Kontak Satpam</h3>
          <div className="space-y-2.5 text-sm text-slate-400">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>Pos Utama Gedung B, Kampus Pusat</span>
            </p>
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              <span>24 Jam Setiap Hari</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-sky-400 shrink-0" />
              <span>(021) 555-0110 (Darurat)</span>
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
