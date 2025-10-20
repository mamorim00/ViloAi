'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { BusinessRule, RuleType } from '@/lib/types';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<Partial<BusinessRule>>({
    rule_type: 'price',
    rule_key: '',
    rule_value: '',
    is_active: true,
  });

  useEffect(() => {
    checkAuth();
    loadRules();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const loadRules = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/business-rules', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error('Error loading rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.rule_key || !newRule.rule_value) {
      alert(t.settings.fillAllFields);
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/business-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newRule),
      });

      if (response.ok) {
        await loadRules();
        setNewRule({
          rule_type: 'price',
          rule_key: '',
          rule_value: '',
          is_active: true,
        });
      }
    } catch (error) {
      console.error('Error creating rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRule = async (ruleId: string, updates: Partial<BusinessRule>) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/business-rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await loadRules();
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm(t.settings.confirmDelete)) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/business-rules/${ruleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        await loadRules();
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (rule: BusinessRule) => {
    await handleUpdateRule(rule.id, { is_active: !rule.is_active });
  };

  const getRulesByType = (type: RuleType) => {
    return rules.filter(r => r.rule_type === type);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link
              href="/dashboard"
              className="flex items-center text-purple-600 hover:text-purple-700"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t.settings.backToDashboard}
            </Link>
            <LanguageToggle />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t.settings.title}</h1>
          <p className="text-gray-600 mt-2">
            {t.settings.subtitle}
          </p>
        </div>

        {/* Add New Rule Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t.settings.addNewRule}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.settings.type}</label>
              <select
                value={newRule.rule_type}
                onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value as RuleType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="price">{t.settings.ruleTypes.price}</option>
                <option value="business_info">{t.settings.ruleTypes.business_info}</option>
                <option value="inventory">{t.settings.ruleTypes.inventory}</option>
                <option value="faq">{t.settings.ruleTypes.faq}</option>
                <option value="other">{t.settings.ruleTypes.other}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {newRule.rule_type === 'faq' ? t.settings.question : t.settings.key}
              </label>
              <input
                type="text"
                value={newRule.rule_key}
                onChange={(e) => setNewRule({ ...newRule, rule_key: e.target.value })}
                placeholder={newRule.rule_type === 'price' ? t.settings.placeholders.priceKey : newRule.rule_type === 'faq' ? t.settings.placeholders.faqQuestion : t.settings.placeholders.genericKey}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {newRule.rule_type === 'faq' ? t.settings.answer : t.settings.value}
              </label>
              <input
                type="text"
                value={newRule.rule_value}
                onChange={(e) => setNewRule({ ...newRule, rule_value: e.target.value })}
                placeholder={newRule.rule_type === 'price' ? t.settings.placeholders.priceValue : newRule.rule_type === 'faq' ? t.settings.placeholders.faqAnswer : t.settings.placeholders.genericValue}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreateRule}
                disabled={saving || !newRule.rule_key || !newRule.rule_value}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                {t.settings.addRule}
              </button>
            </div>
          </div>
        </div>

        {/* Rules by Category */}
        <div className="space-y-6">
          <RuleSection
            title={t.settings.sections.prices}
            type="price"
            rules={getRulesByType('price')}
            onToggle={toggleActive}
            onDelete={handleDeleteRule}
            saving={saving}
          />

          <RuleSection
            title={t.settings.sections.businessInfo}
            type="business_info"
            rules={getRulesByType('business_info')}
            onToggle={toggleActive}
            onDelete={handleDeleteRule}
            saving={saving}
          />

          <RuleSection
            title={t.settings.sections.inventory}
            type="inventory"
            rules={getRulesByType('inventory')}
            onToggle={toggleActive}
            onDelete={handleDeleteRule}
            saving={saving}
          />

          <RuleSection
            title={t.settings.sections.faqs}
            type="faq"
            rules={getRulesByType('faq')}
            onToggle={toggleActive}
            onDelete={handleDeleteRule}
            saving={saving}
          />

          <RuleSection
            title={t.settings.sections.other}
            type="other"
            rules={getRulesByType('other')}
            onToggle={toggleActive}
            onDelete={handleDeleteRule}
            saving={saving}
          />
        </div>
      </div>
    </div>
  );
}

function RuleSection({
  title,
  type,
  rules,
  onToggle,
  onDelete,
  saving,
}: {
  title: string;
  type: RuleType;
  rules: BusinessRule[];
  onToggle: (rule: BusinessRule) => void;
  onDelete: (ruleId: string) => void;
  saving: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        {rules.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t.settings.noRules}</p>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`border rounded-lg p-4 ${
                  rule.is_active ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-semibold text-gray-900">{rule.rule_key}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {rule.is_active ? t.common.active : t.common.inactive}
                      </span>
                    </div>
                    <p className="text-gray-700">{rule.rule_value}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onToggle(rule)}
                      disabled={saving}
                      className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      title={rule.is_active ? t.settings.deactivate : t.settings.activate}
                    >
                      <div className={`w-10 h-6 rounded-full transition ${rule.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${rule.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                      </div>
                    </button>
                    <button
                      onClick={() => onDelete(rule.id)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50"
                      title={t.common.delete}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
