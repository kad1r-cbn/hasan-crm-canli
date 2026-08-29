import jsPDF from 'jspdf';
import { supabase } from './supabase';

// 1. ARKA PLAN VE FONT BASE64'LERİNİ BURAYA KOYACAKSIN
const formTemplateBase64 = "SENIN_RESIM_BASE64_KODUN";
const elYazisiBase64 = "SENIN_FONT_BASE64_KODUN_BURAYA";

export const generateAndUploadPdf = async (recordData: any, customer: any, device: any, description: string, price: string) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');

    // FONTU ENJEKTE ET
    doc.addFileToVFS("ElYazisi.ttf", elYazisiBase64);
    doc.addFont("ElYazisi.ttf", "ElYazisiFontum", "normal");

    // ŞABLONU BAS
    doc.addImage(formTemplateBase64, 'JPEG', 0, 0, 210, 297);

    // DAHA BÜYÜK VE KALIN GÖRÜNÜM İÇİN FONT BOYUTU 18'E ÇIKARILDI
    doc.setFont("ElYazisiFontum", "normal");
    doc.setFontSize(18); 
    doc.setTextColor(15, 30, 120);

    // --- Sağ Üst: Servis Formu Bilgileri ---
    // Y ekseni ~7 milim aşağı çekilip çizgiye oturtuldu
    doc.text(new Date(recordData.service_date).toLocaleDateString('tr-TR'), 160, 87);
    doc.text(`SRV-${recordData.id.substring(0, 8).toUpperCase()}`, 155, 95);

    // --- Sol Orta: Müşteri Bilgileri ---
    // Y ekseni ~6 milim aşağı çekildi
    doc.text(customer.full_name, 40, 118);
    doc.text(customer.phone_number, 40, 128);
    doc.text(customer.address || '-', 40, 138, { maxWidth: 60 });

    // --- Sağ Orta: Cihaz Bilgileri ---
    // Çarpı işaretleri için fontu iyice büyütüyoruz
    doc.setFontSize(22);
    
    // Kutucuk koordinatları (X ekseni) sola çekildi, tam kutuya oturtuldu
    if (device.device_type === 'Kombi') {
      doc.text("X", 128, 117);
    } else if (device.device_type === 'Klima' || device.device_type === 'VRF Tipi Klima' || device.device_type === 'Salon Tipi Klima') {
      doc.text("X", 146, 117); 
    } else if (device.device_type === 'Petek') {
      doc.text("X", 169, 117);
    }
    
    // Metin boyutuna geri dön
    doc.setFontSize(18);
    // Marka ve Seri No ayrıştırıldı, Y eksenleri düzeltildi
    doc.text(`${device.brand} ${device.model}`, 132, 128);
    doc.text(device.serial_number || '-', 132, 138);

    // --- Sol Alt: Arıza / Talep ---
    // Çok aşağıdaydı, 1. satıra (Y=158) çekildi
    doc.text(description, 15, 158, { maxWidth: 85 });

    // --- Sağ Alt: Yapılan İşlemler (Bakım) ---
    if (recordData.next_maintenance_date) {
        doc.setFontSize(22);
        // Temizlik kutusundan alınıp tam 'Bakım' kutucuğuna (Y=158) hizalandı
        doc.text("X", 106, 158); 
        doc.setFontSize(18);
    }

    // --- Sağ Alt Orta: Ücret Bilgisi ---
    // TOPLAM Hanesine milimetrik oturtuldu
    doc.text(price ? `${price}` : '0', 170, 209); 

    // PDF Kayıt işlemleri...
    const pdfBlob = doc.output('blob');
    const fileName = `vora_servis_${recordData.id}_${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage.from('service_pdfs').upload(fileName, pdfBlob, { contentType: 'application/pdf' });
    if (uploadError) throw new Error("Yükleme hatası: " + uploadError.message);

    const { data: urlData } = supabase.storage.from('service_pdfs').getPublicUrl(fileName);
    await supabase.from('service_records').update({ pdf_url: urlData.publicUrl }).eq('id', recordData.id);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("PDF Üretim Hatası:", error);
    return null;
  }
};