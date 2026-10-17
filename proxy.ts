// VORA_CRM_SSR_AUTH_V2
// Next.js 16 proxy: her /admin isteginde gercek Supabase oturumunu dogrula.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          // Yenilenen JWT'yi CDN/proxy cache'inde tutma.
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    }
  );

  // getClaims imzayi dogrular; cookie var diye oturumu dogru kabul etmeyiz.
  const { data, error } = await supabase.auth.getClaims();
  const managerUid = process.env.VORA_CRM_ADMIN_UID;
  const isManager = !error && Boolean(managerUid) && data?.claims?.sub === managerUid;

  if (!isManager) {
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    login.search = '';
    const redirect = NextResponse.redirect(login);
    redirect.headers.set('Cache-Control', 'private, no-store');
    return redirect;
  }

  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
