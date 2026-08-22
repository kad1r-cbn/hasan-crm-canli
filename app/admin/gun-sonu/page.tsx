'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';

export default function GunSonuPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Hesaplama ve Veritabanı State'leri
  const [ciro, setCiro] = useState<number>(0);
  const [gider, setGider] = useState<number | ''>('');
  const [kasa, setKasa] = useState<number | ''>('');
  const [existingReportId, setExistingReportId] = useState<string | null>(null);
  
  // Arayüz State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Takvim Lojistiği
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const shift = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: shift }, (_, i) => i);
  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  // 1. GÜNE TIKLANDIĞINDA VERİLERİ ÇEK
  const handleDayClick = async (day: number) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selected);
    setIsModalOpen(true);
    setLoading(true);
    setMessage({ text: '', type: '' });

    // Saat dilimi kaymalarını önlemek için tarihi YYYY-MM-DD formatına sabitliyoruz
    const localDateStr = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`;

    // Servisler için UTC sınırları
    const startOfDay = new Date(selected.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(selected.setHours(23, 59, 59, 999)).toISOString();

    try {
      // AŞAMA 1: Günlük Ciroyu Hesapla
      const { data: services, error: serviceError } = await supabase
        .from('service_records')
        .select('price')
        .gte('service_date', startOfDay)
        .lte('service_date', endOfDay);

      if (serviceError) throw serviceError;
      const totalCiro = services.reduce((sum, record) => sum + (record.price || 0), 0);
      setCiro(totalCiro);

      // AŞAMA 2: Bu tarihe ait daha önce kaydedilmiş bir "Gün Sonu" var mı kontrol et
      const { data: report, error: reportError } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('report_date', localDateStr)
        .single();

      if (report) {
        // Varsa verileri ekrana yükle
        setExistingReportId(report.id);
        setGider(report.expense);
        setKasa(report.safe_amount);
      } else {
        // Yoksa ekranı sıfırla
        setExistingReportId(null);
        setGider('');
        setKasa('');
      }

    } catch (err) {
      console.error("Veri çekme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. GÜN SONUNU VERİTABANINA MÜHÜRLE
  const handleSaveReport = async () => {
    if (!selectedDate) return;
    
    setSaving(true);
    setMessage({ text: '', type: '' });

    const localDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const numGider = Number(gider) || 0;
    const numKasa = Number(kasa) || 0;
    const netGelir = ciro - numGider - numKasa;
    const pay = netGelir / 2;

    const payload = {
      report_date: localDateStr,
      total_revenue: ciro,
      expense: numGider,
      safe_amount: numKasa,
      net_income: netGelir,
      partner_share: pay
    };

    try {
      if (existingReportId) {
        // Kayıt zaten varsa GÜNCELLE (UPDATE)
        const { error } = await supabase
          .from('daily_reports')
          .update(payload)
          .eq('id', existingReportId);
        if (error) throw error;
        setMessage({ text: 'Gün sonu raporu başarıyla güncellendi.', type: 'success' });
      } else {
        // Kayıt yoksa YENİ EKLE (INSERT)
        const { data, error } = await supabase
          .from('daily_reports')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setExistingReportId(data.id); // Yeni eklenen kaydın ID'sini tut
        setMessage({ text: 'Gün sonu raporu sisteme mühürlendi.', type: 'success' });
      }
    } catch (err: any) {
      console.error("Kaydetme hatası:", err);
      setMessage({ text: `Hata: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Dinamik Hesaplamalar (Ekranda anlık gösterim için)
  const numGider = Number(gider) || 0;
  const numKasa = Number(kasa) || 0;
  const netGelir = ciro - numGider - numKasa;
  const pay = netGelir / 2;

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans flex justify-center items-start">
      <div className="w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden mt-10">
        
        {/* Takvim Başlığı */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors">◀</button>
            <button onClick={nextMonth} className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors">▶</button>
          </div>
        </div>

        {/* Takvim Grid */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-4 text-center mb-4">
            {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'].map(day => (
              <div key={day} className="text-sm font-bold text-slate-400">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-4 text-center">
            {emptyDays.map(empty => <div key={`empty-${empty}`} className="p-4"></div>)}
            
            {daysArray.map(day => {
              const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
              return (
                <button 
                  key={day} 
                  onClick={() => handleDayClick(day)}
                  className={`p-4 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-lg font-bold transition-all
                    ${isToday ? 'bg-cyan-500 text-slate-900' : 'text-slate-300 hover:bg-slate-800'}
                  `}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>

      </div>

      {/* GÜN SONU HESAPLAMA MODALI */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in-down">
            <div className="bg-slate-900 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {selectedDate.toLocaleDateString('tr-TR')} Gün Sonu
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
              {loading ? (
                <div className="text-center py-10 font-bold text-slate-500 animate-pulse">Sistem Verileri Çekiliyor...</div>
              ) : (
                <>
                  {/* Sistem Cirosu (Otomatik) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-700">Sistem Cirosu (Toplam)</span>
                    <span className="text-2xl font-extrabold text-slate-900">{ciro} ₺</span>
                  </div>

                  {/* Manuel Girişler */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Gider (₺)</label>
                      <input 
                        type="number" 
                        className="w-full p-3 border border-red-200 bg-red-50 text-red-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-bold" 
                        value={gider} 
                        onChange={(e) => setGider(Number(e.target.value))} 
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Kasaya Ayrılan (₺)</label>
                      <input 
                        type="number" 
                        className="w-full p-3 border border-amber-200 bg-amber-50 text-amber-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-bold" 
                        value={kasa} 
                        onChange={(e) => setKasa(Number(e.target.value))} 
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Sonuç Tablosu */}
                  <div className="bg-cyan-50 border border-cyan-200 p-5 rounded-xl space-y-4 mt-6">
                    <div className="flex justify-between items-center border-b border-cyan-200 pb-3">
                      <span className="font-bold text-cyan-800">Net Gelir</span>
                      <span className="font-extrabold text-cyan-900 text-xl">{netGelir} ₺</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="block text-xs font-bold text-slate-500 uppercase">Hasan'ın Payı</span>
                        <span className="block text-lg font-extrabold text-emerald-600 mt-1">{pay} ₺</span>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="block text-xs font-bold text-slate-500 uppercase">Orhan'ın Payı</span>
                        <span className="block text-lg font-extrabold text-emerald-600 mt-1">{pay} ₺</span>
                      </div>
                    </div>
                  </div>

                  {message.text && (
                    <div className={`p-3 rounded-lg text-sm font-bold text-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {message.text}
                    </div>
                  )}

                  <button 
                    onClick={handleSaveReport} 
                    disabled={saving}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-lg shadow-md transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Mühürleniyor...' : (existingReportId ? 'Gün Sonunu Güncelle' : 'Gün Sonunu Mühürle')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}