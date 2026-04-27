import { useState } from 'react';
import { useItems, useUnits, useCategories, useCreateItem } from '../api/hooks';
import { useFamilyStore } from '../store';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

export default function ItemsPage() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id) || '';
  const { data: items, isLoading } = useItems(familyId);
  const { data: units } = useUnits();
  const { data: categories } = useCategories(familyId);
  const createItem = useCreateItem();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [defaultUnitId, setDefaultUnitId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const unitOptions = (units || []).map((u) => ({ value: u.id, label: `${u.name} (${u.abbreviation})` }));
  const categoryOptions = (categories || []).map((c) => ({ value: c.id, label: c.name }));

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Item name is required');
      return;
    }
    createItem.mutate(
      {
        familyId,
        data: {
          name: name.trim(),
          defaultUnitId: defaultUnitId || undefined,
          categoryId: categoryId || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Item created');
          setName('');
          setDefaultUnitId('');
          setCategoryId('');
          setShowForm(false);
        },
        onError: () => toast.error('Failed to create item'),
      }
    );
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Items"
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Item'}
          </Button>
        }
      >
        <p className="text-sm text-gray-500">Manage your family's item catalog</p>
      </PageHeader>

      {showForm && (
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Item Name"
              placeholder="e.g. Rice, Milk, Eggs"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Select
              label="Default Unit"
              options={unitOptions}
              value={defaultUnitId}
              onChange={(e) => setDefaultUnitId(e.target.value)}
            />
            <Select
              label="Category"
              options={categoryOptions}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <Button onClick={handleSubmit} disabled={createItem.isPending}>
              {createItem.isPending ? 'Creating...' : 'Create Item'}
            </Button>
          </div>
        </div>
      )}

      {!items?.length ? (
        <EmptyState message="No items yet. Create your first item!" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Default Unit</th>
                <th className="px-4 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.categoryName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.defaultUnitName || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.global ? 'Global' : 'Family'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}