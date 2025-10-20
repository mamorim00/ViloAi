'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Instagram } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-end mb-4">
          <LanguageToggle />
        </div>

        <div className="flex items-center justify-center mb-8">
          <Instagram className="h-12 w-12 text-purple-600 mr-2" />
          <h1 className="text-3xl font-bold text-gray-900">ViloAi</h1>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{t.auth.login.title}</h2>
        <p className="text-gray-600 mb-6 text-center">{t.auth.login.subtitle}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.login.email}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder={t.auth.login.emailPlaceholder}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.login.password}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder={t.auth.login.passwordPlaceholder}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t.auth.login.buttonLoading : t.auth.login.button}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/forgot-password" className="text-purple-600 hover:text-purple-700 text-sm">
            {t.auth.login.forgotPassword}
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t.auth.login.noAccount}{' '}
            <Link href="/signup" className="text-purple-600 hover:text-purple-700 font-semibold">
              {t.auth.login.signupLink}
            </Link>
          </p>
        </div>

        <div className="mt-6">
          <Link
            href="/"
            className="block text-center text-gray-600 hover:text-gray-900 text-sm"
          >
            {t.auth.login.backToHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
