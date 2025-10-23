'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last Updated: January 23, 2025</p>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to ViloAi ("we," "our," or "us"). We are committed to protecting your personal data and
              respecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your
              information when you use our Instagram Direct Message management platform.
            </p>
            <p className="text-gray-700">
              ViloAi is operated from Finland and complies with the General Data Protection Regulation (GDPR) and
              other applicable privacy laws.
            </p>
          </section>

          {/* Data Controller */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Data Controller</h2>
            <p className="text-gray-700 mb-2">
              The data controller responsible for your personal data is:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 font-semibold">ViloAi</p>
              <p className="text-gray-700">Finland</p>
              <p className="text-gray-700">Email: privacy@viloai.com</p>
            </div>
          </section>

          {/* Data We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Account Information</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Email address</li>
              <li>Full name (optional)</li>
              <li>Business name (optional)</li>
              <li>Password (encrypted)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Instagram Data</h3>
            <p className="text-gray-700 mb-2">
              When you connect your Instagram Business Account, we collect:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Instagram user ID and username</li>
              <li>Facebook Page ID (required for Instagram Business API)</li>
              <li>Instagram access tokens (encrypted and stored securely)</li>
              <li>Direct messages (DMs) sent to your Instagram account</li>
              <li>Comments on your Instagram posts</li>
              <li>Sender information (username, name, user ID)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 AI Analysis Data</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Message intent classifications (e.g., price inquiry, availability question)</li>
              <li>AI-generated reply suggestions in Finnish and English</li>
              <li>Confidence scores for intent analysis</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.4 Payment Information</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Stripe customer ID (we do NOT store credit card details)</li>
              <li>Subscription plan and status</li>
              <li>Billing history (managed by Stripe)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.5 Usage Data</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Login times and session data</li>
              <li>Features used within the platform</li>
              <li>Analytics about message volumes and response times</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.6 Cookies and Tracking</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Essential cookies for authentication (Supabase session cookies)</li>
              <li>Analytics cookies (if you consent)</li>
            </ul>
          </section>

          {/* How We Use Your Data */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Use Your Data</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Legal Bases (GDPR)</h3>
            <p className="text-gray-700 mb-4">
              We process your personal data based on the following legal grounds:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>Contract Performance:</strong> To provide our Instagram DM management services</li>
              <li><strong>Legitimate Interest:</strong> To improve our services, prevent fraud, and ensure security</li>
              <li><strong>Consent:</strong> For analytics cookies and marketing communications (where required)</li>
              <li><strong>Legal Obligation:</strong> To comply with tax, accounting, and legal requirements</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Purposes of Processing</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Provide access to our Instagram DM management platform</li>
              <li>Analyze Instagram messages using AI (Anthropic Claude)</li>
              <li>Generate reply suggestions to help you respond faster</li>
              <li>Track message analytics and follower insights</li>
              <li>Process subscription payments via Stripe</li>
              <li>Send service-related emails (e.g., subscription confirmations)</li>
              <li>Improve our AI models and platform features</li>
              <li>Ensure platform security and prevent abuse</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Sharing and Third Parties</h2>
            <p className="text-gray-700 mb-4">
              We share your data only with trusted third-party service providers necessary to operate our service:
            </p>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Supabase (Database & Authentication)</h4>
                <p className="text-gray-700 text-sm mb-1">Purpose: Store user accounts, messages, and analytics</p>
                <p className="text-gray-700 text-sm mb-1">Location: EU/US (GDPR-compliant)</p>
                <p className="text-gray-700 text-sm">Privacy: <a href="https://supabase.com/privacy" className="text-purple-600 hover:underline" target="_blank" rel="noopener">Supabase Privacy Policy</a></p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Stripe (Payment Processing)</h4>
                <p className="text-gray-700 text-sm mb-1">Purpose: Process subscription payments</p>
                <p className="text-gray-700 text-sm mb-1">Location: Global (GDPR-compliant)</p>
                <p className="text-gray-700 text-sm">Privacy: <a href="https://stripe.com/privacy" className="text-purple-600 hover:underline" target="_blank" rel="noopener">Stripe Privacy Policy</a></p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Anthropic (AI Processing)</h4>
                <p className="text-gray-700 text-sm mb-1">Purpose: Analyze messages and generate reply suggestions using Claude AI</p>
                <p className="text-gray-700 text-sm mb-1">Location: US (GDPR-compliant)</p>
                <p className="text-gray-700 text-sm">Privacy: <a href="https://www.anthropic.com/privacy" className="text-purple-600 hover:underline" target="_blank" rel="noopener">Anthropic Privacy Policy</a></p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Meta/Instagram (API Provider)</h4>
                <p className="text-gray-700 text-sm mb-1">Purpose: Access Instagram messages and comments via Instagram Graph API</p>
                <p className="text-gray-700 text-sm mb-1">Location: Global</p>
                <p className="text-gray-700 text-sm">Privacy: <a href="https://www.facebook.com/privacy/policy" className="text-purple-600 hover:underline" target="_blank" rel="noopener">Meta Privacy Policy</a></p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Vercel (Hosting)</h4>
                <p className="text-gray-700 text-sm mb-1">Purpose: Host and serve the ViloAi application</p>
                <p className="text-gray-700 text-sm mb-1">Location: Global CDN (GDPR-compliant)</p>
                <p className="text-gray-700 text-sm">Privacy: <a href="https://vercel.com/legal/privacy-policy" className="text-purple-600 hover:underline" target="_blank" rel="noopener">Vercel Privacy Policy</a></p>
              </div>
            </div>

            <p className="text-gray-700 mt-4">
              <strong>We do NOT:</strong>
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Sell your personal data to third parties</li>
              <li>Use your data for advertising purposes</li>
              <li>Share your Instagram messages with anyone except the AI providers necessary for our service</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Account Data:</strong> Retained while your account is active</li>
              <li><strong>Instagram Messages:</strong> Retained until you delete them or close your account</li>
              <li><strong>Analytics Data:</strong> Retained for 24 months for reporting purposes</li>
              <li><strong>Payment Records:</strong> Retained for 7 years for tax/accounting compliance</li>
              <li><strong>Deleted Accounts:</strong> All personal data deleted within 30 days of account closure</li>
            </ul>
          </section>

          {/* Your Rights (GDPR) */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights Under GDPR</h2>
            <p className="text-gray-700 mb-4">
              As a data subject in the EU, you have the following rights:
            </p>

            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">Right to Access</h4>
                <p className="text-gray-700 text-sm">Request a copy of all personal data we hold about you</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">Right to Rectification</h4>
                <p className="text-gray-700 text-sm">Correct inaccurate or incomplete data (available in Settings)</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">Right to Erasure ("Right to be Forgotten")</h4>
                <p className="text-gray-700 text-sm">Request deletion of your personal data</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">Right to Data Portability</h4>
                <p className="text-gray-700 text-sm">Export your data in a machine-readable format (JSON)</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">Right to Restrict Processing</h4>
                <p className="text-gray-700 text-sm">Limit how we use your data in certain circumstances</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">Right to Object</h4>
                <p className="text-gray-700 text-sm">Object to processing based on legitimate interests</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">Right to Withdraw Consent</h4>
                <p className="text-gray-700 text-sm">Withdraw consent for analytics cookies or marketing emails</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">Right to Lodge a Complaint</h4>
                <p className="text-gray-700 text-sm">File a complaint with the Finnish Data Protection Ombudsman or your local supervisory authority</p>
              </div>
            </div>

            <p className="text-gray-700 mt-4">
              To exercise any of these rights, contact us at <a href="mailto:privacy@viloai.com" className="text-purple-600 hover:underline">privacy@viloai.com</a> or use the data export/deletion tools in your account settings.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>All data transmitted over HTTPS/TLS encryption</li>
              <li>Passwords hashed using bcrypt</li>
              <li>Instagram access tokens encrypted at rest</li>
              <li>Database access restricted to authorized personnel only</li>
              <li>Row-Level Security (RLS) policies in Supabase</li>
              <li>Regular security audits and updates</li>
              <li>API keys and secrets stored in environment variables, never in code</li>
            </ul>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Some of our service providers (e.g., Anthropic, Stripe) may process data outside the EU/EEA.
              We ensure adequate protection through:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>EU Standard Contractual Clauses (SCCs)</li>
              <li>Providers certified under the EU-U.S. Data Privacy Framework</li>
              <li>Adequate data protection safeguards as required by GDPR Article 46</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children&apos;s Privacy</h2>
            <p className="text-gray-700">
              ViloAi is not intended for use by individuals under the age of 16. We do not knowingly collect
              personal data from children. If you believe a child has provided us with personal data, please
              contact us immediately at <a href="mailto:privacy@viloai.com" className="text-purple-600 hover:underline">privacy@viloai.com</a>.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Cookies</h2>
            <p className="text-gray-700 mb-4">
              We use the following types of cookies:
            </p>
            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">Essential Cookies (Required)</h4>
                <p className="text-gray-700 text-sm">Authentication session cookies (Supabase) - necessary for login functionality</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">Analytics Cookies (Optional)</h4>
                <p className="text-gray-700 text-sm">Usage analytics - only with your consent via cookie banner</p>
              </div>
            </div>
            <p className="text-gray-700 mt-4">
              You can manage cookie preferences via the cookie banner or your browser settings.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>Posting a notice on our website</li>
              <li>Sending an email to your registered email address</li>
              <li>Updating the "Last Updated" date at the top of this page</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Your continued use of ViloAi after changes indicates acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy or wish to exercise your rights, contact us:
            </p>
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <p className="text-gray-900 font-semibold mb-2">ViloAi Data Protection Officer</p>
              <p className="text-gray-700">Email: <a href="mailto:privacy@viloai.com" className="text-purple-600 hover:underline">privacy@viloai.com</a></p>
              <p className="text-gray-700">Subject: GDPR Request</p>
              <p className="text-gray-700 mt-4 text-sm">
                We will respond to all requests within 30 days as required by GDPR.
              </p>
            </div>
          </section>

          {/* Supervisory Authority */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Supervisory Authority</h2>
            <p className="text-gray-700 mb-4">
              If you are not satisfied with our response to your privacy concerns, you have the right to lodge a complaint with:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 font-semibold">Finnish Data Protection Ombudsman</p>
              <p className="text-gray-700">Website: <a href="https://tietosuoja.fi/en/" className="text-purple-600 hover:underline" target="_blank" rel="noopener">https://tietosuoja.fi/en/</a></p>
              <p className="text-gray-700">Email: tietosuoja@om.fi</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600">
          <p>© 2025 ViloAi. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <Link href="/terms" className="text-purple-600 hover:underline">Terms of Service</Link>
            <Link href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>
            <Link href="mailto:support@viloai.com" className="text-purple-600 hover:underline">Contact Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
