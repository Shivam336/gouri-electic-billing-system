import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
} from "react-router-dom";
import { FileText, Package, History, PlusSquare } from "lucide-react";

// Import Pages
import TallyBillingPage from "./pages/TallyBillingPage";
import InventoryPage from "./pages/InventoryPage";
import BillHistoryPage from "./pages/BillHistoryPage"; // We will create this below

const App = () => {
  return (
    <Router>
      <div className="flex flex-col h-[100dvh] bg-gray-100 overflow-hidden">
        {/* ================================================= */}
        {/* 💻 DESKTOP NAVIGATION (Top Bar)                   */}
        {/* ================================================= */}
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
            <DesktopTab
              to="/"
              icon={<PlusSquare size={18} />}
              text="Create Bill"
            />
            <DesktopTab
              to="/inventory"
              icon={<Package size={18} />}
              text="Product List"
            />
            <DesktopTab
              to="/history"
              icon={<History size={18} />}
              text="Bill History"
            />
          </nav>
        </header>

        {/* ================================================= */}
        {/* 📄 MAIN CONTENT AREA                              */}
        {/* ================================================= */}
        <main className="flex-1 overflow-hidden relative w-full">
          <Routes>
            <Route path="/" element={<TallyBillingPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/history" element={<BillHistoryPage />} />
          </Routes>
        </main>

        {/* ================================================= */}
        {/* 📱 MOBILE NAVIGATION (Bottom Bar)                 */}
        {/* ================================================= */}
        <nav className="md:hidden flex justify-around items-center bg-white border-t border-gray-200 py-2 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] shrink-0 z-50 safe-area-pb">
          <MobileTab to="/" icon={<PlusSquare size={24} />} text="New Bill" />
          <MobileTab
            to="/inventory"
            icon={<Package size={24} />}
            text="Products"
          />
          <MobileTab
            to="/history"
            icon={<History size={24} />}
            text="History"
          />
        </nav>
      </div>
    </Router>
  );
};

// --- HELPER COMPONENTS ---

const DesktopTab = ({ to, icon, text }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-2 px-6 h-full transition-all border-b-4 ${
        isActive
          ? "border-yellow-400 bg-blue-800 text-white font-bold"
          : "border-transparent text-blue-200 hover:bg-blue-800 hover:text-white"
      }`
    }
  >
    {icon} <span>{text}</span>
  </NavLink>
);

const MobileTab = ({ to, icon, text }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col items-center gap-1 p-2 w-full transition-colors ${
        isActive ? "text-blue-600 font-bold" : "text-gray-400"
      }`
    }
  >
    {icon}
    <span className="text-[10px]">{text}</span>
  </NavLink>
);

export default App;
