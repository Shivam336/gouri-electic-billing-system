import React, { useState, useEffect, useContext } from "react";
import { Search, Printer, X, Calendar, Eye, Edit } from "lucide-react";
import { DataContext } from "../context/DataContextMain";

const BillHistoryPage = ({ setActiveTab, setEditBillData }) => {
  const dataContext = useContext(DataContext);
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedBill, setSelectedBill] = useState(null); // For Reprint
  const [viewBill, setViewBill] = useState(null); // For Read-Only Dashboard View

  useEffect(() => {
    const fetchBills = async () => {
      setIsLoading(true);
      const data = await dataContext.getAllBillData();
      if (data && Array.isArray(data)) {
        const sortedData = [...data].sort(
          (a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0),
        );
        setBills(sortedData);
        setFilteredBills(sortedData);
      }
      setIsLoading(false);
    };
    fetchBills();
  }, [dataContext]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBills(bills);
      return;
    }
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = bills.filter(
      (b) =>
        String(b.id).toLowerCase().includes(lowerSearch) ||
        String(b.customer_name || "")
          .toLowerCase()
          .includes(lowerSearch) ||
        String(b.customer_mobile || "")
          .toLowerCase()
          .includes(lowerSearch),
    );
    setFilteredBills(filtered);
  }, [searchTerm, bills]);

  // FIX: Smarter parse function that handles already-parsed objects
  const safeParse = (data, fallback = []) => {
    if (!data) return fallback;
    if (typeof data === "object") return data;
    try {
      return JSON.parse(data);
    } catch (e) {
      return fallback;
    }
  };

  const handleEdit = (bill) => {
    setEditBillData(bill);
    setActiveTab("billing"); // Jump straight to the billing screen!
  };

  const handlePrintTrigger = () => {
    setTimeout(() => {
      window.print();
      // FIX: Removed setSelectedBill(null) from here!
      // Letting the user close it manually ensures the browser doesn't capture a blank wiped DOM.
    }, 100);
  };

  let tableHeaderCSS =
    "p-2 border-b border-r border-gray-300 font-semibold text-gray-700 bg-gray-100 sticky top-0 z-10";
  let tableCellCSS = "p-2 border-r border-b border-gray-200 text-gray-800";

  return (
    <>
      <style>{`
        @media print {
          @page { size: A5; margin: 0 !important; }
          html, body { background-color: white !important; margin: 0 !important; padding: 0 !important; }
          nav, header, footer, aside, .print-hidden-history { display: none !important; }
        }
      `}</style>

      {/* --- MAIN DASHBOARD --- */}
      <div className="flex flex-col h-full p-4 gap-4 w-full print:hidden print-hidden-history">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex gap-4 items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg text-[#1e3a8a]">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-800 leading-tight">
                Bill History
              </h2>
              <p className="text-[12px] text-gray-500 font-medium">
                View, edit, and reprint past transactions
              </p>
            </div>
          </div>
          <div className="relative w-80">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by Bill No, Name, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] text-[13px] font-medium"
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 font-medium text-[14px]">
              Loading bills...
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-[12px] whitespace-nowrap min-w-max">
                <thead>
                  <tr>
                    <th className={tableHeaderCSS}>Bill No</th>
                    <th className={tableHeaderCSS}>Date</th>
                    <th className={tableHeaderCSS}>Customer Details</th>
                    <th className={`${tableHeaderCSS} text-right`}>Net Bill</th>
                    <th className={`${tableHeaderCSS} text-right`}>Disc</th>
                    <th className={`${tableHeaderCSS} text-right`}>
                      Grand Total
                    </th>
                    <th className={`${tableHeaderCSS} text-right`}>Paid</th>
                    <th className={`${tableHeaderCSS} text-right`}>Balance</th>
                    <th className={`${tableHeaderCSS} text-center`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.length > 0 ? (
                    filteredBills.map((bill, i) => {
                      const bal = parseFloat(bill.closing_balance) || 0;
                      let formattedDate = bill.date
                        ? new Date(bill.date).toLocaleDateString("en-IN")
                        : "";
                      return (
                        <tr
                          key={i}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <td
                            className={`${tableCellCSS} font-bold text-[#1e3a8a]`}
                          >
                            {bill.id}
                          </td>
                          <td className={tableCellCSS}>{formattedDate}</td>
                          <td className={tableCellCSS}>
                            <div className="font-bold">
                              {bill.customer_name}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {bill.customer_mobile}
                            </div>
                          </td>
                          <td
                            className={`${tableCellCSS} text-right font-medium`}
                          >
                            {bill.net_bill}
                          </td>
                          <td
                            className={`${tableCellCSS} text-right text-gray-500`}
                          >
                            {bill.bill_discount || "0"}
                          </td>
                          <td
                            className={`${tableCellCSS} text-right font-bold text-gray-900`}
                          >
                            {bill.grand_total_due}
                          </td>
                          <td
                            className={`${tableCellCSS} text-right text-green-600 font-medium`}
                          >
                            {bill.total_payment}
                          </td>
                          <td
                            className={`${tableCellCSS} text-right font-bold ${bal > 0 ? "text-red-600" : bal < 0 ? "text-green-600" : "text-gray-500"}`}
                          >
                            {bal.toFixed(2)}
                          </td>
                          <td className={`${tableCellCSS} text-center`}>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setViewBill(bill)}
                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-200 rounded transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleEdit(bill)}
                                className="p-1.5 bg-orange-50 text-orange-600 hover:bg-orange-200 rounded transition-colors"
                                title="Edit Bill"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => setSelectedBill(bill)}
                                className="p-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                title="Reprint A5"
                              >
                                <Printer size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="9"
                        className="p-8 text-center text-gray-500 font-medium"
                      >
                        No bills found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- 1. VIEW DETAILS MODAL (Read-Only Dashboard) --- */}
      {viewBill &&
        (() => {
          const items = safeParse(viewBill.items_json || viewBill.items, []);
          const payments = safeParse(
            viewBill.payments_json || viewBill.payments,
            [],
          );
          const linked = safeParse(viewBill.previous_bills, []);
          const formattedDate = viewBill.date
            ? new Date(viewBill.date).toLocaleDateString("en-IN")
            : "";

          return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
              <div className="bg-white rounded-lg shadow-2xl w-[95vw] max-w-[1400px] h-[95vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg shrink-0">
                  <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                    <Eye className="text-[#1e3a8a]" size={24} /> Bill Details: #
                    {viewBill.id}
                  </h2>
                  <button
                    onClick={() => setViewBill(null)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={28} />
                  </button>
                </div>

                {/* FIX 1: Changed to 'overflow-y-auto' so the ENTIRE dashboard scrolls gracefully */}
                <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto text-[14px] bg-gray-50/30">
                  {/* Top Info Cards */}
                  <div className="grid grid-cols-3 gap-6 shrink-0">
                    <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm flex flex-col gap-1.5">
                      <span className="text-[12px] text-blue-600 font-bold uppercase tracking-wider block mb-1">
                        Customer Info
                      </span>
                      <div className="font-bold text-[#1e3a8a] text-[16px]">
                        {viewBill.customer_name}
                      </div>
                      <div className="text-gray-700">
                        <span className="font-semibold text-gray-800">
                          Phone:
                        </span>{" "}
                        {viewBill.customer_mobile || "N/A"}
                      </div>
                      <div className="text-gray-700 whitespace-normal">
                        <span className="font-semibold text-gray-800">
                          Address:
                        </span>{" "}
                        {viewBill.customer_address || "N/A"}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm flex flex-col gap-1.5">
                      <span className="text-[12px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                        Bill & Reference Info
                      </span>
                      <div className="text-gray-700">
                        <span className="font-semibold text-gray-800">
                          Date:
                        </span>{" "}
                        {formattedDate}
                      </div>
                      <div className="text-gray-700">
                        <span className="font-semibold text-gray-800">
                          Ref Name:
                        </span>{" "}
                        {viewBill.ref_name || "N/A"}
                      </div>
                      <div className="text-gray-700">
                        <span className="font-semibold text-gray-800">
                          Ref Phone:
                        </span>{" "}
                        {viewBill.ref_mobile || "N/A"}
                      </div>
                      <div className="text-gray-700 whitespace-normal mt-1">
                        <span className="font-semibold text-gray-800 block">
                          Remarks:
                        </span>{" "}
                        {viewBill.remarks || "None"}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm flex flex-col gap-1 text-[13px]">
                      <span className="text-[12px] text-green-700 font-bold uppercase tracking-wider block mb-1">
                        Financial Summary
                      </span>
                      <div className="flex justify-between text-gray-700">
                        <span>Sales Total:</span>{" "}
                        <span>₹{viewBill.sale_total || "0.00"}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Returns Total:</span>{" "}
                        <span>₹{viewBill.return_total || "0.00"}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-800">
                        <span>Net Bill:</span>{" "}
                        <span>₹{viewBill.net_bill || "0.00"}</span>
                      </div>
                      <div className="flex justify-between text-[#1e3a8a]">
                        <span>Global Discount:</span>{" "}
                        <span>- ₹{viewBill.bill_discount || "0.00"}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Previous Dues:</span>{" "}
                        <span>+ ₹{viewBill.total_previous_bill || "0.00"}</span>
                      </div>

                      <div className="border-t border-gray-200 my-1.5"></div>

                      <div className="flex justify-between font-bold text-gray-900 text-[15px]">
                        <span>Grand Total:</span>{" "}
                        <span>₹{viewBill.grand_total_due || "0.00"}</span>
                      </div>
                      <div className="flex justify-between font-bold text-green-700 text-[14px]">
                        <span>Total Paid:</span>{" "}
                        <span>- ₹{viewBill.total_payment || "0.00"}</span>
                      </div>
                      <div className="flex justify-between font-bold text-red-600 mt-1 text-[14px]">
                        <span>Closing Balance:</span>
                        <span>
                          ₹{viewBill.closing_balance || "0.00"}{" "}
                          {parseFloat(viewBill.closing_balance) < 0 &&
                            "(OVERPAID)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* FIX 2: Removed 'flex-1'. It now takes its natural height, avoiding the "crush" effect */}
                  <div className="border border-gray-300 rounded-lg overflow-x-auto shadow-sm bg-white shrink-0">
                    <table className="w-full text-left whitespace-nowrap min-w-max">
                      <thead className="bg-gray-100 text-[13px] text-gray-700 uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-gray-300">
                        <tr>
                          <th className="p-3 px-4 border-r border-gray-200">
                            Type
                          </th>
                          <th className="p-3 px-4 border-r border-gray-200">
                            Item Description
                          </th>
                          <th className="p-3 px-4 border-r border-gray-200 text-center">
                            HSN
                          </th>
                          <th className="p-3 px-4 border-r border-gray-200 text-center">
                            Qty
                          </th>
                          <th className="p-3 px-4 border-r border-gray-200 text-right">
                            MRP
                          </th>
                          <th className="p-3 px-4 border-r border-gray-200 text-right">
                            Disc %
                          </th>
                          <th className="p-3 px-4 border-r border-gray-200 text-right">
                            Tax %
                          </th>
                          <th className="p-3 px-4 border-r border-gray-200 text-right">
                            Rate
                          </th>
                          <th className="p-3 px-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="text-[14px]">
                        {items.map((it, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-100 last:border-0 hover:bg-blue-50 transition-colors"
                          >
                            <td
                              className={`p-3 px-4 font-bold border-r border-gray-200 ${it.type === "return" ? "text-red-500" : "text-green-600"}`}
                            >
                              {it.type === "return" ? "RTN" : "SALE"}
                            </td>
                            <td className="p-3 px-4 font-bold text-gray-800 border-r border-gray-200">
                              {it.desc}{" "}
                              {it.ref_bill ? (
                                <span className="text-gray-500 text-[12px] ml-2 font-medium">
                                  (Ref: {it.ref_bill})
                                </span>
                              ) : (
                                ""
                              )}
                            </td>
                            <td className="p-3 px-4 text-center text-gray-500 border-r border-gray-200">
                              {it.hsn || "-"}
                            </td>
                            <td className="p-3 px-4 text-center font-bold text-[#1e3a8a] text-[15px] border-r border-gray-200">
                              {it.qty}{" "}
                              <span className="text-[13px]">{it.unit}</span>
                            </td>
                            <td className="p-3 px-4 text-right text-gray-500 border-r border-gray-200">
                              {it.mrp || "-"}
                            </td>
                            <td className="p-3 px-4 text-right text-blue-600 font-bold border-r border-gray-200">
                              {it.disc_percent || "-"}
                            </td>
                            <td className="p-3 px-4 text-right text-gray-500 border-r border-gray-200">
                              {it.tax_percent || "-"}
                            </td>
                            <td className="p-3 px-4 text-right font-bold text-gray-700 text-[15px] border-r border-gray-200">
                              {it.rate}
                            </td>
                            <td
                              className={`p-3 px-4 text-right font-bold text-[15px] ${it.type === "return" ? "text-red-600" : "text-gray-900"}`}
                            >
                              {it.type === "return"
                                ? `-${Math.abs(it.amount)}`
                                : Math.abs(it.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Split: Payments & Linked Bills */}
                  <div className="grid grid-cols-2 gap-6 shrink-0 mt-2">
                    <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm h-max bg-white">
                      <div className="bg-gray-100 p-3 px-4 font-bold text-[13px] text-gray-700 border-b border-gray-300">
                        Payments Received
                      </div>
                      <table className="w-full text-left">
                        <tbody className="text-[14px]">
                          {payments.length > 0 ? (
                            payments.map((p, idx) => (
                              <tr
                                key={idx}
                                className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                              >
                                <td className="p-3 px-4 font-bold text-gray-800">
                                  {p.mode}
                                </td>
                                <td className="p-3 px-4 text-gray-500">
                                  {p.date
                                    ? p.date.split("-").reverse().join("-")
                                    : ""}
                                </td>
                                <td className="p-3 px-4 text-right font-bold text-green-700 text-[15px]">
                                  ₹{p.amount}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="3"
                                className="p-6 text-center text-gray-400 font-medium"
                              >
                                No payments recorded
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm h-max bg-white">
                      <div className="bg-gray-100 p-3 px-4 font-bold text-[13px] text-gray-700 border-b border-gray-300">
                        Linked Previous Dues
                      </div>
                      <table className="w-full text-left">
                        <tbody className="text-[14px]">
                          {linked.length > 0 ? (
                            linked.map((l, idx) => (
                              <tr
                                key={idx}
                                className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                              >
                                <td className="p-3 px-4 font-bold text-gray-800">
                                  Bill #{l.id || l.no}
                                </td>
                                <td className="p-3 px-4 text-right font-bold text-red-600 text-[15px]">
                                  ₹{l.amount}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="2"
                                className="p-6 text-center text-gray-400 font-medium"
                              >
                                No linked bills
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* --- 2. REPRINT MODAL & HIDDEN PRINT LAYOUT --- */}
      {selectedBill &&
        (() => {
          const items = safeParse(
            selectedBill.items_json || selectedBill.items,
            [],
          );
          const paymentsList = safeParse(
            selectedBill.payments_json || selectedBill.payments,
            [],
          );
          const linkedBills = safeParse(selectedBill.previous_bills, []);
          const salesTotal = items
            .filter((i) => i.type === "sale")
            .reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
          const returnsTotal = items
            .filter((i) => i.type === "return")
            .reduce((s, i) => s - Math.abs(parseFloat(i.amount) || 0), 0);

          return (
            <>
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden print-hidden-history">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg shrink-0">
                    <h2 className="font-bold text-lg text-gray-800">
                      Reprint Bill #{selectedBill.id}
                    </h2>
                    <button
                      onClick={() => setSelectedBill(null)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="p-6 flex-1 overflow-auto bg-gray-200 flex justify-center">
                    <div className="bg-white p-6 shadow-sm w-full max-w-lg border border-gray-300 h-max min-h-full font-mono text-[12px] leading-snug text-black uppercase">
                      <div className="text-center font-bold text-lg mb-4 text-[#1e3a8a]">
                        RETAIL INVOICE PREVIEW
                      </div>
                      <p className="text-center text-gray-500 mb-4">
                        Click "Print" below to send this exactly to the A5
                        layout.
                      </p>
                    </div>
                  </div>
                  <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-lg shrink-0">
                    <button
                      onClick={() => setSelectedBill(null)}
                      className="px-5 py-2 border border-gray-300 rounded font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePrintTrigger}
                      className="px-5 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition-colors"
                    >
                      Print
                    </button>
                  </div>
                </div>
              </div>

              {/* PURE PRINT LAYOUT */}
              <div className="hidden print:block absolute top-0 left-0 w-[148mm] bg-white text-black px-[10mm] z-[999999] font-mono text-[12px] leading-tight uppercase">
                <table
                  className="w-full border-collapse"
                  style={{ tableLayout: "fixed" }}
                >
                  <colgroup>
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "50%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "17%" }} />
                  </colgroup>
                  <thead className="table-header-group">
                    <tr>
                      <td colSpan="5" className="h-[10mm] border-0 p-0"></td>
                    </tr>
                    <tr>
                      <td colSpan="5" className="pb-2 border-0 p-0">
                        <div className="border-t border-b border-dashed border-black py-1 mb-2 flex justify-between items-center font-bold">
                          <span className="text-left">
                            BILL NO: {selectedBill.id}
                          </span>
                          <span className="text-center tracking-wide text-[14px]">
                            {returnsTotal < 0 && salesTotal === 0
                              ? "CREDIT NOTE"
                              : "RETAIL INVOICE"}
                          </span>
                          <span className="text-right">
                            DATE:{" "}
                            {selectedBill.date
                              ? new Date(selectedBill.date)
                                  .toLocaleDateString("en-IN")
                                  .replace(/\//g, "-")
                              : ""}
                          </span>
                        </div>
                        <div className="flex w-full justify-between mb-2 text-[12px] leading-tight break-words whitespace-normal gap-2">
                          <div className="w-[60%] flex flex-col items-start pr-1">
                            <span className="font-bold">
                              CUSTOMER: {selectedBill.customer_name}
                            </span>
                            {selectedBill.customer_mobile && (
                              <span>Ph: {selectedBill.customer_mobile}</span>
                            )}
                            {selectedBill.customer_address && (
                              <span>Addr: {selectedBill.customer_address}</span>
                            )}
                          </div>
                          <div className="w-[40%] flex flex-col items-end pl-1 text-right">
                            <span className="font-bold">
                              REF: {selectedBill.ref_name || "N/A"}
                            </span>
                            {selectedBill.ref_mobile && (
                              <span>Ph: {selectedBill.ref_mobile}</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th className="border-t border-b border-dashed border-black py-1 text-left">
                        #
                      </th>
                      <th className="border-t border-b border-dashed border-black py-1 text-left">
                        ITEM DESCRIPTION
                      </th>
                      <th className="border-t border-b border-dashed border-black py-1 text-center">
                        QTY / UNIT
                      </th>
                      <th className="border-t border-b border-dashed border-black py-1 text-right">
                        RATE
                      </th>
                      <th className="border-t border-b border-dashed border-black py-1 text-right">
                        AMOUNT
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter((i) => i.type === "sale").length > 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="py-1 font-bold underline text-left"
                        ></td>
                      </tr>
                    )}
                    {items
                      .filter((i) => i.type === "sale")
                      .map((item, index) => (
                        <tr
                          key={`sale-${index}`}
                          className="break-inside-avoid"
                        >
                          <td className="py-1 align-top text-left">
                            {index + 1}
                          </td>
                          <td className="py-1 pr-2 align-top text-left break-words">
                            {item.desc}
                          </td>
                          <td className="py-1 text-center align-top">
                            {item.qty || "1"} {item.unit}
                          </td>
                          <td className="py-1 text-right align-top">
                            {(
                              Math.abs(item.amount) / Math.abs(item.qty || 1)
                            ).toFixed(2)}
                          </td>
                          <td className="py-1 text-right align-top">
                            {Math.abs(item.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}

                    {items.filter((i) => i.type === "return").length > 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="py-1 pt-3 font-bold underline text-left"
                        >
                          RETURN
                        </td>
                      </tr>
                    )}
                    {items
                      .filter((i) => i.type === "return")
                      .map((item, index) => (
                        <tr key={`rtn-${index}`} className="break-inside-avoid">
                          <td className="py-1 align-top text-left">
                            {index + 1}
                          </td>
                          <td className="py-1 pr-2 align-top text-left break-words">
                            {item.desc}{" "}
                            {item.ref_bill ? `(Ref: ${item.ref_bill})` : ""}
                          </td>
                          <td className="py-1 text-center align-top">
                            {item.qty || "1"} {item.unit}
                          </td>
                          <td className="py-1 text-right align-top">
                            {(
                              Math.abs(item.amount) / Math.abs(item.qty || 1)
                            ).toFixed(2)}
                          </td>
                          <td className="py-1 text-right align-top">
                            -{Math.abs(item.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}

                    <tr className="break-inside-avoid">
                      <td colSpan="5" className="pt-2 border-0 p-0">
                        <div className="border-t border-dashed border-black pt-2 flex flex-col items-end">
                          <div className="flex justify-between w-[65%]">
                            <span>SALES TOTAL:</span>
                            <span>{salesTotal.toFixed(2)}</span>
                          </div>
                          {returnsTotal < 0 && (
                            <div className="flex justify-between w-[65%]">
                              <span>RETURNS TOTAL:</span>
                              <span>{returnsTotal.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between mb-1 w-[65%] font-bold">
                            <span>NET BILL:</span>
                            <span>
                              {parseFloat(selectedBill.net_bill || 0).toFixed(
                                2,
                              )}
                            </span>
                          </div>
                          {parseFloat(selectedBill.bill_discount) > 0 && (
                            <div className="flex justify-between mb-1 w-[65%]">
                              <span>DISCOUNT:</span>
                              <span>{selectedBill.bill_discount}</span>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-dashed border-black pt-1">
                          <div className="flex justify-between">
                            <span>CURRENT BILL AMOUNT:</span>
                            <span>
                              {(
                                parseFloat(selectedBill.net_bill || 0) -
                                parseFloat(selectedBill.bill_discount || 0)
                              ).toFixed(2)}
                            </span>
                          </div>
                          {linkedBills.length > 0 && (
                            <div className="flex justify-between mb-1">
                              <span>(+) PREVIOUS DUES:</span>
                              <span>
                                {parseFloat(
                                  selectedBill.total_previous_bill || 0,
                                ).toFixed(2)}
                              </span>
                            </div>
                          )}
                          {linkedBills.length > 0 && (
                            <div className="text-[10px] text-gray-600 flex gap-2 justify-end mb-1">
                              {linkedBills.map((lb, i) => (
                                <span key={i}>
                                  [{lb.id || lb.no}: {lb.amount}]
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-dashed border-black pt-1">
                          <div className="flex justify-between font-bold text-[13px]">
                            <span>
                              {parseFloat(selectedBill.grand_total_due) < 0
                                ? "REFUND DUE:"
                                : "GRAND TOTAL DUE:"}
                            </span>
                            <span>
                              {Math.abs(
                                parseFloat(selectedBill.grand_total_due || 0),
                              ).toFixed(2)}
                            </span>
                          </div>
                          {paymentsList.map((p, i) => (
                            <div
                              key={i}
                              className="flex justify-between mb-0.5 text-[11px]"
                            >
                              <span>
                                PAID ({p.mode}) [
                                {p.date
                                  ? p.date.split("-").reverse().join("-")
                                  : ""}
                                ]:
                              </span>
                              <span>{parseFloat(p.amount).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-b border-dashed border-black py-1 mt-1 flex justify-between font-bold">
                          <span>CLOSING BALANCE:</span>
                          <span>
                            {Math.abs(
                              parseFloat(selectedBill.closing_balance || 0),
                            ).toFixed(2)}{" "}
                            {parseFloat(selectedBill.closing_balance) < 0 &&
                              "(OVERPAID)"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="table-footer-group">
                    <tr>
                      <td colSpan="5" className="h-[10mm] border-0 p-0"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          );
        })()}
    </>
  );
};

export default BillHistoryPage;
