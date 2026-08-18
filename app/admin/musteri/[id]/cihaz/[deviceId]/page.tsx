import { supabase } from '../../../../../../utils/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CihazGecmisi({ params }: any) {
  const resolvedParams = await params;
  const { id, deviceId } = resolvedParams;

  const { data: device } = await supabase
    .from('devices')
    .select('*')
    .eq('id', deviceId)
    .single();

  const { data: services } = await supabase
    .from('service_records')
    .select('*')
    .eq('device_id', deviceId)
    .order('service_date', { ascending: false });

  if (!device) return <div className="p-8 text-center text-red-600 font-bold">Cihaz bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <Link href={`/admin/musteri/${id}`} className="text-slate-500 hover:text-cyan-600 font-medium flex items-center transition-colors">
            ← Müşteri Profiline Dön
          </Link>
          <div className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm font-semibold">
            Cihaz Geçmişi
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 pb-5 mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{device.brand} {device.model}</h1>
              <p className="text-slate-500 mt-1">Seri No: <span className="font-mono">{device.serial_number || 'Belirtilmemiş'}</span></p>
            </div>
            <span className="bg-cyan-100 text-cyan-800 px-4 py-2 rounded-lg font-bold">
              {device.device_type}
            </span>
          </div>

          <h2 className="text-lg font-bold text-slate-800 mb-4">Tüm Servis İşlemleri</h2>
          
          {!services || services.length === 0 ? (
            <p className="text-slate-500 p-6 bg-slate-50 rounded-xl text-center border border-dashed border-slate-300">
              Bu cihaza ait geçmiş servis kaydı bulunmuyor.
            </p>
          ) : (
            <div className="space-y-4">
              {services.map(service => (
                <div key={service.id} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">İşlem Tarihi</p>
                      <p className="font-bold text-slate-800 text-lg">{new Date(service.service_date).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">Ücret</p>
                      <p className="font-bold text-emerald-600 text-lg">{service.price ? `${service.price} ₺` : 'Ücretsiz'}</p>
                    </div>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed mb-4">{service.description}</p>
                  <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg text-sm flex justify-between items-center">
                    <span className="font-bold">Planlanan Sonraki Bakım:</span>
                    <span className="font-mono font-bold">{new Date(service.next_maintenance_date).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}