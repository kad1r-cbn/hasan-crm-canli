'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans overflow-hidden">
      
      {/* 1. MASAÜSTÜ SOL MENÜ (Mobilde gizlenir) */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-slate-900 text-slate-300 flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Hasan<span className="text-cyan-500">CRM</span></h2>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/admin" className={`block px-4 py-3 rounded-lg font-bold transition-all ${isActive('/admin') ? 'bg-cyan-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>Kontrol Merkezi</Link>
          <Link href="/admin/musteriler" className={`block px-4 py-3 rounded-lg font-bold transition-all ${isActive('/admin/musteriler') ? 'bg-cyan-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>Müşteriler</Link>
          <Link href="/admin/yeni-kayit" className={`block px-4 py-3 rounded-lg font-bold transition-all ${isActive('/admin/yeni-kayit') ? 'bg-cyan-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>+ Hızlı Kayıt</Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white px-4 py-3 rounded-lg font-bold transition-all">Çıkış Yap</button>
        </div>
      </aside>

      {/* 2. MOBİL ÜST BİLGİ BARI VE HAMBURGER İKONU */}
      <header className="md:hidden absolute top-0 left-0 w-full bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-20">
         <div className="flex items-center">
           <button onClick={() => setIsMobileMenuOpen(true)} className="mr-4 text-slate-300 hover:text-white focus:outline-none">
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
           </button>
           <h2 className="text-xl font-extrabold tracking-tight">Hasan<span className="text-cyan-500">CRM</span></h2>
         </div>
      </header>

      {/* 3. MOBİL KAYAR MENÜ (Overlay & Drawer) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Arka plan karartması */}
          <div className="fixed inset-0 bg-black opacity-60" onClick={closeMenu}></div>
          
          {/* Menü Paneli */}
          <aside className="relative w-64 max-w-sm bg-slate-900 text-slate-300 flex flex-col h-full shadow-2xl animate-fade-in-right">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-white">Menü</h2>
              <button onClick={closeMenu} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <Link href="/admin" onClick={closeMenu} className={`block px-4 py-3 rounded-lg font-bold ${isActive('/admin') ? 'bg-cyan-600 text-white' : 'hover:bg-slate-800'}`}>Kontrol Merkezi</Link>
              <Link href="/admin/musteriler" onClick={closeMenu} className={`block px-4 py-3 rounded-lg font-bold ${isActive('/admin/musteriler') ? 'bg-cyan-600 text-white' : 'hover:bg-slate-800'}`}>Müşteriler</Link>
              <Link href="/admin/yeni-kayit" onClick={closeMenu} className={`block px-4 py-3 rounded-lg font-bold ${isActive('/admin/yeni-kayit') ? 'bg-cyan-600 text-white' : 'hover:bg-slate-800'}`}>+ Hızlı Kayıt</Link>
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button onClick={handleLogout} className="w-full bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white px-4 py-3 rounded-lg font-bold">Çıkış Yap</button>
            </div>
          </aside>
        </div>
      )}

      {/* 4. SAĞ İÇERİK ALANI (Mobilde üst barın altında kalmaması için pt-16 eklendi) */}
      <main className="flex-1 h-full overflow-y-auto relative pt-16 md:pt-0">
        {children}
      </main>

    </div>
  );
}