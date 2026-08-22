import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase';

const tr2en = (text: string) => text.replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ü/g, 'u').replace(/Ü/g, 'U').replace(/ş/g, 's').replace(/Ş/g, 'S').replace(/ı/g, 'i').replace(/İ/g, 'I').replace(/ö/g, 'o').replace(/Ö/g, 'O').replace(/ç/g, 'c').replace(/Ç/g, 'C');

export const generateAndUploadPdf = async (recordData: any, customer: any, device: any, description: string, price: string) => {
  try {
    const doc = new jsPDF();
    
    // 1. ÜST BİLGİ (HEADER) - VORA Kurumsal Lacivert
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 42, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.text("VORA", 14, 22);
    
    doc.setTextColor(6, 182, 212); // Camgöbeği Vurgu
    doc.setFontSize(13);
    doc.text("KOMBI & KLIMA TEKNIK SERVIS", 15, 30);
    
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Konforunuz icin yaninizdayiz!", 15, 36);
    
    // 2. İLETİŞİM & BELGE NO
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("SERVIS FORMU", 195, 18, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Hasan Yilmaz: 0536 528 11 16", 195, 28, { align: 'right' });
    doc.text("Orhan Orak: 0538 818 82 36", 195, 34, { align: 'right' });

    doc.setTextColor(50, 50, 50);
    doc.text(tr2en(`Tarih: ${new Date(recordData.service_date || Date.now()).toLocaleDateString('tr-TR')}`), 15, 52);
    doc.text(`Islem No: VORA-${recordData.id.substring(0,8).toUpperCase()}`, 135, 52);

    // 3. MÜŞTERİ BİLGİLERİ
    autoTable(doc, {
      startY: 56,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['MUSTERI BILGILERI']],
      body: [
        [`Ad Soyad: ${tr2en(customer.full_name)}`],
        [`Telefon: ${customer.phone_number}`],
        [`Adres: ${tr2en(customer.address || '-')}`]
      ],
      styles: { fontSize: 10, cellPadding: 3 }
    });

    // 4. CİHAZ BİLGİLERİ
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 4,
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['CIHAZ BILGILERI']],
      body: [
        [`Cihaz Tipi: ${tr2en(device.device_type)}`],
        [`Marka / Model: ${tr2en(device.brand)} ${tr2en(device.model)}`],
        [`Seri No: ${tr2en(device.serial_number || 'Belirtilmemis')}`]
      ],
      styles: { fontSize: 10, cellPadding: 3 }
    });

    // 5. ŞİKAYET VE YAPILAN İŞLEM
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 4,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['YAPILAN ISLEM / ACIKLAMA']],
      body: [
        [{ content: tr2en(description), styles: { minCellHeight: 35 } }]
      ],
      styles: { fontSize: 10, cellPadding: 4 }
    });

    // 6. ÜCRET VE BAKIM TARİHİ
    const maintenanceText = recordData.next_maintenance_date 
        ? tr2en(`Planlanan Sonraki Bakim: ${new Date(recordData.next_maintenance_date).toLocaleDateString('tr-TR')}`)
        : 'Periyodik bakim takibi isaretlenmedi.';

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 4,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50], fontStyle: 'bold' },
      body: [[
        { content: maintenanceText, styles: { textColor: recordData.next_maintenance_date ? [220, 38, 38] : [100, 100, 100], fontStyle: 'bold' } },
        { content: `ODENECEK TUTAR: ${price ? price + ' TL' : 'Ucretsiz'}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 11, textColor: [15, 23, 42] } }
      ]],
      styles: { fontSize: 10, cellPadding: 4 }
    });

    // 7. İMZALAR
    let finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text("TEKNISYEN IMZA", 45, finalY, { align: 'center' });
    doc.text("MUSTERI IMZA", 165, finalY, { align: 'center' });
    doc.setDrawColor(200, 200, 200);
    doc.line(20, finalY + 15, 70, finalY + 15);
    doc.line(140, finalY + 15, 190, finalY + 15);

    // 8. GARANTİ ŞARTLARI VE ALT BİLGİ
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "bold");
    doc.text("CIHAZ UZERINDE DEGISTIRILEN PARCALAR 1 (BIR) YIL GARANTI KAPSAMINDADIR.", 15, 270);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const terms = [
        "1- Musteri, cihaza mudahale icin teknisyenin belirleyecegi uygun calisma ortami saglar.",
        "2- Yukarida belirtilen islemler, degistirilen parcalar tamamen islemi yapan teknisyenin yukumlulugundedir.",
        "3- Sonradan dogabilecek sorunlarin ve teknisyenin islem sirasinda yapmadigi parcalarin daha sonra bozulmasi garanti kapsamina girmez.",
        "4- Servisimize alinan mamul / urunlerin teslimi azami 7 (yedi) is gunudur."
    ];
    doc.text(terms, 15, 275);

    // 9. YÜKLEME Lojistiği
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