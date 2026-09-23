'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../utils/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Edit2, Save, X, Phone, MapPin, User, ShieldCheck } from 'lucide-react';

export default function MusteriDetay() {
  const params = useParams();
  const id = params?.id;

  // Veri State'leri
  const [customer, setCustomer] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Düzenleme (Edit) State'leri
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editKvkk, setEditKvkk] = useState(false); // YASAL ONAY STATE'İ EKLENDİ

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (customerError) throw customerError;

      if (customerData) {
        setCustomer(customerData);
        setEditName(customerData.full_name || '');
        setEditPhone(customerData.phone_number || '');
        setEditAddress(customerData.address || '');
        setEditKvkk(customerData.kvkk_approved || false); // Veritabanından onayı çek
      }

      const { data: devicesData } = await supabase
        .from('devices')
        .select('*')
        .eq('customer_id', id);

      setDevices(devicesData || []);

      const deviceIds = devicesData?.map(d => d.id) || [];
      if (deviceIds.length > 0) {
        const { data: fetchedServices } = await supabase
          .from('service_records')
          .select('device_id, next_maintenance_date')
          .in('device_id', deviceIds)
          .order('service_date', { ascending: false });
        
        setServices(fetchedServices || []);
      }
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          full_name: editName,
          phone_number: editPhone,
          address: editAddress,
          kvkk_approved: editKvkk // Onayı veritabanına mühürle
        })
        .eq('id', id);

      if (error) throw error;

      setIsEditing(false);
      fetchData(); 
    } catch (error) {
      alert('Bilgiler güncellenirken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-slate-500 font-bold animate-pulse text-xl">Sistem Yükleniyor...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 font-bold text-center">
          <p>Müşteri verisi bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Başlık ve Geri Butonu */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/musteriler" className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Müşteri Dosyası</h1>
        </div>

        {/* ÜST KISIM: DÜZENLENEBİLİR Müşteri Bilgileri */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          
          <div className="bg-slate-900 p-6 flex justify-between items-center">
            <h2 className="text-xl md:text-2xl font-extrabold text-white">
              {isEditing ? 'Bilgileri Düzenle' : customer.full_name}
            </h2>
            
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold transition-colors border border-slate-700 text-sm">
                <Edit2 size={16} /> Düzenle
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-bold transition-colors text-sm">
                  <X size={16} /> İptal
                </button>
                <button onClick={handleUpdate} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm">
                  <Save size={16} /> Kaydet
                </button>
              </div>
            )}
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-6">
            
            {/* Telefon Alanı */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Phone size={14} /> Telefon Numarası
              </label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500" 
                />
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg font-bold text-slate-700">
                  {customer.phone_number}
                </div>
              )}
            </div>

            {/* KVKK & İletişim İzni Durumu */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={14} /> KVKK / İletişim İzni
              </label>
              {isEditing ? (
                <div className="flex items-center gap-3 p-3 border border-slate-300 rounded-lg bg-white cursor-pointer" onClick={() => setEditKvkk(!editKvkk)}>
                  <input 
                    type="checkbox" 
                    checked={editKvkk}
                    onChange={(e) => setEditKvkk(e.target.checked)}
                    className="w-5 h-5 accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-sm font-bold text-slate-700 select-none">
                    Müşteriden SMS/WhatsApp onayı alındı.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  {customer.kvkk_approved ? (
                    <span className="text-emerald-600 font-bold text-sm flex items-center gap-1">İzinli (Onay Verildi)</span>
                  ) : (
                    <span className="text-red-500 font-bold text-sm flex items-center gap-1">İzinsiz (Onay Bekliyor)</span>
                  )}
                </div>
              )}
            </div>

            {/* İsim Alanı (Sadece düzenlerken) */}
            {isEditing && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <User size={14} /> Ad Soyad
                </label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500" 
                />
              </div>
            )}

            {/* Adres Alanı */}
            <div className={`space-y-2 md:col-span-2`}>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={14} /> Açık Adres
              </label>
              {isEditing ? (
                <textarea 
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 p-3 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-blue-500 resize-none" 
                />
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-700">
                  {customer.address ? (
                    <span className="font-medium">{customer.address}</span>
                  ) : (
                    <span className="text-red-500 font-bold text-sm flex items-center gap-1">Adres bilgisi eksik. Lütfen ekleyin.</span>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ALT KISIM: Envanter Cihazları (ORİJİNAL) */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
             <h2 className="text-lg md:text-xl font-extrabold text-slate-800">Envanter Cihazları</h2>
             <Link href={`/admin/musteri/${customer.id}/yeni-cihaz`} className="bg-cyan-50 text-cyan-700 hover:bg-cyan-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-cyan-200 shadow-sm">
               + Yeni Cihaz
             </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {devices?.map((device) => {
              const latestService = services.find(s => s.device_id === device.id);
              const hasMaintenance = latestService && latestService.next_maintenance_date;
              const formattedDate = hasMaintenance ? new Date(latestService.next_maintenance_date).toLocaleDateString('tr-TR') : 'Kayıt Bulunmuyor';

              return (
                <div key={device.id} className="border border-slate-200 rounded-xl p-5 flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">{device.brand} {device.model}</h3>
                      <p className="text-sm text-slate-500 font-mono mt-1">Seri No: {device.serial_number || 'Belirtilmemiş'}</p>
                    </div>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-slate-200">
                      {device.device_type}
                    </span>
                  </div>

                  <div className={`p-4 rounded-lg mb-6 border ${hasMaintenance ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1">YAKLAŞAN BAKIM</p>
                    <p className="font-extrabold font-mono text-sm">{formattedDate}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                    <Link href={`/admin/musteri/${customer.id}/cihaz/${device.id}`} className="flex-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-center px-4 py-2.5 rounded-lg text-sm font-bold transition-colors">
                      Geçmiş Kayıtlar
                    </Link>
                    <Link href={`/admin/musteri/${customer.id}/cihaz/${device.id}/yeni-servis`} className="flex-1 bg-slate-900 text-white hover:bg-slate-800 text-center px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-md">
                      + Yeni Servis
                    </Link>
                  </div>
                </div>
              );
            })}
            
            {(!devices || devices.length === 0) && (
              <div className="col-span-full p-10 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                <p className="text-sm text-slate-500 font-bold">Bu müşteriye ait envanter kaydı bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}