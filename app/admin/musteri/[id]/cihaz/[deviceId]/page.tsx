'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../../../../utils/supabase';
import Link from 'next/link';

export default function CihazGecmisi() {
  const { id, deviceId } = useParams<{ id: string; deviceId: string }>();
  const [device, setDevice] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      setError('');

      try {
        // Sunucudaki anonim istemci yerine CRM'nin tarayıcı oturumunu kullan.
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
          if (!cancelled) setError('Oturumunuz doğrulanamadı. Lütfen tekrar giriş yapın.');
          return;
        }

        const { data: deviceData, error: deviceError } = await supabase
          .from('devices')
          .select('*')
          .eq('id', deviceId)
          .eq('customer_id', id)
          .maybeSingle();

        if (cancelled) return;
        if (deviceError) {
          console.error('Cihaz geçmişi - cihaz sorgusu:', deviceError);
          setError('Cihaz bilgileri alınamadı. Oturumunuzu ve bağlantınızı kontrol edin.');
          return;
        }
        if (!deviceData) {
          setError('Bu müşteriye bağlı cihaz bulunamadı.');
          return;
        }

        const { data: serviceData, error: serviceError } = await supabase
          .from('service_records')
          .select('*')
          .eq('device_id', deviceId)
          .order('service_date', { ascending: false });

        if (cancelled) return;
        if (serviceError) {
          console.error('Cihaz geçmişi - servis kayıtları sorgusu:', serviceError);
          setError('Servis geçmişi alınamadı. Oturumunuzu ve bağlantınızı kontrol edin.');
          return;
        }

        setDevice(deviceData);
        setServices(serviceData ?? []);
      } catch (cause) {
        console.error('Cihaz geçmişi - beklenmeyen hata:', cause);
        if (!cancelled) setError('Veriler yüklenirken beklenmeyen bir sorun oluştu.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (id && deviceId) {
      void loadHistory();
    } else {
      setLoading(false);
      setError('Cihaz veya müşteri bağlantısı geçersiz.');
    }

    return () => { cancelled = true; };
  }, [id, deviceId]);

  if (loading) {
    return <div className="p-8 text-center font-bold text-slate-600" role="status">Cihaz geçmişi yükleniyor...</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-8 text-center" role="alert">
        <p className="font-bold text-red-600">{error}</p>
        <Link href={id ? `/admin/musteri/${id}` : '/admin/musteriler'} className="inline-block font-semibold text-cyan-700 hover:underline">
          Müşteri profiline dön
        </Link>
      </div>
    );
  }

  if (!device) {
    return <div className="p-8 text-center font-bold text-red-600">Bu müşteriye bağlı cihaz bulunamadı.</div>;
  }

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
                <div key={service.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
                {/* Sol Taraf: Tarih */}
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-bold uppercase mb-1">İşlem Tarihi</span>
                  <span className="font-extrabold text-slate-800 text-lg">{new Date(service.service_date).toLocaleDateString('tr-TR')}</span>
                </div>
    
               {/* Sağ Taraf: Ücret ve Buton */}
               <div className="flex flex-col items-end">
                 <span className="text-xs text-slate-400 font-bold uppercase mb-1">Ücret</span>
                 <span className="font-extrabold text-emerald-600 text-lg">{service.price ? `${service.price} ₺` : 'Ücretsiz'}</span>
      
                  {service.pdf_url && (
                      <a 
                        href={service.pdf_url} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="mt-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                         >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            PDF Formu
                       </a>
      )}
    </div>
  </div>
  
  <div className="text-sm text-slate-700">
    <span className="font-bold">Yapılan İşlem:</span> {service.description}
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