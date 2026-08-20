'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../../../../../utils/supabase';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// PDF motoru standart fontlarda Türkçe karakterlerde çuvallar. Veri mühendisliğinde buna "Encoding Constraint" denir.
// Sorunu çözmek için veriyi PDF'e basmadan önce İngilizce karakter setine indirgeyen rasyonel bir filtre:
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

    // 1. ADIM: VERİYİ İŞLE VE ID AL
    const { data: recordData, error: recordError } = await supabase
      .from('service_records')
      .insert([{
        device_id: deviceId,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : 0,
        service_date: new Date().toISOString(),
        next_maintenance_date: bakımTarihi
      }])
      .select()
      .single();

    if (recordError || !recordData) {
      alert('Veritabanı kayıt hatası: ' + recordError?.message);
      setIsSubmitting(false);
      return;
    }

    try {
      // 2. ADIM: PDF ÇİZİM MOTORU (jsPDF)
      const doc = new jsPDF();
      
      // Antet ve Başlık
      doc.setFontSize(22);
      doc.text("HASAN IKLIMLENDIRME - SERVIS FORMU", 14, 20);
      
      doc.setFontSize(10);
      doc.text(tr2en(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`), 14, 30);
      doc.text(`Islem No: SRV-${recordData.id}`, 14, 35);
      
      // Müşteri ve Cihaz Tablosu
      autoTable(doc, {
        startY: 45,
        head: [['Musteri Bilgileri', 'Cihaz Bilgileri']],
        body: [
          [
            tr2en(`Ad Soyad: ${customer.full_name}\nTelefon: ${customer.phone_number}\nAdres: ${customer.address || 'Belirtilmemis'}`),
            tr2en(`Marka/Model: ${device.brand} ${device.model}\nTip: ${device.device_type}\nSeri No: ${device.serial_number || 'Belirtilmemis'}`)
          ],
        ],
      });

      // Yapılan İşlem Tablosu
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Yapilan Islem Detayi', 'Ucret (TL)']],
        body: [
          [tr2en(formData.description), formData.price ? `${formData.price} TL` : 'Ucretsiz'],
        ],
      });

      // Varsa Sonraki Bakım Tarihi
      if (bakımTarihi) {
        doc.text(tr2en(`Planlanan Sonraki Bakim: ${new Date(bakımTarihi).toLocaleDateString('tr-TR')}`), 14, (doc as any).lastAutoTable.finalY + 15);
      }

      // 3. ADIM: PDF'İ BLOB'A ÇEVİR VE SUPABASE'E YÜKLE
      const pdfBlob = doc.output('blob');
      const fileName = `servis_${recordData.id}_${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('service_pdfs')
        .upload(fileName, pdfBlob, { contentType: 'application/pdf' });

      if (uploadError) throw new Error("PDF Yüklenemedi: " + uploadError.message);

      // 4. ADIM: URL'İ AL VE VERİTABANINI GÜNCELLE
      const { data: urlData } = supabase.storage.from('service_pdfs').getPublicUrl(fileName);
      const publicPdfUrl = urlData.publicUrl;

      await supabase.from('service_records').update({ pdf_url: publicPdfUrl }).eq('id', recordData.id);

      // 5. ADIM: WHATSAPP LOJİSTİĞİ
      // Numaradaki boşlukları ve başındaki 0'ı temizleyip uluslararası formata (90) getiriyoruz
      let cleanPhone = customer.phone_number.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
      if (!cleanPhone.startsWith('90')) cleanPhone = '90' + cleanPhone;

      const waMessage = tr2en(`Merhaba ${customer.full_name}, ${device.brand} cihazinizin servis islemi tamamlanmistir. Detayli servis formunuza ve faturaniza bu linkten ulasabilirsiniz: `) + publicPdfUrl;
      const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

      // WhatsApp'ı yeni sekmede aç
      window.open(waLink, '_blank');
      
      // Kullanıcıyı müşteri sayfasına geri yolla
      router.push(`/admin/musteri/${id}`);

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
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">2. Yapılan İşlem</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">İşlem Açıklaması</label>
                <textarea required rows={4} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-slate-700" placeholder="Örn: Filtre değişimi yapıldı..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Alınan Ücret (₺)</label>
                <input type="number" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-slate-700 font-bold" placeholder="Örn: 1500" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
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