'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import Link from 'next/link';

const tr2en = (text: string) => {
  return text.replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ü/g, 'u').replace(/Ü/g, 'U')
             .replace(/ş/g, 's').replace(/Ş/g, 'S').replace(/ı/g, 'i').replace(/İ/g, 'I')
             .replace(/ö/g, 'o').replace(/Ö/g, 'O').replace(/ç/g, 'c').replace(/Ç/g, 'C');
};

export default function KontrolMerkezi() {
  const [stats, setStats] = useState({ customers: 0, devices: 0, services: 0, pendingRequests: 0 });
  const [upcomingServices, setUpcomingServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const [
        { count: customerCount },
        { count: deviceCount },
        { count: serviceCount },
        { count: pendingCount }
      ] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('devices').select('*', { count: 'exact', head: true }),
        supabase.from('service_records').select('*', { count: 'exact', head: true }),
        supabase.from('web_requests').select('*', { count: 'exact', head: true }).eq('status', 'Bekliyor')
      ]);

      setStats({
        customers: customerCount || 0,
        devices: deviceCount || 0,
        services: serviceCount || 0,
        pendingRequests: pendingCount || 0
      });

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const next10Days = new Date(today);
      next10Days.setDate(today.getDate() + 10);
      const next10DaysStr = `${next10Days.getFullYear()}-${String(next10Days.getMonth() + 1).padStart(2, '0')}-${String(next10Days.getDate()).padStart(2, '0')}`;

      const { data: upcoming } = await supabase
        .from('service_records')
        .select(`
          id,
          next_maintenance_date,
          reminder_sent,
          devices (brand, device_type, customer_id, customers ( full_name, phone_number ))
        `)
        .gte('next_maintenance_date', todayStr)
        .lte('next_maintenance_date', next10DaysStr)
        .order('next_maintenance_date', { ascending: true });

      if (upcoming) setUpcomingServices(upcoming);
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const handleSendReminder = async (recordId: string, phone: string, name: string, brand: string) => {
    if (!phone) {
      alert("Hata: Müşteriye ait telefon numarası bulunamadı.");
      return;
    }
    const template = localStorage.getItem('hasan_crm_wa_template') || 'Merhaba [MUSTERI], [MARKA] marka cihazinizin periyodik bakim zamani yaklasmistir. Musait oldugunuz bir gun icin randevu olusturmak ister misiniz?';
    const message = tr2en(template.replace('[MUSTERI]', name).replace('[MARKA]', brand));
    
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    if (!cleanPhone.startsWith('90') && cleanPhone.length > 0) cleanPhone = '90' + cleanPhone;

    const { error } = await supabase.from('service_records').update({ reminder_sent: true }).eq('id', recordId);

    if (!error) {
      setUpcomingServices(prev => prev.map(item => item.id === recordId ? { ...item, reminder_sent: true } : item));
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/web-talepleri" className={`p-6 rounded-2xl shadow-sm border transition-all hover:-translate-y-1 block ${stats.pendingRequests > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
            <p className={`text-sm font-bold uppercase ${stats.pendingRequests > 0 ? 'text-orange-600' : 'text-slate-500'}`}>Bekleyen Talepler</p>
            <p className={`text-3xl font-extrabold ${stats.pendingRequests > 0 ? 'text-orange-600 animate-pulse' : 'text-slate-400'}`}>{stats.pendingRequests}</p>
          </Link>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><p className="text-sm font-bold text-slate-500 uppercase">Müşteriler</p><p className="text-3xl font-extrabold text-cyan-600">{stats.customers}</p></div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><p className="text-sm font-bold text-slate-500 uppercase">Cihazlar</p><p className="text-3xl font-extrabold text-indigo-600">{stats.devices}</p></div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><p className="text-sm font-bold text-slate-500 uppercase">Servisler</p><p className="text-3xl font-extrabold text-emerald-600">{stats.services}</p></div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h2 className="text-lg font-bold text-slate-800">Yaklaşan Servisler (Sonraki 10 Gün)</h2></div>
          <div className="flex flex-col divide-y divide-slate-100">
            {upcomingServices.map((record) => {
              const device = record.devices;
              const customer = device?.customers;
              const bakımTarihi = new Date(record.next_maintenance_date).toLocaleDateString('tr-TR');
              return (
                <div key={record.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-slate-50 transition-colors">
                  <div className="mb-3 md:mb-0">
                    <h3 className="font-bold text-slate-800 text-lg">{customer?.full_name || 'Bilinmiyor'}</h3>
                    <p className="text-sm text-slate-600 mt-1">{device?.brand} - {device?.device_type}</p>
                    <div className="mt-2 inline-block bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-100">Bakım: {bakımTarihi}</div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <Link href={`/admin/musteri/${device?.customer_id}`} className="flex-1 md:flex-none text-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm">Profile Git &rarr;</Link>
                    {record.reminder_sent ? (
                      <button onClick={() => handleSendReminder(record.id, customer?.phone_number, customer?.full_name, device?.brand)} className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm" title="Mesajı Tekrar Gönder">İletildi (Tekrar)</button>
                    ) : (
                      <button onClick={() => handleSendReminder(record.id, customer?.phone_number, customer?.full_name, device?.brand)} className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm">WP Hatırlat</button>
                    )}
                  </div>
                </div>
              );
            })}
            {upcomingServices.length === 0 && <div className="p-8 text-center bg-slate-50"><p className="font-bold text-slate-500">Önümüzdeki 10 gün içinde yaklaşan servis kaydı yok.</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}