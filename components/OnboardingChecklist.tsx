'use client';

import { Profile } from '@/lib/types';
import { CheckCircle, Circle, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface OnboardingChecklistProps {
  profile: Profile;
  onStepClick?: (step: number) => void;
}

interface ChecklistItem {
  id: number;
  labelEn: string;
  labelFi: string;
  isCompleted: (profile: Profile) => boolean;
}

export default function OnboardingChecklist({ profile, onStepClick }: OnboardingChecklistProps) {
  const { language } = useLanguage();

  const checklistItems: ChecklistItem[] = [
    {
      id: 0,
      labelEn: 'Get started',
      labelFi: 'Aloita',
      isCompleted: (p) => p.onboarding_step > 0,
    },
    {
      id: 1,
      labelEn: 'Choose subscription',
      labelFi: 'Valitse paketti',
      isCompleted: (p) => !!p.subscription_plan_id,
    },
    {
      id: 2,
      labelEn: 'Connect Instagram',
      labelFi: 'Yhdistä Instagram',
      isCompleted: (p) => p.instagram_connected,
    },
    {
      id: 3,
      labelEn: 'Setup business rules',
      labelFi: 'Määritä säännöt',
      isCompleted: () => false, // TODO: Check business rules count
    },
    {
      id: 4,
      labelEn: 'Sync messages',
      labelFi: 'Synkronoi viestit',
      isCompleted: () => false, // TODO: Check message count
    },
  ];

  const completedCount = checklistItems.filter((item) => item.isCompleted(profile)).length;
  const totalCount = checklistItems.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  // If onboarding is completed, don't show the checklist
  if (profile.onboarding_completed) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          {language === 'fi' ? 'Käyttöönotto' : 'Getting Started'}
        </h3>
        <span className="text-sm font-medium text-purple-600">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-purple-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {checklistItems.map((item) => {
          const isCompleted = item.isCompleted(profile);
          const isCurrent = profile.onboarding_step === item.id;
          const label = language === 'fi' ? item.labelFi : item.labelEn;

          return (
            <button
              key={item.id}
              onClick={() => onStepClick && onStepClick(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                isCurrent
                  ? 'bg-purple-50 border border-purple-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle
                    className={`h-5 w-5 flex-shrink-0 ${
                      isCurrent ? 'text-purple-600' : 'text-gray-400'
                    }`}
                  />
                )}
                <span
                  className={`text-sm font-medium ${
                    isCompleted
                      ? 'text-gray-500 line-through'
                      : isCurrent
                      ? 'text-purple-900'
                      : 'text-gray-700'
                  }`}
                >
                  {label}
                </span>
              </div>
              {isCurrent && <ChevronRight className="h-5 w-5 text-purple-600" />}
            </button>
          );
        })}
      </div>

      {/* Completion Message */}
      {completedCount === totalCount && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 text-center font-medium">
            {language === 'fi'
              ? '🎉 Loistavaa! Olet valmis käyttämään ViloAi:ta!'
              : '🎉 Great! You\'re all set to use ViloAi!'}
          </p>
        </div>
      )}
    </div>
  );
}
