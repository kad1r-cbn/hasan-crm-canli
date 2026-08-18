'use client';

import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Supabase üzerinden kimlik doğrulama isteği
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Giriş başarısız. E-posta veya şifre hatalı.');
      setLoading(false);
    } else {
      // Başarılı giriş, ana panele fırlat
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">CRM Sistem Girişi</h1>
          <p className="text-slate-500 mt-2 font-medium">Lütfen yetkili hesapla giriş yapın.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-bold border border-red-200">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">E-posta</label>
            <input 
              type="email" 
              required
              className="w-full p-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Şifre</label>
            <input 
              type="password" 
              required
              className="w-full p-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50 text-lg"
          >
            {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}