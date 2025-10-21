import { LeadInfo } from '@/lib/types';
import { Flame } from 'lucide-react';

interface LeadBadgeProps {
  leadInfo: LeadInfo;
  showReason?: boolean;
}

export default function LeadBadge({ leadInfo, showReason = false }: LeadBadgeProps) {
  if (!leadInfo.isLead) {
    return null;
  }

  // Determine color and flame count based on score
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-700';
  let flameCount = 0;

  if (leadInfo.score === 10) {
    bgColor = 'bg-red-100';
    textColor = 'text-red-700';
    flameCount = 2;
  } else if (leadInfo.score === 8) {
    bgColor = 'bg-orange-100';
    textColor = 'text-orange-700';
    flameCount = 1;
  } else if (leadInfo.score === 5) {
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-700';
    flameCount = 1;
  }

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded ${bgColor} ${textColor}`}>
      <div className="flex items-center">
        {Array.from({ length: flameCount }).map((_, index) => (
          <Flame key={index} className="h-3 w-3 fill-current" />
        ))}
      </div>
      <span className="ml-1 text-xs font-bold">LEAD</span>
      {showReason && (
        <span className="ml-1 text-xs">- {leadInfo.reason}</span>
      )}
    </div>
  );
}
