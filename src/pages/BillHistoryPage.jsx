import React, { useState, useContext } from "react";
import {
  Search,
  Trash2,
  Printer,
  RefreshCw,
  Edit,
  FileText,
} from "lucide-react";
import InvoicePDF from "./InvoicePDF";
import { DataContext } from "../context/DataContext";

const BillHistoryPage = ({ onEditRequest }) => {
  const { bills, deleteBill, loading } = useContext(DataContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (billId) => {
    setDeletingId(billId);
    await deleteBill(billId);
    setDeletingId(null);
  };

  const handleEdit = (bill) => {
    if (onEditRequest) {
      // Parse raw data if it exists (handles new structure)
      const fullBill = bill.raw ? JSON.parse(bill.raw) : bill;
      onEditRequest(fullBill);
    }
  };

  const filteredBills = bills.filter(
    (b) =>
      (b.customerName &&
        b.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.id && b.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.mobile && b.mobile.toString().includes(searchTerm)),
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 font-sans">
      <div className="bg-white p-4 shadow-sm z-10 sticky top-0 border-b">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold text-[#1e3a8a] flex items-center gap-2">
            Bill History
            {loading && (
              <RefreshCw
                size={16}
                className="animate-spin text-gray-400 ml-2"
              />
            )}
          </h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            className="w-full bg-gray-100 p-2.5 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            placeholder="Search Name, Mobile or Doc ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {!loading && bills.length === 0 && (
          <div className="text-center text-gray-400 mt-10 p-4">
            <FileText size={40} className="mx-auto mb-2 opacity-20" />
            <p>No transactions found</p>
          </div>
        )}

        <div className="hidden md:block bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1e40af] text-white font-bold text-xs uppercase">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Doc ID</th>
                <th className="p-3">Type</th>
                <th className="p-3">Customer</th>
                <th className="p-3 text-right">Total Due</th>
                <th className="p-3 text-right text-green-300">Paid</th>
                <th className="p-3 text-right text-red-300">Balance</th>
                <th className="p-3 text-center">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBills.map((bill) => (
                <tr
                  key={bill.id || Math.random()}
                  className="hover:bg-blue-50 transition"
                >
                  <td className="p-3 text-gray-600">
                    {new Date(bill.date).toLocaleDateString("en-IN")}
                  </td>
                  <td className="p-3 font-bold text-gray-800">{bill.id}</td>
                  <td className="p-3 font-bold text-blue-700 text-xs">
                    {bill.type || "SALE"}
                  </td>
                  <td className="p-3 font-bold text-gray-800">
                    {bill.customerName}
                  </td>
                  <td className="p-3 text-right font-bold text-gray-800">
                    ₹{bill.totalDue || 0}
                  </td>
                  <td className="p-3 text-right font-bold text-green-600">
                    ₹{bill.paid || 0}
                  </td>
                  <td className="p-3 text-right font-bold text-red-600">
                    ₹{bill.closingBalance || 0}
                  </td>
                  <td className="p-3 flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(bill)}
                      className="text-blue-600 hover:bg-blue-100 p-1.5 rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(bill.id)}
                      disabled={deletingId === bill.id}
                      className="text-red-600 hover:bg-red-100 p-1.5 rounded disabled:opacity-50"
                    >
                      {deletingId === bill.id ? "..." : <Trash2 size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default BillHistoryPage;
