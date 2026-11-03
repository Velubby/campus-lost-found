'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { signInWithGoogle } from '@/lib/supabase/auth';

export default function GoogleSignInButton({ disabled = false, next }: { disabled?: boolean; next?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isSubmitting = useRef(false);

  const handleGoogleLogin = async () => {
    if (disabled || isSubmitting.current) return;
    isSubmitting.current = true;
    setIsLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await signInWithGoogle(next);
      if (signInError || !data.url) {
        throw new Error('Google OAuth could not be started');
      }
    } catch {
      setError('Login Google belum dapat dimulai. Coba lagi nanti atau gunakan email dan password.');
      isSubmitting.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div aria-hidden="true" className="flex items-center gap-3 text-xs text-slate-500">
        <span className="h-px flex-1 bg-slate-200" />
        <span>atau</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className="inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
      >
        <Image src="/google.svg" alt="" aria-hidden="true" width={18} height={18} className="shrink-0 object-contain" />
        <span>{isLoading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
      </button>
      {error && <p role="alert" className="text-xs text-rose-800">{error}</p>}

    </div>
  );
}
