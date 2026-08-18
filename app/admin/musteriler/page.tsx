import { supabase } from '../../../utils/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MusterilerListesi() {
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-full bg-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center mb-6">
           <h1 className="text-3xl font-extrabold text-slate-900">Müşteri Rehberi</h1>
           <Link href="/admin/yeni-kayit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-md">
             + Yeni Müşteri Ekle
           </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
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
                {customers?.map((customer) => (
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
        </div>

      </div>
    </div>
  );
}