import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore, useFamilyStore } from '../store';
import { useMyFamilies, useNotifications } from '../api/hooks';
import { useNotificationStream } from '../api/useNotificationStream';
import { clsx } from 'clsx';
import { useEffect } from 'react';

const navItems = [
  { path: '/dashboard', label: '📊 Dashboard' },
  { path: '/members', label: '👥 Members' },
  { path: '/shopping', label: '🛒 Shopping' },
  { path: '/purchases', label: '💰 Purchases' },
  { path: '/bills', label: '📄 Bills' },
  { path: '/gas', label: '⛽ Gas' },
  { path: '/inventory', label: '📦 Inventory' },
  { path: '/items', label: '🏷️ Items' },
  { path: '/reports', label: '📈 Reports' },
  { path: '/notifications', label: '🔔 Notifications' },
  { path: '/settings', label: '⚙️ Settings' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { currentFamily, setCurrentFamily } = useFamilyStore();
  const navigate = useNavigate();
  const { data: families } = useMyFamilies();
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  useNotificationStream();

  useEffect(() => {
    if (families?.length && !currentFamily) {
      setCurrentFamily(families[0]);
    }
  }, [families, currentFamily, setCurrentFamily]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-primary-600">🏠 Family Hub</h1>
        </div>

        {/* Family selector */}
        <div className="p-3 border-b">
          <select
            className="input-field text-sm"
            value={currentFamily?.id || ''}
            onChange={(e) => {
              const f = families?.find(f => f.id === e.target.value);
              if (f) setCurrentFamily(f);
            }}
          >
            {families?.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <button
            onClick={() => navigate('/families')}
            className="text-xs text-primary-600 hover:underline mt-1 block"
          >
            Manage families
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx('block px-4 py-2.5 text-sm transition-colors',
                  isActive ? 'bg-primary-50 text-primary-700 font-medium border-r-2 border-primary-600' : 'text-gray-600 hover:bg-gray-50')
              }
            >
              {item.label}
              {item.path === '/notifications' && unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t">
          <p className="text-sm font-medium truncate">{user?.fullName}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          <button onClick={handleLogout} className="text-xs text-red-600 hover:underline mt-2">
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
