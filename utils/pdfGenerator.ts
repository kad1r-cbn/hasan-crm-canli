import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase';

const tr2en = (text: string) => text.replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ü/g, 'u').replace(/Ü/g, 'U').replace(/ş/g, 's').replace(/Ş/g, 'S').replace(/ı/g, 'i').replace(/İ/g, 'I').replace(/ö/g, 'o').replace(/Ö/g, 'O').replace(/ç/g, 'c').replace(/Ç/g, 'C');

export const generateAndUploadPdf = async (recordData: any, customer: any, device: any, description: string, price: string) => {
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.text("HASAN IKLIMLENDIRME - SERVIS FORMU", 14, 20);
  doc.setFontSize(10);
  doc.text(tr2en(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`), 14, 30);
  
  autoTable(doc, {
    startY: 45,
    head: [['Musteri Bilgileri', 'Cihaz Bilgileri']],
    body: [[
      tr2en(`Ad Soyad: ${customer.full_name}\nTelefon: ${customer.phone_number}`),
      tr2en(`Marka/Model: ${device.brand} ${device.model}\nTip: ${device.device_type}`)
    ]],
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Yapilan Islem', 'Ucret']],
    body: [[tr2en(description), `${price || 0} TL`]],
  });

  const pdfBlob = doc.output('blob');
  const fileName = `servis_${recordData.id}_${Date.now()}.pdf`;

  const { error: uploadError } = await supabase.storage.from('service_pdfs').upload(fileName, pdfBlob, { contentType: 'application/pdf' });
  if (uploadError) return null;

  const { data: urlData } = supabase.storage.from('service_pdfs').getPublicUrl(fileName);
  await supabase.from('service_records').update({ pdf_url: urlData.publicUrl }).eq('id', recordData.id);
  
  return urlData.publicUrl;
};