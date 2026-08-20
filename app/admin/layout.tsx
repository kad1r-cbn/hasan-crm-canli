'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    // Mobilde alt bar için padding-bottom (pb-16), masaüstünde normal
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-100 font-sans overflow-hidden">
      
      {/* 1. MASAÜSTÜ SOL MENÜ (Mobilde 'hidden' ile tamamen gizlenir, 'md:flex' ile masaüstünde belirir) */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-slate-900 text-slate-300 flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Hasan<span className="text-cyan-500">CRM</span></h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Operasyon Yönetimi</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/admin" className={`block px-4 py-3 rounded-lg font-bold transition-all ${isActive('/admin') ? 'bg-cyan-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
            Kontrol Merkezi
          </Link>
          <Link href="/admin/musteriler" className={`block px-4 py-3 rounded-lg font-bold transition-all ${isActive('/admin/musteriler') ? 'bg-cyan-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
            Müşteriler
          </Link>
          <Link href="/admin/yeni-kayit" className={`block px-4 py-3 rounded-lg font-bold transition-all ${isActive('/admin/yeni-kayit') ? 'bg-cyan-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
            + Hızlı Kayıt
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center justify-center bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white px-4 py-3 rounded-lg font-bold transition-all">
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* 2. MOBİL ÜST BİLGİ BARI (Sadece mobilde görünür) */}
      <header className="md:hidden flex-shrink-0 bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-20">
         <h2 className="text-xl font-extrabold tracking-tight">Hasan<span className="text-cyan-500">CRM</span></h2>
         <button onClick={handleLogout} className="text-xs bg-slate-800 px-3 py-1.5 rounded text-slate-300 hover:text-white hover:bg-red-600 font-bold">
           Çıkış
         </button>
      </header>

      {/* 3. SAĞ İÇERİK ALANI (Mobilde alt barın altında kalmaması için pb-16 eklendi) */}
      <main className="flex-1 h-full overflow-y-auto relative pb-20 md:pb-0">
        {children}
      </main>

      {/* 4. MOBİL ALT GEZİNME BARI (Sadece mobilde görünür, ekranın altına yapışır) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 flex justify-around items-center p-3 z-30 pb-safe">
         <Link href="/admin" className={`flex flex-col items-center ${isActive('/admin') ? 'text-cyan-500' : 'text-slate-400'}`}>
            <span className="text-xs font-bold mt-1">Kontrol</span>
         </Link>
         <Link href="/admin/musteriler" className={`flex flex-col items-center ${isActive('/admin/musteriler') ? 'text-cyan-500' : 'text-slate-400'}`}>
            <span className="text-xs font-bold mt-1">Müşteriler</span>
         </Link>
         <Link href="/admin/yeni-kayit" className={`flex flex-col items-center ${isActive('/admin/yeni-kayit') ? 'text-cyan-500' : 'text-slate-400'}`}>
            <div className="bg-cyan-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
              + Kayıt
            </div>
         </Link>
      </nav>

    </div>
  );
}