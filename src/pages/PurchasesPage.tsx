import { useState } from 'react';
import { usePurchases, useCreatePurchase, useShoppingRequests, useItems, useUnits } from '../api/hooks';
import { useFamilyStore } from '../store';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import toast from 'react-hot-toast';

export default function PurchasesPage() {
  const family = useFamilyStore(s => s.currentFamily);
  const { data: purchases, isLoading } = usePurchases(family?.id || '');
  const { data: shoppingReqs } = useShoppingRequests(family?.id || '');
  const { data: items } = useItems(family?.id || '');
  const { data: units } = useUnits();
  const createPurchase = useCreatePurchase();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    shoppingRequestId: '', itemId: '', quantity: '', unitId: '', cost: '', shopName: '', note: '',
  });

  if (!family) return <p className="text-gray-500">Select a family first</p>;
  if (isLoading) return <LoadingSpinner />;

  const acceptedReqs = shoppingReqs?.filter(r => r.status === 'ACCEPTED' || r.status === 'PENDING');

  const handleCreate = () => {
    if (!form.itemId || !form.quantity || !form.cost) return;
    createPurchase.mutate({ familyId: family.id, data: {
      itemId: form.itemId,
      quantity: parseFloat(form.quantity),
      unitId: form.unitId,
      cost: parseFloat(form.cost),
      shopName: form.shopName || undefined,
      shoppingRequestId: form.shoppingRequestId || undefined,
      note: form.note || undefined,
    }}, {
      onSuccess: () => {
        toast.success('Purchase recorded!');
        setShowForm(false);
        setForm({ shoppingRequestId: '', itemId: '', quantity: '', unitId: '', cost: '', shopName: '', note: '' });
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Purchases</h1>
        <Button onClick={() => setShowForm(!showForm)}>+ Record Purchase</Button>
      </div>

      {showForm && (
        <div className="card mb-6 space-y-3">
          <h3 className="font-medium">Record Purchase</h3>
          <Select label="Link to Shopping Request (optional)" value={form.shoppingRequestId}
            onChange={e => {
              const req = acceptedReqs?.find(r => r.id === e.target.value);
              setForm(f => ({
                ...f, shoppingRequestId: e.target.value,
                itemId: req?.itemId || f.itemId,
                quantity: req?.quantity?.toString() || f.quantity,
                unitId: req?.unitId || f.unitId,
              }));
            }}
            options={acceptedReqs?.map(r => ({ value: r.id, label: `${r.itemName} - ${r.quantity} ${r.unitAbbreviation}` })) || []} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Item" value={form.itemId} onChange={e => setForm(f => ({ ...f, itemId: e.target.value }))}
              options={items?.map(i => ({ value: i.id, label: i.name })) || []} />
            <Input label="Quantity" type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            <Select label="Unit" value={form.unitId} onChange={e => setForm(f => ({ ...f, unitId: e.target.value }))}
              options={units?.map(u => ({ value: u.id, label: `${u.name} (${u.abbreviation})` })) || []} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Cost (৳)" type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
            <Input label="Shop Name" value={form.shopName} onChange={e => setForm(f => ({ ...f, shopName: e.target.value }))} />
          </div>
          <Input label="Note" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          <Button onClick={handleCreate} loading={createPurchase.isPending}>Save Purchase</Button>
        </div>
      )}

      {!purchases?.length ? <EmptyState message="No purchases yet" /> : (
        <div className="space-y-3">
          {purchases.map(p => (
            <div key={p.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">{p.itemName}</p>
                <p className="text-sm text-gray-500">{p.quantity} {p.unitAbbreviation} · {p.shopName || 'Unknown shop'}</p>
                <p className="text-xs text-gray-400">{new Date(p.purchaseDate).toLocaleDateString()} · by {p.purchasedByName}</p>
              </div>
              <p className="text-lg font-bold text-green-700">৳{p.cost}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
