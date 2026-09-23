'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase'; 
import { CheckCircle2, Clock, Phone, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Yönlendirme motoru eklendi

export default function WebTalepleri() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Rota değiştirici aktif

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('web_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

 // Otomatik Dönüşüm Köprüsü (Gerçek Şemaya Uyarlandı)
  const handleConvertToCustomer = async (req: any) => {
    try {
      // 1. Talebi "Dönüştü" olarak işaretle
      const { error: updateError } = await supabase
        .from('web_requests')
        .update({ status: 'Müşteriye Çevrildi' })
        .eq('id', req.id);

      if (updateError) throw updateError;

      // 2. Customers tablosuna kaydet (Senin veritabanı yapına göre düzeltildi)
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert([{ 
          full_name: req.full_name, 
          phone_number: req.phone_number 
        }])
        .select()
        .single();

      if (insertError) {
         console.error("Müşteri aktarım hatası:", insertError);
         alert("Müşteri tabloya eklenemedi. Veritabanı bağlantınızı kontrol edin.");
         fetchRequests();
         return;
      }

      // 3. Başarılı olursa müşterinin özel ekranına ışınla
      if (newCustomer && newCustomer.id) {
         router.push(`/admin/musteri/${newCustomer.id}`);
      }

    } catch (error) {
      console.error('İşlem hatası:', error);
      alert('Otomasyon sırasında bir hata oluştu.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      
      {/* UI GÜNCELLEMESİ: Karanlık mod widget tasarımı ile beyaz yazı sorunu çözüldü */}
      <div className="flex justify-between items-center mb-8 bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Web Talepleri</h1>
          <p className="text-slate-400 mt-2 font-medium">Siteden gelen acil servis çağrıları ve müşteri havuzu.</p>
        </div>
        <button onClick={fetchRequests} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-600/20">
          Listeyi Yenile
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 font-bold text-slate-500 animate-pulse">Kayıtlar Yükleniyor...</div>
      ) : (
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-5 font-bold text-sm text-slate-600">Tarih / Saat</th>
                <th className="p-5 font-bold text-sm text-slate-600">Müşteri</th>
                <th className="p-5 font-bold text-sm text-slate-600">Telefon</th>
                <th className="p-5 font-bold text-sm text-slate-600">Cihaz Türü</th>
                <th className="p-5 font-bold text-sm text-slate-600">Durum</th>
                <th className="p-5 font-bold text-sm text-slate-600">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-5 text-sm text-slate-500 font-medium">
                    {new Date(req.created_at).toLocaleString('tr-TR')}
                  </td>
                  <td className="p-5 font-black text-slate-800">{req.full_name}</td>
                  <td className="p-5">
                    <a href={`tel:${req.phone_number}`} className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors">
                      <Phone size={16} /> {req.phone_number}
                    </a>
                  </td>
                  <td className="p-5 text-sm font-bold text-slate-600">{req.device_type}</td>
                  <td className="p-5">
                    {req.status === 'Bekliyor' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200">
                        <Clock size={14} /> Bekliyor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200">
                        <CheckCircle2 size={14} /> {req.status}
                      </span>
                    )}
                  </td>
                  <td className="p-5">
                    {req.status === 'Bekliyor' && (
                      <button 
                        onClick={() => handleConvertToCustomer(req)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-emerald-600/20 hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <UserPlus size={16} /> Müşteriye Çevir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-medium">Henüz web sitesinden gelen bir talep yok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}