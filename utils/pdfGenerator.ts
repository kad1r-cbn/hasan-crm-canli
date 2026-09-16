import jsPDF from 'jspdf';
import { supabase } from './supabase';

// 1. AŞAMA: O DEVASA ŞABLONLARI BURAYA YAPIŞTIRACAKSIN
const formTemplateBase64 = "data:image/png;base64,.../* SENİN VORA ŞABLONUNUN BASE64 KODUNU BURAYA YAPIŞTIR */";
const elYazisiBase64 = "AAEAAAATAQAA.../* SENİN EL YAZISI FONTUNUN BASE64 KODUNU BURAYA YAPIŞTIR */";

// 2. AŞAMA: KUSURSUZ HİZALANMIŞ PDF MOTORU
export const generateAndUploadPdf = async (recordData: any, customer: any, device: any, description: string, price: string) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');

    doc.addFileToVFS("ElYazisi.ttf", elYazisiBase64);
    doc.addFont("ElYazisi.ttf", "ElYazisiFontum", "normal");
    doc.addImage(formTemplateBase64, 'PNG', 0, 0, 210, 297);

    doc.setFont("ElYazisiFontum", "normal");
    doc.setFontSize(16); 
    doc.setTextColor(15, 30, 120);

    // --- Sağ Üst: Servis Formu Bilgileri ---
    const d = new Date(recordData.service_date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear()); 

    doc.text(dd, 162, 100);
    doc.text(mm, 175, 100);
    doc.text(yyyy, 189, 100);
    doc.text(`SRV-${recordData.id.substring(0, 8).toUpperCase()}`, 162, 110);

    // --- Sol Orta: Müşteri Bilgileri ---
    doc.text(customer.full_name, 42, 130);
    doc.text(customer.phone_number, 42, 142);
    doc.text(customer.address || '-', 42, 154, { maxWidth: 65 }); 

    // --- Sağ Orta: Cihaz Bilgileri ---
    doc.setFontSize(20);
    if (device.device_type === 'Kombi') doc.text("X", 127, 130);
    else if (device.device_type === 'Klima' || device.device_type === 'VRF Tipi Klima' || device.device_type === 'Salon Tipi Klima') doc.text("X", 147, 130); 
    else if (device.device_type === 'Petek') doc.text("X", 170, 130);
    
    doc.setFontSize(16);
    doc.text(`${device.brand} ${device.model}`, 135, 142);
    doc.text(device.serial_number || '-', 135, 154);

    // --- Sol Alt: Arıza / Talep ---
    doc.text(description, 15, 176, { maxWidth: 85 });

    // --- Sağ Alt: Yapılan İşlemler Kutucukları ---
    doc.setFontSize(20);
    if (recordData.operation_type === 'Arıza Tespiti') doc.text("X", 106, 177);
    else if (recordData.operation_type === 'Bakım') doc.text("X", 106, 184);
    else if (recordData.operation_type === 'Parça Değişimi') doc.text("X", 106, 191);
    else if (recordData.operation_type === 'Temizlik') doc.text("X", 106, 198);
    else if (recordData.operation_type === 'Diğer') {
      doc.text("X", 106, 205);
      doc.setFontSize(14);
      if (recordData.operation_other_text) doc.text(recordData.operation_other_text, 120, 204);
    }
    doc.setFontSize(16);

    // --- Sol Alt: Kullanılan Parçalar Tablosu ---
    if (recordData.is_part_used && recordData.part_name) {
       doc.text(recordData.part_name, 20, 205);
       if (recordData.part_quantity) doc.text(String(recordData.part_quantity), 90, 205);
    }

    // --- Sağ Alt Orta: Ücret ve Ödeme Şekli ---
    doc.text(price ? `${price}` : '0', 172, 222); 
    
    doc.setFontSize(20);
    if (recordData.payment_method === 'Nakit') doc.text("X", 106, 233);
    else if (recordData.payment_method === 'Kart') doc.text("X", 133, 233);
    else if (recordData.payment_method === 'Havale') doc.text("X", 158, 233);
    else if (recordData.payment_method === 'Peşin') doc.text("X", 125, 240);
    else if (recordData.payment_method === 'Taksit') doc.text("X", 155, 240);
    doc.setFontSize(16);

    // --- Sağ En Alt: Teknisyen Bilgisi ---
    if (recordData.technician) {
      doc.text(recordData.technician, 162, 263);
    }

    // PDF Kayıt işlemleri
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