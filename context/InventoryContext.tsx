import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InventoryItem, Transaction, InventoryContextType } from '../types';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Initial Mock Data - CLEARED as per request
const INITIAL_ITEMS: InventoryItem[] = [];

const INITIAL_TRANSACTIONS: Transaction[] = [];

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Try to load from local storage or use initial
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('lamees_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('lamees_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    localStorage.setItem('lamees_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('lamees_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Helper to get the next sequential number from MSP IDs
  const getNextIdNumber = (currentItems: InventoryItem[]): number => {
    const maxNum = currentItems.reduce((max, item) => {
      if (item.id && item.id.startsWith('MSP')) {
        const numPart = parseInt(item.id.substring(3), 10);
        return !isNaN(numPart) && numPart > max ? numPart : max;
      }
      return max;
    }, 0);
    return maxNum + 1;
  };

  const addItem = (newItemData: Omit<InventoryItem, 'id' | 'barcode'>) => {
    const nextNum = getNextIdNumber(items);
    const newId = `MSP${nextNum.toString().padStart(6, '0')}`;
    
    // Simulate barcode generation
    const newBarcode = Math.floor(100000000 + Math.random() * 900000000).toString();
    
    const newItem: InventoryItem = {
      ...newItemData,
      id: newId,
      barcode: newBarcode
    };

    setItems([...items, newItem]);

    const transaction: Transaction = {
      id: `TRX-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'NEW_ITEM',
      itemId: newId,
      itemName: newItem.name,
      quantity: newItem.quantity,
      supervisorName: 'مشرف النظام' // Usually auth user
    };
    setTransactions([transaction, ...transactions]);
  };

  const addItems = (newItemsData: Omit<InventoryItem, 'id' | 'barcode'>[]) => {
    let lastIdNum = getNextIdNumber(items);
    const newItems: InventoryItem[] = [];
    const newTransactions: Transaction[] = [];

    newItemsData.forEach(data => {
      const newId = `MSP${lastIdNum.toString().padStart(6, '0')}`;
      lastIdNum++; // Increment for next item in the batch
      
      // Generate a barcode if not present
      const newBarcode = Math.floor(100000000 + Math.random() * 900000000).toString();
      
      const newItem: InventoryItem = {
        ...data,
        id: newId,
        barcode: newBarcode
      };

      newItems.push(newItem);

      newTransactions.push({
        id: `TRX-${Date.now()}-${newId}`, // Ensure unique ID for rapid generation
        timestamp: new Date().toISOString(),
        type: 'NEW_ITEM',
        itemId: newId,
        itemName: newItem.name,
        quantity: newItem.quantity,
        supervisorName: 'استيراد Excel'
      });
    });

    setItems([...items, ...newItems]);
    setTransactions([...newTransactions, ...transactions]);
  };

  const deleteItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const processStockOut = (itemId: string, qty: number, details: { 
    receiverName: string; 
    supervisorName: string; 
    location: string;
    signature?: string;
    deliveryDate: string;
  }) => {
    const itemIndex = items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const currentItem = items[itemIndex];
    if (currentItem.quantity < qty) {
      alert("الكمية غير متوفرة!");
      return;
    }

    const updatedItems = [...items];
    updatedItems[itemIndex] = {
      ...currentItem,
      quantity: currentItem.quantity - qty
    };
    setItems(updatedItems);

    const transaction: Transaction = {
      id: `TRX-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'OUT',
      itemId: itemId,
      itemName: currentItem.name,
      quantity: qty,
      ...details
    };
    setTransactions([transaction, ...transactions]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prevTransactions) => prevTransactions.filter((t) => t.id !== id));
  };

  return (
    <InventoryContext.Provider value={{ items, transactions, addItem, addItems, deleteItem, processStockOut, deleteTransaction }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};