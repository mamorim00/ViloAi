import { IntentAnalysisResult, MessageIntent, BusinessRule } from '@/lib/types';

// Mock AI analyzer for development without API keys
export async function analyzeMessageIntent(
  messageText: string,
  businessRules?: BusinessRule[]
): Promise<IntentAnalysisResult> {
  console.log('🤖 Using MOCK AI analyzer (no API key needed)');

  // Simple keyword-based intent detection
  const lowerText = messageText.toLowerCase();

  // Detect language based on Finnish keywords
  const finnishKeywords = ['hinta', 'maksa', 'saatavilla', 'varastossa', 'sijainti', 'osoite', 'missä', 'ongelma', 'valitus', 'kiitos', 'mahtava'];
  const detectedLanguage: 'fi' | 'en' = finnishKeywords.some(keyword => lowerText.includes(keyword)) ? 'fi' : 'en';

  let intent: MessageIntent = 'other';
  let suggestedReplyFi = 'Kiitos viestistäsi! Palaamme asiaan pian.';
  let suggestedReplyEn = 'Thank you for your message! We will get back to you soon.';

  // Price detection
  if (lowerText.includes('price') || lowerText.includes('cost') ||
      lowerText.includes('hinta') || lowerText.includes('maksa')) {
    intent = 'price_inquiry';
    suggestedReplyFi = 'Kiitos kysymyksestäsi! Hintamme vaihtelevat tuotteen mukaan. Voinko auttaa sinua tietyn tuotteen hinnan kanssa?';
    suggestedReplyEn = 'Thank you for your inquiry! Our prices vary by product. Can I help you with pricing for a specific item?';
  }
  // Availability detection
  else if (lowerText.includes('available') || lowerText.includes('stock') ||
           lowerText.includes('saatavilla') || lowerText.includes('varastossa')) {
    intent = 'availability';
    suggestedReplyFi = 'Kiitos kysymyksestäsi! Tuotteemme ovat yleensä saatavilla. Mistä tuotteesta olet kiinnostunut?';
    suggestedReplyEn = 'Thank you for asking! Our products are generally available. Which product are you interested in?';
  }
  // Location detection
  else if (lowerText.includes('location') || lowerText.includes('address') ||
           lowerText.includes('where') || lowerText.includes('sijainti') ||
           lowerText.includes('osoite') || lowerText.includes('missä')) {
    intent = 'location';
    suggestedReplyFi = 'Kiitos kysymyksestäsi! Löydät meidät Helsingistä. Voinko lähettää sinulle tarkan osoitteen?';
    suggestedReplyEn = 'Thank you for asking! We are located in Helsinki. Would you like me to send you our exact address?';
  }
  // Complaint detection
  else if (lowerText.includes('problem') || lowerText.includes('issue') ||
           lowerText.includes('complaint') || lowerText.includes('ongelma') ||
           lowerText.includes('valitus')) {
    intent = 'complaint';
    suggestedReplyFi = 'Pahoittelut kuullessani tästä! Haluamme korjata tilanteen mahdollisimman pian. Voisitko kertoa lisää?';
    suggestedReplyEn = 'I apologize for the inconvenience! We want to resolve this as quickly as possible. Could you tell me more?';
  }
  // Compliment detection
  else if (lowerText.includes('great') || lowerText.includes('love') ||
           lowerText.includes('amazing') || lowerText.includes('kiitos') ||
           lowerText.includes('mahtava')) {
    intent = 'compliment';
    suggestedReplyFi = 'Kiitos paljon! Olemme iloisia, että olet tyytyväinen. Palautteesi merkitsee meille paljon!';
    suggestedReplyEn = 'Thank you so much! We are glad you are happy. Your feedback means a lot to us!';
  }
  // General question
  else if (lowerText.includes('?') || lowerText.includes('how') ||
           lowerText.includes('what') || lowerText.includes('when')) {
    intent = 'general_question';
    suggestedReplyFi = 'Kiitos kysymyksestäsi! Autamme mielellämme. Voisitko kertoa tarkemmin, mistä haluat tietää?';
    suggestedReplyEn = 'Thank you for your question! We are happy to help. Could you provide more details about what you would like to know?';
  }

  return {
    intent,
    confidence: 0.75, // Mock confidence
    detectedLanguage,
    suggestedReplyFi,
    suggestedReplyEn,
  };
}

export async function generateCustomReply(
  messageText: string,
  context: string,
  language: 'fi' | 'en'
): Promise<string> {
  console.log('🤖 Using MOCK AI reply generator (no API key needed)');

  if (language === 'fi') {
    return 'Kiitos viestistäsi! Olemme täällä auttamassa sinua. Palaamme asiaan pian yksityiskohtaisemman vastauksen kanssa.';
  }

  return 'Thank you for your message! We are here to help you. We will get back to you soon with a more detailed response.';
}
