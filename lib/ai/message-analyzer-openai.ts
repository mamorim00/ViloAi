import OpenAI from 'openai';
import { IntentAnalysisResult, MessageIntent, BusinessRule, ConversationContext } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabase/server';

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

// Format conversation context for AI
function formatConversationContext(context: ConversationContext[]): string {
  if (!context || context.length === 0) {
    return '';
  }

  let formatted = '\n\nConversation History (Recent messages from same sender):\n';
  context.forEach((msg, index) => {
    const timestamp = new Date(msg.msg_timestamp).toLocaleTimeString();
    formatted += `[${timestamp}] ${msg.sender_name || 'Customer'}: "${msg.message_text}"\n`;
  });

  formatted += '\nIMPORTANT: Consider the FULL conversation context above. Multiple related messages should be understood together.\n';

  return formatted;
}

// Analyze message with conversation context (session-aware)
export async function analyzeMessageWithContext(
  messageText: string,
  userId: string,
  conversationId: string,
  messageTimestamp: string,
  businessRules?: BusinessRule[]
): Promise<IntentAnalysisResult> {
  try {
    // Fetch recent messages from the same conversation (within last 10 minutes)
    const { data: contextMessages } = await supabaseAdmin.rpc('get_conversation_context', {
      p_user_id: userId,
      p_conversation_id: conversationId,
      p_current_timestamp: messageTimestamp,
      p_minutes_back: 10,
      p_max_messages: 5,
    });

    const conversationContext: ConversationContext[] = contextMessages || [];
    const businessContext = formatBusinessRulesForAI(businessRules || []);
    const historyContext = formatConversationContext(conversationContext);

    console.log(`🧠 Analyzing with ${conversationContext.length} previous messages in context`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes customer messages and provides professional replies. Detect the language and reply in the same language.',
        },
        {
          role: 'user',
          content: `Analyze this Instagram direct message and determine the customer's intent and the language of the message.

Current Message: "${messageText}"
${historyContext}${businessContext}

First, detect if the message is in Finnish or English.

Consider the FULL conversation history when classifying intent. If the customer said "Hey" or "Hi" and then asks a specific question in the next message, classify based on the actual question, not the greeting.

Classify the intent as one of:
- price_inquiry: Customer asking about prices or costs
- availability: Customer asking if product/service is available
- location: Customer asking about business location or address
- general_question: General information request
- complaint: Customer complaint or issue
- compliment: Positive feedback or compliment
- other: Anything else (greetings without follow-up questions)

CRITICAL REPLY GUIDELINES:
- Answer ONLY what the customer asked - nothing more
- Do NOT add follow-up questions unless the customer asked a question
- Do NOT offer additional services, shipping info, or upsells unless specifically asked
- Do NOT say "Let us know if you need help" or similar phrases
- Keep replies SHORT and DIRECT (1-2 sentences maximum)
- Use business-specific information when available
- Match the SAME LANGUAGE as the incoming message

Respond in JSON format:
{
  "intent": "intent_type",
  "confidence": 0.95,
  "detectedLanguage": "fi" or "en",
  "suggestedReplyFi": "Direct Finnish reply (use this if message is in Finnish)",
  "suggestedReplyEn": "Direct English reply (use this if message is in English)"
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
    console.error('Error analyzing message with context:', error);
    // Fallback to simple analysis without context
    return analyzeMessageIntent(messageText, businessRules);
  }
}

/**
 * Determine if a comment/message requires a reply
 * Filters out casual comments, emojis, compliments that don't need responses
 * Returns true if it's a question/inquiry that should get a reply
 */
export async function shouldReplyToComment(
  commentText: string
): Promise<{ shouldReply: boolean; reason: string; confidence: number }> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an assistant that determines if Instagram comments require business replies.',
        },
        {
          role: 'user',
          content: `Analyze this Instagram comment and determine if it requires a business reply.

Comment: "${commentText}"

A comment REQUIRES A REPLY if it:
- Asks a question (price, availability, location, hours, etc.)
- Requests information or help
- Expresses interest in purchasing or learning more
- Contains a complaint or concern that needs addressing

A comment DOES NOT require a reply if it's:
- Just emojis (❤️, 🔥, 👍, etc.)
- Simple compliments without questions ("Love this!", "Beautiful!", "Amazing!")
- Generic praise without inquiry ("Great work!", "Nice!", "Cool!")
- Tags or mentions of friends without questions
- Simple acknowledgments ("Thanks", "OK", "👏")

Respond in JSON format:
{
  "shouldReply": true or false,
  "reason": "Brief explanation why",
  "confidence": 0.0 to 1.0
}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const content = completion.choices[0].message.content;
    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          shouldReply: result.shouldReply,
          reason: result.reason,
          confidence: result.confidence,
        };
      }
    }

    // Default to replying if parsing fails (conservative approach)
    return {
      shouldReply: true,
      reason: 'Unable to determine - replying to be safe',
      confidence: 0.5,
    };
  } catch (error) {
    console.error('Error analyzing comment type:', error);
    // Default to replying if error occurs
    return {
      shouldReply: true,
      reason: 'Error in analysis - replying to be safe',
      confidence: 0.5,
    };
  }
}
