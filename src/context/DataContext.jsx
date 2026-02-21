import React, { createContext, useState, useEffect } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxxmr_BaGhUlBoj9nnnoMc3bh0wREIeicMVfCtumnAsBpSS5dGVMEKjA-4mIij4F-eE/exec"; // Ensure your URL is correct

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [inventory, setInventory] = useState([]);
  const [bills, setBills] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const localInv = localStorage.getItem("inventory");
    const localBills = localStorage.getItem("bills");
    const localQueue = localStorage.getItem("offlineQueue");

    let hasData = false;
    if (localInv) {
      setInventory(JSON.parse(localInv));
      hasData = true;
    }
    if (localBills) {
      setBills(JSON.parse(localBills));
      hasData = true;
    }
    if (localQueue) {
      setQueue(JSON.parse(localQueue));
    }

    if (hasData) setLoading(false);
    if (navigator.onLine) {
      refreshData(hasData);
      if (localQueue) processQueue();
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
      refreshData(true);
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queue]);

  useEffect(() => {
    localStorage.setItem("inventory", JSON.stringify(inventory));
  }, [inventory]);
  useEffect(() => {
    localStorage.setItem("bills", JSON.stringify(bills));
  }, [bills]);
  useEffect(() => {
    localStorage.setItem("offlineQueue", JSON.stringify(queue));
  }, [queue]);

  const refreshData = async (hasDataAlready = true) => {
    if (!navigator.onLine) return;
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

  const processQueue = async () => {
    const currentQueue = JSON.parse(
      localStorage.getItem("offlineQueue") || "[]",
    );
    if (currentQueue.length === 0) return;
    setSyncing(true);
    const newQueue = [...currentQueue];
    for (let i = 0; i < newQueue.length; i++) {
      const item = newQueue[i];
      if (!item) continue;
      try {
        await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify(item.payload),
        });
        newQueue[i] = null;
      } catch (e) {
        break;
      }
    }
    const remainingQueue = newQueue.filter((item) => item !== null);
    setQueue(remainingQueue);
    if (remainingQueue.length === 0) refreshData(true);
    setSyncing(false);
  };

  const addToQueue = (actionName, payload) => {
    const queueItem = {
      id: Date.now(),
      action: actionName,
      payload: { ...payload, action: actionName },
    };
    setQueue((prev) => {
      const updated = [...prev, queueItem];
      if (navigator.onLine) setTimeout(processQueue, 100);
      return updated;
    });
  };

  const addProduct = async (product) => {
    setInventory((prev) => [
      ...prev,
      { ...product, stock: Number(product.stock) },
    ]);
    addToQueue("addProduct", { product });
  };
  const updateProduct = async (product) => {
    setInventory((prev) =>
      prev.map((p) => (p.realRowIndex === product.realRowIndex ? product : p)),
    );
    addToQueue("updateProduct", { product });
  };
  const deleteProduct = async (realRowIndex) => {
    setInventory((prev) => prev.filter((p) => p.realRowIndex !== realRowIndex));
    addToQueue("deleteProduct", { realRowIndex });
  };
  const deleteBill = async (billId) => {
    if (!window.confirm(`Delete Bill ${billId}?`)) return;
    setBills((prev) => prev.filter((b) => b.id !== billId)); // Use ID for new structure
    addToQueue("deleteBill", { billId });
  };

  // ⚡️ UPDATED PAYLOAD FOR NEW KHATA STRUCTURE
  const saveBill = async (billData) => {
    const newBill = {
      id: billData.id,
      type: billData.type,
      date: billData.date,
      customerName: billData.customer.name, // Extracted for easy table viewing
      mobile: billData.customer.mobile,
      totalDue: billData.financials.totalDue,
      paid: billData.financials.paidNow,
      closingBalance: billData.financials.closingBalance,
      // Full raw data stored for history edit/view
      raw: JSON.stringify(billData),
    };

    setBills((prev) => [newBill, ...prev]);
    addToQueue("confirmBill", billData); // Send full object to Apps Script
    return true;
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
