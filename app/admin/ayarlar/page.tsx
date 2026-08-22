'use client';

import { useState, useEffect } from 'react';

export default function AyarlarPage() {
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
  const [waTemplate, setWaTemplate] = useState('Merhaba [MUSTERI], [MARKA] marka cihazinizin periyodik bakim zamani yaklasmistir. Musait oldugunuz bir gun icin randevu olusturmak ister misiniz?');
  const [saved, setSaved] = useState(false);

  // Sayfa yüklendiğinde ayarları hafızadan çek
  useEffect(() => {
    const alerts = localStorage.getItem('hasan_crm_alerts');
    const template = localStorage.getItem('hasan_crm_wa_template');
    if (alerts !== null) setMaintenanceAlerts(alerts === 'true');
    if (template) setWaTemplate(template);
  }, []);

  const handleSave = () => {
    localStorage.setItem('hasan_crm_alerts', String(maintenanceAlerts));
    localStorage.setItem('hasan_crm_wa_template', waTemplate);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-6 mt-6">
        
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Sistem Ayarları</h1>
          <p className="text-slate-500 mt-1">Uygulama tercihlerini ve iş kurallarını yapılandırın.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              Sistem Tercihleri
            </h2>
            
            <div className="mt-6 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-700">Yaklaşan Bakım Uyarıları</p>
                <p className="text-sm text-slate-500">Müşteri profillerinde bakım tarihi yaklaşan cihazlar için alarm göster.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={maintenanceAlerts} onChange={(e) => setMaintenanceAlerts(e.target.checked)} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              WhatsApp Hatırlatma Şablonu
            </h2>
            <p className="text-sm text-slate-500 mb-3">Yaklaşan bakımları müşteriye bildirirken kullanılacak otomatik mesajı belirleyin. <code className="bg-slate-100 px-1 text-cyan-600">[MUSTERI]</code> ve <code className="bg-slate-100 px-1 text-cyan-600">[MARKA]</code> etiketleri otomatik olarak değiştirilecektir.</p>
            
            <textarea 
              rows={4} 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-slate-700 font-medium"
              value={waTemplate}
              onChange={(e) => setWaTemplate(e.target.value)}
            ></textarea>
          </div>

          <div className="bg-slate-900 p-4 flex justify-end items-center">
            {saved && <span className="text-emerald-400 font-bold mr-4 animate-pulse">Ayarlar Kaydedildi!</span>}
            <button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-extrabold px-6 py-2.5 rounded-lg transition-colors">
              Ayarları Kaydet
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}