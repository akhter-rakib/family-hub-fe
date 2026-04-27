import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

export function useNotificationStream() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token) return;

    const url = `/api/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('notification', (event) => {
      const data = JSON.parse(event.data);
      // Refresh notification list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      // Show toast
      toast(data.message, { icon: '🔔' });
    });

    es.onerror = () => {
      // Browser will auto-reconnect for transient errors.
      // Close on permanent failure to avoid infinite retry loops.
      if (es.readyState === EventSource.CLOSED) {
        es.close();
      }
    };

    return () => {
      es.close();
    };
  }, [token, queryClient]);
}
