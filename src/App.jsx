import React, { useState } from "react";
import { PlusSquare, Package, History } from "lucide-react";
import TallyBillingPage from "./pages/TallyBillingPage";

// Refined placeholder components for empty states
const InventoryPage = () => (
  <div className="h-full flex items-center justify-center text-gray-500 font-medium">
    <div className="flex flex-col items-center gap-2">
      <Package size={48} className="text-gray-300" />
      <p>Product List Coming Soon...</p>
    </div>
  </div>
);

const BillHistoryPage = () => (
  <div className="h-full flex items-center justify-center text-gray-500 font-medium">
    <div className="flex flex-col items-center gap-2">
      <History size={48} className="text-gray-300" />
      <p>Bill History Coming Soon...</p>
    </div>
  </div>
);

const App = () => {
  // State to track which tab is currently active
  const [activeTab, setActiveTab] = useState("billing");

  return (
    // 'h-screen' strictly locks the app to the exact height of the browser window
    <div className="flex flex-col font-sans h-screen w-full bg-gray-50">
      {/* HEADER: Increased height to h-14 (56px) for a more premium software feel */}
      <header className="flex items-center bg-[#1e3a8a] text-white h-14 justify-between shadow-md z-20">
        {/* Brand/Logo Area */}
        <div className="flex items-center gap-3 px-6">
          <div className="bg-white text-[#1e3a8a] font-black px-2 py-1 rounded-md text-sm tracking-widest shadow-sm">
            GE
          </div>
          <h1 className="font-bold tracking-wider text-lg">
            Gouri Electricals
          </h1>
        </div>

        {/* Tab Navigation */}
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

      {/* MAIN CONTENT: 'flex-1' perfectly fills the remaining space under the header */}

      <main className="flex-1 overflow-y-auto relative w-full bg-gray-50">
        {activeTab === "billing" && <TallyBillingPage />}
        {activeTab === "inventory" && <InventoryPage />}
        {activeTab === "history" && <BillHistoryPage />}
      </main>
    </div>
  );
};

export default App;
