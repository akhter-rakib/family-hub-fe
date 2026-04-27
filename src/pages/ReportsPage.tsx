import { useState } from 'react';
import { useMonthlyReport } from '../api/hooks';
import { useFamilyStore } from '../store';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

export default function ReportsPage() {
  const family = useFamilyStore(s => s.currentFamily);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { data: report, isLoading } = useMonthlyReport(family?.id || '', year, month);

  if (!family) return <p className="text-gray-500">Select a family first</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Monthly Report</h1>
        <div className="flex gap-2">
          <select className="input-field w-24" value={month} onChange={e => setMonth(+e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('default', { month: 'short' })}</option>
            ))}
          </select>
          <select className="input-field w-24" value={year} onChange={e => setYear(+e.target.value)}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : report && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Total Spending</h2>
            <p className="text-3xl font-bold text-primary-700">৳{report.grandTotal?.toLocaleString() || 0}</p>
          </div>

          {report.categoryBreakdown?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">By Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={report.categoryBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={e => e.category}>
                    {report.categoryBreakdown.map((_: unknown, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `৳${v}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {report.itemBreakdown?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Top Items</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={report.itemBreakdown.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="itemName" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `৳${v}`} />
                  <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {report.memberBreakdown?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">By Member</h2>
              <div className="space-y-2">
                {report.memberBreakdown.map((m: any) => (
                  <div key={m.memberName} className="flex items-center justify-between">
                    <span>{m.memberName}</span>
                    <span className="font-semibold">৳{m.amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
