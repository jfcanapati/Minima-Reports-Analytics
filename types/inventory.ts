export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  type: "consumable" | "asset";
  currentStock?: number;
  maxStock?: number;
  restockThreshold?: number;
  cost: number;
  unit: string;
  location: string;
  supplier: string;
  description?: string;
  notes?: string;
  variant?: string;
  batchNumber?: string;
  isActive?: boolean;
  imageUrl?: string;
  imageMetadata?: {
    format: string;
    height: number;
    width: number;
    publicId: string;
    size: number;
  };
  // Asset-specific fields
  condition?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  room?: string;
  roomId?: string;
  assignedTo?: string;
  assignedDepartment?: string;
  assignedRoom?: string;
  value?: string | number;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: "stock-in" | "stock-out" | "adjustment";
  quantity: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  reason?: string;
  performedBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  consumables: number;
  assets: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  status: "pending" | "approved" | "ordered" | "delivered" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  supplier: Supplier;
  items: PurchaseOrderItem[];
  totalAmount: number;
  expectedDelivery: string;
  notes?: string;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  deliveredAt?: string;
  deliveryReceipt?: {
    receivedAt: string;
    receivedBy: string;
    notes: string;
    items: any[];
  };
  statusHistory?: {
    status: string;
    changedAt: string;
    changedBy: string;
    reason: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  inventoryItemId: string;
  itemName: string;
  itemUnit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  categories: string[];
  paymentTerms: string;
  leadTimeDays: number;
  rating?: number;
  totalOrders?: number;
  isActive: boolean;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: number;
  createdAt: number;
  updatedAt?: string;
}


export interface MenuItem {
  id: string;
  name: string;
  category: string;
  cost: number;
  currentStock: number;
  maxStock: number;
  restockThreshold: number;
  unit: string;
  location: string;
  supplier: string;
  description?: string;
  isAvailable: boolean;
  preparationTime?: number;
  requiredIngredients?: {
    ingredientId: string;
    quantityRequired: number;
    unit: string;
    isCritical: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}
