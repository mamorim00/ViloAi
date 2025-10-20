import Link from 'next/link';
import { MessageSquare, BarChart3, Zap, Instagram } from 'lucide-react';

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
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            AI-Powered Social Assistant for Finnish Businesses
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Automate Instagram DM responses and gain insights to grow your business
          </p>
          <Link
            href="/signup"
            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700"
          >
            Start Free Trial
          </Link>
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

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h3>
          <ol className="space-y-4">
            <Step number={1} text="Connect your Instagram Business account" />
            <Step number={2} text="AI analyzes incoming DMs for customer intent" />
            <Step number={3} text="Get smart reply suggestions in Finnish and English" />
            <Step number={4} text="Track analytics and insights on your dashboard" />
          </ol>
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
