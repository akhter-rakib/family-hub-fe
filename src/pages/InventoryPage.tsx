import { useState } from 'react';
import { useInventory, useUpsertInventory, useUnits } from '../api/hooks';
import { useFamilyStore } from '../store';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const family = useFamilyStore(s => s.currentFamily);
  const { data: inventory, isLoading } = useInventory(family?.id || '');
  const { data: units } = useUnits();
  const upsert = useUpsertInventory();
  const [editing, setEditing] = useState<string | null>(null);
  const [qty, setQty] = useState('');

  if (!family) return <p className="text-gray-500">Select a family first</p>;
  if (isLoading) return <LoadingSpinner />;

  const handleUpdate = (itemId: string, unitId: string | undefined) => {
    upsert.mutate({ familyId: family.id, data: { itemId, quantity: parseFloat(qty), unitId } }, {
      onSuccess: () => { toast.success('Updated!'); setEditing(null); },
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Inventory</h1>

      {!inventory?.length ? <EmptyState message="No inventory items. Purchases will auto-update inventory." /> : (
        <div className="space-y-3">
          {inventory.map(item => (
            <div key={item.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">{item.itemName}</p>
                <p className="text-sm text-gray-500">
                  {item.quantity} {item.unitAbbreviation}
                  {item.lowStockThreshold && item.quantity <= item.lowStockThreshold && (
                    <span className="ml-2 text-red-600 font-medium">⚠️ Low stock</span>
                  )}
                </p>
                {item.expiryDate && (
                  <p className="text-xs text-gray-400">Expires: {new Date(item.expiryDate).toLocaleDateString()}</p>
                )}
              </div>
              {editing === item.id ? (
                <div className="flex gap-2 items-center">
                  <Input type="number" value={qty} onChange={e => setQty(e.target.value)} className="w-20" />
                  <Button onClick={() => handleUpdate(item.itemId, item.unitId)} loading={upsert.isPending}>Save</Button>
                  <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                </div>
              ) : (
                <Button variant="secondary" onClick={() => { setEditing(item.id); setQty(item.quantity.toString()); }}>
                  Edit
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
