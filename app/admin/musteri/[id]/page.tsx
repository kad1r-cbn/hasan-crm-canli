import { supabase } from '../../../../utils/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MusteriDetay({ params }: any) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

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

  const { data: devices } = await supabase
    .from('devices')
    .select('*')
    .eq('customer_id', id);

  const deviceIds = devices?.map(d => d.id) || [];

  let services: any[] = [];
  if (deviceIds.length > 0) {
    const { data: fetchedServices } = await supabase
      .from('service_records')
      .select('*')
      .in('device_id', deviceIds)
      .order('service_date', { ascending: false });
    
    services = fetchedServices || [];
  }

  // Üstteki veri çekme (fetch) fonksiyonların ve statelerin aynı kalacak.
// Sadece return kısmını şu şekilde değiştir:

  return (
    <div className="min-h-full bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Başlık ve Geri Butonu */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/musteriler" className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Müşteri Profili</h1>
        </div>

        {/* BİLGİ KARTLARI (Mobilde 1 kolon, Masaüstünde 2 kolon) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Müşteri Temel Bilgileri */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Kimlik Bilgileri</h2>
            <div className="space-y-3">
              <p><span className="text-slate-500 text-sm font-bold block">Ad Soyad</span> <span className="font-semibold text-slate-900">{customer.full_name}</span></p>
              <p><span className="text-slate-500 text-sm font-bold block">Telefon</span> <span className="font-mono font-semibold text-slate-900">{customer.phone_number}</span></p>
              <p><span className="text-slate-500 text-sm font-bold block">Adres</span> <span className="font-semibold text-slate-900">{customer.address}</span></p>
            </div>
          </div>

          {/* Cihazlar Listesi */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
               <h2 className="text-lg font-bold text-slate-800">Kayıtlı Cihazlar</h2>
               <Link href={`/admin/musteri/${customer.id}/yeni-cihaz`} className="bg-cyan-100 text-cyan-800 hover:bg-cyan-200 px-3 py-1 rounded-lg text-xs font-bold transition-colors">
                 + Cihaz Ekle
               </Link>
            </div>
            <div className="space-y-3">
              {devices?.map((device) => (
                <div key={device.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="font-bold text-slate-800">{device.brand} - {device.device_type}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">Seri No: {device.serial_number || 'Belirtilmemiş'}</p>
                </div>
              ))}
              {(!devices || devices.length === 0) && <p className="text-sm text-slate-500 font-bold">Cihaz bulunamadı.</p>}
            </div>
          </div>
        </div>

        {/* Servis Geçmişi (Tam Genişlik) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
             <h2 className="text-lg font-bold text-slate-800">Servis Geçmişi</h2>
             <Link href={`/admin/musteri/${customer.id}/yeni-servis`} className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 px-3 py-1 rounded-lg text-xs font-bold transition-colors">
               + Servis İşlemi Gir
             </Link>
          </div>
          <div className="space-y-3">
            {/* Servis geçmişi map fonksiyonun buraya gelecek */}
          </div>
        </div>

      </div>
    </div>
  );
}