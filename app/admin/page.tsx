'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import Link from 'next/link';

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

      // 2. 10 Günlük Zaman Penceresi Hesaplama
      const today = new Date();
      const next10Days = new Date();
      next10Days.setDate(today.getDate() + 10);
      
      // Tarihleri YYYY-MM-DD formatına çevir (Supabase'in okuyabileceği format)
      const todayStr = today.toISOString().split('T')[0];
      const next10DaysStr = next10Days.toISOString().split('T')[0];

      // 3. Yaklaşan Servisleri Çek (Sadece bugünden itibaren 10 gün içinde olanlar)
      const { data: upcoming } = await supabase
        .from('service_records')
        .select(`
          id,
          next_maintenance_date,
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
              // Yeni JSON hiyerarşisine göre veriyi doğru değişkenlere atıyoruz
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
                  <div className="flex gap-2 w-full md:w-auto">
                    {/* Cihazın customer_id'si üzerinden doğru profile yönlendiriyoruz */}
                    <Link href={`/admin/musteri/${device?.customer_id}`} className="flex-1 md:flex-none text-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm">
                      Profile Git &rarr;
                    </Link>
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