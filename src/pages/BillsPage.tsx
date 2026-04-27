import { useState } from 'react';
import { useBills, useCreateBill, useMarkBillPaid } from '../api/hooks';
import { useFamilyStore } from '../store';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import toast from 'react-hot-toast';

export default function BillsPage() {
  const family = useFamilyStore(s => s.currentFamily);
  const { data: bills, isLoading } = useBills(family?.id || '');
  const createBill = useCreateBill();
  const markPaid = useMarkBillPaid();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', billType: '', amount: '', dueDate: '', recurring: false, recurrenceInterval: '' });

  if (!family) return <p className="text-gray-500">Select a family first</p>;
  if (isLoading) return <LoadingSpinner />;

  const handleCreate = () => {
    if (!form.title || !form.amount) return;
    createBill.mutate({ familyId: family.id, data: {
      title: form.title,
      billType: form.billType,
      amount: parseFloat(form.amount),
      dueDate: form.dueDate || undefined,
      recurring: form.recurring,
      recurrenceInterval: form.recurrenceInterval || undefined,
    }}, {
      onSuccess: () => {
        toast.success('Bill created!');
        setShowForm(false);
        setForm({ title: '', billType: '', amount: '', dueDate: '', recurring: false, recurrenceInterval: '' });
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bills</h1>
        <Button onClick={() => setShowForm(!showForm)}>+ New Bill</Button>
      </div>

      {showForm && (
        <div className="card mb-6 space-y-3">
          <h3 className="font-medium">New Bill</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Select label="Type" value={form.billType} onChange={e => setForm(f => ({ ...f, billType: e.target.value }))}
              options={['ELECTRICITY', 'GAS', 'WATER', 'INTERNET', 'RENT', 'OTHER'].map(v => ({ value: v, label: v }))} />
            <Input label="Amount (৳)" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <Input label="Due Date" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))} />
            Recurring
          </label>
          {form.recurring && (
            <Select label="Interval" value={form.recurrenceInterval} onChange={e => setForm(f => ({ ...f, recurrenceInterval: e.target.value }))}
              options={[{ value: 'MONTHLY', label: 'Monthly' }, { value: 'QUARTERLY', label: 'Quarterly' }, { value: 'YEARLY', label: 'Yearly' }]} />
          )}
          <Button onClick={handleCreate} loading={createBill.isPending}>Create Bill</Button>
        </div>
      )}

      {!bills?.length ? <EmptyState message="No bills yet" /> : (
        <div className="space-y-3">
          {bills.map(b => (
            <div key={b.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">{b.title}</p>
                <p className="text-sm text-gray-500">{b.billType} · Due: {b.dueDate ? new Date(b.dueDate).toLocaleDateString() : 'No date'}</p>
                {b.recurring && <span className="text-xs text-primary-600">🔄 {b.recurrenceInterval}</span>}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold">৳{b.amount}</p>
                {b.paid ? (
                  <span className="badge bg-green-100 text-green-800">Paid</span>
                ) : (
                  <Button onClick={() => markPaid.mutate({ familyId: family.id, billId: b.id }, {
                    onSuccess: () => toast.success('Marked paid!'),
                  })}>
                    Mark Paid
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
