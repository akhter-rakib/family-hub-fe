import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type {
  ApiResponse, AuthResponse, Family, FamilyMember, JoinRequest,
  Unit, Category, Item, ShoppingRequest, Purchase, Bill, GasUsage, AvailableCylinder,
  InventoryItem, Notification, MonthlyReport, Dashboard, User, DescoBalance,
  DescoConfig,
} from '../types';

// === Auth ===
export const useLogin = () => useMutation({
  mutationFn: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data).then(r => r.data.data!),
});

export const useRegister = () => useMutation({
  mutationFn: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data).then(r => r.data.data!),
});

export const useCurrentUser = () => useQuery({
  queryKey: ['me'],
  queryFn: () => api.get<ApiResponse<User>>('/auth/me').then(r => r.data.data!),
});

// === Families ===
export const useMyFamilies = () => useQuery({
  queryKey: ['families'],
  queryFn: () => api.get<ApiResponse<Family[]>>('/families').then(r => r.data.data!),
});

export const useFamily = (id: string) => useQuery({
  queryKey: ['family', id],
  queryFn: () => api.get<ApiResponse<Family>>(`/families/${id}`).then(r => r.data.data!),
  enabled: !!id,
});

export const useCreateFamily = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post<ApiResponse<Family>>('/families', data).then(r => r.data.data!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['families'] }),
  });
};

export const useFamilyMembers = (familyId: string) => useQuery({
  queryKey: ['members', familyId],
  queryFn: () => api.get<ApiResponse<FamilyMember[]>>(`/families/${familyId}/members`).then(r => r.data.data!),
  enabled: !!familyId,
});

export const useJoinFamily = () => useMutation({
  mutationFn: (data: { inviteCode: string; message?: string }) =>
    api.post('/families/join-request', data),
});

export const usePendingRequests = (familyId: string, enabled = true) => useQuery({
  queryKey: ['join-requests', familyId],
  queryFn: () => api.get<ApiResponse<JoinRequest[]>>(`/families/${familyId}/join-requests`).then(r => r.data.data!),
  enabled: !!familyId && enabled,
});

export const useApproveRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, requestId }: { familyId: string; requestId: string }) =>
      api.post(`/families/${familyId}/join-requests/${requestId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['join-requests'] });
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });
};

// === Catalog ===
export const useUnits = () => useQuery({
  queryKey: ['units'],
  queryFn: () => api.get<ApiResponse<Unit[]>>('/units').then(r => r.data.data!),
  staleTime: 60 * 60 * 1000,
});

export const useCategories = (familyId: string) => useQuery({
  queryKey: ['categories', familyId],
  queryFn: () => api.get<ApiResponse<Category[]>>(`/families/${familyId}/categories`).then(r => r.data.data!),
  enabled: !!familyId,
  staleTime: 60 * 60 * 1000,
});

export const useSearchItems = (familyId: string, query: string) => useQuery({
  queryKey: ['items-search', familyId, query],
  queryFn: () => api.get<ApiResponse<Item[]>>(`/families/${familyId}/items/search`, { params: { q: query } }).then(r => r.data.data!),
  enabled: !!familyId && query.length >= 2,
});

export const useItems = (familyId: string) => useQuery({
  queryKey: ['items', familyId],
  queryFn: () => api.get<ApiResponse<Item[]>>(`/families/${familyId}/items`).then(r => r.data.data!),
  enabled: !!familyId,
});

export const useCreateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, data }: { familyId: string; data: { name: string; categoryId?: string; defaultUnitId?: string } }) =>
      api.post<ApiResponse<Item>>(`/families/${familyId}/items`, data).then(r => r.data.data!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
};

// === Shopping ===
export const useShoppingRequests = (familyId: string, status?: string) => useQuery({
  queryKey: ['shopping', familyId, status],
  queryFn: () => api.get<ApiResponse<ShoppingRequest[]>>(`/families/${familyId}/shopping-requests`, { params: status ? { status } : {} }).then(r => r.data.data!),
  enabled: !!familyId,
});

export const useMyTasks = (familyId: string) => useQuery({
  queryKey: ['my-tasks'],
  queryFn: () => api.get<ApiResponse<ShoppingRequest[]>>(`/families/${familyId}/shopping-requests/my-tasks`).then(r => r.data.data!),
});

export const useCreateShopping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, data }: { familyId: string; data: any }) =>
      api.post(`/families/${familyId}/shopping-requests`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping'] }),
  });
};

export const useBatchCreateShopping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, data }: { familyId: string; data: any }) =>
      api.post(`/families/${familyId}/shopping-requests/batch`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping'] }),
  });
};

export const useUpdateShopping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, requestId, data }: { familyId: string; requestId: string; data: any }) =>
      api.patch(`/families/${familyId}/shopping-requests/${requestId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopping'] });
      qc.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });
};

export const useQuickPurchase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, requestId, data }: { familyId: string; requestId: string; data: any }) =>
      api.post(`/families/${familyId}/shopping-requests/${requestId}/quick-purchase`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopping'] });
      qc.invalidateQueries({ queryKey: ['my-tasks'] });
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// === Purchases ===
export const usePurchases = (familyId: string) => useQuery({
  queryKey: ['purchases', familyId],
  queryFn: () => api.get<ApiResponse<Purchase[]>>(`/families/${familyId}/purchases`).then(r => r.data.data!),
  enabled: !!familyId,
});

export const useCreatePurchase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, data }: { familyId: string; data: any }) =>
      api.post(`/families/${familyId}/purchases`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['shopping'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// === Bills ===
export const useBills = (familyId: string) => useQuery({
  queryKey: ['bills', familyId],
  queryFn: () => api.get<ApiResponse<Bill[]>>(`/families/${familyId}/bills`).then(r => r.data.data!),
  enabled: !!familyId,
});

export const useCreateBill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, data }: { familyId: string; data: any }) =>
      api.post(`/families/${familyId}/bills`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bills'] }),
  });
};

export const useUpdateBill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, billId, data }: { familyId: string; billId: string; data: any }) =>
      api.patch(`/families/${familyId}/bills/${billId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bills'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useMarkBillPaid = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, billId }: { familyId: string; billId: string }) =>
      api.patch(`/families/${familyId}/bills/${billId}/pay`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bills'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// === Gas ===
export const useGasLogs = (familyId: string) => useQuery({
  queryKey: ['gas', familyId],
  queryFn: () => api.get<ApiResponse<GasUsage[]>>(`/families/${familyId}/gas`).then(r => r.data.data!),
  enabled: !!familyId,
});

export const useAvailableCylinders = (familyId: string) => useQuery({
  queryKey: ['gas-cylinders', familyId],
  queryFn: () => api.get<ApiResponse<AvailableCylinder[]>>(`/families/${familyId}/gas/available-cylinders`).then(r => r.data.data!),
  enabled: !!familyId,
});

export const useStartGas = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, data }: { familyId: string; data: any }) =>
      api.post(`/families/${familyId}/gas`, data),
    onSuccess: (_data, { familyId }) => {
      qc.invalidateQueries({ queryKey: ['gas'] });
      qc.invalidateQueries({ queryKey: ['gas-cylinders', familyId] });
    },
  });
};

export const useFinishGas = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, gasId }: { familyId: string; gasId: string }) =>
      api.patch(`/families/${familyId}/gas/${gasId}/finish`),
    onSuccess: (_data, { familyId }) => {
      qc.invalidateQueries({ queryKey: ['gas'] });
      qc.invalidateQueries({ queryKey: ['gas-cylinders', familyId] });
    },
  });
};

export const useUpdateGas = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, gasId, data }: { familyId: string; gasId: string; data: any }) =>
      api.patch(`/families/${familyId}/gas/${gasId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gas'] }),
  });
};

// === Inventory ===
export const useInventory = (familyId: string) => useQuery({
  queryKey: ['inventory', familyId],
  queryFn: () => api.get<ApiResponse<InventoryItem[]>>(`/families/${familyId}/inventory`).then(r => r.data.data!),
  enabled: !!familyId,
});

// === Reports ===
export const useMonthlyReport = (familyId: string, year: number, month: number) => useQuery({
  queryKey: ['report', familyId, year, month],
  queryFn: () => api.get<ApiResponse<MonthlyReport>>(`/families/${familyId}/reports/monthly`, { params: { year, month } }).then(r => r.data.data!),
  enabled: !!familyId,
});

export const useDashboard = (familyId: string) => useQuery({
  queryKey: ['dashboard', familyId],
  queryFn: () => api.get<ApiResponse<Dashboard>>(`/families/${familyId}/dashboard`).then(r => r.data.data!),
  enabled: !!familyId,
  staleTime: 5 * 60 * 1000,
});

// === Notifications ===
export const useNotifications = () => useQuery({
  queryKey: ['notifications'],
  queryFn: () => api.get<ApiResponse<Notification[]>>('/notifications').then(r => r.data.data!),
});

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

// === Inventory (upsert) ===
export const useUpsertInventory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, data }: { familyId: string; data: any }) =>
      api.put(`/families/${familyId}/inventory`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
};

// === DESCO Balance ===
export const useDescoBalance = (familyId: string) => useQuery({
  queryKey: ['desco-balance', familyId],
  queryFn: () => api.get<ApiResponse<DescoBalance>>(`/families/${familyId}/desco/balance`).then(r => r.data.data!),
  enabled: !!familyId,
  staleTime: 10 * 60 * 1000,
});

export const useRefreshDescoBalance = (familyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<ApiResponse<DescoBalance>>(`/families/${familyId}/desco/balance/refresh`).then(r => r.data.data!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['desco-balance', familyId] }),
  });
};

// === DESCO Config ===
export const useDescoConfig = (familyId: string) => useQuery({
  queryKey: ['desco-config', familyId],
  queryFn: () => api.get<ApiResponse<DescoConfig>>(`/families/${familyId}/desco-config`).then(r => r.data.data!),
  enabled: !!familyId,
});

export const useSaveDescoConfig = (familyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DescoConfig>) =>
      api.post<ApiResponse<DescoConfig>>(`/families/${familyId}/desco-config`, data).then(r => r.data.data!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['desco-config', familyId] }),
  });
};

export const useDeleteDescoConfig = (familyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/families/${familyId}/desco-config`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['desco-config', familyId] }),
  });
};
