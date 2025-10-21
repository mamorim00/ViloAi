import { AutomationRule, TriggerType } from '@/lib/types';

/**
 * Check if a message matches any automation rules
 * Returns the first matching rule, or null if no match
 */
export function findMatchingAutomationRule(
  messageText: string,
  messageType: 'comment' | 'dm',
  rules: AutomationRule[]
): AutomationRule | null {
  if (!messageText || !rules || rules.length === 0) {
    return null;
  }

  // Normalize message text for comparison (lowercase, trim whitespace)
  const normalizedMessage = messageText.toLowerCase().trim();

  // Filter rules that apply to this message type
  const applicableRules = rules.filter((rule) => {
    if (!rule.is_active) return false;
    return rule.trigger_type === messageType || rule.trigger_type === 'both';
  });

  // Find the first matching rule
  for (const rule of applicableRules) {
    const normalizedTrigger = rule.trigger_text.toLowerCase().trim();

    let matches = false;

    switch (rule.match_type) {
      case 'exact':
        matches = normalizedMessage === normalizedTrigger;
        break;

      case 'contains':
        matches = normalizedMessage.includes(normalizedTrigger);
        break;

      case 'starts_with':
        matches = normalizedMessage.startsWith(normalizedTrigger);
        break;

      default:
        // Default to exact match
        matches = normalizedMessage === normalizedTrigger;
    }

    if (matches) {
      console.log(`✅ Automation rule matched: "${rule.trigger_text}" -> "${rule.reply_text}"`);
      return rule;
    }
  }

  return null;
}

/**
 * Test multiple messages against a single automation rule
 * Useful for testing rule effectiveness
 */
export function testAutomationRule(
  rule: AutomationRule,
  testMessages: string[]
): { message: string; matches: boolean }[] {
  return testMessages.map((message) => {
    const normalizedMessage = message.toLowerCase().trim();
    const normalizedTrigger = rule.trigger_text.toLowerCase().trim();

    let matches = false;

    switch (rule.match_type) {
      case 'exact':
        matches = normalizedMessage === normalizedTrigger;
        break;

      case 'contains':
        matches = normalizedMessage.includes(normalizedTrigger);
        break;

      case 'starts_with':
        matches = normalizedMessage.startsWith(normalizedTrigger);
        break;

      default:
        matches = normalizedMessage === normalizedTrigger;
    }

    return { message, matches };
  });
}

/**
 * Validate automation rule configuration
 * Returns an array of validation errors (empty if valid)
 */
export function validateAutomationRule(
  rule: Partial<AutomationRule>
): string[] {
  const errors: string[] = [];

  if (!rule.trigger_text || rule.trigger_text.trim() === '') {
    errors.push('Trigger text is required');
  }

  if (!rule.reply_text || rule.reply_text.trim() === '') {
    errors.push('Reply text is required');
  }

  if (!rule.trigger_type || !['comment', 'dm', 'both'].includes(rule.trigger_type)) {
    errors.push('Trigger type must be comment, dm, or both');
  }

  if (rule.match_type && !['exact', 'contains', 'starts_with'].includes(rule.match_type)) {
    errors.push('Match type must be exact, contains, or starts_with');
  }

  // Check for reasonable length limits
  if (rule.trigger_text && rule.trigger_text.length > 500) {
    errors.push('Trigger text must be 500 characters or less');
  }

  if (rule.reply_text && rule.reply_text.length > 1000) {
    errors.push('Reply text must be 1000 characters or less');
  }

  return errors;
}

/**
 * Get statistics about automation rule usage
 */
export interface AutomationRuleStats {
  totalRules: number;
  activeRules: number;
  commentRules: number;
  dmRules: number;
  bothRules: number;
  totalUsageCount: number;
  mostUsedRule?: AutomationRule;
}

export function getAutomationRuleStats(rules: AutomationRule[]): AutomationRuleStats {
  const activeRules = rules.filter((r) => r.is_active);

  const stats: AutomationRuleStats = {
    totalRules: rules.length,
    activeRules: activeRules.length,
    commentRules: rules.filter((r) => r.trigger_type === 'comment').length,
    dmRules: rules.filter((r) => r.trigger_type === 'dm').length,
    bothRules: rules.filter((r) => r.trigger_type === 'both').length,
    totalUsageCount: rules.reduce((sum, r) => sum + r.usage_count, 0),
  };

  // Find most used rule
  if (rules.length > 0) {
    stats.mostUsedRule = rules.reduce((prev, current) =>
      current.usage_count > prev.usage_count ? current : prev
    );
  }

  return stats;
}
