import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthRedirectPath } from '@/lib/supabase/redirect';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const nextPath = getAuthRedirectPath(searchParams.get('next'));
  let destination = `/masuk?${new URLSearchParams({ error: 'google_auth', next: nextPath })}`;

  if (code && !searchParams.has('error')) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) destination = nextPath;
    } catch {
      console.error('Google OAuth session exchange failed');
    }
  }

  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
