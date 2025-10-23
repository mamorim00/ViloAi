'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always true, cannot be disabled
    analytics: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
      } catch (e) {
        console.error('Error loading cookie consent:', e);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const newPreferences = {
      essential: true,
      analytics: true,
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleAcceptEssential = () => {
    const newPreferences = {
      essential: true,
      analytics: false,
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const savePreferences = (prefs: typeof preferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());

    // Apply preferences - enable/disable analytics tracking
    if (prefs.analytics) {
      // Enable analytics (e.g., Google Analytics, Plausible, etc.)
      console.log('✅ Analytics cookies enabled');
      // Add your analytics initialization here
      // Example: gtag('consent', 'update', { analytics_storage: 'granted' });
    } else {
      console.log('❌ Analytics cookies disabled');
      // Disable analytics
      // Example: gtag('consent', 'update', { analytics_storage: 'denied' });
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
        {/* Main Banner */}
        {!showPreferences ? (
          <div className="p-6">
            <div className="flex items-start mb-4">
              <Cookie className="h-8 w-8 text-purple-600 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  We Value Your Privacy
                </h2>
                <p className="text-gray-700 text-sm leading-relaxed">
                  We use cookies to enhance your experience on ViloAi. Essential cookies are required for
                  the platform to function (authentication, security). Optional analytics cookies help us
                  improve our service. You can customize your preferences at any time.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-start mb-3">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="mt-1 mr-3 h-5 w-5 rounded border-gray-300"
                />
                <div>
                  <p className="font-semibold text-gray-900">Essential Cookies (Required)</p>
                  <p className="text-sm text-gray-600">
                    Authentication, session management, and security features. Cannot be disabled.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="mt-1 mr-3 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <p className="font-semibold text-gray-900">Analytics Cookies (Optional)</p>
                  <p className="text-sm text-gray-600">
                    Help us understand how you use ViloAi to improve our platform. All data is anonymized.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAcceptAll}
                className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Accept All Cookies
              </button>
              <button
                onClick={handleAcceptEssential}
                className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Essential Only
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setShowPreferences(true)}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium underline"
              >
                Customize Preferences
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              By clicking "Accept All Cookies", you agree to our{' '}
              <Link href="/privacy" className="text-purple-600 hover:underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/terms" className="text-purple-600 hover:underline">
                Terms of Service
              </Link>
              .
            </p>
          </div>
        ) : (
          /* Preferences Panel */
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Cookie Preferences</h2>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-gray-700 text-sm mb-6">
              Manage your cookie preferences below. Essential cookies are required for the platform to work
              and cannot be disabled. You can change these settings at any time.
            </p>

            <div className="space-y-4 mb-6">
              {/* Essential Cookies */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Essential Cookies</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Required for the platform to function. These cookies enable core features like authentication,
                      security, and session management.
                    </p>
                    <p className="text-xs text-gray-500">
                      Examples: Supabase auth cookies, CSRF tokens
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                      Always Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Analytics Cookies</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Help us understand how users interact with ViloAi. We collect anonymized data on page views,
                      feature usage, and performance metrics to improve our platform.
                    </p>
                    <p className="text-xs text-gray-500">
                      Examples: Page views, session duration, feature usage (all anonymized)
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          setPreferences({ ...preferences, analytics: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSavePreferences}
                className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Save Preferences
              </button>
              <button
                onClick={() => setShowPreferences(false)}
                className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-800">
                <strong>GDPR Compliance:</strong> You have the right to access, modify, or delete your data
                at any time. Visit our{' '}
                <Link href="/privacy" className="underline hover:text-blue-900">
                  Privacy Policy
                </Link>{' '}
                to learn more about your rights.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
