import { useDashboard } from '../api/hooks';
import { useFamilyStore } from '../store';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DashboardPage() {
  const family = useFamilyStore(s => s.currentFamily);
  const { data, isLoading } = useDashboard(family?.id || '');

  if (!family) return <p className="text-gray-500">Select a family first</p>;
  if (isLoading) return <LoadingSpinner />;
  if (!data) return null;

  const cards = [
    { label: 'Members', value: data.totalMembers, icon: '👥', color: 'bg-blue-50 text-blue-700' },
    { label: 'Pending Shopping', value: data.pendingShoppingRequests, icon: '🛒', color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Overdue Bills', value: data.overdueBills, icon: '⚠️', color: 'bg-red-50 text-red-700' },
    { label: 'Monthly Spending', value: `৳${data.monthlySpending?.toLocaleString() || 0}`, icon: '💰', color: 'bg-green-50 text-green-700' },
    { label: 'Low Stock', value: data.lowStockItems, icon: '📦', color: 'bg-orange-50 text-orange-700' },
    { label: 'Unread Notifications', value: data.unreadNotifications, icon: '🔔', color: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard — {family.name}</h1>
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
    </div>
  );
}
