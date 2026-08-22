'use client';

import { useState, use } from 'react';
import { supabase } from '../../../../../utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateAndUploadPdf } from '../../../../../utils/pdfGenerator';

export default function YeniCihazVeServisEkle({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Cihaz State
  const [deviceData, setDeviceData] = useState({
    device_type: 'Klima',
    brand: '',
    model: '',
    serial_number: ''
  });

  // Servis State
  const today = new Date();
  const nextYear = new Date(today.setFullYear(today.getFullYear() + 1)).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [requiresMaintenance, setRequiresMaintenance] = useState(true);
  const [serviceData, setServiceData] = useState({
    service_date: todayStr,
    description: '',
    price: '',
    next_maintenance_date: nextYear
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Cihazı Veritabanına Yaz
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .insert([{
        customer_id: customerId,
        device_type: deviceData.device_type,
        brand: deviceData.brand,
        model: deviceData.model,
        serial_number: deviceData.serial_number
      }])
      .select()
      .single();

    if (deviceError) {
      setError(`Cihaz Kayıt Hatası: ${deviceError.message}`);
      setLoading(false);
      return;
    }

    // 2. Cihaz ID'sini al ve İlk Servisi Yaz (recordData'yı oluşturuyoruz)
    const finalNextDate = requiresMaintenance ? serviceData.next_maintenance_date : null;
    
    const { data: recordData, error: serviceError } = await supabase
      .from('service_records')
      .insert([{
        device_id: device.id,
        service_date: serviceData.service_date,
        description: serviceData.description,
        price: serviceData.price ? parseFloat(serviceData.price) : null,
        next_maintenance_date: finalNextDate
      }])
      .select() // Eksik olan parça
      .single(); // Eksik olan parça

    if (serviceError) {
      setError(`Servis Kayıt Hatası: ${serviceError.message}`);
      setLoading(false);
      return;
    }

    // 3. Müşteri Bilgisini Veritabanından Çek (PDF ve WhatsApp'a isim/telefon lazım)
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    // 4. PDF Motoru ve WhatsApp Lojistiği
    try {
      if (customer) {
        const publicUrl = await generateAndUploadPdf(recordData, customer, device, serviceData.description, serviceData.price);
        
        if (publicUrl) {
          let cleanPhone = customer.phone_number.replace(/\D/g, '');
          if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
          if (!cleanPhone.startsWith('90')) cleanPhone = '90' + cleanPhone;

          const waMessage = `Merhaba ${customer.full_name}, VORA Teknik Servis isleminiz tamamlanmistir. Servis formunuza buradan ulasabilirsiniz: ${publicUrl}`;
          window.location.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;
          return;
        }
      }
    } catch (e) {
      console.error("PDF Motoru Hatası:", e);
    }

    // İşlem bitince müşteri paneline geri dön
    router.push(`/admin/musteri/${customerId}`);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 border-b-4 border-cyan-500">
          <h2 className="text-2xl font-bold text-white">Mevcut Müşteriye Yeni Cihaz & İşlem</h2>
          <p className="text-cyan-400 text-sm mt-1">Cihazı envantere ekleyin ve ilk müdahaleyi anında kaydedin.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm font-bold">
              {error}
            </div>
          )}

          {/* CİHAZ BİLGİLERİ */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">1. Yeni Cihaz Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Cihaz Tipi</label>
                <select className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                  value={deviceData.device_type} onChange={(e) => setDeviceData({...deviceData, device_type: e.target.value})}>
                  <option value="Klima">Klima</option>
                  <option value="Kombi">Kombi</option>
                  <option value="VRF Tipi Klima">VRF Tipi Klima</option>
                  <option value="Salon Tipi Klima">Salon Tipi Klima</option>
                  <option value="Petek">Petek</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Marka</label>
                <input type="text" required className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  value={deviceData.brand} onChange={(e) => setDeviceData({...deviceData, brand: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Model</label>
                <input type="text" required className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  value={deviceData.model} onChange={(e) => setDeviceData({...deviceData, model: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Seri No (Opsiyonel)</label>
                <input type="text" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  value={deviceData.serial_number} onChange={(e) => setDeviceData({...deviceData, serial_number: e.target.value})} />
              </div>
            </div>
          </div>

          {/* İLK İŞLEM / SERVİS BİLGİLERİ */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">2. Yapılan İşlem</h3>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">İşlem Açıklaması</label>
              <textarea required rows={2} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500" placeholder="Örn: Yeni cihaz montajı yapıldı."
                value={serviceData.description} onChange={(e) => setServiceData({...serviceData, description: e.target.value})}></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">İşlem Tarihi</label>
                <input type="date" required className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  value={serviceData.service_date} onChange={(e) => setServiceData({...serviceData, service_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Alınan Ücret (₺)</label>
                <input type="number" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  value={serviceData.price} onChange={(e) => setServiceData({...serviceData, price: e.target.value})} />
              </div>
            </div>
            
            <div className="flex items-center mt-4">
              <input type="checkbox" id="maintenanceCheck" className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                checked={requiresMaintenance} onChange={(e) => setRequiresMaintenance(e.target.checked)} />
              <label htmlFor="maintenanceCheck" className="ml-3 text-sm font-bold text-slate-700">Bu işlem periyodik bakım takibi gerektirir</label>
            </div>

            {requiresMaintenance && (
              <div className="mt-3 p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                <label className="block text-sm font-bold text-cyan-800 mb-1">Sonraki Bakım Tarihi</label>
                <input type="date" required={requiresMaintenance} className="w-full p-3 border border-cyan-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-bold"
                  value={serviceData.next_maintenance_date} onChange={(e) => setServiceData({...serviceData, next_maintenance_date: e.target.value})} />
              </div>
            )}
          </div>

          <div className="flex space-x-4 pt-4 border-t border-slate-200">
            <Link href={`/admin/musteri/${customerId}`} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-4 rounded-lg transition-colors text-center text-lg">
              İptal
            </Link>
            <button type="submit" disabled={loading} className="flex-[2] bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50 text-lg shadow-lg">
              {loading ? 'Sisteme İşleniyor...' : 'Cihazı ve Servisi Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}