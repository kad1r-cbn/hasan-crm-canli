'use client';

import { useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateAndUploadPdf } from '../../../utils/pdfGenerator'; 

export default function YeniMusteriEkle() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // 1. Müşteri Verileri
  const [customerData, setCustomerData] = useState({
    full_name: '',
    phone_number: '',
    address: '',
    kvkk_approved: false
  });

  // 2. Cihaz Verileri
  const [deviceData, setDeviceData] = useState({
    device_type: 'Klima',
    brand: '',
    model: '',
    serial_number: ''
  });

  // 3. Servis Verileri
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

  // --- TELEFON MASKESİ ALGORİTMASI ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, ''); 
    
    if (input.length === 0) {
      setCustomerData({ ...customerData, phone_number: '' });
      return;
    }
    
    if (input[0] !== '0') input = '0' + input;
    input = input.substring(0, 11);
    
    let formatted = '';
    if (input.length > 0) formatted += input[0];
    if (input.length > 1) formatted += `(${input.substring(1, 4)}`;
    if (input.length > 4) formatted += `) ${input.substring(4, 7)}`;
    if (input.length > 7) formatted += ` ${input.substring(7, 9)}`;
    if (input.length > 9) formatted += ` ${input.substring(9, 11)}`;
    
    setCustomerData({ ...customerData, phone_number: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('Adım 1/3: Müşteri profili oluşturuluyor...');

    // AŞAMA 1: Müşteriyi Kaydet
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (customerError) {
      setError(`Müşteri Kayıt Hatası: ${customerError.message}`);
      setLoading(false);
      return;
    }

    setSuccessMsg('Adım 2/3: Cihaz envantere ekleniyor...');

    // AŞAMA 2: Cihazı Kaydet (Müşteri ID'si ile bağla)
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .insert([{
        customer_id: customer.id,
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

    setSuccessMsg('Adım 3/3: İlk servis kaydı işleniyor...');

    // AŞAMA 3: Servis Kaydını Ekle (Cihaz ID'si ile bağla ve .select().single() ile veriyi al)
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
      .select()
      .single();

    if (serviceError) {
      setError(`Servis Kayıt Hatası: ${serviceError.message}`);
      setLoading(false);
      return;
    }

   // AŞAMA 4: PDF Motoru ve WhatsApp Lojistiği
    try {
      setSuccessMsg('PDF oluşturuluyor ve müşteriye iletiliyor...');
      const publicUrl = await generateAndUploadPdf(recordData, customer, device, serviceData.description, serviceData.price);
      
      if (publicUrl) {
        let cleanPhone = customer.phone_number.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
        if (!cleanPhone.startsWith('90')) cleanPhone = '90' + cleanPhone;

        // Güvenlik Ağı: Telefon eksikse sistemi dondurma, profiline at.
        if (cleanPhone.length < 12) {
           alert('İşlem Başarılı: Müşteri, cihaz ve servis kaydedildi, PDF depoya yüklendi!\n\nAncak geçerli bir telefon numarası olmadığı için WhatsApp yönlendirmesi atlandı.');
           router.push(`/admin/musteri/${customer.id}`);
           return; 
        }

        const waMessage = `Merhaba ${customer.full_name}, VORA Teknik Servis isleminiz tamamlanmistir. Servis formunuza buradan ulasabilirsiniz: ${publicUrl}`;
        window.location.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;
        return; // İşlemi bitir, yönlendirmeyi WhatsApp halletsin
      }
    } catch (e) {
      console.error("PDF Motoru Hatası:", e);
      alert("PDF Motoru Hatası, ancak veriler başarıyla kaydedildi.");
      setLoading(false);
    }

    // Her şey kusursuz çalıştıysa profiline yönlendir (WhatsApp'a gidemezse buraya düşer)
    setSuccessMsg('Tüm kayıtlar başarılı! Yönlendiriliyorsunuz...');
    router.push(`/admin/musteri/${customer.id}`);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 border-b-4 border-cyan-500">
          <h2 className="text-2xl font-bold text-white">Komple Yeni Kayıt (Müşteri + Cihaz + İşlem)</h2>
          <p className="text-cyan-400 text-sm mt-1">Tek ekranda tüm operasyonu sisteme işleyin.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm font-bold">
              {error}
            </div>
          )}
          {loading && successMsg && !error && (
            <div className="bg-cyan-50 text-cyan-800 p-4 rounded-lg border border-cyan-200 text-sm font-bold flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {successMsg}
            </div>
          )}

          {/* MÜŞTERİ BÖLÜMÜ */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">1. Müşteri Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ad Soyad</label>
                <input type="text" required className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  value={customerData.full_name} onChange={(e) => setCustomerData({...customerData, full_name: e.target.value})} />
              </div>
              <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Telefon Numarası</label>
            <input 
              type="tel" 
              required
              maxLength={16}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-mono tracking-wider"
              placeholder="0(555) 123 45 67"
              value={customerData.phone_number}
              onChange={handlePhoneChange} 
            />
          </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Açık Adres</label>
              <textarea required rows={2} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                value={customerData.address} onChange={(e) => setCustomerData({...customerData, address: e.target.value})}></textarea>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="kvkk" className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                checked={customerData.kvkk_approved} onChange={(e) => setCustomerData({...customerData, kvkk_approved: e.target.checked})} />
              <label htmlFor="kvkk" className="ml-3 text-sm font-bold text-slate-700">İletişim (SMS/Arama) onayı alındı</label>
            </div>
          </div>

          {/* CİHAZ BÖLÜMÜ */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">2. Cihaz Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Cihaz Tipi</label>
                <select className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                  value={deviceData.device_type} onChange={(e) => setDeviceData({...deviceData, device_type: e.target.value})}>
                  <option value="Klima">Klima</option>
                  <option value="Kombi">Kombi</option>
                  <option value="Soğuk Oda">Soğuk Oda Motoru</option>
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

          {/* İLK SERVİS BÖLÜMÜ */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">3. Yapılan İlk İşlem (Kurulum/Arıza)</h3>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">İşlem Açıklaması</label>
              <textarea required rows={2} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500" placeholder="Örn: Sıfır cihaz kurulumu yapıldı."
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
            <Link href="/admin" className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-4 rounded-lg transition-colors text-center text-lg">
              İptal
            </Link>
            <button type="submit" disabled={loading} className="flex-[2] bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50 text-lg shadow-lg">
              {loading ? 'Kayıtlar İşleniyor...' : 'Tümünü Kaydet ve Profili Aç'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}