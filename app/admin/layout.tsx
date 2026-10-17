// VORA_CRM_SSR_AUTH_V2
// Sunucuda kontrol edilen kimlik olmadan admin HTML'i olusturma.
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '../../utils/supabase-server';
import AdminShell from './AdminShell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();
  const managerUid = process.env.VORA_CRM_ADMIN_UID;
  if (error || !managerUid || data?.claims?.sub !== managerUid) {
    redirect('/login');
  }

  return <AdminShell>{children}</AdminShell>;
}
