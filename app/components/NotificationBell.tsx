'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase'; // Yol senin yapına göre değişebilir
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  // Ses motorunu yükle
  useEffect(() => {
    // public klasörüne attığın ses dosyasının adı
    audioRef.current = new Audio('/ding.mp3'); 
  }, []);

  // Sadece "Bekliyor" durumundaki talepleri çek
  const fetchPending = async () => {
    const { data } = await supabase
      .from('web_requests')
      .select('*')
      .eq('status', 'Bekliyor')
      .order('created_at', { ascending: false });
    if (data) setPendingRequests(data);
  };

  useEffect(() => {
    fetchPending();

    // GERÇEK ZAMANLI (REAL-TIME) DİNLEME MOTORU
    const channel = supabase
      .channel('public:web_requests')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'web_requests' },
        (payload) => {
          // Yeni talep düştüğünde anında listeye ekle
          setPendingRequests((prev) => [payload.new, ...prev]);
          
          // Zili Çaldır (Tarayıcı izin verirse)
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Tarayıcı otomatik sesi engelledi. Ekrana tıklamak gerekebilir."));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'web_requests' },
        (payload) => {
          // Müşteriye çevrildiğinde statü değişeceği için listeyi tazele, okunanlar silinsin
          fetchPending();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = pendingRequests.length;

  return (
    <div className="relative">
      {/* ZİL İKONU VE TURUNCU NOKTA */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-orange-500 border-2 border-slate-900 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
        )}
      </button>

      {/* AÇILIR BİLDİRİM PANELİ */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="bg-slate-900 p-4 flex justify-between items-center">
            <h3 className="text-white font-bold">Web Talepleri</h3>
            {unreadCount > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount} Yeni
              </span>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {pendingRequests.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-medium text-sm">
                Okunmamış yeni bir talep yok.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingRequests.map((req) => (
                  <div 
                    key={req.id} 
                    onClick={() => {
                      setIsOpen(false);
                      // Tıklayınca doğrudan operasyon merkezine fırlat
                      router.push('/admin/web-talepleri');
                    }}
                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors relative"
                  >
                    {/* Küçük turuncu nokta (Okunmadı işareti) */}
                    <div className="absolute left-3 top-5 w-2 h-2 bg-orange-500 rounded-full"></div>
                    
                    <div className="pl-4">
                      <p className="text-sm font-bold text-slate-800">{req.full_name}</p>
                      <p className="text-xs text-slate-500 mt-1"><span className="font-bold">{req.device_type}</span> için acil servis kaydı bıraktı.</p>
                      <p className="text-xs text-blue-600 mt-2 font-bold">{new Date(req.created_at).toLocaleTimeString('tr-TR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}