'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
// Dosya derinliği fazla olduğu için 7 kat yukarı çıkıyoruz. Eğer import hatası verirse ../ sayısını artır veya azalt.
import { supabase } from '../../../../../../../utils/supabase';
import Link from 'next/link';

export default function YeniServisKaydi() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const deviceId = params.deviceId as string;

  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);

  const [formData, setFormData] = useState({
    description: '',
    price: '',
    next_maintenance_date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // PDF motoruna ve arayüze veri sağlamak için cihaz ve müşteri bilgisini çekiyoruz
      const { data: deviceData } = await supabase.from('devices').select('*').eq('id', deviceId).single();
      const { data: customerData } = await supabase.from('customers').select('*').eq('id', id).single();

      if (deviceData) setDevice(deviceData);
      if (customerData) setCustomer(customerData);
      setLoading(false);
    };
    fetchData();
  }, [id, deviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // ADIM 3'TE PDF ÇİZME VE WHATSAPP MOTORU TAM OLARAK BU SATIRA GELECEK.
    // Şimdilik sadece veriyi düz bir şekilde veritabanına işliyoruz.
    
    const { data, error } = await supabase
      .from('service_records')
      .insert([{
        device_id: deviceId,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : 0,
        service_date: new Date().toISOString(),
        next_maintenance_date: formData.next_maintenance_date || null
        // pdf_url: ... (PDF yüklendikten sonra buraya eklenecek)
      }])
      .select()
      .single();

    if (error) {
      alert('Kayıt sırasında rasyonel bir hata oluştu: ' + error.message);
      setIsSubmitting(false);
      return;
    }

    // İşlem bitince müşterinin o cihazının geçmiş sayfasına geri fırlatıyoruz
    router.push(`/admin/musteri/${id}`);
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Sistem altyapısı hazırlanıyor...</div>;

  return (
    <div className="min-h-full bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/admin/musteri/${id}`} className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">Yeni Servis Formu</h1>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-500 uppercase">İşlem Yapılan Cihaz</h2>
            <p className="text-lg font-extrabold text-slate-900 mt-1">{device?.brand} {device?.model} <span className="text-sm font-normal text-slate-500">({customer?.full_name})</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Yapılan İşlem Detayı (Zorunlu)</label>
              <textarea 
                required
                rows={4}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-slate-50 outline-none"
                placeholder="Örn: Filtre değişimi yapıldı, gaz basıldı..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Alınan Ücret (₺)</label>
              <input 
                type="number"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-slate-50 outline-none"
                placeholder="Örn: 1500"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Planlanan Sonraki Bakım Tarihi</label>
              <input 
                type="date"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-slate-50 outline-none"
                value={formData.next_maintenance_date}
                onChange={(e) => setFormData({...formData, next_maintenance_date: e.target.value})}
              />
              <p className="text-xs text-slate-500 mt-1 font-semibold">Bu tarih seçilirse, Kontrol Merkezindeki "10 Günlük" yaklaşan bakımlar radarına otomatik girecektir.</p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-lg shadow-md transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Sisteme İşleniyor...' : 'Servis Kaydını Veritabanına İşle'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}