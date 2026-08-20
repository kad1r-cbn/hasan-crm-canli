'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import Link from 'next/link';

export default function KontrolMerkezi() {
  const [stats, setStats] = useState({ customers: 0, devices: 0, services: 0 });
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Paralel Veri Çekimi (Performans Optimizasyonu)
      const [
        { count: customerCount },
        { count: deviceCount },
        { count: serviceCount },
        { data: recent }
      ] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('devices').select('*', { count: 'exact', head: true }),
        supabase.from('service_records').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      setStats({
        customers: customerCount || 0,
        devices: deviceCount || 0,
        services: serviceCount || 0
      });
      
      if (recent) setRecentCustomers(recent);
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-slate-500 font-bold animate-pulse">
        Sistem metrikleri hesaplanıyor...
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-6">Sistem Özeti</h1>

        {/* METRİK KARTLARI (Mobilde alt alta, Masaüstünde yan yana) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center md:items-start">
            <span className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Toplam Müşteri</span>
            <span className="text-4xl font-extrabold text-cyan-600">{stats.customers}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center md:items-start">
            <span className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Kayıtlı Cihaz</span>
            <span className="text-4xl font-extrabold text-indigo-600">{stats.devices}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center md:items-start">
            <span className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Servis İşlemi</span>
            <span className="text-4xl font-extrabold text-emerald-600">{stats.services}</span>
          </div>
        </div>

        {/* SON EKLENEN MÜŞTERİLER (Mobil Kart Mimarisi) */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800">Son Eklenen Müşteriler</h2>
            <Link href="/admin/musteriler" className="text-cyan-600 hover:text-cyan-800 text-sm font-bold transition-colors">Tümünü Gör &rarr;</Link>
          </div>
          
          <div className="flex flex-col divide-y divide-slate-100">
            {recentCustomers.map((customer) => (
              <Link href={`/admin/musteri/${customer.id}`} key={customer.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{customer.full_name}</h3>
                  <p className="text-slate-500 font-mono text-xs md:text-sm mt-1">{customer.phone_number}</p>
                </div>
                <div className="bg-cyan-100 text-cyan-800 px-3 py-1.5 rounded-lg text-xs font-bold">
                  Detay
                </div>
              </Link>
            ))}
            {recentCustomers.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm font-bold">Henüz müşteri kaydı bulunmuyor.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}