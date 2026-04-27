export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
  timestamp?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  fullName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Family {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  myRole: string;
  memberCount: number;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: string;
  message?: string;
  createdAt: string;
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  baseUnit: string;
  conversionFactor: number;
  unitType: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface Item {
  id: string;
  name: string;
  categoryId?: string;
  categoryName?: string;
  defaultUnitId?: string;
  defaultUnitName?: string;
  global: boolean;
}

export interface ShoppingRequest {
  id: string;
  familyId: string;
  itemId: string;
  itemName: string;
  categoryName?: string;
  quantity: number;
  unitId?: string;
  unitAbbreviation: string;
  normalizedQuantity?: number;
  status: string;
  priority: number;
  dueDate?: string;
  note?: string;
  requestedById: string;
  requestedByName: string;
  assignedToId?: string;
  assignedToName?: string;
  listName?: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  familyId: string;
  itemId: string;
  itemName: string;
  categoryName?: string;
  quantity: number;
  unitAbbreviation: string;
  normalizedQuantity?: number;
  cost: number;
  shopName?: string;
  purchaseDate: string;
  receiptUrl?: string;
  note?: string;
  purchasedById: string;
  purchasedByName: string;
  shoppingRequestId?: string;
  createdAt: string;
}

export interface Bill {
  id: string;
  familyId: string;
  title: string;
  billType: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidDate?: string;
  recurring: boolean;
  recurrenceInterval?: string;
  note?: string;
  createdAt: string;
}

export interface GasUsage {
  id: string;
  familyId: string;
  startDate: string;
  endDate?: string;
  daysUsed?: number;
  cost?: number;
  status: string;
  purchaseId?: string;
  purchaseItemName?: string;
  purchaseShopName?: string;
  note?: string;
  createdAt: string;
}

export interface AvailableCylinder {
  purchaseId: string;
  itemName: string;
  cost: number;
  purchaseDate: string;
  shopName?: string;
  purchasedByName: string;
  note?: string;
}

export interface InventoryItem {
  id: string;
  familyId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitId?: string;
  unitAbbreviation: string;
  lowStockThreshold?: number;
  expiryDate?: string;
  lowStock: boolean;
  expiringSoon: boolean;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalPurchaseCost: number;
  totalBillsPaid: number;
  grandTotal: number;
  categoryBreakdown: { category: string; amount: number }[];
  itemBreakdown: { itemName: string; amount: number; totalQuantity: number }[];
  memberBreakdown: { memberName: string; amount: number }[];
}

export interface Dashboard {
  totalMembers: number;
  pendingShoppingRequests: number;
  overdueBills: number;
  monthlySpending: number;
  lowStockItems: number;
  unreadNotifications: number;
}
