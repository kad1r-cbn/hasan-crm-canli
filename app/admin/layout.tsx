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
    <div className="flex h-screen w-full bg-slate-100 font-sans overflow-hidden">
      
      {/* SOL MENÜ (Sabit Genişlik ve Tam Yükseklik) */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Hasan<span className="text-cyan-500">CRM</span></h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Operasyon Yönetimi</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link 
            href="/admin" 
            className={`block px-4 py-3 rounded-lg font-bold transition-all ${isActive('/admin') ? 'bg-cyan-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            Kontrol Merkezi
          </Link>
          
          <Link 
            href="/admin/musteriler" 
            className={`block px-4 py-3 rounded-lg font-bold transition-all ${isActive('/admin/musteriler') ? 'bg-cyan-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            Müşteriler
          </Link>
          
          <Link 
            href="/admin/yeni-kayit" 
            className={`block px-4 py-3 rounded-lg font-bold transition-all ${isActive('/admin/yeni-kayit') ? 'bg-cyan-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            + Hızlı Kayıt (Müşteri)
          </Link>

          <div className="pt-4 mt-4 border-t border-slate-800">
             <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sistem</p>
             <Link 
            href="/admin/ayarlar" 
            className={`block px-4 py-3 rounded-lg font-bold transition-all ${isActive('/admin/ayarlar') ? 'bg-cyan-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            Ayarlar (Tema vs.)
          </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white px-4 py-3 rounded-lg font-bold transition-all"
          >
            Oturumu Kapat
          </button>
        </div>
      </aside>

      {/* SAĞ İÇERİK (Sadece burası kendi içinde aşağıya kayacak) */}
      <main className="flex-1 h-full overflow-y-auto relative">
        {children}
      </main>

    </div>
  );
}