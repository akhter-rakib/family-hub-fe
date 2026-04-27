import { clsx } from 'clsx';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  BOUGHT: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-orange-100 text-orange-800',
  NOT_AVAILABLE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  FINISHED: 'bg-gray-100 text-gray-800',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('badge', statusColors[status] || 'bg-gray-100 text-gray-800')}>
      {status}
    </span>
  );
}
