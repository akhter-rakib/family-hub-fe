import { useDashboard, useMonthlyReport, useDescoBalance, useRefreshDescoBalance, useDescoConfig } from '../api/hooks';
import { useFamilyStore } from '../store';
import LoadingSpinner from '../components/LoadingSpinner';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { DescoConfig } from '../types';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DashboardPage() {
  const family = useFamilyStore(s => s.currentFamily);
  const now = new Date();
  const { data, isLoading } = useDashboard(family?.id || '');
  const { data: report } = useMonthlyReport(family?.id || '', now.getFullYear(), now.getMonth() + 1);
  const { data: desco } = useDescoBalance(family?.id || '');
  const refreshDesco = useRefreshDescoBalance(family?.id || '');
  const { data: descoConfigData } = useDescoConfig(family?.id || '');

  if (!family) return <p className="text-gray-500">Select a family first</p>;
  if (isLoading) return <LoadingSpinner />;
  if (!data) return null;

  const cards = [
    { label: 'Grand Total Spend', value: `৳${Number(data.monthlySpending || 0).toLocaleString()}`, icon: '💰', color: 'bg-green-50 text-green-700' },
    { label: 'Bills Paid', value: `৳${Number(report?.totalBillsPaid || 0).toLocaleString()}`, icon: '🧾', color: 'bg-orange-50 text-orange-700' },
    { label: 'Purchases', value: `৳${Number(report?.totalPurchaseCost || 0).toLocaleString()}`, icon: '🛒', color: 'bg-blue-50 text-blue-700' },
    { label: 'Pending Shopping', value: data.pendingShoppingRequests, icon: '⏳', color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Overdue Bills', value: data.overdueBills, icon: '⚠️', color: 'bg-red-50 text-red-700' },
    { label: 'Low Stock', value: data.lowStockItems, icon: '📦', color: 'bg-purple-50 text-purple-700' },
  ];

  const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard — {family.name}</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{monthLabel}</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`card ${c.color}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{c.icon}</span>
              <div>
                <p className="text-sm opacity-75">{c.label}</p>
                <p className="text-2xl font-bold">{c.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DESCO Prepaid Meter */}
      {descoConfigData && descoConfigData.enabled ? (
        <div className={`card border-l-4 ${desco?.lowBalance ? 'border-l-red-500 bg-red-50' : 'border-l-cyan-500 bg-cyan-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-3xl">⚡</span>
              <div>
                <p className="text-sm font-medium text-gray-500">DESCO Prepaid Meter</p>
                {desco ? (
                  <>
                    <div className="flex items-center gap-6 mt-1">
                      <div>
                        <p className="text-xs text-gray-400">Balance</p>
                        <p className={`text-2xl font-bold ${desco.lowBalance ? 'text-red-600' : 'text-cyan-700'}`}>
                          ৳{Number(desco.balance).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">This Month Usage</p>
                        <p className="text-2xl font-bold text-gray-700">
                          {Number(desco.currentMonthConsumption).toLocaleString()} <span className="text-sm font-normal">kWh</span>
                        </p>
                      </div>
                    </div>
                    {desco.lowBalance && (
                      <p className="text-xs text-red-600 font-medium mt-1">⚠ Low balance! Please recharge soon.</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Last updated: {new Date(desco.fetchedAt).toLocaleString()}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">No data yet. Click Fetch Now to load.</p>
                )}
              </div>
            </div>
            <button
              onClick={() => refreshDesco.mutate()}
              disabled={refreshDesco.isPending}
              className="text-sm px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
            >
              {refreshDesco.isPending ? 'Fetching...' : desco ? '🔄 Refresh' : '⚡ Fetch Now'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card border-l-4 border-l-gray-300 bg-gray-50">
          <div className="flex items-center gap-4">
            <span className="text-3xl">⚡</span>
            <div>
              <p className="text-sm font-medium text-gray-500">DESCO Prepaid Meter</p>
              <p className="text-sm text-gray-400 mt-1">Not configured for this family. <a href="/settings" className="text-primary-600 underline">Configure now</a>.</p>
            </div>
          </div>
        </div>
      )}

      {/* Current month report sections */}
      {report && (
        <>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-700">This Month's Breakdown</h2>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">{monthLabel}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category breakdown */}
            {report.categoryBreakdown?.length > 0 && (
              <div className="card">
                <h3 className="font-semibold mb-4">Spending by Category</h3>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={report.categoryBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80}>
                        {report.categoryBreakdown.map((_: unknown, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `৳${Number(v).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 shrink-0 min-w-0">
                    {report.categoryBreakdown.slice(0, 6).map((c: any, i: number) => (
                      <div key={c.category} className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="truncate text-gray-600 max-w-[80px]">{c.category}</span>
                        <span className="font-medium ml-auto">৳{Number(c.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Member spending */}
            {report.memberBreakdown?.length > 0 && (
              <div className="card">
                <h3 className="font-semibold mb-4">Purchases by Member</h3>
                <div className="space-y-3">
                  {report.memberBreakdown.map((m: any) => {
                    const pct = Number(report.totalPurchaseCost) > 0
                      ? Math.round((m.amount / Number(report.totalPurchaseCost)) * 100)
                      : 0;
                    return (
                      <div key={m.memberName}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{m.memberName}</span>
                          <span>৳{Number(m.amount).toLocaleString()} <span className="text-gray-400">({pct}%)</span></span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Top items table */}
          {report.itemBreakdown?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-4">Top Items This Month</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="pb-2 font-medium text-gray-500">Item</th>
                      <th className="pb-2 font-medium text-gray-500 text-right">Qty</th>
                      <th className="pb-2 font-medium text-gray-500 text-right">Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.itemBreakdown.slice(0, 8).map((item: any) => (
                      <tr key={item.itemName} className="hover:bg-gray-50">
                        <td className="py-2 font-medium">{item.itemName}</td>
                        <td className="py-2 text-right text-gray-500">{Number(item.totalQuantity || 0).toLocaleString()}</td>
                        <td className="py-2 text-right font-semibold text-primary-700">৳{Number(item.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {report.itemBreakdown.length > 8 && (
                  <p className="text-xs text-gray-400 mt-2 text-center">+{report.itemBreakdown.length - 8} more items — see full report</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
