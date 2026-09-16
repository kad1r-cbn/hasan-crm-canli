'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../../../../../utils/supabase';
import Link from 'next/link';
// VORA Motoru
import { generateAndUploadPdf } from '../../../../../../../utils/pdfGenerator'; 

const tr2en = (text: string) => {
  return text
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C');
};

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
  const [isPeriodic, setIsPeriodic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // YENİ EKLENEN OPERASYONEL STATE'LER
  const [isPartUsed, setIsPartUsed] = useState(false);
  const [partName, setPartName] = useState('');
  const [partQuantity, setPartQuantity] = useState('');
  const [operationType, setOperationType] = useState('Arıza Tespiti');
  const [operationOther, setOperationOther] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Nakit');
  const [technician, setTechnician] = useState('Hasan Yılmaz');

  useEffect(() => {
    const fetchData = async () => {
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

    const bakımTarihi = isPeriodic && formData.next_maintenance_date ? formData.next_maintenance_date : null;

    // 1. ADIM: VERİYİ İŞLE VE ID AL (YENİ VERİLER EKLENDİ)
    const { data: recordData, error: recordError } = await supabase
      .from('service_records')
      .insert([{
        device_id: deviceId,
        service_date: new Date().toISOString(),
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : null,
        next_maintenance_date: bakımTarihi,
        is_part_used: isPartUsed,
        part_name: isPartUsed ? partName : null,
        part_quantity: isPartUsed ? partQuantity : null,
        operation_type: operationType,
        operation_other_text: operationType === 'Diğer' ? operationOther : null,
        payment_method: paymentMethod,
        technician: technician
      }])
      .select()
      .single();

    if (recordError || !recordData) {
      alert('Veritabanı kayıt hatası: ' + recordError?.message);
      setIsSubmitting(false);
      return;
    }

    try {
      // 2. ADIM: VORA PDF MOTORUNU ÇAĞIR VE WHATSAPP'A GÖNDER
      const publicUrl = await generateAndUploadPdf(recordData, customer, device, formData.description, formData.price);

      if (publicUrl) {
        let rawPhone = customer?.phone_number || '';
        let cleanPhone = rawPhone.replace(/\D/g, ''); 
        
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
        if (!cleanPhone.startsWith('90') && cleanPhone.length > 0) {
          cleanPhone = '90' + cleanPhone;
        }

        if (cleanPhone.length < 12) {
           alert('İşlem Başarılı: Servis kaydedildi ve PDF depoya yüklendi!\n\nAncak müşterinin geçerli bir telefon numarası olmadığı için WhatsApp yönlendirmesi atlandı.');
           router.push(`/admin/musteri/${id}`);
           return; 
        }

        // WhatsApp mesajı ve Yönlendirme
        const waMessage = tr2en(`Merhaba ${customer.full_name}, VORA Teknik Servis isleminiz tamamlanmistir. Servis formunuza buradan ulasabilirsiniz: `) + publicUrl;
        const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

        window.location.href = waLink;
      }

    } catch (err: any) {
      alert("Operasyon sırasında hata: " + err.message);
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Sistem yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-white font-sans pb-10">
      <div className="bg-slate-900 text-white px-6 pt-8 pb-8 border-b-4 border-cyan-500">
        <Link href={`/admin/musteri/${id}`} className="inline-flex items-center text-slate-400 hover:text-white text-sm font-bold mb-4 transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Geri Dön
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Mevcut Cihaza Yeni İşlem</h1>
        <p className="text-slate-400 text-sm mt-2">Cihaza yapılan müdahaleyi sisteme kaydedin ve müşteriye iletin.</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-6">
        <form onSubmit={handleSubmit}>
          
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">1. İşlem Yapılan Cihaz</h2>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-lg font-extrabold text-slate-900">{device?.brand} {device?.model}</p>
              <p className="text-sm text-slate-500 mt-1">Müşteri: <span className="font-bold text-slate-700">{customer?.full_name}</span></p>
              <p className="text-xs text-slate-400 font-mono mt-1">Seri No: {device?.serial_number || 'Belirtilmemiş'}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">2. Yapılan İşlem Detayları</h2>
            <div className="space-y-5">
              
              {/* YAPILAN İŞLEMLER */}
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">Yapılan İşlem</label>
                <select value={operationType} onChange={(e) => setOperationType(e.target.value)} className="p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 bg-white">
                  <option value="Arıza Tespiti">Arıza Tespiti</option>
                  <option value="Bakım">Bakım</option>
                  <option value="Parça Değişimi">Parça Değişimi</option>
                  <option value="Temizlik">Temizlik</option>
                  <option value="Diğer">Diğer</option>
                </select>
                {operationType === 'Diğer' && (
                  <input type="text" placeholder="Yapılan işlemi yazın..." value={operationOther} onChange={(e) => setOperationOther(e.target.value)} className="mt-2 p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500" />
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">İşlem Açıklaması Detayı</label>
                <textarea required rows={4} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-slate-700" placeholder="Örn: Filtre değişimi yapıldı..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
              </div>

              {/* KULLANILAN PARÇALAR */}
              <div className="flex flex-col gap-2 p-4 border border-dashed border-slate-300 rounded-lg bg-white">
                <div className="flex items-center gap-3">
                  <label className="font-bold text-slate-700 text-sm">Parça Kullanıldı mı?</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isPartUsed} onChange={(e) => setIsPartUsed(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
                
                {isPartUsed && (
                  <div className="flex gap-2 mt-2">
                    <input type="text" placeholder="Parça Adı (Örn: Sensör)" required={isPartUsed} value={partName} onChange={(e) => setPartName(e.target.value)} className="flex-1 p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500" />
                    <input type="number" placeholder="Adet" required={isPartUsed} value={partQuantity} onChange={(e) => setPartQuantity(e.target.value)} className="w-24 p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500" />
                  </div>
                )}
              </div>

              {/* ÜCRET VE ÖDEME ŞEKLİ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Alınan Ücret (₺)</label>
                  <input type="number" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-slate-700 font-bold" placeholder="Örn: 1500" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Ödeme Şekli</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 bg-white">
                    <option value="Nakit">Nakit</option>
                    <option value="Kart">Kart</option>
                    <option value="Havale">Havale</option>
                    <option value="Peşin">Peşin</option>
                    <option value="Taksit">Taksit</option>
                  </select>
                </div>
              </div>

              {/* TEKNİSYEN */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">Teknisyen</label>
                <select value={technician} onChange={(e) => setTechnician(e.target.value)} className="p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 bg-white">
                  <option value="Hasan Yılmaz">Hasan Yılmaz</option>
                  <option value="Orhan Orak">Orhan Orak</option>
                </select>
              </div>

              <div className="mt-6 flex items-start gap-3">
                <input type="checkbox" id="periodic" checked={isPeriodic} onChange={(e) => setIsPeriodic(e.target.checked)} className="w-5 h-5 mt-0.5 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500" />
                <label htmlFor="periodic" className="text-sm font-bold text-slate-700 cursor-pointer">Bu işlem periyodik bakım takibi gerektirir</label>
              </div>
              
              {isPeriodic && (
                <div className="mt-4 p-4 bg-cyan-50 border border-cyan-200 rounded-xl relative animate-fade-in-down">
                  <label className="block text-sm font-bold text-cyan-800 mb-1">Sonraki Bakım Tarihi</label>
                  <input type="date" required={isPeriodic} className="w-full p-3 border border-cyan-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white outline-none font-bold text-slate-700" value={formData.next_maintenance_date} onChange={(e) => setFormData({...formData, next_maintenance_date: e.target.value})} />
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Link href={`/admin/musteri/${id}`} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3.5 rounded-lg text-center transition-colors">
              İptal
            </Link>
            <button type="submit" disabled={isSubmitting} className="flex-[2] bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-lg shadow-md transition-colors disabled:opacity-50">
              {isSubmitting ? 'PDF Üretiliyor ve Kaydediliyor...' : 'Servisi Kaydet ve Müşteriye İlet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}