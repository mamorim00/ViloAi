import OpenAI from 'openai';
import { IntentAnalysisResult, MessageIntent, BusinessRule } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Format business rules for AI context
function formatBusinessRulesForAI(rules: BusinessRule[]): string {
  if (!rules || rules.length === 0) {
    return '';
  }

  const activeRules = rules.filter(r => r.is_active);
  if (activeRules.length === 0) {
    return '';
  }

  let context = '\n\nBusiness Context:\n';

  // Group rules by type
  const rulesByType: Record<string, BusinessRule[]> = {};
  activeRules.forEach(rule => {
    if (!rulesByType[rule.rule_type]) {
      rulesByType[rule.rule_type] = [];
    }
    rulesByType[rule.rule_type].push(rule);
  });

  // Format prices
  if (rulesByType.price) {
    context += '\nPrices:\n';
    rulesByType.price.forEach(rule => {
      context += `- ${rule.rule_key}: ${rule.rule_value}\n`;
    });
  }

  // Format business info
  if (rulesByType.business_info) {
    context += '\nBusiness Information:\n';
    rulesByType.business_info.forEach(rule => {
      context += `- ${rule.rule_key}: ${rule.rule_value}\n`;
    });
  }

  // Format inventory
  if (rulesByType.inventory) {
    context += '\nInventory/Availability:\n';
    rulesByType.inventory.forEach(rule => {
      context += `- ${rule.rule_key}: ${rule.rule_value}\n`;
    });
  }

  // Format FAQs
  if (rulesByType.faq) {
    context += '\nCommon Questions & Answers:\n';
    rulesByType.faq.forEach(rule => {
      context += `- Q: ${rule.rule_key}\n  A: ${rule.rule_value}\n`;
    });
  }

  // Format other rules
  if (rulesByType.other) {
    context += '\nAdditional Context:\n';
    rulesByType.other.forEach(rule => {
      context += `- ${rule.rule_key}: ${rule.rule_value}\n`;
    });
  }

  context += '\nIMPORTANT: Use specific information from the business context above when relevant. For prices and structured data, provide exact values. For FAQs and general context, adapt the information naturally to answer the customer\'s question.\n';

  return context;
}

export async function analyzeMessageIntent(
  messageText: string,
  businessRules?: BusinessRule[]
): Promise<IntentAnalysisResult> {
  try {
    const businessContext = formatBusinessRulesForAI(businessRules || []);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes customer messages and provides professional replies. You must detect the language of the message and reply in the same language. Use business-specific information when available to provide accurate, personalized responses.',
        },
        {
          role: 'user',
          content: `Analyze this Instagram direct message and determine the customer's intent and the language of the message.

Message: "${messageText}"
${businessContext}

First, detect if the message is in Finnish or English.

Classify the intent as one of:
- price_inquiry: Customer asking about prices or costs
- availability: Customer asking if product/service is available
- location: Customer asking about business location or address
- general_question: General information request
- complaint: Customer complaint or issue
- compliment: Positive feedback or compliment
- other: Anything else

IMPORTANT: Provide the reply suggestion in the SAME LANGUAGE as the incoming message. If the message is in Finnish, reply in Finnish. If the message is in English, reply in English.

Respond in JSON format:
{
  "intent": "intent_type",
  "confidence": 0.95,
  "detectedLanguage": "fi" or "en",
  "suggestedReplyFi": "Professional Finnish reply (use this if message is in Finnish)",
  "suggestedReplyEn": "Professional English reply (use this if message is in English)"
}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0].message.content;
    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          intent: result.intent as MessageIntent,
          confidence: result.confidence,
          detectedLanguage: result.detectedLanguage as 'fi' | 'en',
          suggestedReplyFi: result.suggestedReplyFi,
          suggestedReplyEn: result.suggestedReplyEn,
        };
      }
    }

    // Fallback if parsing fails
    return {
      intent: 'other',
      confidence: 0.5,
      suggestedReplyFi: 'Kiitos viestistäsi! Palaamme asiaan pian.',
      suggestedReplyEn: 'Thank you for your message! We will get back to you soon.',
    };
  } catch (error) {
    console.error('Error analyzing message intent:', error);
    return {
      intent: 'other',
      confidence: 0.5,
      suggestedReplyFi: 'Kiitos viestistäsi! Palaamme asiaan pian.',
      suggestedReplyEn: 'Thank you for your message! We will get back to you soon.',
    };
  }
}

export async function generateCustomReply(
  messageText: string,
  context: string,
  language: 'fi' | 'en'
): Promise<string> {
  try {
    const languageName = language === 'fi' ? 'Finnish' : 'English';

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional customer service assistant for a small business. Generate ${languageName} replies.`,
        },
        {
          role: 'user',
          content: `Generate a professional ${languageName} reply to this Instagram message.

Customer message: "${messageText}"
Business context: ${context}

Requirements:
- Be friendly and professional
- Address the customer's question/concern
- Use proper ${languageName} language
- Keep it concise (2-3 sentences)
- Use appropriate tone for social media

Reply:`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return completion.choices[0].message.content || (
      language === 'fi'
        ? 'Kiitos viestistäsi! Palaamme asiaan pian.'
        : 'Thank you for your message! We will get back to you soon.'
    );
  } catch (error) {
    console.error('Error generating custom reply:', error);
    return language === 'fi'
      ? 'Kiitos viestistäsi! Palaamme asiaan pian.'
      : 'Thank you for your message! We will get back to you soon.';
  }
}
