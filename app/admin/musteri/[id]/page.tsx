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

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <Link href="/admin" className="text-slate-500 hover:text-cyan-600 font-medium flex items-center transition-colors">
            ← Panele Dön
          </Link>
          <div className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm font-semibold">
            Müşteri Profili
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{customer.full_name}</h1>
            <div className="mt-2 space-y-1 text-slate-600">
              <p className="flex items-center"><span className="font-bold mr-2">Telefon:</span> <span className="font-mono text-sm">{customer.phone_number}</span></p>
              <p className="flex items-center"><span className="font-bold mr-2">Adres:</span> {customer.address}</p>
            </div>
          </div>
          <div>
            {customer.kvkk_approved ? (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">KVKK Onaylı</span>
            ) : (
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">İzin Yok</span>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800">Envanter Cihazları</h2>
            <Link href={`/admin/musteri/${id}/yeni-cihaz`} className="bg-cyan-50 text-cyan-700 hover:bg-cyan-100 px-4 py-2 rounded-lg text-sm font-bold border border-cyan-200 transition-colors">
              + Yeni Cihaz Ekle
            </Link>
          </div>
          
          {!devices || devices.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <p className="text-slate-500 font-medium">Kayıtlı cihaz bulunmuyor.</p>
            </div>
          ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {devices.map((device) => {
                const deviceServices = services.filter(s => s.device_id === device.id);
                const latestService = deviceServices[0]; // En son yapılan işlem

                return (
                  <div key={device.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">{device.brand} {device.model}</h3>
                          <p className="text-sm text-slate-500 mt-1">Seri No: <span className="font-mono text-slate-700">{device.serial_number || 'Belirtilmemiş'}</span></p>
                        </div>
                        <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide border border-slate-200">
                          {device.device_type}
                        </span>
                      </div>
                      
                      {!latestService ? (
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg mb-4 text-slate-500 text-sm font-medium">
                          Henüz servis kaydı yok.
                        </div>
                      ) : latestService.next_maintenance_date ? (
                        <div className="bg-red-50 border border-red-100 p-3 rounded-lg mb-4">
                          <p className="text-xs text-red-600 font-bold uppercase tracking-wide mb-1">Yaklaşan Bakım</p>
                          <p className="text-red-700 font-semibold">{new Date(latestService.next_maintenance_date).toLocaleDateString('tr-TR')}</p>
                        </div>
                      ) : (
                        <div className="bg-slate-100 border border-slate-200 p-3 rounded-lg mb-4 text-slate-500 text-sm font-bold text-center">
                          Periyodik Bakım Gerekmiyor
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-3 mt-auto pt-4 border-t border-slate-100">
                      <Link 
                        href={`/admin/musteri/${id}/cihaz/${device.id}`}
                        className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold py-2.5 rounded-lg transition-colors text-center"
                      >
                        Geçmiş Kayıtlar
                      </Link>
                      <Link 
                        href={`/admin/musteri/${id}/yeni-servis/${device.id}`}
                        className="flex-1 bg-slate-900 hover:bg-black text-white text-sm font-bold py-2.5 rounded-lg transition-colors text-center"
                      >
                        + Yeni Servis
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}