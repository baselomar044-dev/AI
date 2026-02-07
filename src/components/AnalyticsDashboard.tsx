// ============================================
// 📊 ANALYTICS DASHBOARD - Complete UI
// ============================================

import React, { useState, useEffect, useCallback } from 'react';

// ===== TYPES =====
interface CostSummary {
  period: string;
  totalCost: number;
  totalRequests: number;
  formattedTotalCost: string;
  formattedSavings: string;
  avgCostPerRequest: number;
  avgLatency: number;
  successRate: number;
  savings: number;
  byProvider: Record<string, { cost: number; requests: number }>;
  byCategory: Record<string, { cost: number; requests: number }>;
}

interface BudgetStatus {
  daily: { used: number; limit: number; percentage: number; status: string };
  monthly: { used: number; limit: number; percentage: number; status: string };
  isOverBudget: boolean;
  alerts: Alert[];
}

interface Alert {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface ProviderStats {
  providerId: string;
  name: string;
  color: string;
  totalCost: number;
  formattedTotalCost: string;
  totalRequests: number;
  avgLatency: number;
  successRate: number;
  remainingFreeQuota: Record<string, number>;
}

interface ChartData {
  overview: {
    hourly: { cost: number; requests: number };
    daily: { cost: number; requests: number };
    weekly: { cost: number; requests: number };
    monthly: { cost: number; requests: number };
  };
  costByProvider: { name: string; value: number; color: string }[];
  costByCategory: { name: string; value: number; requests: number; icon: string }[];
  timeline: { time: string; cost: number; requests: number }[];
  topModels: { model: string; cost: number; requests: number; formattedCost: string }[];
}

interface Suggestion {
  type: string;
  message: string;
  potentialSavings: number;
  formattedSavings: string;
}

// ===== MAIN COMPONENT =====
export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'budget' | 'history'>('overview');
  const [period, setPeriod] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [budget, setBudget] = useState<BudgetStatus | null>(null);
  const [providers, setProviders] = useState<ProviderStats[]>([]);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===== FETCH DATA =====
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, budgetRes, providersRes, chartsRes, suggestionsRes] = await Promise.all([
        fetch(`/api/analytics/summary?period=${period}`),
        fetch('/api/analytics/budget'),
        fetch('/api/analytics/providers'),
        fetch(`/api/analytics/charts?period=${period}`),
        fetch('/api/analytics/suggestions'),
      ]);

      if (!summaryRes.ok || !budgetRes.ok || !providersRes.ok || !chartsRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [summaryData, budgetData, providersData, chartsData, suggestionsData] = await Promise.all([
        summaryRes.json(),
        budgetRes.json(),
        providersRes.json(),
        chartsRes.json(),
        suggestionsRes.json(),
      ]);

      setSummary(summaryData.data);
      setBudget(budgetData.data);
      setProviders(providersData.data);
      setCharts(chartsData.data);
      setSuggestions(suggestionsData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  // ===== ACKNOWLEDGE ALERT =====
  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/analytics/alerts/${alertId}/acknowledge`, { method: 'POST' });
      fetchData();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  // ===== RENDER =====
  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📊 لوحة التحليلات</h1>
          <p className="text-gray-600 dark:text-gray-400">تتبع التكاليف والاستخدام في الوقت الفعلي</p>
        </div>
        
        <div className="flex gap-2">
          {(['hour', 'day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {p === 'hour' && 'ساعة'}
              {p === 'day' && 'يوم'}
              {p === 'week' && 'أسبوع'}
              {p === 'month' && 'شهر'}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {budget?.alerts && budget.alerts.length > 0 && (
        <div className="space-y-2">
          {budget.alerts.filter(a => !a.acknowledged).map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg flex justify-between items-center ${
                alert.type === 'budget_exceeded'
                  ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {alert.type === 'budget_exceeded' ? '🚨' : '⚠️'}
                </span>
                <span className="font-medium">{alert.message}</span>
              </div>
              <button
                onClick={() => acknowledgeAlert(alert.id)}
                className="px-3 py-1 bg-white dark:bg-gray-800 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                تم
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'overview', label: '📈 نظرة عامة', icon: '📈' },
          { id: 'providers', label: '🔌 المزودين', icon: '🔌' },
          { id: 'budget', label: '💰 الميزانية', icon: '💰' },
          { id: 'history', label: '📜 السجل', icon: '📜' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab summary={summary} charts={charts} suggestions={suggestions} />
      )}
      {activeTab === 'providers' && (
        <ProvidersTab providers={providers} />
      )}
      {activeTab === 'budget' && (
        <BudgetTab budget={budget} onRefresh={fetchData} />
      )}
      {activeTab === 'history' && (
        <HistoryTab />
      )}
    </div>
  );
}

// ===== OVERVIEW TAB =====
function OverviewTab({ 
  summary, 
  charts, 
  suggestions 
}: { 
  summary: CostSummary | null; 
  charts: ChartData | null;
  suggestions: Suggestion[];
}) {
  if (!summary || !charts) return null;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي التكلفة"
          value={summary.formattedTotalCost}
          icon="💵"
          color="blue"
        />
        <StatCard
          title="عدد الطلبات"
          value={summary.totalRequests.toLocaleString()}
          icon="📊"
          color="green"
        />
        <StatCard
          title="معدل النجاح"
          value={`${(summary.successRate * 100).toFixed(1)}%`}
          icon="✅"
          color="emerald"
        />
        <StatCard
          title="التوفير"
          value={summary.formattedSavings}
          icon="🎉"
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Provider */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">التكلفة حسب المزود</h3>
          <div className="space-y-3">
            {charts.costByProvider
              .filter(p => p.value > 0)
              .sort((a, b) => b.value - a.value)
              .map((provider) => (
                <div key={provider.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: provider.color }}
                  />
                  <span className="flex-1 text-gray-700 dark:text-gray-300">{provider.name}</span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    ${provider.value.toFixed(4)}
                  </span>
                </div>
              ))}
            {charts.costByProvider.filter(p => p.value > 0).length === 0 && (
              <p className="text-gray-500 text-center py-4">لا توجد بيانات بعد</p>
            )}
          </div>
        </div>

        {/* Cost by Category */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">التكلفة حسب النوع</h3>
          <div className="space-y-3">
            {charts.costByCategory
              .filter(c => c.value > 0)
              .sort((a, b) => b.value - a.value)
              .map((category) => (
                <div key={category.name} className="flex items-center gap-3">
                  <span className="text-xl">{category.icon}</span>
                  <span className="flex-1 text-gray-700 dark:text-gray-300 capitalize">
                    {category.name.replace('_', ' ')}
                  </span>
                  <span className="text-gray-500 text-sm">{category.requests} طلب</span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    ${category.value.toFixed(4)}
                  </span>
                </div>
              ))}
            {charts.costByCategory.filter(c => c.value > 0).length === 0 && (
              <p className="text-gray-500 text-center py-4">لا توجد بيانات بعد</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Models */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">🏆 أكثر النماذج استخداماً</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-right text-gray-500 text-sm">
                <th className="pb-3">النموذج</th>
                <th className="pb-3">الطلبات</th>
                <th className="pb-3">التكلفة</th>
              </tr>
            </thead>
            <tbody>
              {charts.topModels.map((model, i) => (
                <tr key={model.model} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-3">
                    <span className="text-gray-400 ml-2">#{i + 1}</span>
                    <span className="font-medium">{model.model}</span>
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{model.requests}</td>
                  <td className="py-3 font-mono">{model.formattedCost}</td>
                </tr>
              ))}
              {charts.topModels.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">
                    لا توجد بيانات بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">💡 اقتراحات لتقليل التكاليف</h3>
          <div className="space-y-3">
            {suggestions.map((suggestion, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-start gap-3"
              >
                <span className="text-2xl">
                  {suggestion.type === 'switch_provider' && '🔄'}
                  {suggestion.type === 'use_free_tier' && '🆓'}
                  {suggestion.type === 'batch_requests' && '📦'}
                  {suggestion.type === 'reduce_tokens' && '✂️'}
                </span>
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300">{suggestion.message}</p>
                  <p className="text-green-600 text-sm mt-1">
                    توفير محتمل: {suggestion.formattedSavings}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== PROVIDERS TAB =====
function ProvidersTab({ providers }: { providers: ProviderStats[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {providers.map((provider) => (
        <div
          key={provider.providerId}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-r-4"
          style={{ borderRightColor: provider.color }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: provider.color }}
            >
              {provider.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{provider.name}</h3>
              <p className="text-sm text-gray-500">{provider.providerId}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">التكلفة</span>
              <span className="font-mono font-medium">{provider.formattedTotalCost}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">الطلبات</span>
              <span className="font-medium">{provider.totalRequests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">معدل النجاح</span>
              <span className={`font-medium ${
                provider.successRate >= 0.95 ? 'text-green-500' :
                provider.successRate >= 0.8 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {(provider.successRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">متوسط الاستجابة</span>
              <span className="font-medium">{provider.avgLatency.toFixed(0)}ms</span>
            </div>

            {/* Free Quota */}
            {Object.keys(provider.remainingFreeQuota).length > 0 && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 mb-2">الكوتا المجانية المتبقية:</p>
                {Object.entries(provider.remainingFreeQuota).map(([model, remaining]) => (
                  <div key={model} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                      {model}
                    </span>
                    <span className="font-mono text-green-600">{remaining}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== BUDGET TAB =====
function BudgetTab({ 
  budget, 
  onRefresh 
}: { 
  budget: BudgetStatus | null; 
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [dailyLimit, setDailyLimit] = useState('10');
  const [monthlyLimit, setMonthlyLimit] = useState('100');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (budget) {
      setDailyLimit(budget.daily.limit.toString());
      setMonthlyLimit(budget.monthly.limit.toString());
    }
  }, [budget]);

  const saveBudget = async () => {
    setSaving(true);
    try {
      await fetch('/api/analytics/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyLimit: parseFloat(dailyLimit),
          monthlyLimit: parseFloat(monthlyLimit),
        }),
      });
      setEditing(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to save budget:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!budget) return null;

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BudgetCard
          title="الميزانية اليومية"
          used={budget.daily.used}
          limit={budget.daily.limit}
          percentage={budget.daily.percentage}
          status={budget.daily.status}
        />
        <BudgetCard
          title="الميزانية الشهرية"
          used={budget.monthly.used}
          limit={budget.monthly.limit}
          percentage={budget.monthly.percentage}
          status={budget.monthly.status}
        />
      </div>

      {/* Edit Budget */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">⚙️ إعدادات الميزانية</h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              تعديل
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                الحد اليومي ($)
              </label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                الحد الشهري ($)
              </label>
              <input
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                step="0.01"
                min="0"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveBudget}
                disabled={saving}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-gray-600 dark:text-gray-400">
            <div>
              <span className="text-sm">الحد اليومي:</span>
              <span className="font-mono font-medium mr-2">${budget.daily.limit}</span>
            </div>
            <div>
              <span className="text-sm">الحد الشهري:</span>
              <span className="font-mono font-medium mr-2">${budget.monthly.limit}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== HISTORY TAB =====
function HistoryTab() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/usage?limit=${limit}&offset=${(page - 1) * limit}`);
      const data = await res.json();
      setHistory(data.data || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr className="text-right text-sm text-gray-500">
              <th className="px-4 py-3">الوقت</th>
              <th className="px-4 py-3">المزود</th>
              <th className="px-4 py-3">النموذج</th>
              <th className="px-4 py-3">النوع</th>
              <th className="px-4 py-3">التكلفة</th>
              <th className="px-4 py-3">الاستجابة</th>
              <th className="px-4 py-3">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  لا توجد سجلات بعد
                </td>
              </tr>
            ) : (
              history.map((record) => (
                <tr key={record.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(record.timestamp).toLocaleString('ar-EG')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded text-xs text-white"
                      style={{ backgroundColor: record.providerColor }}
                    >
                      {record.providerId}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono truncate max-w-[150px]">
                    {record.model}
                  </td>
                  <td className="px-4 py-3">
                    <span>{record.categoryIcon}</span>
                    <span className="mr-1 text-sm">{record.taskCategory}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{record.formattedCost}</td>
                  <td className="px-4 py-3 text-sm">{record.latencyMs}ms</td>
                  <td className="px-4 py-3">
                    {record.success ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-red-500">✗</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50"
        >
          السابق
        </button>
        <span className="text-gray-600 dark:text-gray-400">صفحة {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={history.length < limit}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50"
        >
          التالي
        </button>
      </div>
    </div>
  );
}

// ===== HELPER COMPONENTS =====
function StatCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: string; 
  icon: string; 
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    emerald: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-4xl opacity-80">{icon}</span>
      </div>
    </div>
  );
}

function BudgetCard({ 
  title, 
  used, 
  limit, 
  percentage, 
  status 
}: { 
  title: string; 
  used: number; 
  limit: number; 
  percentage: number; 
  status: string;
}) {
  const statusColors = {
    ok: 'bg-green-500',
    warning: 'bg-yellow-500',
    exceeded: 'bg-red-500',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <span className={`px-2 py-1 rounded text-xs text-white ${statusColors[status as keyof typeof statusColors]}`}>
          {status === 'ok' && 'جيد'}
          {status === 'warning' && 'تحذير'}
          {status === 'exceeded' && 'تجاوز'}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>${used.toFixed(4)}</span>
          <span>${limit}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              percentage >= 100 ? 'bg-red-500' :
              percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      <p className="text-center text-2xl font-bold text-gray-900 dark:text-white">
        {percentage.toFixed(1)}%
      </p>
    </div>
  );
}
