import { useState } from 'react';
import { useMonthlyReport } from '../api/hooks';
import { useFamilyStore } from '../store';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`card ${color}`}>
      <p className="text-sm opacity-70 font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const family = useFamilyStore(s => s.currentFamily);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { data: report, isLoading } = useMonthlyReport(family?.id || '', year, month);

  // Dynamic year range: current year back 5 years
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const monthLabel = `${MONTHS[month - 1]} ${year}`;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  if (!family) return <p className="text-gray-500">Select a family first</p>;

  return (
    <div>
      {/* Header + filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Monthly Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {monthLabel}{isCurrentMonth && <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">Current Month</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <select className="input-field w-28" value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select className="input-field w-24" value={year} onChange={e => setYear(+e.target.value)}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : !report ? (
        <p className="text-gray-400 text-center py-12">No data for {monthLabel}</p>
      ) : (
        <div className="space-y-6">

          {/* Summary stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Grand Total" value={`৳${Number(report.grandTotal || 0).toLocaleString()}`} color="bg-primary-50 text-primary-800" />
            <StatCard label="Purchases" value={`৳${Number(report.totalPurchaseCost || 0).toLocaleString()}`} sub="Shopping only" color="bg-blue-50 text-blue-800" />
            <StatCard label="Bills Paid" value={`৳${Number(report.totalBillsPaid || 0).toLocaleString()}`} sub="Rent, utilities…" color="bg-orange-50 text-orange-800" />
            <StatCard label="Items Bought" value={String(report.itemBreakdown?.length || 0)} sub="Unique items" color="bg-green-50 text-green-800" />
          </div>

          {/* Item quantity table */}
          {report.itemBreakdown?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Item Details</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 pr-4 font-medium text-gray-600">Item</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-600">Qty Bought</th>
                      <th className="text-right py-2 pl-4 font-medium text-gray-600">Amount Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.itemBreakdown.map((item: any) => (
                      <tr key={item.itemName} className="hover:bg-gray-50">
                        <td className="py-2 pr-4 font-medium">{item.itemName}</td>
                        <td className="py-2 px-4 text-right text-gray-600">{Number(item.totalQuantity || 0).toLocaleString()}</td>
                        <td className="py-2 pl-4 text-right font-semibold text-primary-700">৳{Number(item.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200">
                      <td className="py-2 pr-4 font-semibold">Total Purchases</td>
                      <td></td>
                      <td className="py-2 pl-4 text-right font-bold text-primary-700">৳{Number(report.totalPurchaseCost || 0).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Category pie chart */}
          {report.categoryBreakdown?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={report.categoryBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={e => e.category}>
                      {report.categoryBreakdown.map((_: unknown, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `৳${Number(v).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full lg:w-48 space-y-2 shrink-0">
                  {report.categoryBreakdown.map((c: any, i: number) => (
                    <div key={c.category} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="flex-1 truncate">{c.category}</span>
                      <span className="font-semibold">৳{Number(c.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top items bar chart */}
          {report.itemBreakdown?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Top 10 Items by Spend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={report.itemBreakdown.slice(0, 10)} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="itemName" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `৳${Number(v).toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bills paid this month */}
          {Number(report.totalBillsPaid) > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-3">Bills Paid This Month</h2>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Total bills settled in {monthLabel}</span>
                <span className="text-lg font-bold text-orange-700">৳{Number(report.totalBillsPaid).toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">See the Bills page for individual bill details.</p>
            </div>
          )}

          {/* By Member */}
          {report.memberBreakdown?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Purchases by Member</h2>
              <div className="space-y-3">
                {report.memberBreakdown.map((m: any) => {
                  const pct = report.totalPurchaseCost > 0
                    ? Math.round((m.amount / Number(report.totalPurchaseCost)) * 100)
                    : 0;
                  return (
                    <div key={m.memberName}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{m.memberName}</span>
                        <span className="font-semibold">৳{Number(m.amount).toLocaleString()} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
