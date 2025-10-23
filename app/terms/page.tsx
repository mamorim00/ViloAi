'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
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

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last Updated: January 23, 2025</p>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              Welcome to ViloAi! These Terms of Service ("Terms") govern your use of the ViloAi platform
              ("Service"), operated by ViloAi ("we," "us," or "our").
            </p>
            <p className="text-gray-700 mb-4">
              By accessing or using ViloAi, you agree to be bound by these Terms and our Privacy Policy.
              If you do not agree to these Terms, you may not use the Service.
            </p>
            <p className="text-gray-700">
              <strong>Important:</strong> These Terms include a limitation of liability, dispute resolution,
              and other important provisions that affect your legal rights.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility</h2>
            <p className="text-gray-700 mb-4">
              To use ViloAi, you must:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Be at least 16 years old (or the age of majority in your jurisdiction)</li>
              <li>Have an Instagram Business Account connected to a Facebook Page</li>
              <li>Be a business owner or authorized representative of the business</li>
              <li>Provide accurate and complete registration information</li>
              <li>Not be prohibited from using the Service under applicable laws</li>
            </ul>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration and Security</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Account Creation</h3>
            <p className="text-gray-700 mb-4">
              You must create an account to use ViloAi. When registering, you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Account Responsibility</h3>
            <p className="text-gray-700">
              You are responsible for all activities that occur under your account. We are not liable for
              any loss or damage arising from your failure to maintain account security.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Service Description</h2>
            <p className="text-gray-700 mb-4">
              ViloAi provides an Instagram Direct Message and comment management platform with AI-powered features:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Sync and manage Instagram DMs and comments in one unified inbox</li>
              <li>AI-powered message intent analysis (using Anthropic Claude)</li>
              <li>Automated reply suggestions in Finnish and English</li>
              <li>Automation rules for instant replies to common questions</li>
              <li>Analytics and insights on message volumes and response times</li>
              <li>Follower engagement tracking</li>
            </ul>
          </section>

          {/* Subscription Plans */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Subscription Plans and Billing</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Subscription Tiers</h3>
            <p className="text-gray-700 mb-4">
              ViloAi offers multiple subscription plans with varying features and usage limits.
              Current pricing and plan details are available on our <Link href="/pricing" className="text-purple-600 hover:underline">Pricing Page</Link>.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Payment Terms</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>All subscriptions are billed monthly in advance</li>
              <li>Payments are processed securely via Stripe</li>
              <li>Prices are in Euros (EUR) unless otherwise stated</li>
              <li>You authorize us to charge your payment method for all fees</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Automatic Renewal</h3>
            <p className="text-gray-700 mb-4">
              Subscriptions automatically renew at the end of each billing period unless you cancel before the renewal date.
              You will be charged the then-current subscription fee.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.4 Upgrades and Downgrades</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>Upgrades:</strong> Take effect immediately. You will be charged a prorated amount for the remainder of your billing cycle.</li>
              <li><strong>Downgrades:</strong> Take effect immediately. You will receive a prorated credit applied to your next invoice.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.5 Failed Payments</h3>
            <p className="text-gray-700 mb-4">
              If a payment fails:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>We will attempt to charge your payment method up to 3 times</li>
              <li>Your account may be suspended if payment is not received within 7 days</li>
              <li>After 30 days of non-payment, your account may be terminated</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.6 Refund Policy</h3>
            <p className="text-gray-700 mb-4">
              We offer a <strong>14-day money-back guarantee</strong> for new subscribers:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Request a refund within 14 days of your initial subscription</li>
              <li>Contact us at <a href="mailto:support@viloai.com" className="text-purple-600 hover:underline">support@viloai.com</a> with your refund request</li>
              <li>Refunds are issued to the original payment method within 5-10 business days</li>
            </ul>
            <p className="text-gray-700">
              After the 14-day period, subscriptions are non-refundable. You may cancel at any time to prevent future charges.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.7 Cancellation</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>You may cancel your subscription at any time via the Stripe Customer Portal in Settings</li>
              <li>Cancellations take effect at the end of the current billing period</li>
              <li>You will retain access to paid features until the end of your billing cycle</li>
              <li>No partial refunds for mid-cycle cancellations</li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Acceptable Use Policy</h2>
            <p className="text-gray-700 mb-4">You agree NOT to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Use the Service for any unlawful purpose or in violation of any laws</li>
              <li>Send spam, unsolicited messages, or harassing content via Instagram</li>
              <li>Violate Instagram's Terms of Service or Community Guidelines</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Reverse engineer, decompile, or disassemble the Service</li>
              <li>Use automated scripts or bots to scrape or abuse the Service</li>
              <li>Upload malicious code, viruses, or malware</li>
              <li>Impersonate another person or entity</li>
              <li>Share your account credentials with others</li>
              <li>Use the Service to compete with us or develop a similar product</li>
            </ul>
          </section>

          {/* Instagram API Compliance */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Instagram API and Meta Platform Terms</h2>
            <p className="text-gray-700 mb-4">
              ViloAi uses the Instagram Graph API to access your Instagram data. By using our Service, you acknowledge:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>You must comply with Meta's Platform Terms and Instagram's Terms of Use</li>
              <li>You grant us permission to access your Instagram Business Account on your behalf</li>
              <li>We are not affiliated with, endorsed by, or sponsored by Meta or Instagram</li>
              <li>Instagram may change their API, which could affect ViloAi's functionality</li>
              <li>You are responsible for maintaining your Instagram account's access permissions</li>
            </ul>
            <p className="text-gray-700">
              Read Meta's Platform Terms: <a href="https://developers.facebook.com/terms" className="text-purple-600 hover:underline" target="_blank" rel="noopener">https://developers.facebook.com/terms</a>
            </p>
          </section>

          {/* AI Processing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. AI-Powered Features</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 AI Analysis</h3>
            <p className="text-gray-700 mb-4">
              ViloAi uses Anthropic Claude AI to analyze your Instagram messages and generate reply suggestions.
              By using the Service, you:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Consent to your messages being processed by Anthropic's AI models</li>
              <li>Understand that AI-generated suggestions are automated and may not always be accurate</li>
              <li>Agree to review all AI-generated content before sending to your customers</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.2 No Warranties on AI Accuracy</h3>
            <p className="text-gray-700">
              AI-generated content is provided "as is" without warranties. We are not responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Inaccurate message intent classifications</li>
              <li>Inappropriate or incorrect reply suggestions</li>
              <li>Any consequences from using AI-generated content</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Intellectual Property</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">9.1 ViloAi Ownership</h3>
            <p className="text-gray-700 mb-4">
              ViloAi and its original content, features, and functionality are owned by ViloAi and are protected
              by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">9.2 Your Data Ownership</h3>
            <p className="text-gray-700 mb-4">
              You retain all rights to your Instagram messages, business data, and content. We do not claim
              ownership of your data. By using the Service, you grant us a limited license to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Store and process your data to provide the Service</li>
              <li>Use anonymized, aggregated data to improve our AI models and platform features</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">9.3 Feedback</h3>
            <p className="text-gray-700">
              If you provide feedback, suggestions, or ideas about ViloAi, you grant us the right to use them
              without compensation or attribution.
            </p>
          </section>

          {/* Data Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Data Privacy and GDPR</h2>
            <p className="text-gray-700 mb-4">
              We are committed to protecting your privacy and complying with GDPR. Our <Link href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link> explains:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>What data we collect and why</li>
              <li>How we use and share your data</li>
              <li>Your rights under GDPR (access, deletion, portability, etc.)</li>
              <li>How to exercise your rights</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Please review our Privacy Policy carefully. By using ViloAi, you agree to our Privacy Policy.
            </p>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Service Availability and Modifications</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">11.1 Service Uptime</h3>
            <p className="text-gray-700 mb-4">
              We strive for 99.9% uptime but do not guarantee uninterrupted service. The Service may be temporarily
              unavailable due to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Scheduled maintenance</li>
              <li>Technical issues or outages</li>
              <li>Instagram API downtime (beyond our control)</li>
              <li>Force majeure events</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">11.2 Service Modifications</h3>
            <p className="text-gray-700">
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time with
              reasonable notice. We are not liable for any modifications, suspensions, or discontinuations.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Termination</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">12.1 Termination by You</h3>
            <p className="text-gray-700 mb-4">
              You may terminate your account at any time by:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Canceling your subscription via the Stripe Customer Portal</li>
              <li>Contacting us at <a href="mailto:support@viloai.com" className="text-purple-600 hover:underline">support@viloai.com</a> to delete your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">12.2 Termination by Us</h3>
            <p className="text-gray-700 mb-4">
              We may suspend or terminate your account immediately if:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>You violate these Terms</li>
              <li>Your payment fails after 30 days</li>
              <li>You engage in fraudulent or illegal activity</li>
              <li>You abuse the Service or harm other users</li>
              <li>Required by law</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">12.3 Effect of Termination</h3>
            <p className="text-gray-700">
              Upon termination:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Your access to the Service will cease immediately</li>
              <li>Your data will be deleted within 30 days (unless legally required to retain)</li>
              <li>No refunds will be issued for unused subscription time (except within 14-day guarantee period)</li>
              <li>You must cease all use of our intellectual property</li>
            </ul>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Disclaimers and Warranties</h2>
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                <strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.</strong>
              </p>
              <p className="text-gray-700 mb-4">
                TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Merchantability</li>
                <li>Fitness for a particular purpose</li>
                <li>Non-infringement</li>
                <li>Accuracy, reliability, or availability of the Service</li>
                <li>AI-generated content accuracy</li>
                <li>Uninterrupted or error-free service</li>
              </ul>
              <p className="text-gray-700 mt-4">
                WE DO NOT WARRANT THAT THE SERVICE WILL MEET YOUR REQUIREMENTS OR ACHIEVE ANY PARTICULAR RESULTS.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Limitation of Liability</h2>
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
              </p>
              <p className="text-gray-700 mb-4">
                IN NO EVENT SHALL VILOAI, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
                <li>LOSS OF PROFITS, REVENUE, DATA, OR USE</li>
                <li>LOSS OF BUSINESS OPPORTUNITIES OR GOODWILL</li>
                <li>DAMAGES ARISING FROM USE OF AI-GENERATED CONTENT</li>
                <li>DAMAGES CAUSED BY INSTAGRAM API CHANGES OR OUTAGES</li>
              </ul>
              <p className="text-gray-700">
                OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS OR THE SERVICE SHALL NOT EXCEED
                THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR €100, WHICHEVER IS GREATER.
              </p>
            </div>
            <p className="text-gray-700 mt-4">
              Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability
              for consequential damages. In such jurisdictions, our liability will be limited to the maximum
              extent permitted by law.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify, defend, and hold harmless ViloAi and its affiliates from any claims,
              damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights (including intellectual property or privacy rights)</li>
              <li>Your Instagram content or messages</li>
              <li>Your violation of Instagram's or Meta's terms</li>
            </ul>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Dispute Resolution and Governing Law</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">16.1 Governing Law</h3>
            <p className="text-gray-700 mb-4">
              These Terms are governed by the laws of Finland, without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">16.2 Informal Resolution</h3>
            <p className="text-gray-700 mb-4">
              Before filing a legal claim, you agree to contact us at <a href="mailto:support@viloai.com" className="text-purple-600 hover:underline">support@viloai.com</a> to
              attempt to resolve the dispute informally. We will do the same.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">16.3 Jurisdiction</h3>
            <p className="text-gray-700">
              Any disputes not resolved informally shall be resolved in the courts of Finland.
              You consent to the exclusive jurisdiction and venue of such courts.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Changes to These Terms</h2>
            <p className="text-gray-700 mb-4">
              We may update these Terms from time to time. If we make material changes, we will notify you by:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Posting a notice on our website</li>
              <li>Sending an email to your registered email address</li>
              <li>Updating the "Last Updated" date at the top of this page</li>
            </ul>
            <p className="text-gray-700">
              Your continued use of the Service after changes indicates acceptance of the updated Terms.
              If you do not agree to the new Terms, you must stop using the Service and cancel your account.
            </p>
          </section>

          {/* Miscellaneous */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Miscellaneous</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">18.1 Entire Agreement</h3>
            <p className="text-gray-700 mb-4">
              These Terms and our Privacy Policy constitute the entire agreement between you and ViloAi
              regarding the Service.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">18.2 Severability</h3>
            <p className="text-gray-700 mb-4">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions
              will remain in full effect.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">18.3 Waiver</h3>
            <p className="text-gray-700 mb-4">
              Our failure to enforce any right or provision of these Terms does not constitute a waiver of
              that right or provision.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">18.4 Assignment</h3>
            <p className="text-gray-700 mb-4">
              You may not assign or transfer these Terms or your account without our written consent.
              We may assign these Terms without restriction.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">18.5 Force Majeure</h3>
            <p className="text-gray-700">
              We are not liable for delays or failures caused by circumstances beyond our reasonable control,
              including natural disasters, war, terrorism, riots, government actions, pandemics, or internet/infrastructure failures.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">19. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <p className="text-gray-900 font-semibold mb-2">ViloAi Support</p>
              <p className="text-gray-700">Email: <a href="mailto:support@viloai.com" className="text-purple-600 hover:underline">support@viloai.com</a></p>
              <p className="text-gray-700">Legal: <a href="mailto:legal@viloai.com" className="text-purple-600 hover:underline">legal@viloai.com</a></p>
              <p className="text-gray-700 mt-4 text-sm">
                We will respond to all inquiries within 2 business days.
              </p>
            </div>
          </section>

          {/* Acknowledgment */}
          <section>
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Acknowledgment</h2>
              <p className="text-gray-700">
                BY USING VILOAI, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE
                TERMS OF SERVICE AND OUR PRIVACY POLICY.
              </p>
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
