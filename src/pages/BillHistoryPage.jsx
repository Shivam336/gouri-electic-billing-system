import React, { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  Printer,
  RefreshCw,
  Edit,
  FileText,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "./InvoicePDF";
import { useNavigate } from "react-router-dom";

// 🔴 PASTE YOUR GOOGLE SCRIPT URL HERE
const API_URL =
  "https://script.google.com/macros/s/AKfycbxL9l-XvqKYr5Kx3gjnDjLhg_Id2y-3S0ckvSmLiYaTy86edneLnu-v9n8AGNz_yyCv/exec";

const BillHistoryPage = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=getBills`);
      const data = await res.json();
      setBills(data);
    } catch (e) {
      console.error("Error fetching bills", e);
    }
    setLoading(false);
  };

  const handleEdit = (bill) => {
    // Navigate to Home Page and pass the bill data
    navigate("/", { state: { mode: "edit", billData: bill } });
  };

  const handleDelete = async (billId) => {
    if (!window.confirm(`Are you sure you want to delete Bill ${billId}?`))
      return;

    setDeletingId(billId);
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "deleteBill", billId: billId }),
      });
      setBills(bills.filter((b) => b.billNo !== billId));
    } catch (e) {
      alert("Failed to delete");
    }
    setDeletingId(null);
  };

  const handleReprint = async (bill) => {
    try {
      const items = JSON.parse(bill.items);
      const blob = await pdf(
        <InvoicePDF
          billId={bill.billNo}
          customerName={bill.customerName}
          customerMobile={bill.mobile}
          items={items}
          total={bill.amount}
          type="Duplicate"
        />,
      ).toBlob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (e) {
      alert("Error generating PDF");
    }
  };

  const filteredBills = bills.filter(
    (b) =>
      (b.customerName &&
        b.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.billNo && b.billNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.mobile && b.mobile.toString().includes(searchTerm)),
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 font-sans">
      {/* HEADER */}
      <div className="bg-white p-4 shadow-sm z-10 sticky top-0 border-b">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold text-blue-900">Bill History</h1>
          <button
            onClick={fetchBills}
            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            className="w-full bg-gray-100 p-2.5 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            placeholder="Search Name, Mobile or Bill No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        {loading && bills.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            Loading history...
          </div>
        )}

        {/* 💻 DESKTOP TABLE */}
        <div className="hidden md:block bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600 font-bold border-b uppercase text-xs">
              <tr>
                <th className="p-4">Bill No</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Mobile</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBills.map((bill) => (
                <tr key={bill.billNo} className="hover:bg-blue-50 transition">
                  <td className="p-4 font-bold text-blue-700">{bill.billNo}</td>
                  <td className="p-4 text-gray-500">
                    {new Date(bill.date).toLocaleDateString("en-IN")}
                  </td>
                  <td className="p-4 font-bold text-gray-800">
                    {bill.customerName}
                  </td>
                  <td className="p-4 text-gray-500">{bill.mobile}</td>
                  <td className="p-4 text-right font-bold text-gray-800">
                    ₹{bill.amount}
                  </td>
                  <td className="p-4 flex justify-center gap-3">
                    <button
                      onClick={() => handleEdit(bill)}
                      className="text-blue-600 hover:bg-blue-100 p-2 rounded flex items-center gap-1 text-xs font-bold"
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handleReprint(bill)}
                      className="text-gray-600 hover:bg-gray-100 p-2 rounded flex items-center gap-1 text-xs font-bold"
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(bill.billNo)}
                      disabled={deletingId === bill.billNo}
                      className="text-red-600 hover:bg-red-100 p-2 rounded flex items-center gap-1 text-xs font-bold disabled:opacity-50"
                    >
                      {deletingId === bill.billNo ? (
                        "..."
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📱 MOBILE CARDS */}
        <div className="md:hidden space-y-3 pb-24">
          {filteredBills.map((bill) => (
            <div
              key={bill.billNo}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {bill.billNo}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(bill.date).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-base">
                    {bill.customerName}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="block text-xl font-bold text-blue-900">
                    ₹{bill.amount}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-1 pt-3 border-t border-dashed">
                <button
                  onClick={() => handleEdit(bill)}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs active:scale-95 transition"
                >
                  <Edit size={16} /> Edit
                </button>
                <button
                  onClick={() => handleReprint(bill)}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-gray-50 text-gray-600 font-bold text-xs active:scale-95 transition"
                >
                  <Printer size={16} /> Print
                </button>
                <button
                  onClick={() => handleDelete(bill.billNo)}
                  disabled={deletingId === bill.billNo}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-red-50 text-red-600 font-bold text-xs active:scale-95 transition"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
          {filteredBills.length === 0 && !loading && (
            <div className="text-center text-gray-400 mt-10 p-4">
              <FileText size={40} className="mx-auto mb-2 opacity-20" />
              <p>No bills found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillHistoryPage;
