// Environment variable validation
export function validateEnv() {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required for basic functionality
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
  }

  // Required for Instagram integration
  if (!process.env.META_APP_ID) {
    warnings.push('META_APP_ID not set - Instagram connection will not work');
  }
  if (!process.env.META_APP_SECRET) {
    warnings.push('META_APP_SECRET not set - Instagram connection will not work');
  }
  if (!process.env.META_REDIRECT_URI) {
    warnings.push('META_REDIRECT_URI not set - Instagram connection will not work');
  }

  // Optional but recommended
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    warnings.push(
      'No AI API key set (ANTHROPIC_API_KEY or OPENAI_API_KEY) - Using mock AI analyzer'
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    warnings.push('STRIPE_SECRET_KEY not set - Subscription features will not work');
  }

  return { errors, warnings, isValid: errors.length === 0 };
}

export function logEnvStatus() {
  const { errors, warnings, isValid } = validateEnv();

  if (!isValid) {
    console.error('\n❌ Environment Configuration Errors:');
    errors.forEach((err) => console.error(`   - ${err}`));
    console.error('\n   Please check your .env.local file\n');
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Configuration Warnings:');
    warnings.forEach((warn) => console.warn(`   - ${warn}`));
    console.warn('');
  }

  if (isValid && warnings.length === 0) {
    console.log('✅ All environment variables configured correctly\n');
  }

  return isValid;
}
