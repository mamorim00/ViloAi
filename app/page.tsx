import Link from 'next/link';
import { MessageSquare, BarChart3, Zap, Instagram, Clock, TrendingUp, Shield, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Instagram className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">ViloAi</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/pricing" className="text-gray-700 hover:text-purple-600 px-4 py-2">
                Pricing
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-purple-600 px-4 py-2">
                Login
              </Link>
              <Link href="/signup" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section with Value Proposition */}
        <div className="text-center mb-16">
          <div className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            14-Day Free Trial • No Credit Card Required
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            AI-Powered Social Assistant for Finnish Businesses
          </h2>
          <p className="text-xl text-gray-600 mb-4">
            Automate Instagram DM responses and gain insights to grow your business
          </p>
          <p className="text-lg text-gray-500 mb-8">
            Save 10+ hours per week managing customer messages with AI-powered automation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 border-2 border-purple-600"
            >
              View Pricing
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Setup in 5 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Social Proof / Stats Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">10+</div>
              <div className="text-gray-600">Hours Saved Per Week</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">95%</div>
              <div className="text-gray-600">Response Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">2x</div>
              <div className="text-gray-600">Faster Reply Time</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<MessageSquare className="h-12 w-12 text-purple-600" />}
            title="Smart DM Analysis"
            description="Automatically detect customer intent: price inquiries, availability questions, and location requests"
          />
          <FeatureCard
            icon={<BarChart3 className="h-12 w-12 text-purple-600" />}
            title="AI Insights Dashboard"
            description="Track top followers, message trends, and product interest in real-time"
          />
          <FeatureCard
            icon={<Zap className="h-12 w-12 text-purple-600" />}
            title="Multi-Language Replies"
            description="Auto-suggest professional replies in Finnish and English powered by AI"
          />
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h3>
          <ol className="space-y-4">
            <Step number={1} text="Connect your Instagram Business account" />
            <Step number={2} text="AI analyzes incoming DMs for customer intent" />
            <Step number={3} text="Get smart reply suggestions in Finnish and English" />
            <Step number={4} text="Track analytics and insights on your dashboard" />
          </ol>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose ViloAi?</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <BenefitCard
              icon={<Clock className="h-8 w-8 text-blue-600" />}
              title="Save Time"
              description="Reduce message management time by up to 80%. Spend more time on what matters - growing your business."
            />
            <BenefitCard
              icon={<TrendingUp className="h-8 w-8 text-green-600" />}
              title="Increase Revenue"
              description="Faster responses mean more conversions. Never miss a sales opportunity again with instant AI-powered replies."
            />
            <BenefitCard
              icon={<BarChart3 className="h-8 w-8 text-purple-600" />}
              title="Data-Driven Insights"
              description="Understand your customers better. Track trends, identify top followers, and make informed business decisions."
            />
            <BenefitCard
              icon={<Shield className="h-8 w-8 text-red-600" />}
              title="Professional & Reliable"
              description="Maintain consistent, professional communication in both Finnish and English. Build trust with your customers."
            />
          </div>
        </div>

        {/* Use Cases / Who It's For */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-8 mb-16 text-white">
          <h3 className="text-3xl font-bold mb-6 text-center">Perfect for Finnish Businesses</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <UseCase
              title="E-commerce Sellers"
              description="Handle product inquiries, pricing questions, and availability checks automatically"
            />
            <UseCase
              title="Service Providers"
              description="Manage appointment requests, location queries, and service questions efficiently"
            />
            <UseCase
              title="Retail Shops"
              description="Engage with customers, answer common questions, and track follower engagement"
            />
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-white rounded-lg shadow-lg p-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to Transform Your Instagram DM Management?</h3>
          <p className="text-xl text-gray-600 mb-8">
            Join Finnish businesses already saving time and growing with ViloAi
          </p>
          <Link
            href="/signup"
            className="inline-block bg-purple-600 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all"
          >
            Start Your Free 14-Day Trial
          </Link>
          <p className="text-sm text-gray-500 mt-4">No credit card required • Setup in minutes • Cancel anytime</p>
        </div>
      </main>

      <footer className="bg-gray-900 text-white mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 ViloAi. Built for Finnish small businesses.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <li className="flex items-center space-x-4">
      <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
        {number}
      </div>
      <span className="text-gray-700">{text}</span>
    </li>
  );
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h4 className="text-xl font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function UseCase({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center">
      <h4 className="text-xl font-bold mb-2">{title}</h4>
      <p className="text-purple-100">{description}</p>
    </div>
  );
}
