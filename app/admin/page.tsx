'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import Link from 'next/link';

// WhatsApp linkinin kırılmaması için rasyonel Türkçe karakter temizleyici
const tr2en = (text: string) => {
  return text.replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ü/g, 'u').replace(/Ü/g, 'U')
             .replace(/ş/g, 's').replace(/Ş/g, 'S').replace(/ı/g, 'i').replace(/İ/g, 'I')
             .replace(/ö/g, 'o').replace(/Ö/g, 'O').replace(/ç/g, 'c').replace(/Ç/g, 'C');
};

export default function KontrolMerkezi() {
  const [stats, setStats] = useState({ customers: 0, devices: 0, services: 0 });
  const [upcomingServices, setUpcomingServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. İstatistikleri Çek
      const [
        { count: customerCount },
        { count: deviceCount },
        { count: serviceCount }
      ] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('devices').select('*', { count: 'exact', head: true }),
        supabase.from('service_records').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        customers: customerCount || 0,
        devices: deviceCount || 0,
        services: serviceCount || 0
      });

      // 2. Zaman Penceresi Hesaplama (Geçmişleri çöpe atıyoruz)
      const today = new Date();
      // Saat dilimi kaymalarını önlemek için manuel formatlama: YYYY-MM-DD
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const next10Days = new Date(today);
      next10Days.setDate(today.getDate() + 10);
      const next10DaysStr = `${next10Days.getFullYear()}-${String(next10Days.getMonth() + 1).padStart(2, '0')}-${String(next10Days.getDate()).padStart(2, '0')}`;

      // 3. Yaklaşan Servisleri Çek (reminder_sent sütununu dahil ediyoruz)
      const { data: upcoming } = await supabase
        .from('service_records')
        .select(`
          id,
          next_maintenance_date,
          reminder_sent,
          devices (
            brand,
            device_type,
            customer_id,
            customers ( full_name, phone_number )
          )
        `)
        .gte('next_maintenance_date', todayStr)
        .lte('next_maintenance_date', next10DaysStr)
        .order('next_maintenance_date', { ascending: true });

      if (upcoming) setUpcomingServices(upcoming);
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  // 4. WhatsApp Mesajı Gönderme ve Veritabanı Güncelleme Motoru
  const handleSendReminder = async (recordId: string, phone: string, name: string, brand: string) => {
    if (!phone) {
      alert("Hata: Müşteriye ait telefon numarası bulunamadı.");
      return;
    }

    // Şablonu çek, etiketleri değiştir ve Türkçe karakterleri temizle
    const template = localStorage.getItem('hasan_crm_wa_template') || 'Merhaba [MUSTERI], [MARKA] marka cihazinizin periyodik bakim zamani yaklasmistir. Musait oldugunuz bir gun icin randevu olusturmak ister misiniz?';
    const message = tr2en(template.replace('[MUSTERI]', name).replace('[MARKA]', brand));
    
    // Numarayı formatla
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    if (!cleanPhone.startsWith('90') && cleanPhone.length > 0) {
      cleanPhone = '90' + cleanPhone;
    }

    // Veritabanında "İletildi" olarak işaretle
    const { error } = await supabase
      .from('service_records')
      .update({ reminder_sent: true })
      .eq('id', recordId);

    if (!error) {
      // Ekranda anında "İletildi" rozetini göster (Sayfayı yenilemeye gerek kalmadan)
      setUpcomingServices(prev => 
        prev.map(item => item.id === recordId ? { ...item, reminder_sent: true } : item)
      );
      
      // WhatsApp'ı yeni sekmede aç
      window.location.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    } else {
      alert("Veritabanı Hatası: Durum güncellenemedi.");
    }
  };

  if (loading) return <div className="text-center py-10 font-bold text-slate-500 animate-pulse">Sistem yükleniyor...</div>;

  return (
    <div className="min-h-full bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">Operasyon Merkezi</h1>

        {/* METRİKLER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><p className="text-sm font-bold text-slate-500 uppercase">Müşteriler</p><p className="text-3xl font-extrabold text-cyan-600">{stats.customers}</p></div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><p className="text-sm font-bold text-slate-500 uppercase">Cihazlar</p><p className="text-3xl font-extrabold text-indigo-600">{stats.devices}</p></div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><p className="text-sm font-bold text-slate-500 uppercase">Servisler</p><p className="text-3xl font-extrabold text-emerald-600">{stats.services}</p></div>
        </div>

       {/* YAKLAŞAN SERVİSLER MODÜLÜ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Yaklaşan Servisler (Sonraki 10 Gün)</h2>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {upcomingServices.map((record) => {
              const device = record.devices;
              const customer = device?.customers;
              const bakımTarihi = new Date(record.next_maintenance_date).toLocaleDateString('tr-TR');

              return (
                <div key={record.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-slate-50 transition-colors">
                  <div className="mb-3 md:mb-0">
                    <h3 className="font-bold text-slate-800 text-lg">{customer?.full_name || 'Bilinmiyor'}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {device?.brand} - {device?.device_type}
                    </p>
                    <div className="mt-2 inline-block bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-100">
                      Bakım: {bakımTarihi}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <Link href={`/admin/musteri/${device?.customer_id}`} className="flex-1 md:flex-none text-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm">
                      Profile Git &rarr;
                    </Link>

                    {/* RASYONEL BUTON LOJİSTİĞİ */}
                    {record.reminder_sent ? (
                      <button 
                        onClick={() => handleSendReminder(record.id, customer?.phone_number, customer?.full_name, device?.brand)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                        title="Mesajı Tekrar Gönder"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        İletildi (Tekrar)
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleSendReminder(record.id, customer?.phone_number, customer?.full_name, device?.brand)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.571c-.198 0-.52.074-.792.347-.272.273-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WP Hatırlat
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {upcomingServices.length === 0 && (
              <div className="p-8 text-center bg-slate-50">
                <p className="font-bold text-slate-500">Önümüzdeki 10 gün içinde yaklaşan servis kaydı yok.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}