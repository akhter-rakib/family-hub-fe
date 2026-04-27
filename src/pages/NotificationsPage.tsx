import { useNotifications, useMarkAllRead, useMarkRead } from '../api/hooks';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markAllRead = useMarkAllRead();
  const markRead = useMarkRead();

  if (isLoading) return <LoadingSpinner />;

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={() => markAllRead.mutate(undefined, { onSuccess: () => toast.success('All marked read') })}>
            Mark all read ({unreadCount})
          </Button>
        )}
      </div>

      {!notifications?.length ? <EmptyState message="No notifications" /> : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={clsx('card cursor-pointer transition-colors', !n.read && 'bg-blue-50 border-blue-200')}
              onClick={() => !n.read && markRead.mutate(n.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={clsx('text-sm', !n.read && 'font-medium')}>{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
