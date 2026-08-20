'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';
import Link from 'next/link';

export default function MusterilerListesi() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase
  .from('customers')
  .select('*')
  .order('created_at', { ascending: false });
      if (data) setCustomers(data);
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  // Rasyonel Arama Algoritması: Hem isimde hem numarada arar
  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone_number.includes(searchTerm)
  );

  return (
    <div className="min-h-full bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Üst Kısım ve Arama Motoru */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
           <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Müşteri Rehberi</h1>
           
           <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
             <div className="relative w-full md:w-72">
               <input 
                 type="text" 
                 placeholder="İsim veya telefon ara..." 
                 className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-medium shadow-sm"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
               <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
             </div>
             
             <Link href="/admin/yeni-kayit" className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-md text-center">
               + Yeni Müşteri
             </Link>
           </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500 font-bold">Veriler yükleniyor...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            
            {/* MASAÜSTÜ İÇİN TABLO (Mobilde Gizlenir) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider border-b-4 border-cyan-500">
                    <th className="p-5 font-bold">Müşteri Adı</th>
                    <th className="p-5 font-bold">Telefon</th>
                    <th className="p-5 font-bold">Adres</th>
                    <th className="p-5 font-bold text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-cyan-50 transition-colors">
                      <td className="p-5 font-bold text-slate-800">
                        <Link href={`/admin/musteri/${customer.id}`} className="text-cyan-700 hover:underline text-base">
                          {customer.full_name}
                        </Link>
                      </td>
                      <td className="p-5 text-slate-600 font-mono text-sm">{customer.phone_number}</td>
                      <td className="p-5 text-slate-600 text-sm truncate max-w-xs">{customer.address}</td>
                      <td className="p-5 text-center">
                        {customer.kvkk_approved ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">İzinli</span>
                        ) : (
                           <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">İzinsiz</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBİL İÇİN KART MİMARİSİ (Masaüstünde Gizlenir) */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100">
              {filteredCustomers.map((customer) => (
                <Link href={`/admin/musteri/${customer.id}`} key={customer.id} className="p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{customer.full_name}</h3>
                    <p className="text-slate-500 font-mono text-sm mt-1">{customer.phone_number}</p>
                    <p className="text-slate-400 text-xs mt-1 truncate max-w-[200px]">{customer.address}</p>
                  </div>
                  <div>
                     {customer.kvkk_approved ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold border border-green-200">İzinli</span>
                      ) : (
                         <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-[10px] font-bold border border-red-200">İzinsiz</span>
                      )}
                  </div>
                </Link>
              ))}
              {filteredCustomers.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm font-bold">Sonuç bulunamadı.</div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}