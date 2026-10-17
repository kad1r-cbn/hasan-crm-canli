// VORA_CRM_SSR_AUTH_V2
// Tek browser istemcisi; Supabase Auth oturumu SSR ile paylasilan cookie'de saklanir.
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
