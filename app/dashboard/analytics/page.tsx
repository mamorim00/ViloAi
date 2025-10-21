'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, TrendingUp, MessageSquare, Clock, CheckCircle, Download } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AnalyticsSummary } from '@/lib/types';

const INTENT_COLORS = {
  price_inquiry: '#10b981', // green
  availability: '#f59e0b', // orange
  location: '#ef4444', // red
  general_question: '#3b82f6', // blue
  complaint: '#dc2626', // dark red
  compliment: '#8b5cf6', // purple
  other: '#6b7280', // gray
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<number>(30); // days

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadAnalytics();
    }
  }, [dateRange]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(false);
    loadAnalytics();
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/summary?days=${dateRange}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        console.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const exportToCsv = () => {
    if (!analytics) return;

    const csvRows = [
      ['Date', 'Total Messages', 'Replied Messages'],
      ...analytics.messagesByDate.map(d => [d.date, d.count, d.replied]),
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viloai-analytics-${dateRange}days.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t.common.loading}</div>
      </div>
    );
  }

  // Prepare data for pie chart
  const intentData = analytics ? Object.entries(analytics.messagesByIntent)
    .filter(([_, count]) => count > 0)
    .map(([intent, count]) => ({
      name: t.intents[intent as keyof typeof t.intents],
      value: count,
      fill: INTENT_COLORS[intent as keyof typeof INTENT_COLORS] || INTENT_COLORS.other,
    })) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="flex items-center text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t.messages.backToDashboard}
          </Link>
          <LanguageToggle />
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t.analytics?.title || 'Analytics Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="7">{t.analytics?.last7Days || 'Last 7 days'}</option>
              <option value="30">{t.analytics?.last30Days || 'Last 30 days'}</option>
              <option value="90">{t.analytics?.last90Days || 'Last 90 days'}</option>
            </select>
            <button
              onClick={exportToCsv}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Download className="h-5 w-5" />
              <span>{t.analytics?.export || 'Export CSV'}</span>
            </button>
          </div>
        </div>

        {!analytics ? (
          <div className="text-center py-12 text-gray-500">{t.common.loading}</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={<MessageSquare className="h-8 w-8 text-blue-600" />}
                title={t.analytics?.totalMessages || 'Total Messages'}
                value={analytics.totalMessages.toString()}
                bgColor="bg-blue-50"
              />
              <StatCard
                icon={<CheckCircle className="h-8 w-8 text-green-600" />}
                title={t.analytics?.repliedMessages || 'Replied'}
                value={analytics.repliedMessages.toString()}
                subtitle={`${analytics.responseRate}% ${t.analytics?.responseRate || 'response rate'}`}
                bgColor="bg-green-50"
              />
              <StatCard
                icon={<Clock className="h-8 w-8 text-orange-600" />}
                title={t.analytics?.avgResponseTime || 'Avg Response Time'}
                value={`${analytics.avgResponseTimeHours}h`}
                bgColor="bg-orange-50"
              />
              <StatCard
                icon={<TrendingUp className="h-8 w-8 text-purple-600" />}
                title={t.analytics?.engagement || 'Engagement'}
                value={analytics.totalMessages > 0 ? '↑' : '-'}
                subtitle={analytics.totalMessages > 0 ? t.analytics?.active || 'Active' : t.analytics?.noActivity || 'No activity'}
                bgColor="bg-purple-50"
              />
            </div>

            {/* Messages Over Time Chart */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t.analytics?.messagesOverTime || 'Messages Over Time'}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.messagesByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    name={t.analytics?.total || 'Total'}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="replied"
                    stroke="#10b981"
                    name={t.analytics?.replied || 'Replied'}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Intent Distribution Pie Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {t.analytics?.intentDistribution || 'Message Intent Distribution'}
                </h2>
                {intentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={intentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {intentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {t.dashboard.noMessages}
                  </div>
                )}
              </div>

              {/* Intent Breakdown Bar Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {t.analytics?.intentBreakdown || 'Intent Breakdown'}
                </h2>
                {intentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={intentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8b5cf6">
                        {intentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {t.dashboard.noMessages}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  bgColor,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div>{icon}</div>
      </div>
    </div>
  );
}
