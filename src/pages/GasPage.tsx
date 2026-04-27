import { useState } from 'react';
import { useGasLogs, useStartGas, useFinishGas } from '../api/hooks';
import { useFamilyStore } from '../store';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';

export default function GasPage() {
  const family = useFamilyStore(s => s.currentFamily);
  const { data: logs, isLoading } = useGasLogs(family?.id || '');
  const startGas = useStartGas();
  const finishGas = useFinishGas();

  const [showForm, setShowForm] = useState(false);
  const [cost, setCost] = useState('');
  const [note, setNote] = useState('');

  if (!family) return <p className="text-gray-500">Select a family first</p>;
  if (isLoading) return <LoadingSpinner />;

  const activeLog = logs?.find(l => l.status === 'ACTIVE');

  const handleStart = () => {
    if (!cost) return;
    startGas.mutate({ familyId: family.id, data: { cost: parseFloat(cost), note: note || undefined } }, {
      onSuccess: () => {
        toast.success('Gas usage started!');
        setShowForm(false);
        setCost('');
        setNote('');
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
    });
  };

  const handleFinish = (id: string) => {
    finishGas.mutate({ familyId: family.id, gasId: id }, {
      onSuccess: () => toast.success('Gas usage finished!'),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gas Usage</h1>
        {!activeLog && <Button onClick={() => setShowForm(!showForm)}>+ Start New</Button>}
      </div>

      {activeLog && (
        <div className="card mb-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-800">⛽ Active Gas Cylinder</p>
              <p className="text-sm text-green-600">Started: {new Date(activeLog.startDate).toLocaleDateString()} · ৳{activeLog.cost}</p>
            </div>
            <Button onClick={() => handleFinish(activeLog.id)} loading={finishGas.isPending}>
              Mark Finished
            </Button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card mb-6 space-y-3">
          <h3 className="font-medium">Start Gas Usage</h3>
          <Input label="Cost (৳)" type="number" value={cost} onChange={e => setCost(e.target.value)} />
          <Input label="Note" value={note} onChange={e => setNote(e.target.value)} />
          <Button onClick={handleStart} loading={startGas.isPending}>Start</Button>
        </div>
      )}

      {!logs?.length ? <EmptyState message="No gas usage logs" /> : (
        <div className="space-y-3">
          {logs.filter(l => l.status === 'FINISHED').map(l => (
            <div key={l.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {new Date(l.startDate).toLocaleDateString()} — {l.endDate ? new Date(l.endDate).toLocaleDateString() : 'Ongoing'}
                </p>
                <p className="text-sm">{l.daysUsed} days · ৳{l.cost}</p>
                {(l.daysUsed ?? 0) > 0 && <p className="text-xs text-gray-400">৳{((l.cost ?? 0) / (l.daysUsed ?? 1)).toFixed(1)}/day</p>}
              </div>
              <StatusBadge status={l.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
