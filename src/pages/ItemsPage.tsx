import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

const ItemsPage = () => {
  const [newItem, setNewItem] = useState({ name: '', defaultUnit: '' });

  const { data: items, refetch } = useQuery(['items'], async () => {
    const response = await axios.get('/api/items');
    return response.data;
  });

  const mutation = useMutation(
    async (item) => {
      await axios.post('/api/items', item);
    },
    {
      onSuccess: () => {
        refetch();
        setNewItem({ name: '', defaultUnit: '' });
      },
    }
  );

  const handleCreateItem = () => {
    mutation.mutate(newItem);
  };

  return (
    <div>
      <h1>Items</h1>
      <div>
        <input
          type="text"
          placeholder="Item Name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
        <select
          value={newItem.defaultUnit}
          onChange={(e) => setNewItem({ ...newItem, defaultUnit: e.target.value })}
        >
          <option value="">Select Unit</option>
          <option value="litre">Litre</option>
          <option value="kg">Kilogram</option>
          <option value="piece">Piece</option>
        </select>
        <button onClick={handleCreateItem}>Create Item</button>
      </div>
      <ul>
        {items?.map((item) => (
          <li key={item.id}>
            {item.name} - {item.defaultUnitName}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ItemsPage;