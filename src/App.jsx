import React, { useState, useCallback, memo } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Package, History, PlusSquare } from "lucide-react";
import { DataProvider } from "./context/DataContext";

import TallyBillingPage from "./pages/TallyBillingPage";
import InventoryPage from "./pages/InventoryPage";
import BillHistoryPage from "./pages/BillHistoryPage";

// --- ⚡️ MEMOIZED COMPONENTS (Prevents Lag) ---
// This tells React: "Don't re-render these pages unless their PROPS change"
const MemoizedBilling = memo(TallyBillingPage);
const MemoizedInventory = memo(InventoryPage);
const MemoizedHistory = memo(BillHistoryPage);

const App = () => {
  const [activeTab, setActiveTab] = useState("billing");
  const [billToEdit, setBillToEdit] = useState(null);

  // ⚡️ STABLE CALLBACK (Prevents History Tab from re-rendering unnecessarily)
  const handleEditBill = useCallback((billData) => {
    setBillToEdit(billData);
    setActiveTab("billing");
  }, []);

  const clearEditData = useCallback(() => {
    setBillToEdit(null);
  }, []);

  return (
    <DataProvider>
      <Router>
        <div className="flex flex-col h-[100dvh] bg-gray-100 overflow-hidden">
          {/* DESKTOP HEADER */}
          <header className="hidden md:flex items-center justify-between bg-blue-900 text-white px-6 py-0 shadow-lg shrink-0 z-50 h-14">
            <div className="flex items-center gap-2">
              <div className="bg-white text-blue-900 font-bold p-1 rounded text-xs">
                GE
              </div>
              <h1 className="font-bold tracking-wide text-lg">
                Gouri Electricals
              </h1>
            </div>
            <nav className="flex h-full">
              <TabButton
                isActive={activeTab === "billing"}
                onClick={() => setActiveTab("billing")}
                icon={<PlusSquare size={18} />}
                text="Create Bill"
              />
              <TabButton
                isActive={activeTab === "inventory"}
                onClick={() => setActiveTab("inventory")}
                icon={<Package size={18} />}
                text="Product List"
              />
              <TabButton
                isActive={activeTab === "history"}
                onClick={() => setActiveTab("history")}
                icon={<History size={18} />}
                text="Bill History"
              />
            </nav>
          </header>

          {/* MAIN CONTENT (Keep-Alive with Memoization) */}
          <main className="flex-1 overflow-hidden relative w-full bg-gray-50">
            {/* BILLING TAB */}
            <div
              style={{
                display: activeTab === "billing" ? "block" : "none",
                height: "100%",
              }}
            >
              <MemoizedBilling
                editData={billToEdit}
                onEditComplete={clearEditData}
              />
            </div>

            {/* INVENTORY TAB */}
            <div
              style={{
                display: activeTab === "inventory" ? "block" : "none",
                height: "100%",
              }}
            >
              {/* Inventory has no props, so it will NEVER re-render on tab switch now */}
              <MemoizedInventory />
            </div>

            {/* HISTORY TAB */}
            <div
              style={{
                display: activeTab === "history" ? "block" : "none",
                height: "100%",
              }}
            >
              <MemoizedHistory onEditRequest={handleEditBill} />
            </div>
          </main>

          {/* MOBILE NAV */}
          <nav className="md:hidden flex justify-around items-center bg-white border-t border-gray-200 py-2 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] shrink-0 z-50 safe-area-pb">
            <MobileTabButton
              isActive={activeTab === "billing"}
              onClick={() => setActiveTab("billing")}
              icon={<PlusSquare size={24} />}
              text="New Bill"
            />
            <MobileTabButton
              isActive={activeTab === "inventory"}
              onClick={() => setActiveTab("inventory")}
              icon={<Package size={24} />}
              text="Products"
            />
            <MobileTabButton
              isActive={activeTab === "history"}
              onClick={() => setActiveTab("history")}
              icon={<History size={24} />}
              text="History"
            />
          </nav>
        </div>
      </Router>
    </DataProvider>
  );
};

// Helpers
const TabButton = ({ isActive, onClick, icon, text }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 h-full transition-all border-b-4 ${isActive ? "border-yellow-400 bg-blue-800 text-white font-bold" : "border-transparent text-blue-200 hover:bg-blue-800 hover:text-white"}`}
  >
    {icon} <span>{text}</span>
  </button>
);
const MobileTabButton = ({ isActive, onClick, icon, text }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${isActive ? "text-blue-600 font-bold" : "text-gray-400"}`}
  >
    {icon} <span className="text-[10px]">{text}</span>
  </button>
);

export default App;
