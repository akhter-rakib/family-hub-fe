import { useState } from 'react';
import { useGasLogs, useAvailableCylinders, useStartGas, useFinishGas, useUpdateGas } from '../api/hooks';
import type { GasUsage, AvailableCylinder } from '../types';
import { useFamilyStore } from '../store';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GasPage() {
  const family = useFamilyStore(s => s.currentFamily);
  const { data: logs, isLoading: logsLoading } = useGasLogs(family?.id || '');
  const { data: available, isLoading: cylLoading } = useAvailableCylinders(family?.id || '');
  const startGas = useStartGas();
  const finishGas = useFinishGas();
  const updateGas = useUpdateGas();

  const todayStr = new Date().toISOString().split('T')[0];

  // Which cylinder is being started (by purchaseId)
  const [startingId, setStartingId] = useState<string | null>(null);
  const [startNote, setStartNote] = useState('');
  const [startDate, setStartDate] = useState(todayStr);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ startDate: '', note: '' });

  if (!family) return <p className="text-gray-500">Select a family first</p>;
  if (logsLoading || cylLoading) return <LoadingSpinner />;

  const activeLog = logs?.find(l => l.status === 'ACTIVE');
  const finishedLogs = logs?.filter(l => l.status === 'FINISHED') || [];

  // Stats from finished logs
  const avgDays = finishedLogs.length > 0
    ? Math.round(finishedLogs.reduce((sum, l) => sum + (l.daysUsed ?? 0), 0) / finishedLogs.length)
    : null;

  const avgCost = finishedLogs.length > 0
    ? Math.round(finishedLogs.reduce((sum, l) => sum + (l.cost ?? 0), 0) / finishedLogs.length)
    : null;

  // Estimated empty date for active cylinder
  const estimatedEmptyDate = activeLog && avgDays
    ? new Date(new Date(activeLog.startDate).getTime() + avgDays * 24 * 60 * 60 * 1000)
    : null;

  const daysUntilEmpty = estimatedEmptyDate
    ? Math.max(0, Math.round((estimatedEmptyDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  const daysActiveNow = activeLog
    ? Math.round((Date.now() - new Date(activeLog.startDate).getTime()) / (24 * 60 * 60 * 1000))
    : null;

  // Cylinders this year
  const thisYear = new Date().getFullYear();
  const cylindersThisYear = logs?.filter(l => new Date(l.startDate).getFullYear() === thisYear).length ?? 0;

  // Cost trend data for chart (last 8 finished)
  const costTrend = [...finishedLogs]
    .reverse()
    .slice(-8)
    .map(l => ({
      label: new Date(l.startDate).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      cost: l.cost ?? 0,
      days: l.daysUsed ?? 0,
    }));

  const handleStartCylinder = (cyl: AvailableCylinder) => {
    startGas.mutate({ familyId: family.id, data: {
      purchaseId: cyl.purchaseId,
      startDate: startDate || undefined,
      note: startNote || undefined,
    }}, {
      onSuccess: () => {
        toast.success('Gas cylinder started!');
        setStartingId(null);
        setStartNote('');
        setStartDate(todayStr);
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
    });
  };

  const handleFinish = (id: string) => {
    finishGas.mutate({ familyId: family.id, gasId: id }, {
      onSuccess: () => toast.success('Gas cylinder marked as finished!'),
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
    });
  };

  const startEditing = (l: GasUsage) => {
    setEditingId(l.id);
    setEditForm({
      startDate: l.startDate ? String(l.startDate) : todayStr,
      note: l.note || '',
    });
  };

  const handleSaveEdit = (gasId: string) => {
    updateGas.mutate({ familyId: family.id, gasId, data: {
      startDate: editForm.startDate || undefined,
      note: editForm.note || undefined,
    }}, {
      onSuccess: () => { toast.success('Updated!'); setEditingId(null); },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gas Usage</h1>
      </div>

      {/* Active cylinder card */}
      {activeLog && (
        <div className="card bg-green-50 border border-green-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <p className="font-semibold text-green-800 text-lg">
                ⛽ Active Cylinder
                {activeLog.purchaseItemName && (
                  <span className="text-base font-normal text-green-700 ml-2">— {activeLog.purchaseItemName}</span>
                )}
              </p>
              <p className="text-sm text-green-700">
                Started: <span className="font-medium">{new Date(activeLog.startDate).toLocaleDateString()}</span>
                {activeLog.cost && <span> · Cost: <span className="font-medium">৳{activeLog.cost}</span></span>}
                {activeLog.purchaseShopName && <span> · {activeLog.purchaseShopName}</span>}
              </p>
              <p className="text-sm text-green-600">
                Running for <span className="font-bold">{daysActiveNow} days</span>
                {avgDays && <span className="text-green-500"> (avg: {avgDays} days)</span>}
              </p>
              {estimatedEmptyDate && (
                <div className={`text-sm font-medium mt-1 ${daysUntilEmpty! <= 5 ? 'text-red-600' : daysUntilEmpty! <= 10 ? 'text-orange-600' : 'text-green-700'}`}>
                  {daysUntilEmpty! <= 0
                    ? '⚠️ Estimated to be empty — consider replacing'
                    : `📅 Estimated empty around ${estimatedEmptyDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} (${daysUntilEmpty} days left)`}
                </div>
              )}
            </div>
            <Button onClick={() => handleFinish(activeLog.id)} loading={finishGas.isPending}>
              Mark Finished
            </Button>
          </div>

          {/* Progress bar */}
          {avgDays && daysActiveNow !== null && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-green-600 mb-1">
                <span>Day {daysActiveNow}</span>
                <span>~{avgDays} days avg</span>
              </div>
              <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${daysActiveNow / avgDays > 0.85 ? 'bg-red-500' : daysActiveNow / avgDays > 0.65 ? 'bg-orange-400' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, (daysActiveNow / avgDays) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Available cylinders — only when no active one */}
      {!activeLog && (
        <div className="card">
          <h2 className="font-semibold mb-3">
            Available Cylinders
            {available && available.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">({available.length} purchased, not started)</span>
            )}
          </h2>

          {!available || available.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-4xl mb-2">⛽</p>
              <p className="text-sm">No cylinders available.</p>
              <p className="text-xs mt-1">
                Purchase a <strong>Gas Cylinder</strong> from the{' '}
                <span className="text-primary-600">Purchases page</span> first — it will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {available.map(cyl => (
                <div key={cyl.purchaseId} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-800">{cyl.itemName}</p>
                      <p className="text-sm text-gray-500">
                        ৳{cyl.cost} · Bought {new Date(cyl.purchaseDate).toLocaleDateString()}
                        {cyl.shopName && ` · ${cyl.shopName}`}
                        {cyl.purchasedByName && ` · by ${cyl.purchasedByName}`}
                      </p>
                      {cyl.note && <p className="text-xs text-gray-400 mt-0.5">{cyl.note}</p>}
                    </div>
                    <Button
                      onClick={() => setStartingId(startingId === cyl.purchaseId ? null : cyl.purchaseId)}
                      className="shrink-0"
                    >
                      {startingId === cyl.purchaseId ? 'Cancel' : 'Start'}
                    </Button>
                  </div>

                  {/* Inline confirm panel */}
                  {startingId === cyl.purchaseId && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Start Date"
                          type="date"
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                        />
                        <Input
                          label="Note (optional)"
                          value={startNote}
                          onChange={e => setStartNote(e.target.value)}
                        />
                      </div>
                      <Button onClick={() => handleStartCylinder(cyl)} loading={startGas.isPending}>
                        Confirm Start
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary stats */}
      {finishedLogs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-2xl font-bold text-primary-700">{avgDays ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Avg Days / Cylinder</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-orange-600">৳{avgCost ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Avg Cost / Cylinder</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-600">{cylindersThisYear}</p>
            <p className="text-xs text-gray-500 mt-1">Cylinders This Year</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">
              ৳{avgDays && avgCost ? Math.round(avgCost / avgDays) : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Avg Cost / Day</p>
          </div>
        </div>
      )}

      {/* Cost trend chart */}
      {costTrend.length > 1 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Cost Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={costTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `৳${v}`} />
              <Line type="monotone" dataKey="cost" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} name="Cost" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      {finishedLogs.length === 0 && !activeLog ? (
        <EmptyState message="No gas usage history yet. Purchase a gas cylinder and start it to begin tracking." />
      ) : finishedLogs.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">History</h2>
          <div className="space-y-3">
            {finishedLogs.map(l => (
              <div key={l.id} className="border-b border-gray-50 last:border-0 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(l.startDate).toLocaleDateString()} — {l.endDate ? new Date(l.endDate).toLocaleDateString() : '—'}
                      {l.purchaseItemName && <span className="text-gray-400 font-normal"> · {l.purchaseItemName}</span>}
                    </p>
                    <p className="text-sm text-gray-500">
                      {l.daysUsed} days
                      {(l.daysUsed ?? 0) > 0 && l.cost && (
                        <span className="text-gray-400"> · ৳{(l.cost / l.daysUsed!).toFixed(1)}/day</span>
                      )}
                      {l.purchaseShopName && <span className="text-gray-400"> · {l.purchaseShopName}</span>}
                      {l.note && <span className="text-gray-400"> · {l.note}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary-700">৳{l.cost}</span>
                    <button onClick={() => editingId === l.id ? setEditingId(null) : startEditing(l)}
                      className="text-xs text-gray-400 hover:text-primary-600">
                      {editingId === l.id ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                </div>
                {editingId === l.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input label="Start Date" type="date" value={editForm.startDate}
                        onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))} />
                      <Input label="Note" value={editForm.note}
                        onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={() => handleSaveEdit(l.id)} loading={updateGas.isPending} className="text-sm">Save</Button>
                      <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

