import { useState, useMemo } from 'react';
import {
  useShoppingRequests, useCreateShopping, useBatchCreateShopping,
  useUpdateShopping, useQuickPurchase, useItems, useUnits,
  useFamilyMembers, useMyTasks,
} from '../api/hooks';
import { useFamilyStore, useAuthStore } from '../store';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import toast from 'react-hot-toast';
import type { ShoppingRequest } from '../types';

interface ListItem {
  itemId?: string;
  itemName: string;
  quantity: string;
  unitId: string;
}

export default function ShoppingPage() {
  const family = useFamilyStore(s => s.currentFamily);
  const userId = useAuthStore(s => s.user?.id);
  const { data: requests, isLoading } = useShoppingRequests(family?.id || '');
  const { data: myTasks } = useMyTasks(family?.id || '');
  const { data: items } = useItems(family?.id || '');
  const { data: units } = useUnits();
  const { data: members } = useFamilyMembers(family?.id || '');
  const createReq = useCreateShopping();
  const batchCreate = useBatchCreateShopping();
  const updateReq = useUpdateShopping();
  const quickPurchase = useQuickPurchase();

  const [tab, setTab] = useState<'all' | 'my-tasks'>('all');
  const [showForm, setShowForm] = useState(false);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [currentItem, setCurrentItem] = useState<ListItem>({ itemName: '', quantity: '', unitId: '' });
  const [assignTo, setAssignTo] = useState('');
  const [listName, setListName] = useState('');
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [buyForm, setBuyForm] = useState({ actualQuantity: '', cost: '', shopName: '' });

  const otherMembers = useMemo(() =>
    members?.filter(m => m.userId !== userId) || [], [members, userId]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!itemSearch.trim()) return items.slice(0, 20);
    return items.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()));
  }, [items, itemSearch]);

  // Sort: pending/accepted first, then by createdAt desc
  const sortedList = useMemo(() => {
    const raw = tab === 'my-tasks' ? (myTasks || []) : (requests || []);
    return [...raw].sort((a, b) => {
      const pendingStatuses = ['PENDING', 'ACCEPTED'];
      const aIsPending = pendingStatuses.includes(a.status) ? 0 : 1;
      const bIsPending = pendingStatuses.includes(b.status) ? 0 : 1;
      if (aIsPending !== bIsPending) return aIsPending - bIsPending;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tab, myTasks, requests]);

  // Group by listName or date
  const grouped = useMemo(() => {
    const groups: { key: string; label: string; items: ShoppingRequest[] }[] = [];
    const map = new Map<string, ShoppingRequest[]>();
    for (const r of sortedList) {
      const key = r.listName || new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    for (const [key, items] of map) {
      groups.push({ key, label: key, items });
    }
    return groups;
  }, [sortedList]);

  if (!family) return <p className="text-gray-500">Select a family first</p>;
  if (isLoading) return <LoadingSpinner />;

  const addToList = () => {
    if (!currentItem.quantity || (!currentItem.itemId && !currentItem.itemName)) {
      toast.error('Select an item and enter quantity');
      return;
    }
    setListItems([...listItems, { ...currentItem }]);
    setCurrentItem({ itemName: '', quantity: '', unitId: '' });
    setItemSearch('');
  };

  const removeFromList = (idx: number) => {
    setListItems(listItems.filter((_, i) => i !== idx));
  };

  const handleSubmitList = () => {
    if (listItems.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    const payload = {
      items: listItems.map(li => ({
        itemId: li.itemId || undefined,
        itemName: li.itemId ? undefined : li.itemName,
        quantity: parseFloat(li.quantity),
        unitId: li.unitId,
      })),
      assignedTo: assignTo || undefined,
      listName: listName.trim() || undefined,
    };

    batchCreate.mutate({ familyId: family.id, data: payload }, {
      onSuccess: () => {
        toast.success(`${listItems.length} items sent!`);
        setListItems([]);
        setShowForm(false);
        setAssignTo('');
        setListName('');
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
    });
  };

  const handleQuickPurchase = (r: ShoppingRequest) => {
    if (!buyForm.cost) { toast.error('Enter the cost'); return; }
    quickPurchase.mutate({
      familyId: family.id,
      requestId: r.id,
      data: {
        actualQuantity: parseFloat(buyForm.actualQuantity || String(r.quantity)),
        cost: parseFloat(buyForm.cost),
        shopName: buyForm.shopName || undefined,
      },
    }, {
      onSuccess: () => {
        toast.success('Purchased! ✓');
        setBuyingId(null);
        setBuyForm({ actualQuantity: '', cost: '', shopName: '' });
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
    });
  };

  const handleAccept = (id: string) => {
    updateReq.mutate({ familyId: family.id, requestId: id, data: { status: 'ACCEPTED', assignedTo: userId } }, {
      onSuccess: () => toast.success('Accepted!'),
    });
  };

  const handleNotAvailable = (id: string) => {
    updateReq.mutate({ familyId: family.id, requestId: id, data: { status: 'NOT_AVAILABLE' } }, {
      onSuccess: () => toast.success('Marked as not available'),
    });
  };

  const pendingForMe = (requests || []).filter(r => r.assignedToId === userId && (r.status === 'PENDING' || r.status === 'ACCEPTED'));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Shopping</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create Shopping List'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'all' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600 hover:text-gray-800'}`}
          onClick={() => setTab('all')}
        >
          All Requests
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'my-tasks' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600 hover:text-gray-800'}`}
          onClick={() => setTab('my-tasks')}
        >
          My Tasks {pendingForMe.length > 0 && <span className="ml-1 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingForMe.length}</span>}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card mb-6 space-y-4">
          <h3 className="font-medium text-lg">Create Shopping List</h3>
          <p className="text-sm text-gray-500">
            Add items you need — {otherMembers.length === 1
              ? `will be auto-assigned to ${otherMembers[0].name}`
              : 'assign a family member to buy them'}
          </p>

          {/* List name */}
          <Input
            label="List Name (optional)"
            placeholder="e.g. Eid Shop, Weekly Groceries..."
            value={listName}
            onChange={e => setListName(e.target.value)}
          />

          {/* Item picker */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search or type new item..."
                  value={itemSearch}
                  onChange={e => { setItemSearch(e.target.value); setCurrentItem(c => ({ ...c, itemId: undefined, itemName: e.target.value })); }}
                />
                {filteredItems.length > 0 && itemSearch && !currentItem.itemId && (
                  <div className="mt-1 max-h-32 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {filteredItems.slice(0, 8).map(i => (
                      <button key={i.id} type="button"
                        className="w-full text-left px-3 py-1.5 hover:bg-primary-50 text-sm"
                        onClick={() => { setCurrentItem(c => ({ ...c, itemId: i.id, itemName: i.name })); setItemSearch(i.name); }}
                      >
                        {i.name} {i.categoryName && <span className="text-gray-400">({i.categoryName})</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="sm:col-span-3">
                <Input label="Qty" type="number" value={currentItem.quantity}
                  onChange={e => setCurrentItem(c => ({ ...c, quantity: e.target.value }))} />
              </div>
              <div className="sm:col-span-3">
                <Select label="Unit" value={currentItem.unitId}
                  onChange={e => setCurrentItem(c => ({ ...c, unitId: e.target.value }))}
                  options={units?.map(u => ({ value: u.id, label: u.abbreviation })) || []} />
              </div>
              <div className="sm:col-span-1">
                <Button onClick={addToList} className="w-full">+</Button>
              </div>
            </div>
          </div>

          {/* Items list */}
          {listItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">{listItems.length} item(s) in list:</p>
              {listItems.map((li, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm">
                    <span className="font-medium">{li.itemName}</span>
                    <span className="text-gray-500 ml-2">{li.quantity} {units?.find(u => u.id === li.unitId)?.abbreviation}</span>
                  </span>
                  <button type="button" onClick={() => removeFromList(idx)} className="text-red-500 hover:text-red-700 text-sm">✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Assign to (only if >2 members) */}
          {otherMembers.length > 1 && (
            <Select label="Assign to"
              value={assignTo}
              onChange={e => setAssignTo(e.target.value)}
              options={otherMembers.map(m => ({ value: m.userId, label: m.name }))} />
          )}

          <Button onClick={handleSubmitList} loading={batchCreate.isPending} disabled={listItems.length === 0}>
            Send Shopping List ({listItems.length} items)
          </Button>
        </div>
      )}

      {/* Request list */}
      {sortedList.length === 0 ? (
        <EmptyState message={tab === 'my-tasks' ? 'No tasks assigned to you' : 'No shopping requests yet'} />
      ) : (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.key}>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">{group.items.length}</span>
                {group.label}
              </h3>
              <div className="space-y-3">
                {group.items.map(r => (
            <div key={r.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{r.itemName}</p>
                    {r.priority > 0 && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Urgent</span>}
                  </div>
                  <p className="text-sm text-gray-500">
                    {r.quantity} {r.unitAbbreviation}
                    {r.assignedToName && <span> · assigned to <span className="font-medium">{r.assignedToId === userId ? 'You' : r.assignedToName}</span></span>}
                  </p>
                  <p className="text-xs text-gray-400">Requested by {r.requestedByName}</p>
                  {r.note && <p className="text-sm text-gray-400 italic mt-1">{r.note}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={r.status} />

                  {/* Actions based on status and role */}
                  {r.status === 'PENDING' && !r.assignedToId && (
                    <Button onClick={() => handleAccept(r.id)} className="text-sm">I'll Buy</Button>
                  )}
                  {(r.status === 'PENDING' || r.status === 'ACCEPTED') && r.assignedToId === userId && (
                    <>
                      <Button onClick={() => { setBuyingId(r.id); setBuyForm({ actualQuantity: String(r.quantity), cost: '', shopName: '' }); }} className="text-sm">
                        Purchase ✓
                      </Button>
                      <button onClick={() => handleNotAvailable(r.id)} className="text-xs text-gray-500 hover:text-red-600">
                        N/A
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Inline purchase form */}
              {buyingId === r.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm font-medium mb-2">Confirm purchase:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input label="Actual Qty" type="number" value={buyForm.actualQuantity}
                      onChange={e => setBuyForm(f => ({ ...f, actualQuantity: e.target.value }))} />
                    <Input label="Cost (৳)" type="number" value={buyForm.cost}
                      onChange={e => setBuyForm(f => ({ ...f, cost: e.target.value }))} />
                    <Input label="Shop (optional)" value={buyForm.shopName}
                      onChange={e => setBuyForm(f => ({ ...f, shopName: e.target.value }))} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button onClick={() => handleQuickPurchase(r)} loading={quickPurchase.isPending} className="text-sm">
                      Confirm Purchase
                    </Button>
                    <button onClick={() => setBuyingId(null)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
