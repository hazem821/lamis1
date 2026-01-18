export type ItemType = 'NLAG' | 'ERSA';
export type ItemCategory = 'A' | 'B' | 'C' | 'Z';

export interface User {
  email: string;
  name: string;
  avatar?: string;
}

export interface InventoryItem {
  id: string; // Unique ID / Counter
  name: string;
  specifications: string;
  type: ItemType;
  category: ItemCategory;
  image: string; // Base64 or URL
  barcode: string; // Generated or scanned code
  quantity: number;
  unit: string; // e.g., 'piece', 'kg', 'liter'
  shelfNumber: string; // Storage location / Shelf ID
  minLevel: number; // Threshold for low stock alert
  maxLevel: number; // Threshold for overstock (optional logic)
  price: number; // Unit price/cost
}

export interface Transaction {
  id: string;
  timestamp: string;
  type: 'IN' | 'OUT' | 'NEW_ITEM';
  itemId: string;
  itemName: string;
  quantity: number;
  receiverName?: string;
  supervisorName?: string;
  location?: string;
  notes?: string;
  signature?: string; // Base64 signature image
  deliveryDate?: string; // Date of delivery confirmation
}

export interface InventoryContextType {
  items: InventoryItem[];
  transactions: Transaction[];
  addItem: (item: Omit<InventoryItem, 'id' | 'barcode'>) => void;
  addItems: (items: Omit<InventoryItem, 'id' | 'barcode'>[]) => void;
  deleteItem: (id: string) => void;
  processStockOut: (itemId: string, quantity: number, details: { 
    receiverName: string; 
    supervisorName: string; 
    location: string;
    signature?: string; // Made optional
    deliveryDate: string;
  }) => void;
  deleteTransaction: (id: string) => void;
}