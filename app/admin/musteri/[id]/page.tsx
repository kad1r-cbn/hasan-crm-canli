import { supabase } from '../../../../utils/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MusteriDetay({ params }: any) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // 1. Müşteri Verisini Çek
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (customerError || !customer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 font-bold text-center">
          <p>Müşteri verisi bulunamadı.</p>
        </div>
      </div>
    );
  }

  // 2. Cihazları Çek
  const { data: devices } = await supabase
    .from('devices')
    .select('*')
    .eq('customer_id', id);

  const deviceIds = devices?.map(d => d.id) || [];
  
  // 3. Cihazlara ait sadece "Sonraki Bakım Tarihi" verilerini çek (Performanslı sorgu)
  let services: any[] = [];
  if (deviceIds.length > 0) {
    const { data: fetchedServices } = await supabase
      .from('service_records')
      .select('device_id, next_maintenance_date')
      .in('device_id', deviceIds)
      .order('service_date', { ascending: false });
    
    services = fetchedServices || [];
  }

  return (
    <div className="min-h-full bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Başlık ve Geri Butonu */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/musteriler" className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Müşteri Profili</h1>
        </div>

        {/* ÜST KISIM: Müşteri Temel Bilgileri */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900">{customer.full_name}</h2>
          <div className="mt-4 space-y-2">
            <p><span className="text-slate-500 font-bold w-20 inline-block">Telefon:</span> <span className="font-mono text-slate-700">{customer.phone_number}</span></p>
            <p><span className="text-slate-500 font-bold w-20 inline-block">Adres:</span> <span className="text-slate-700">{customer.address}</span></p>
          </div>
        </div>

        {/* ALT KISIM: Envanter Cihazları */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
             <h2 className="text-lg md:text-xl font-extrabold text-slate-800">Envanter Cihazları</h2>
             <Link href={`/admin/musteri/${customer.id}/yeni-cihaz`} className="bg-cyan-50 text-cyan-700 hover:bg-cyan-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-cyan-200 shadow-sm">
               + Yeni Cihaz
             </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {devices?.map((device) => {
              // DİNAMİK MANTIK: Bu cihaza ait en güncel servisi bul
              const latestService = services.find(s => s.device_id === device.id);
              const hasMaintenance = latestService && latestService.next_maintenance_date;
              const formattedDate = hasMaintenance ? new Date(latestService.next_maintenance_date).toLocaleDateString('tr-TR') : 'Kayıt Bulunmuyor';

              return (
                <div key={device.id} className="border border-slate-200 rounded-xl p-5 flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow">
                  
                  {/* 1. Satır: Cihaz Marka/Model ve Tag */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">{device.brand} {device.model}</h3>
                      <p className="text-sm text-slate-500 font-mono mt-1">Seri No: {device.serial_number || 'Belirtilmemiş'}</p>
                    </div>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-slate-200">
                      {device.device_type}
                    </span>
                  </div>

                  {/* 2. Satır: DİNAMİK Yaklaşan Bakım Uyarısı */}
                  <div className={`p-4 rounded-lg mb-6 border ${hasMaintenance ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1">YAKLAŞAN BAKIM</p>
                    <p className="font-extrabold font-mono text-sm">{formattedDate}</p>
                  </div>

                  {/* 3. Satır: Alt Butonlar */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                    <Link href={`/admin/musteri/${customer.id}/cihaz/${device.id}`} className="flex-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-center px-4 py-2.5 rounded-lg text-sm font-bold transition-colors">
                      Geçmiş Kayıtlar
                      
                    </Link>
                    <Link href={`/admin/musteri/${customer.id}/cihaz/${device.id}/yeni-servis`} className="flex-1 bg-slate-900 text-white hover:bg-slate-800 text-center px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-md">
                      + Yeni Servis
                    </Link>
                  </div>
                  
                </div>
              );
            })}
            
            {/* Cihaz Yoksa Gösterilecek Boş Durum */}
            {(!devices || devices.length === 0) && (
              <div className="col-span-full p-10 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                <p className="text-sm text-slate-500 font-bold">Bu müşteriye ait envanter kaydı bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}