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

      // 2. Yaklaşan Servisleri Çek (Örnek: Son eklenen veya bakımı yaklaşan cihazlar üzerinden)
      // NOT: Veritabanındaki mantığına göre buradaki 'devices' veya 'service_records' sorgusunu kendi kolonlarına göre adapte et.
      const { data: upcoming } = await supabase
        .from('devices')
        .select(`
          *,
          customers (
            full_name,
            phone_number
          )
        `)
        .order('created_at', { ascending: false }) // Eğer next_maintenance_date kolonun varsa burayı ona göre değiştir
        .limit(5);

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
            <h2 className="text-lg font-bold text-slate-800">Yaklaşan Servisler / Cihazlar</h2>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {upcomingServices.map((device) => (
              <div key={device.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-slate-50">
                <div className="mb-2 md:mb-0">
                  <h3 className="font-bold text-slate-800">{device.customers?.full_name || 'Bilinmiyor'}</h3>
                  <p className="text-sm text-slate-500">{device.brand} - {device.device_type}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Link href={`/admin/musteri/${device.customer_id}`} className="flex-1 md:flex-none text-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                    Profile Git
                  </Link>
                </div>
              </div>
            ))}
            {upcomingServices.length === 0 && <div className="p-6 text-center font-bold text-slate-500">Yaklaşan servis kaydı yok.</div>}
          </div>
        </div>

      </div>
    </div>
  );
}