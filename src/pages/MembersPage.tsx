import { useFamilyMembers, usePendingRequests, useApproveRequest } from '../api/hooks';
import { useFamilyStore } from '../store';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import toast from 'react-hot-toast';

export default function MembersPage() {
  const family = useFamilyStore(s => s.currentFamily);
  const isAdmin = family?.myRole === 'OWNER' || family?.myRole === 'ADMIN';
  const { data: members, isLoading } = useFamilyMembers(family?.id || '');
  const { data: requests } = usePendingRequests(family?.id || '', isAdmin);
  const approve = useApproveRequest();

  if (!family) return <p className="text-gray-500">Select a family first</p>;
  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Members</h1>
        <div className="text-sm text-gray-500">
          Invite code: <span className="font-mono font-bold text-primary-600">{family.inviteCode}</span>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {members?.map(m => (
          <div key={m.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-sm text-gray-500">{m.email}</p>
            </div>
            <span className="badge bg-primary-100 text-primary-800">{m.role}</span>
          </div>
        ))}
      </div>

      {isAdmin && requests && requests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Pending Join Requests</h2>
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.userName}</p>
                  <p className="text-sm text-gray-500">{r.userEmail}</p>
                  {r.message && <p className="text-sm text-gray-400 italic">"{r.message}"</p>}
                </div>
                <Button
                  onClick={() => approve.mutate({ familyId: family.id, requestId: r.id }, {
                    onSuccess: () => toast.success('Approved!'),
                  })}
                  loading={approve.isPending}
                >
                  Approve
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
