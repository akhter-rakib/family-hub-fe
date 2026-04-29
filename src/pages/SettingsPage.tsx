import { useFamilyStore } from '../store';
import { useDescoConfig, useSaveDescoConfig, useDeleteDescoConfig } from '../api/hooks';
import React, { useState } from 'react';

export default function SettingsPage() {
  const family = useFamilyStore(s => s.currentFamily);
  const familyId = family?.id || '';
  const { data: config, isLoading } = useDescoConfig(familyId);
  const saveConfig = useSaveDescoConfig(familyId);
  const deleteConfig = useDeleteDescoConfig(familyId);

  const [accountNo, setAccountNo] = useState(config?.accountNo || '');
  const [meterNo, setMeterNo] = useState(config?.meterNo || '');
  const [enabled, setEnabled] = useState(config?.enabled ?? true);

  // Sync form with loaded config
  React.useEffect(() => {
    setAccountNo(config?.accountNo || '');
    setMeterNo(config?.meterNo || '');
    setEnabled(config?.enabled ?? true);
  }, [config]);

  if (!family) return <p className="text-gray-500">Select a family first</p>;
  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto mt-8 card">
      <h2 className="text-xl font-bold mb-4">DESCO Meter Configuration</h2>
      <form
        onSubmit={e => {
          e.preventDefault();
          saveConfig.mutate({ accountNo, meterNo, enabled });
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Account No</label>
          <input
            className="input"
            value={accountNo}
            onChange={e => setAccountNo(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Meter No</label>
          <input
            className="input"
            value={meterNo}
            onChange={e => setMeterNo(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => setEnabled(e.target.checked)}
            id="desco-enabled"
          />
          <label htmlFor="desco-enabled" className="text-sm">Enable DESCO balance tracking for this family</label>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saveConfig.isPending}
          >
            {saveConfig.isPending ? 'Saving...' : 'Save'}
          </button>
          {config && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => deleteConfig.mutate()}
              disabled={deleteConfig.isPending}
            >
              {deleteConfig.isPending ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
