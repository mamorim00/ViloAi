import Anthropic from '@anthropic-ai/sdk';
import { IntentAnalysisResult, MessageIntent } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeMessageIntent(
  messageText: string
): Promise<IntentAnalysisResult> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze this Instagram direct message and determine the customer's intent. Then provide professional reply suggestions in both Finnish and English.

Message: "${messageText}"

Classify the intent as one of:
- price_inquiry: Customer asking about prices or costs
- availability: Customer asking if product/service is available
- location: Customer asking about business location or address
- general_question: General information request
- complaint: Customer complaint or issue
- compliment: Positive feedback or compliment
- other: Anything else

Respond in JSON format:
{
  "intent": "intent_type",
  "confidence": 0.95,
  "suggestedReplyFi": "Professional Finnish reply",
  "suggestedReplyEn": "Professional English reply"
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          intent: result.intent as MessageIntent,
          confidence: result.confidence,
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

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Generate a professional ${languageName} reply to this Instagram message for a small business.

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
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }

    return language === 'fi'
      ? 'Kiitos viestistäsi! Palaamme asiaan pian.'
      : 'Thank you for your message! We will get back to you soon.';
  } catch (error) {
    console.error('Error generating custom reply:', error);
    return language === 'fi'
      ? 'Kiitos viestistäsi! Palaamme asiaan pian.'
      : 'Thank you for your message! We will get back to you soon.';
  }
}
