import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase';

const tr2en = (text: string) => text.replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ü/g, 'u').replace(/Ü/g, 'U').replace(/ş/g, 's').replace(/Ş/g, 'S').replace(/ı/g, 'i').replace(/İ/g, 'I').replace(/ö/g, 'o').replace(/Ö/g, 'O').replace(/ç/g, 'c').replace(/Ç/g, 'C');

export const generateAndUploadPdf = async (recordData: any, customer: any, device: any, description: string, price: string) => {
  try {
    const doc = new jsPDF();
    
    // ÜST BİLGİ (HEADER) - Lacivert/Mavi Arka Plan
    doc.setFillColor(15, 23, 42); // slate-900 (VORA Koyu Renk)
    doc.rect(0, 0, 210, 45, 'F');
    
    // Logo / Şirket İsmi
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("VORA", 14, 20);
    
    doc.setTextColor(6, 182, 212); // cyan-500 (Vurgu rengi)
    doc.setFontSize(14);
    doc.text("KOMBI & KLIMA", 52, 20);
    
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("TEKNIK SERVIS - 7/24 HIZMET", 14, 28);
    
    // İletişim Bilgileri (Kartvizitten)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text("Hasan Yilmaz: 0536 528 11 16   |   Orhan Orak: 0538 818 82 36", 14, 38);
    
    // Tarih ve Belge No (Sağ Üst)
    doc.setFontSize(10);
    doc.text(tr2en(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`), 150, 20);
    doc.text(`Islem No: VORA-${recordData.id}`, 150, 26);

    // MÜŞTERİ & CİHAZ TABLOSU
    autoTable(doc, {
      startY: 55,
      headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['Musteri Bilgileri', 'Cihaz Bilgileri']],
      body: [[
        tr2en(`Ad Soyad: ${customer.full_name}\nTelefon: ${customer.phone_number}\nAdres: ${customer.address || '-'}`),
        tr2en(`Cihaz Tipi: ${device.device_type}\nMarka/Model: ${device.brand} ${device.model}\nSeri No: ${device.serial_number || '-'}`)
      ]],
    });

    // İŞLEM TABLOSU
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['YAPILAN ISLEM DETAYI', 'ALINAN UCRET']],
      body: [[
        tr2en(description), 
        { content: `${price ? price + ' TL' : 'Ucretsiz'}`, styles: { fontStyle: 'bold', textColor: [5, 150, 105] } }
      ]],
    });

    // SONRAKİ BAKIM UYARISI
    if (recordData.next_maintenance_date) {
        doc.setFontSize(10);
        doc.setTextColor(220, 38, 38); // red-600
        doc.setFont("helvetica", "bold");
        doc.text(tr2en(`PLANLANAN SONRAKI BAKIM TARIHI: ${new Date(recordData.next_maintenance_date).toLocaleDateString('tr-TR')}`), 14, (doc as any).lastAutoTable.finalY + 15);
    }

    // ALT BİLGİ (FOOTER)
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Uzman Kadro | Kaliteli Hizmet | 1 Yil Iscilik Garantisi", 105, 280, { align: "center" });

    // SUPABASE YÜKLEME İŞLEMİ
    const pdfBlob = doc.output('blob');
    const fileName = `vora_servis_${recordData.id}_${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage.from('service_pdfs').upload(fileName, pdfBlob, { contentType: 'application/pdf' });
    if (uploadError) return null;

    const { data: urlData } = supabase.storage.from('service_pdfs').getPublicUrl(fileName);
    await supabase.from('service_records').update({ pdf_url: urlData.publicUrl }).eq('id', recordData.id);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("PDF Üretim Hatası:", error);
    return null;
  }
};