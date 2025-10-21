'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import {
  CheckCircle,
  Circle,
  Instagram,
  Settings as SettingsIcon,
  RefreshCw,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface OnboardingStep {
  id: number;
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  actionLabel?: string;
  checkCompleted: (profile: Profile) => boolean;
  action?: () => void | Promise<void>;
}

interface OnboardingFlowProps {
  profile: Profile;
  onClose?: () => void;
  onComplete?: () => void;
}

export default function OnboardingFlow({ profile, onClose, onComplete }: OnboardingFlowProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(profile.onboarding_step || 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localProfile, setLocalProfile] = useState<Profile>(profile);
  const [error, setError] = useState<string | null>(null);

  const steps: OnboardingStep[] = [
    {
      id: 0,
      titleKey: 'welcome',
      descriptionKey: 'welcomeDesc',
      icon: <Sparkles className="h-12 w-12 text-purple-600" />,
      actionLabel: language === 'fi' ? 'Aloita' : 'Get Started',
      checkCompleted: () => true,
      action: async () => {
        await updateOnboardingStep(1);
      },
    },
    {
      id: 1,
      titleKey: 'chooseSubscription',
      descriptionKey: 'chooseSubscriptionDesc',
      icon: <CheckCircle className="h-12 w-12 text-green-600" />,
      actionLabel: language === 'fi' ? 'Valitse paketti' : 'Choose Plan',
      checkCompleted: (p) => !!p.subscription_plan_id,
      action: () => {
        router.push('/pricing');
      },
    },
    {
      id: 2,
      titleKey: 'connectInstagram',
      descriptionKey: 'connectInstagramDesc',
      icon: <Instagram className="h-12 w-12 text-purple-600" />,
      actionLabel: language === 'fi' ? 'Yhdistä Instagram' : 'Connect Instagram',
      checkCompleted: (p) => p.instagram_connected,
      action: () => {
        window.location.href = '/api/auth/instagram';
      },
    },
    {
      id: 3,
      titleKey: 'setupBusinessRules',
      descriptionKey: 'setupBusinessRulesDesc',
      icon: <SettingsIcon className="h-12 w-12 text-blue-600" />,
      actionLabel: language === 'fi' ? 'Ohita toistaiseksi' : 'Skip for Now',
      checkCompleted: () => false, // Optional step - never auto-completes
      action: async () => {
        // Skip this optional step and move to next
        await updateOnboardingStep(currentStep + 1);
      },
    },
    {
      id: 4,
      titleKey: 'syncMessages',
      descriptionKey: 'syncMessagesDesc',
      icon: <RefreshCw className="h-12 w-12 text-orange-600" />,
      actionLabel: language === 'fi' ? 'Synkronoi viestit' : 'Sync Messages',
      checkCompleted: () => false, // Will be checked via message count
      action: async () => {
        await syncMessages();
      },
    },
  ];

  useEffect(() => {
    setLocalProfile(profile);
    setCurrentStep(profile.onboarding_step || 0);
  }, [profile]);

  // Refresh profile data when window regains focus (user returns from pricing page)
  useEffect(() => {
    const refreshProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setLocalProfile(profileData);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshProfile();
      }
    };

    const handleFocus = () => {
      refreshProfile();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const updateOnboardingStep = async (step: number) => {
    setIsProcessing(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated. Please log in again.');
        return;
      }

      const updates: any = {
        onboarding_step: step,
        updated_at: new Date().toISOString(),
      };

      // Start onboarding timestamp if beginning
      if (step === 1 && !profile.onboarding_started_at) {
        updates.onboarding_started_at = new Date().toISOString();
      }

      // Mark as completed if final step
      if (step >= steps.length) {
        updates.onboarding_completed = true;
        updates.onboarding_completed_at = new Date().toISOString();
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Database error:', updateError);
        if (updateError.code === '42703') {
          setError('Database migration required. Please run the migration in Supabase SQL Editor. See MIGRATION_INSTRUCTIONS.md for details.');
        } else {
          setError(`Failed to update progress: ${updateError.message}`);
        }
        return;
      }

      if (data) {
        setLocalProfile(data);
        setCurrentStep(step);

        // If completed, trigger completion callback
        if (step >= steps.length && onComplete) {
          onComplete();
        }
      }
    } catch (error: any) {
      console.error('Failed to update onboarding step:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const syncMessages = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/messages/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      });

      if (response.ok) {
        await updateOnboardingStep(currentStep + 1);
      } else {
        console.error('Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = async () => {
    const step = steps[currentStep];
    if (step.action) {
      await step.action();
    } else {
      await updateOnboardingStep(currentStep + 1);
    }
  };

  const handleSkip = async () => {
    await updateOnboardingStep(steps.length);
  };

  // Check if current step is completed
  const isCurrentStepCompleted = steps[currentStep]?.checkCompleted(localProfile);

  // Auto-advance if step is already completed
  useEffect(() => {
    if (isCurrentStepCompleted && currentStep > 0 && currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        updateOnboardingStep(currentStep + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isCurrentStepCompleted, currentStep]);

  const currentStepData = steps[currentStep];
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  if (!currentStepData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 relative">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              {language === 'fi' ? 'Edistyminen' : 'Progress'}
            </span>
            <span className="text-sm font-medium text-purple-600">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center space-x-4 mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {index < currentStep ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <Circle className="h-6 w-6" />
              )}
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">{currentStepData.icon}</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {language === 'fi'
              ? getFinnishTitle(currentStepData.titleKey)
              : getEnglishTitle(currentStepData.titleKey)}
          </h2>
          <p className="text-lg text-gray-600">
            {language === 'fi'
              ? getFinnishDescription(currentStepData.descriptionKey)
              : getEnglishDescription(currentStepData.descriptionKey)}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Completion Status */}
        {isCurrentStepCompleted && currentStep > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
            <CheckCircle className="h-6 w-6 text-green-600 inline-block mr-2" />
            <span className="text-green-800 font-medium">
              {language === 'fi' ? 'Valmis!' : 'Completed!'}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            disabled={isProcessing}
            className="text-gray-500 hover:text-gray-700 font-medium disabled:opacity-50"
          >
            {language === 'fi' ? 'Ohita opastus' : 'Skip Tour'}
          </button>
          <button
            onClick={handleNext}
            disabled={isProcessing}
            className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>
              {isProcessing
                ? language === 'fi'
                  ? 'Käsitellään...'
                  : 'Processing...'
                : currentStepData.actionLabel ||
                  (language === 'fi' ? 'Seuraava' : 'Next')}
            </span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Translation helpers (temporary until we add to translations.ts)
function getEnglishTitle(key: string): string {
  const titles: Record<string, string> = {
    welcome: 'Welcome to ViloAi!',
    chooseSubscription: 'Choose Your Plan',
    connectInstagram: 'Connect Instagram',
    setupBusinessRules: 'Setup Business Rules',
    syncMessages: 'Sync Your Messages',
  };
  return titles[key] || key;
}

function getFinnishTitle(key: string): string {
  const titles: Record<string, string> = {
    welcome: 'Tervetuloa ViloAi:hin!',
    chooseSubscription: 'Valitse pakettisi',
    connectInstagram: 'Yhdistä Instagram',
    setupBusinessRules: 'Määritä liiketoimintasäännöt',
    syncMessages: 'Synkronoi viestisi',
  };
  return titles[key] || key;
}

function getEnglishDescription(key: string): string {
  const descriptions: Record<string, string> = {
    welcomeDesc:
      "Let's get you set up! We'll guide you through connecting Instagram and configuring AI-powered message management.",
    chooseSubscriptionDesc:
      'Select a subscription plan that fits your business needs. You can change this later.',
    connectInstagramDesc:
      'Connect your Instagram Business account to start managing DMs with AI assistance.',
    setupBusinessRulesDesc:
      '(Optional) You can add business rules later in Settings. For now, you can skip to start using ViloAi right away!',
    syncMessagesDesc:
      'Fetch your Instagram messages and let our AI analyze them for insights.',
  };
  return descriptions[key] || key;
}

function getFinnishDescription(key: string): string {
  const descriptions: Record<string, string> = {
    welcomeDesc:
      'Aloitetaan! Autamme sinua yhdistämään Instagramin ja määrittämään tekoälyavusteisen viestienhallinnan.',
    chooseSubscriptionDesc:
      'Valitse yrityksellesi sopiva tilauспакetti. Voit vaihtaa sen myöhemmin.',
    connectInstagramDesc:
      'Yhdistä Instagram Business -tilisi hallitaksesi viestejä tekoälyn avulla.',
    setupBusinessRulesDesc:
      '(Valinnainen) Voit lisätä liiketoimintasäännöt myöhemmin Asetuksissa. Voit nyt ohittaa tämän vaiheen ja aloittaa ViloAi:n käytön heti!',
    syncMessagesDesc:
      'Hae Instagram-viestisi ja anna tekoälymme analysoida ne saadaksesi oivalluksia.',
  };
  return descriptions[key] || key;
}
