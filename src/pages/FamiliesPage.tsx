import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyFamilies, useCreateFamily, useJoinFamily } from '../api/hooks';
import { useFamilyStore } from '../store';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function FamiliesPage() {
  const navigate = useNavigate();
  const { data: families, isLoading } = useMyFamilies();
  const { setCurrentFamily } = useFamilyStore();
  const createFamily = useCreateFamily();
  const joinFamily = useJoinFamily();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    createFamily.mutate({ name }, {
      onSuccess: (family) => {
        setCurrentFamily(family);
        toast.success('Family created!');
        navigate('/dashboard');
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
    });
  };

  const handleJoin = () => {
    if (!inviteCode.trim()) return;
    joinFamily.mutate({ inviteCode }, {
      onSuccess: () => {
        toast.success('Join request submitted!');
        setShowJoin(false);
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
    });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-2xl font-bold text-center">🏠 My Families</h1>

        {families?.length ? (
          <div className="space-y-3">
            {families.map(f => (
              <div key={f.id} className="card cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => { setCurrentFamily(f); navigate('/dashboard'); }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{f.name}</h3>
                    <p className="text-sm text-gray-500">{f.memberCount} members · {f.myRole}</p>
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{f.inviteCode}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No families yet. Create or join one!</p>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={() => setShowCreate(!showCreate)}>Create Family</Button>
          <Button variant="secondary" onClick={() => setShowJoin(!showJoin)}>Join Family</Button>
        </div>

        {showCreate && (
          <div className="card">
            <h3 className="font-medium mb-3">Create Family</h3>
            <div className="flex gap-2">
              <Input placeholder="Family name" value={name} onChange={e => setName(e.target.value)} />
              <Button onClick={handleCreate} loading={createFamily.isPending}>Create</Button>
            </div>
          </div>
        )}

        {showJoin && (
          <div className="card">
            <h3 className="font-medium mb-3">Join Family</h3>
            <div className="flex gap-2">
              <Input placeholder="Invite code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
              <Button onClick={handleJoin} loading={joinFamily.isPending}>Join</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
