import React, { createContext, useState, useEffect } from "react";

// 🔴 PASTE YOUR GOOGLE SCRIPT URL HERE
const API_URL =
  "https://script.google.com/macros/s/AKfycbxEyFNimLW1HMuafE8vzIDbUD_D2cYho4AgSkQHmaMbCYSIcXCYiv2yhsD9ygBapqOE/exec";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // --- STATE ---
  const [inventory, setInventory] = useState([]);
  const [bills, setBills] = useState([]);
  const [queue, setQueue] = useState([]); // Offline Action Queue

  // UI States
  const [loading, setLoading] = useState(true); // Initial Load (Spinner)
  const [syncing, setSyncing] = useState(false); // Background Sync (Small Icon)
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // --- 1. INITIAL LOAD (Instant) ---
  useEffect(() => {
    // Load from LocalStorage
    const localInv = localStorage.getItem("inventory");
    const localBills = localStorage.getItem("bills");
    const localQueue = localStorage.getItem("offlineQueue");

    let hasData = false;

    if (localInv) {
      try {
        setInventory(JSON.parse(localInv));
        hasData = true;
      } catch (e) {}
    }
    if (localBills) {
      try {
        setBills(JSON.parse(localBills));
        hasData = true;
      } catch (e) {}
    }
    if (localQueue) {
      try {
        setQueue(JSON.parse(localQueue));
      } catch (e) {}
    }

    // If data exists, stop loading IMMEDIATELY (0.1s start)
    if (hasData) setLoading(false);

    // Trigger background sync
    if (navigator.onLine) {
      refreshData(hasData);
      if (localQueue) processQueue();
    }
  }, []);

  // --- 2. NETWORK LISTENERS ---
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue(); // Try to clear queue immediately
      refreshData(true); // Fetch fresh data
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queue]); // Re-bind if queue changes (to capture latest state)

  // --- 3. PERSISTENCE (Auto-Save to Phone) ---
  useEffect(() => {
    localStorage.setItem("inventory", JSON.stringify(inventory));
  }, [inventory]);
  useEffect(() => {
    localStorage.setItem("bills", JSON.stringify(bills));
  }, [bills]);
  useEffect(() => {
    localStorage.setItem("offlineQueue", JSON.stringify(queue));
  }, [queue]);

  // --- 4. CORE SYNC LOGIC ---

  // Fetches latest data from Google Sheets
  const refreshData = async (hasDataAlready = true) => {
    if (!navigator.onLine) return;

    // Don't show big spinner if we already have data
    if (!hasDataAlready) setLoading(true);
    else setSyncing(true);

    try {
      const [invRes, billRes] = await Promise.all([
        fetch(`${API_URL}?action=getInventory`),
        fetch(`${API_URL}?action=getBills`),
      ]);

      const invData = await invRes.json();
      const billData = await billRes.json();

      if (Array.isArray(invData)) setInventory(invData);
      if (Array.isArray(billData)) setBills(billData);
    } catch (e) {
      console.error("Sync Error:", e);
    }

    setLoading(false);
    setSyncing(false);
  };

  // Processes offline actions one by one
  const processQueue = async () => {
    // Read directly from LS to ensure we have the absolute latest source of truth
    const currentQueue = JSON.parse(
      localStorage.getItem("offlineQueue") || "[]",
    );
    if (currentQueue.length === 0) return;

    setSyncing(true);
    console.log(`Processing ${currentQueue.length} offline actions...`);

    const newQueue = [...currentQueue];

    for (let i = 0; i < newQueue.length; i++) {
      const item = newQueue[i];
      if (!item) continue;

      try {
        await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify(item.payload),
        });
        // Mark as success (null)
        newQueue[i] = null;
      } catch (e) {
        console.error("Queue item failed, pausing sync.", e);
        break; // Stop on first error to preserve order
      }
    }

    // Clean up successful items
    const remainingQueue = newQueue.filter((item) => item !== null);
    setQueue(remainingQueue);

    // If queue finished, refresh data to ensure strict sync
    if (remainingQueue.length === 0) {
      refreshData(true);
    }
    setSyncing(false);
  };

  // Helper to add actions to queue
  const addToQueue = (actionName, payload) => {
    const queueItem = {
      id: Date.now() + Math.random(),
      action: actionName,
      payload: { ...payload, action: actionName }, // Ensure action is inside body
    };

    setQueue((prev) => {
      const updated = [...prev, queueItem];
      // Try to process immediately if online
      if (navigator.onLine) setTimeout(processQueue, 100);
      return updated;
    });
  };

  // --- 5. PUBLIC ACTIONS (Optimistic Updates) ---

  const addProduct = async (product) => {
    // UI Update: Add to list immediately
    const newProduct = { ...product, stock: Number(product.stock) };
    setInventory((prev) => [...prev, newProduct]);
    // Server: Queue it
    addToQueue("addProduct", { product });
  };

  const updateProduct = async (product) => {
    // UI Update: Find and replace
    setInventory((prev) =>
      prev.map((p) => (p.realRowIndex === product.realRowIndex ? product : p)),
    );
    // Server: Queue it
    addToQueue("updateProduct", { product });
  };

  const deleteProduct = async (realRowIndex) => {
    // UI Update: Filter out
    setInventory((prev) => prev.filter((p) => p.realRowIndex !== realRowIndex));
    // Server: Queue it
    addToQueue("deleteProduct", { realRowIndex });
  };

  const deleteBill = async (billId) => {
    if (!window.confirm(`Delete Bill ${billId}? Stock will be restored.`))
      return;

    // UI Update
    setBills((prev) => prev.filter((b) => b.billNo !== billId));
    // Server: Queue it
    addToQueue("deleteBill", { billId });
  };

  const saveBill = async (billData) => {
    // 1. Optimistic Update for History Tab
    // We need to match the shape that BillHistoryPage expects
    const newBill = {
      billNo: billData.billId,
      date: billData.date,
      customerName: billData.customerName,
      mobile: billData.mobile,
      amount: billData.total,
      items: JSON.stringify(billData.items), // Store items as JSON string for history
    };

    setBills((prev) => [newBill, ...prev]); // Add to TOP of list

    // 2. Queue for Server
    addToQueue("confirmBill", billData);

    return true; // Return success immediately
  };

  return (
    <DataContext.Provider
      value={{
        inventory,
        bills,
        queue,
        loading,
        syncing,
        isOnline,
        refreshData,
        addProduct,
        updateProduct,
        deleteProduct,
        deleteBill,
        saveBill,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
