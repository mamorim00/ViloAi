'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Instagram } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function SignupPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            business_name: businessName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Update profile with additional info
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            business_name: businessName,
          })
          .eq('id', data.user.id);

        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
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

        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{t.auth.signup.title}</h2>
        <p className="text-gray-600 mb-6 text-center">{t.auth.signup.subtitle}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {t.auth.signup.successMessage}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.signup.fullName}
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder={t.auth.signup.fullNamePlaceholder}
            />
          </div>

          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.signup.businessName}
            </label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder={t.auth.signup.businessNamePlaceholder}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.signup.email}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder={t.auth.signup.emailPlaceholder}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.signup.password}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder={t.auth.signup.passwordPlaceholder}
            />
            <p className="text-xs text-gray-500 mt-1">{t.auth.signup.passwordHint}</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t.auth.signup.buttonLoading : t.auth.signup.button}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t.auth.signup.hasAccount}{' '}
            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
              {t.auth.signup.loginLink}
            </Link>
          </p>
        </div>

        <div className="mt-6">
          <Link
            href="/"
            className="block text-center text-gray-600 hover:text-gray-900 text-sm"
          >
            {t.auth.signup.backToHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
