"use client";

import { useState, useEffect } from "react";
import { ref, get, query, orderByChild } from "firebase/database";
import { database } from "@/lib/firebase";
import { InventoryItem, InventoryStats, InventoryTransaction, PurchaseOrder, Supplier, MenuItem } from "@/types/inventory";

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const inventoryRef = ref(database, "inventory");
      const snapshot = await get(inventoryRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const itemsList: InventoryItem[] = Object.entries(data).map(([id, itemData]) => ({
          id,
          ...(itemData as Omit<InventoryItem, "id">),
        }));
        setItems(itemsList);
      } else {
        setItems([]);
      }
    } catch (err) {
      setError("Failed to fetch inventory");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return {
    items,
    loading,
    error,
    fetchInventory,
  };
}

export function useInventoryStats(items: InventoryItem[]): InventoryStats {
  const stats: InventoryStats = {
    totalItems: items.length,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0,
    consumables: 0,
    assets: 0,
  };

  items.forEach((item) => {
    // Count by type
    if (item.type === "consumable") {
      stats.consumables++;
    } else if (item.type === "asset") {
      stats.assets++;
    }

    // Check stock levels for consumables
    if (item.type === "consumable" && item.currentStock !== undefined) {
      if (item.currentStock === 0) {
        stats.outOfStockItems++;
      } else if (item.restockThreshold && item.currentStock <= item.restockThreshold) {
        stats.lowStockItems++;
      }
    }

    // Calculate total value
    if (item.currentStock && item.cost) {
      stats.totalValue += item.currentStock * item.cost;
    } else if (item.type === "asset" && item.value) {
      stats.totalValue += typeof item.value === "string" ? parseFloat(item.value) : item.value;
    }
  });

  return stats;
}

export function useInventoryTransactions(itemId?: string) {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const transactionsRef = ref(database, "transactions");
        const transactionsQuery = query(transactionsRef, orderByChild("createdAt"));
        const snapshot = await get(transactionsQuery);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          let transactionsList: InventoryTransaction[] = Object.entries(data).map(([id, txData]) => ({
            id,
            ...(txData as Omit<InventoryTransaction, "id">),
          }));

          // Filter by itemId if provided
          if (itemId) {
            transactionsList = transactionsList.filter((tx) => tx.itemId === itemId);
          }

          // Sort by date descending
          transactionsList.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          setTransactions(transactionsList);
        } else {
          setTransactions([]);
        }
      } catch (err) {
        setError("Failed to fetch transactions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [itemId]);

  return {
    transactions,
    loading,
    error,
  };
}

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const poRef = ref(database, "purchaseOrders");
        const snapshot = await get(poRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const poList: PurchaseOrder[] = Object.entries(data).map(([id, poData]) => ({
            id,
            ...(poData as Omit<PurchaseOrder, "id">),
          }));

          // Sort by date descending
          poList.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          setPurchaseOrders(poList);
        } else {
          setPurchaseOrders([]);
        }
      } catch (err) {
        setError("Failed to fetch purchase orders");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrders();
  }, []);

  return {
    purchaseOrders,
    loading,
    error,
  };
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      setError(null);
      try {
        const suppliersRef = ref(database, "suppliers");
        const snapshot = await get(suppliersRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const suppliersList: Supplier[] = Object.entries(data).map(([id, supplierData]) => ({
            id,
            ...(supplierData as Omit<Supplier, "id">),
          }));

          // Sort by name
          suppliersList.sort((a, b) => a.name.localeCompare(b.name));

          setSuppliers(suppliersList);
        } else {
          setSuppliers([]);
        }
      } catch (err) {
        setError("Failed to fetch suppliers");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  return {
    suppliers,
    loading,
    error,
  };
}

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const menuRef = ref(database, "menu");
        const snapshot = await get(menuRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const menuList: MenuItem[] = Object.entries(data).map(([id, menuData]) => ({
            id,
            ...(menuData as Omit<MenuItem, "id">),
          }));

          // Sort by name
          menuList.sort((a, b) => a.name.localeCompare(b.name));

          setMenuItems(menuList);
        } else {
          setMenuItems([]);
        }
      } catch (err) {
        setError("Failed to fetch menu items");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  return {
    menuItems,
    loading,
    error,
  };
}
