import React, { useState } from "react";
import { PlusSquare, Package, History } from "lucide-react";
import TallyBillingPage from "./pages/TallyBillingPage";
import BillHistoryPage from "./pages/BillHistoryPage";
import { DataProvider } from "./context/DataContextMain";

// Placeholder component for inventory
const InventoryPage = () => (
  <div className="h-full flex items-center justify-center text-gray-500 font-medium">
    <div className="flex flex-col items-center gap-2">
      <Package size={48} className="text-gray-300" />
      <p>Product List Coming Soon...</p>
    </div>
  </div>
);

const App = () => {
  const [activeTab, setActiveTab] = useState("billing");

  // NEW: State to hold the bill we want to edit
  const [editBillData, setEditBillData] = useState(null);

  return (
    <DataProvider>
      <div className="flex flex-col font-sans h-screen w-full bg-gray-50 print:h-auto print:bg-white print:block">
        <header className="flex items-center bg-[#1e3a8a] text-white h-14 justify-between shadow-md z-20 print:hidden">
          <div className="flex items-center gap-3 px-6">
            <div className="bg-white text-[#1e3a8a] font-black px-2 py-1 rounded-md text-sm tracking-widest shadow-sm">
              GE
            </div>
            <h1 className="font-bold tracking-wider text-lg">
              Gouri Electricals
            </h1>
          </div>

          <nav className="flex h-full">
            <button
              onClick={() => setActiveTab("billing")}
              className={`flex items-center gap-2 px-6 h-full transition-all border-b-4 text-[13px] tracking-wide ${
                activeTab === "billing"
                  ? "border-yellow-400 bg-[#1e40af] font-bold text-white"
                  : "border-transparent hover:bg-[#1e40af] text-blue-100 font-medium"
              }`}
            >
              <PlusSquare size={16} /> Create Bill
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2 px-6 h-full transition-all border-b-4 text-[13px] tracking-wide ${
                activeTab === "inventory"
                  ? "border-yellow-400 bg-[#1e40af] font-bold text-white"
                  : "border-transparent hover:bg-[#1e40af] text-blue-100 font-medium"
              }`}
            >
              <Package size={16} /> Product List
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-6 h-full transition-all border-b-4 text-[13px] tracking-wide ${
                activeTab === "history"
                  ? "border-yellow-400 bg-[#1e40af] font-bold text-white"
                  : "border-transparent hover:bg-[#1e40af] text-blue-100 font-medium"
              }`}
            >
              <History size={16} /> Bill History
            </button>
          </nav>
        </header>

        <main className="flex-1 overflow-y-auto relative w-full bg-gray-50 print:overflow-visible print:bg-white print:block">
          {/* Passing the edit props down! */}
          {activeTab === "billing" && (
            <TallyBillingPage
              editBillData={editBillData}
              setEditBillData={setEditBillData}
            />
          )}
          {activeTab === "inventory" && <InventoryPage />}
          {activeTab === "history" && (
            <BillHistoryPage
              setActiveTab={setActiveTab}
              setEditBillData={setEditBillData}
            />
          )}
        </main>
      </div>
    </DataProvider>
  );
};

export default App;
