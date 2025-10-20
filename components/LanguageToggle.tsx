'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Languages } from 'lucide-react';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      <Languages className="h-5 w-5 text-gray-600" />
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setLanguage('fi')}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            language === 'fi'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          FI
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            language === 'en'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
