# AI Setup Options

You have **3 ways** to use ViloAi without a paid API key initially:

## ✅ Option 1: MOCK Mode (Currently Active - No API Key Needed)

**Best for:** Testing the app flow without any API costs

The app is currently configured to use a **simple keyword-based analyzer** that doesn't require any API key. This is perfect for:
- Testing the UI and user flow
- Demonstrating the app to stakeholders
- Development without API costs

**What it does:**
- Detects keywords in messages (e.g., "price", "hinta", "location", "sijainti")
- Returns pre-written Finnish and English replies
- Works offline and costs nothing

**Current status:** ✅ ACTIVE (ready to use right now!)

**To use:** Just run `npm run dev` - no configuration needed!

---

## 💰 Option 2: Free AI Credits (Recommended for Testing)

### Anthropic Claude (Original Implementation)
1. Sign up at https://console.anthropic.com
2. Get **$5 in free credits** (hundreds of analyses)
3. Create an API key
4. Add to `.env.local`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
5. Edit `lib/ai/index.ts`:
   ```typescript
   // Comment out the mock, uncomment Anthropic:
   // export * from './message-analyzer-mock';
   export * from './message-analyzer';
   ```

### OpenAI GPT (Alternative)
1. Sign up at https://platform.openai.com
2. Get **$5 in free credits** (valid 3 months)
3. Create an API key
4. Add to `.env.local`:
   ```bash
   OPENAI_API_KEY=sk-...
   ```
5. Edit `lib/ai/index.ts`:
   ```typescript
   // Comment out the mock, uncomment OpenAI:
   // export * from './message-analyzer-mock';
   export * from './message-analyzer-openai';
   ```

---

## 🔄 Switching Between Modes

Edit **one file**: `lib/ai/index.ts`

```typescript
// Option 1: MOCK - No API key needed
export * from './message-analyzer-mock';

// Option 2: OpenAI - Free $5 credits
// export * from './message-analyzer-openai';

// Option 3: Anthropic - Free $5 credits (best quality)
// export * from './message-analyzer';
```

Just uncomment the one you want and comment out the others!

---

## 📊 Comparison

| Feature | MOCK | OpenAI Free | Anthropic Free |
|---------|------|-------------|----------------|
| **Cost** | $0 | $0 (first $5) | $0 (first $5) |
| **Quality** | Basic | Very Good | Excellent |
| **Setup Time** | 0 min | 5 min | 5 min |
| **API Key** | ❌ Not needed | ✅ Required | ✅ Required |
| **Finnish Quality** | Pre-written | Good | Excellent |
| **Intent Detection** | Keywords | AI-powered | AI-powered |
| **Custom Replies** | Template | Generated | Generated |

---

## 🚀 Quick Start Steps

### Right Now (No API Key):
```bash
npm run dev
```
Visit http://localhost:3000 and test with the MOCK analyzer!

### When You Get Free Credits:
1. Sign up for Anthropic or OpenAI
2. Get your free $5 credits
3. Copy API key to `.env.local`
4. Edit `lib/ai/index.ts` to switch mode
5. Restart: `npm run dev`

---

## 💡 Testing the MOCK Analyzer

Try these test messages to see different intents:

**Price Inquiry:**
- "How much does this cost?"
- "Mikä on hinta?"

**Availability:**
- "Is this available?"
- "Onko saatavilla?"

**Location:**
- "Where are you located?"
- "Missä sijaitsette?"

**General:**
- "What are your opening hours?"
- "Can I order this online?"

Each will get a different AI-generated reply in both Finnish and English!

---

## 📝 Cost Estimation

**With Free Credits ($5):**
- ~500-1000 message analyses (OpenAI GPT-3.5)
- ~200-400 message analyses (Anthropic Claude)
- Perfect for MVP testing and demo

**After Free Credits:**
- OpenAI: ~$0.002-0.005 per message
- Anthropic: ~$0.01-0.02 per message
- Still very affordable for a business tool!

---

## 🎯 Recommendation

1. **Start now** with MOCK mode → Test the app flow
2. **Sign up** for Anthropic free credits → Better quality
3. **Launch MVP** with paid API when you get users
4. **Scale** based on actual usage

You can build and test the entire app today without spending a penny! 🎉
