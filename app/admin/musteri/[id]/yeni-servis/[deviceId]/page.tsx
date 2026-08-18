'use client';

import { useState, use } from 'react';
import { supabase } from '../../../../../../utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function YeniServisEkle({ params }: { params: Promise<{ id: string, deviceId: string }> }) {
  const router = useRouter();
  
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;
  const deviceId = resolvedParams.deviceId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const today = new Date();
  const nextYear = new Date(today.setFullYear(today.getFullYear() + 1)).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  // Rutin bakım gerektirip gerektirmediğini tutan yeni state
  const [requiresMaintenance, setRequiresMaintenance] = useState(true);

  const [formData, setFormData] = useState({
    service_date: todayStr,
    description: '',
    price: '',
    next_maintenance_date: nextYear
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Eğer rutin bakım gerekmiyorsa, tarihi zorla NULL (boş) yapıyoruz.
    const finalNextDate = requiresMaintenance ? formData.next_maintenance_date : null;

    const { error: insertError } = await supabase
      .from('service_records')
      .insert([
        { 
          device_id: deviceId,
          service_date: formData.service_date,
          description: formData.description,
          price: formData.price ? parseFloat(formData.price) : null,
          next_maintenance_date: finalNextDate
        }
      ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      router.push(`/admin/musteri/${customerId}`);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 border-b-4 border-cyan-500">
          <h2 className="text-2xl font-bold text-white">Servis Kaydı Oluştur</h2>
          <p className="text-cyan-400 text-sm mt-1">İşlem detaylarını ve periyodik takip durumunu belirleyin.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm font-medium">
              Hata: {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Servis Tarihi</label>
            <input 
              type="date" 
              required
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50"
              value={formData.service_date}
              onChange={(e) => setFormData({...formData, service_date: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Yapılan İşlem (Açıklama)</label>
            <textarea 
              required
              rows={3}
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              placeholder="Örn: Kompresör değişimi yapıldı."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Alınan Ücret (₺)</label>
            <input 
              type="number" 
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Örn: 500"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
            />
          </div>

          {/* Aksiyon Belirleyici Checkbox */}
          <div className="flex items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
            <input 
              type="checkbox" 
              id="maintenanceCheck"
              className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
              checked={requiresMaintenance}
              onChange={(e) => setRequiresMaintenance(e.target.checked)}
            />
            <label htmlFor="maintenanceCheck" className="ml-3 text-sm font-bold text-slate-700 cursor-pointer">
              Bu işlem periyodik bakım takibi gerektirir
            </label>
          </div>

          {/* Şartlı Görünen Tarih Alanı */}
          {requiresMaintenance && (
            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100 transition-all">
              <label className="block text-sm font-bold text-cyan-800 mb-2">Sonraki Bakım Tarihi (Otomasyon)</label>
              <input 
                type="date" 
                required={requiresMaintenance}
                className="w-full p-3 border border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                value={formData.next_maintenance_date}
                onChange={(e) => setFormData({...formData, next_maintenance_date: e.target.value})}
              />
              <p className="text-xs text-cyan-600 mt-2 font-medium">Sistem 1 yıl sonrasını otomatik önerdi, değiştirebilirsiniz.</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Link 
              href={`/admin/musteri/${customerId}`}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-lg transition-colors text-center"
            >
              İptal
            </Link>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Servisi Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}