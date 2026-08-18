'use client';

import { useState } from 'react';

export default function Ayarlar() {
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Bu aşamada sadece UI state tutuyoruz. 
    // İleride next-themes veya veritabanı user_preferences tablosuna bağlanacak.
    alert('Ayarlar arayüzü kaydedildi (Görsel Simülasyon)');
  };

  return (
    <div className="min-h-full bg-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
           <h1 className="text-3xl font-extrabold text-slate-900">Sistem Ayarları</h1>
           <p className="text-slate-500 mt-2 font-medium">Uygulama tercihlerini ve arayüz ayarlarını yapılandırın.</p>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* TEMA AYARLARI */}
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
              Görünüm ve Tema
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`cursor-pointer border-2 rounded-xl p-4 flex items-center transition-all ${theme === 'light' ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 hover:border-cyan-300'}`}>
                <input type="radio" name="theme" value="light" className="hidden" checked={theme === 'light'} onChange={() => setTheme('light')} />
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mr-4 border border-slate-300">☀️</div>
                <div>
                  <div className="font-bold text-slate-800">Açık Tema</div>
                  <div className="text-xs text-slate-500">Standart gündüz görünümü</div>
                </div>
              </label>

              <label className={`cursor-pointer border-2 rounded-xl p-4 flex items-center transition-all ${theme === 'dark' ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 hover:border-cyan-300'}`}>
                <input type="radio" name="theme" value="dark" className="hidden" checked={theme === 'dark'} onChange={() => setTheme('dark')} />
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mr-4 border border-slate-600 text-white">🌙</div>
                <div>
                  <div className="font-bold text-slate-800">Koyu Tema</div>
                  <div className="text-xs text-slate-500">Göz yormayan gece arayüzü (Yakında)</div>
                </div>
              </label>
            </div>
          </div>

          {/* BİLDİRİM AYARLARI */}
          <div className="p-8 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              Sistem Tercihleri
            </h2>
            
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200">
              <div>
                <div className="font-bold text-slate-800">Yaklaşan Bakım Uyarıları</div>
                <div className="text-sm text-slate-500">Kontrol merkezinde kırmızı alarm bildirimlerini göster.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>
          </div>

          {/* KAYDET BUTONU */}
          <div className="p-6 bg-slate-900 flex justify-end">
            <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-extrabold py-3 px-8 rounded-lg transition-colors shadow-lg">
              Ayarları Kaydet
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}