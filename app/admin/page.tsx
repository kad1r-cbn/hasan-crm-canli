import { supabase } from '../../utils/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminPanel() {
  const today = new Date();
  const thirtyDaysLater = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  const targetDate = thirtyDaysLater.toISOString().split('T')[0];

  const { data: rawDevices, error: devicesError } = await supabase
    .from('devices')
    .select(`
      id,
      device_type,
      brand,
      customers (
        id,
        full_name,
        phone_number
      ),
      service_records (
        id,
        next_maintenance_date,
        service_date,
        description
      )
    `);
    
  if (devicesError) console.error("Analitik Sorgu Hatası:", devicesError);

  const upcomingServices = (rawDevices || [])
    .map((device: any) => {
      if (!device.service_records || device.service_records.length === 0 || !device.customers) return null;
      
      const sortedRecords = device.service_records.sort((a: any, b: any) => 
        new Date(b.service_date).getTime() - new Date(a.service_date).getTime()
      );
      
      const latestService = sortedRecords[0];

      if (!latestService.next_maintenance_date) return null;
      if (latestService.next_maintenance_date > targetDate) return null;

      return {
        id: latestService.id,
        next_maintenance_date: latestService.next_maintenance_date,
        description: latestService.description,
        devices: {
          id: device.id,
          device_type: device.device_type,
          brand: device.brand,
          customers: device.customers
        }
      };
    })
    .filter(Boolean); 

  upcomingServices.sort((a: any, b: any) => 
    new Date(a.next_maintenance_date).getTime() - new Date(b.next_maintenance_date).getTime()
  );

  return (
    <div className="min-h-full bg-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
           <h1 className="text-3xl font-extrabold text-slate-900">Kontrol Merkezi</h1>
           <div className="text-slate-500 font-bold">{today.toLocaleDateString('tr-TR')}</div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border-l-4 border-l-red-600 overflow-hidden">
          <div className="bg-red-50 p-6 border-b border-red-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-red-700 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Aksiyon Bekleyen Bakımlar
              </h2>
              <p className="text-sm text-red-600 mt-1 font-medium">Bu müşterileri arayarak acil randevu oluşturun, nakit akışını sağlayın.</p>
            </div>
            <div className="bg-red-600 text-white font-bold px-5 py-2 rounded-lg text-xl shadow-inner">
              {upcomingServices?.length || 0}
            </div>
          </div>

          <div className="p-0">
            {!upcomingServices || upcomingServices.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-bold bg-slate-50">
                Yaklaşan veya geciken bakım kaydı bulunmuyor. Sistem temiz.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4 font-bold">Müşteri Bilgisi</th>
                      <th className="p-4 font-bold">Cihaz</th>
                      <th className="p-4 font-bold">Sonraki Bakım</th>
                      <th className="p-4 font-bold text-right">Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {upcomingServices.map((record: any) => {
                      const device = record.devices;
                      const customer = device?.customers;
                      if (!customer) return null;

                      const isOverdue = new Date(record.next_maintenance_date) < new Date();

                      return (
                        <tr key={record.id} className="hover:bg-red-50/50 transition-colors">
                          <td className="p-4">
                            <Link href={`/admin/musteri/${customer.id}`} className="font-bold text-slate-800 hover:text-cyan-700 text-base">
                              {customer.full_name}
                            </Link>
                            <div className="text-sm text-slate-500 font-mono mt-1">{customer.phone_number}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-700">{device.brand}</div>
                            <div className="text-xs text-slate-500 uppercase">{device.device_type}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${isOverdue ? 'bg-red-100 text-red-700 border-red-200 shadow-sm' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                              {new Date(record.next_maintenance_date).toLocaleDateString('tr-TR')}
                              {isOverdue ? ' (Gecikmiş)' : ' (Yaklaşıyor)'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Link href={`/admin/musteri/${customer.id}/yeni-servis/${device.id}`} className="bg-slate-800 hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors inline-block">
                              Yeni Servis Gir
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>  
                </table>
              </div>   
            )}
          </div>
        </div>
      </div>
    </div>
  );
}