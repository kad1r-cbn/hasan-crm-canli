'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase'; 
import { CheckCircle2, Clock, Phone, UserPlus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WebTalepleri() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const handleConvertToCustomer = async (req: any) => {
    try {
      const { error: updateError } = await supabase
        .from('web_requests')
        .update({ status: 'Müşteriye Çevrildi' })
        .eq('id', req.id);

      if (updateError) throw updateError;

      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert([{ 
          full_name: req.full_name, 
          phone_number: req.phone_number 
        }])
        .select()
        .single();

      if (insertError) {
         alert("Müşteri tabloya eklenemedi. Veritabanı bağlantınızı kontrol edin.");
         fetchRequests();
         return;
      }

      if (newCustomer && newCustomer.id) {
         router.push(`/admin/musteri/${newCustomer.id}`);
      }

    } catch (error) {
      alert('Otomasyon sırasında bir hata oluştu.');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      
      {/* ÜST BAŞLIK ALANI (MOBİL UYUMLU) */}
      <div className="bg-slate-900 p-6 md:p-8 rounded-2xl shadow-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Web Talepleri</h1>
          <p className="text-slate-400 mt-1 md:mt-2 text-sm md:text-base font-medium">Siteden gelen acil servis çağrıları ve müşteri havuzu.</p>
        </div>
        <button 
          onClick={fetchRequests} 
          className="w-full sm:w-auto flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
        >
          <RefreshCw size={18} /> Listeyi Yenile
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 font-bold text-slate-500 animate-pulse">Kayıtlar Yükleniyor...</div>
      ) : (
        <>
          {/* MASAÜSTÜ İÇİN TABLO GÖRÜNÜMÜ (Ekran genişse görünür) */}
          <div className="hidden md:block bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-5 font-bold text-sm text-slate-600">Tarih / Saat</th>
                  <th className="p-5 font-bold text-sm text-slate-600">Müşteri</th>
                  <th className="p-5 font-bold text-sm text-slate-600">Telefon</th>
                  <th className="p-5 font-bold text-sm text-slate-600">Cihaz Türü</th>
                  <th className="p-5 font-bold text-sm text-slate-600">Durum</th>
                  <th className="p-5 font-bold text-sm text-slate-600 text-right">Aksiyon</th>
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
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200">
                          <Clock size={14} /> Bekliyor
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200">
                          <CheckCircle2 size={14} /> {req.status}
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-right">
                      {req.status === 'Bekliyor' && (
                        <button 
                          onClick={() => handleConvertToCustomer(req)}
                          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
                        >
                          <UserPlus size={16} /> Müşteriye Çevir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && (
              <div className="p-12 text-center text-slate-500 font-medium">Henüz web sitesinden gelen bir talep yok.</div>
            )}
          </div>

          {/* MOBİL İÇİN KART GÖRÜNÜMÜ (Ekran dar ise görünür) */}
          <div className="md:hidden space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col gap-4">
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-lg text-slate-800">{req.full_name}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">{new Date(req.created_at).toLocaleString('tr-TR')}</p>
                  </div>
                  {req.status === 'Bekliyor' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200">
                      <Clock size={14} /> Bekliyor
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200">
                      <CheckCircle2 size={14} /> İletildi
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> {req.device_type}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
                  <a 
                    href={`tel:${req.phone_number}`} 
                    className="flex-1 flex justify-center items-center gap-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-xl font-bold transition-all border border-blue-100 active:bg-blue-100"
                  >
                    <Phone size={18} /> {req.phone_number}
                  </a>
                  
                  {req.status === 'Bekliyor' && (
                    <button 
                      onClick={() => handleConvertToCustomer(req)}
                      className="flex-1 flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95"
                    >
                      <UserPlus size={18} /> Müşteriye Çevir
                    </button>
                  )}
                </div>
                
              </div>
            ))}
            {requests.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 font-medium">Henüz web sitesinden gelen bir talep yok.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}