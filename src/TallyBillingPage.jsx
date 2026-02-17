import React, { useState, useEffect, useRef } from "react";
import {
  Save,
  Trash2,
  Plus,
  User,
  Phone,
  ArrowLeft,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "./InvoicePDF";
import { useNavigate } from "react-router-dom";

// 🔴 PASTE YOUR GOOGLE SCRIPT URL HERE
const API_URL =
  "https://script.google.com/macros/s/AKfycbxPymWeFoW2IS0a_mCum2oA_d4WVE2phqH6ROr6FwMXssNqJ1vFvIJszu_IiO1hpqvx/exec";

const TallyBillingPage = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [inventory, setInventory] = useState([]);
  const [rows, setRows] = useState([getEmptyRow()]);
  const [loading, setLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);

  const [billMeta, setBillMeta] = useState({
    billNo: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    mobile: "",
  });

  const [suggestions, setSuggestions] = useState({
    visible: false,
    rowIndex: -1,
    list: [],
    highlightIndex: 0,
  });

  const gridRefs = useRef({});
  const suggestionRefs = useRef([]);

  // --- INIT ---
  useEffect(() => {
    fetchStock();
  }, []);

  // FIND THIS useEffect (around line 40)
  useEffect(() => {
    if (
      suggestions.visible &&
      suggestionRefs.current[suggestions.highlightIndex]
    ) {
      suggestionRefs.current[suggestions.highlightIndex].scrollIntoView({
        behavior: "auto", // CHANGE 'smooth' TO 'auto' (Instant scroll)
        block: "nearest",
      });
    }
  }, [suggestions.highlightIndex, suggestions.visible]);

  const fetchStock = async () => {
    setStockLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=getInventory`);
      const data = await res.json();
      const processedData = data.map((prod) => ({
        ...prod,
        item: [prod.item, prod.brand, prod.size, prod.model, prod.color]
          .filter((p) => p && p.toString().trim() !== "")
          .join(" "),
      }));
      setInventory(processedData);
    } catch (e) {
      console.error(e);
    }
    setStockLoading(false);
  };

  function getEmptyRow() {
    return {
      id: Date.now() + Math.random(),
      item: "",
      brand: "",
      realRowIndex: -1,
      stock: 0,
      qty: "",
      unit: "",
      price: "",
      amount: 0,
    };
  }

  // --- HANDLERS ---
  const handleInputChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    if (field === "qty" || field === "price") {
      newRows[index].amount =
        (parseFloat(newRows[index].qty) || 0) *
        (parseFloat(newRows[index].price) || 0);
    }
    if (field === "item") {
      if (value.trim() === "") {
        setSuggestions({
          visible: false,
          rowIndex: -1,
          list: [],
          highlightIndex: 0,
        });
      } else {
        const matches = inventory
          .filter((p) => p.item.toLowerCase().includes(value.toLowerCase()))
          .slice(0, 50);
        setSuggestions({
          visible: true,
          rowIndex: index,
          list: matches,
          highlightIndex: 0,
        });
      }
    }
    setRows(newRows);
  };

  const selectItem = (rowIndex, product) => {
    const newRows = [...rows];
    newRows[rowIndex] = {
      ...newRows[rowIndex],
      item: product.item,
      brand: product.brand,
      realRowIndex: product.realRowIndex,
      stock: product.stock,
      unit: product.unit1,
      price: product.price1,
      unit1: product.unit1,
      price1: product.price1,
      unit2: product.unit2,
      price2: product.price2,
      amount: (parseFloat(product.price1) || 0) * 1,
      qty: 1,
    };
    setRows(newRows);
    setSuggestions({
      visible: false,
      rowIndex: -1,
      list: [],
      highlightIndex: 0,
    });
    focusCell(rowIndex, "qty");
  };

  const handleKeyDown = (e, index, field) => {
    if (suggestions.visible && suggestions.rowIndex === index) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestions((prev) => ({
          ...prev,
          highlightIndex: Math.min(
            prev.highlightIndex + 1,
            prev.list.length - 1,
          ),
        }));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestions((prev) => ({
          ...prev,
          highlightIndex: Math.max(prev.highlightIndex - 1, 0),
        }));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (suggestions.list.length > 0)
          selectItem(index, suggestions.list[suggestions.highlightIndex]);
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "item") focusCell(index, "qty");
      else if (field === "qty") focusCell(index, "price");
      else if (field === "price") {
        index === rows.length - 1 ? addNewRow() : focusCell(index + 1, "item");
      }
    }
  };

  const handleUnitChange = (index, newUnit) => {
    const newRows = [...rows];
    const r = newRows[index];
    r.unit = newUnit;
    if (newUnit === r.unit1) r.price = r.price1;
    else if (newUnit === r.unit2) r.price = r.price2;
    r.amount = (parseFloat(r.qty) || 0) * (parseFloat(r.price) || 0);
    setRows(newRows);
  };

  const addNewRow = () => {
    setRows((prev) => [...prev, getEmptyRow()]);
    setTimeout(() => focusCell(rows.length, "item"), 50);
  };
  const removeRow = (index) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };
  const focusCell = (rowIndex, field) => {
    const el = gridRefs.current[`${rowIndex}-${field}`];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const handleConfirm = async () => {
    if (!billMeta.customerName) return alert("Customer Name Required");
    const validItems = rows.filter((r) => r.item && r.qty > 0);
    if (validItems.length === 0) return alert("Cart is empty");
    if (!window.confirm(`Confirm Bill for ₹${grandTotal}?`)) return;
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "confirmBill",
          billId: billMeta.billNo,
          customerName: billMeta.customerName,
          mobile: billMeta.mobile,
          total: grandTotal,
          items: validItems,
        }),
      });
      const blob = await pdf(
        <InvoicePDF
          billId={billMeta.billNo}
          customerName={billMeta.customerName}
          customerMobile={billMeta.mobile}
          items={validItems}
          total={grandTotal}
          type="Confirmed"
        />,
      ).toBlob();
      window.open(URL.createObjectURL(blob), "_blank");
      setRows([getEmptyRow()]);
      setBillMeta({
        ...billMeta,
        customerName: "",
        mobile: "",
        billNo: `INV-${Math.floor(Math.random() * 9000)}`,
      });
      fetchStock();
    } catch (e) {
      alert("Error saving bill");
    }
    setLoading(false);
  };

  const grandTotal = rows.reduce(
    (acc, r) => acc + (parseFloat(r.amount) || 0),
    0,
  );

  return (
    // 1. FIXED INSET-0 forces full screen (overlaps App.js padding)
    <div className="fixed inset-0 z-50 flex flex-col bg-white font-sans text-sm h-[100dvh] w-screen overflow-hidden">
      {/* HEADER */}
      {/* HEADER */}
      <div className="bg-blue-900 text-white p-3 shadow-md shrink-0 w-full z-40">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
          {/* LEFT SIDE: Back, Bill No, Date */}
          <div className="flex justify-between md:justify-start items-center w-full md:w-auto gap-0 md:gap-6">
            {/* Back Button & Bill No */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="p-2 hover:bg-blue-800 rounded-full text-blue-200 transition-colors"
              >
                <ArrowLeft size={22} />
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] text-blue-300 font-bold tracking-wider uppercase">
                  Bill No
                </span>
                <span className="font-bold text-xl leading-none tracking-wide">
                  {billMeta.billNo}
                </span>
              </div>
            </div>

            {/* Vertical Divider (Visible on Laptop only) */}
            <div className="hidden md:block h-10 w-px bg-blue-700"></div>

            {/* Date Input */}
            <div className="flex flex-col items-end md:items-start">
              <span className="text-[10px] text-blue-300 font-bold tracking-wider uppercase">
                Date
              </span>
              <input
                type="date"
                className="bg-transparent font-bold outline-none text-white text-lg w-36 cursor-pointer"
                value={billMeta.date}
                onChange={(e) =>
                  setBillMeta({ ...billMeta, date: e.target.value })
                }
              />
            </div>
          </div>

          {/* RIGHT SIDE: Stock Status & Customer Inputs */}
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            {/* Stock Status (Hidden on very small mobile screens to save space, visible on Laptop) */}
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] text-blue-300 font-bold tracking-wider uppercase">
                Stock Status
              </span>
              <div className="flex items-center gap-2 text-xs font-medium">
                {stockLoading ? (
                  <span className="text-yellow-300 animate-pulse">
                    Syncing...
                  </span>
                ) : (
                  <span className="text-green-400 flex items-center gap-1">
                    ● Live
                  </span>
                )}
                <button
                  onClick={fetchStock}
                  className="hover:bg-blue-800 p-1 rounded-full transition-colors"
                >
                  <RefreshCw
                    size={14}
                    className={stockLoading ? "animate-spin" : "opacity-70"}
                  />
                </button>
              </div>
            </div>

            {/* Customer Inputs Group */}
            <div className="flex gap-2 w-full md:w-auto">
              {/* Customer Name */}
              <div className="flex items-center bg-blue-800/50 hover:bg-blue-800 transition-colors rounded-lg border border-blue-700/50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30 w-full md:w-64 h-11 px-3">
                <User className="text-blue-300 shrink-0" size={18} />
                <input
                  className="bg-transparent p-2 text-white placeholder-blue-300/70 outline-none font-semibold w-full text-sm"
                  placeholder="Customer Name"
                  value={billMeta.customerName}
                  onChange={(e) =>
                    setBillMeta({ ...billMeta, customerName: e.target.value })
                  }
                />
              </div>

              {/* Mobile Number */}
              <div className="flex items-center bg-blue-800/50 hover:bg-blue-800 transition-colors rounded-lg border border-blue-700/50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30 w-full md:w-44 h-11 px-3">
                <Phone className="text-blue-300 shrink-0" size={18} />
                <input
                  className="bg-transparent p-2 text-white placeholder-blue-300/70 outline-none font-medium w-full text-sm"
                  placeholder="Mobile"
                  inputMode="numeric"
                  value={billMeta.mobile}
                  onChange={(e) =>
                    setBillMeta({ ...billMeta, mobile: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID AREA */}
      <div className="flex-1 w-full overflow-hidden flex flex-col relative bg-gray-50">
        {/* INNER SCROLL CONTAINER */}
        <div className="overflow-auto w-full h-full">
          {/* TABLE CONTAINER: Min-width for mobile, Full width for Desktop */}
          <div className="min-w-[900px] md:min-w-0 md:w-full flex flex-col">
            {/* HEADERS */}
            <div className="flex bg-gray-100 border-b border-gray-300 text-xs font-bold text-gray-700 uppercase sticky top-0 z-30">
              <div className="w-10 p-3 text-center border-r border-gray-300 sticky left-0 bg-gray-100 z-40 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                #
              </div>

              {/* Item Header (Flexible) */}
              <div className="w-[250px] md:flex-1 p-3 border-r border-gray-300 sticky left-10 bg-gray-100 z-40 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                Item
              </div>

              <div className="w-20 p-3 text-right border-r border-gray-300">
                Stock
              </div>
              <div className="w-20 p-3 text-right border-r border-gray-300">
                Qty
              </div>
              <div className="w-24 p-3 border-r border-gray-300">Unit</div>
              <div className="w-24 p-3 text-right border-r border-gray-300">
                Rate
              </div>
              <div className="w-32 p-3 text-right border-r border-gray-300">
                Amount
              </div>
              <div className="w-12 text-center p-3">Del</div>
            </div>

            {/* BODY */}
            <div className="pb-24 bg-white min-h-[500px]">
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  className={`flex border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  {/* # Sticky Left */}
                  <div
                    className="w-10 p-2 flex items-center justify-center text-gray-400 border-r text-xs sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]"
                    style={{
                      backgroundColor: index % 2 === 0 ? "white" : "#f9fafb",
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Item Input Sticky Left */}
                  {/* ITEM INPUT */}
                  <div
                    className="w-[250px] md:flex-1 relative border-r sticky left-10 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]"
                    style={{
                      backgroundColor: index % 2 === 0 ? "white" : "#f9fafb",
                    }}
                  >
                    <input
                      ref={(el) => (gridRefs.current[`${index}-item`] = el)}
                      className="w-full h-full p-3 outline-none bg-transparent font-semibold text-gray-800 uppercase text-xs md:text-sm text-left" // Added text-left
                      value={row.item}
                      placeholder={
                        index === rows.length - 1 ? "Type Item..." : ""
                      }
                      onChange={(e) =>
                        handleInputChange(index, "item", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, index, "item")}
                      autoComplete="off"
                    />

                    {/* SUGGESTIONS DROPDOWN */}
                    {suggestions.visible && suggestions.rowIndex === index && (
                      <div className="fixed left-0 right-0 md:absolute md:left-0 md:right-0 md:w-full bg-white border border-blue-600 shadow-2xl z-50 max-h-[40vh] overflow-y-auto mt-1 rounded-b-lg">
                        {suggestions.list.map((item, i) => (
                          <div
                            key={item.realRowIndex}
                            ref={(el) => (suggestionRefs.current[i] = el)}
                            // Added 'text-left' and 'items-center'
                            className={`p-2.5 px-4 flex justify-between items-center cursor-pointer border-b border-gray-100 text-left ${
                              i === suggestions.highlightIndex
                                ? "bg-blue-600 text-white"
                                : "text-gray-800 hover:bg-gray-50"
                            }`}
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevents input blur issue
                              selectItem(index, item);
                            }}
                          >
                            {/* Item Name - Forced Left Align */}
                            <span className="font-bold text-sm uppercase truncate flex-1 text-left mr-4">
                              {item.item}
                            </span>

                            {/* Stock - Fixed Width on Right */}
                            <span
                              className={`text-xs font-mono whitespace-nowrap ${
                                i === suggestions.highlightIndex
                                  ? "text-blue-100"
                                  : "text-gray-500"
                              }`}
                            >
                              Stk: {item.stock}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="w-20 p-2 flex items-center justify-end text-xs text-gray-500 border-r bg-gray-50">
                    {row.stock}
                  </div>
                  <div className="w-20 border-r bg-white">
                    <input
                      ref={(el) => (gridRefs.current[`${index}-qty`] = el)}
                      type="number"
                      inputMode="numeric"
                      className="w-full h-full p-2 text-right outline-none bg-transparent font-bold text-black focus:bg-yellow-100"
                      value={row.qty}
                      onChange={(e) =>
                        handleInputChange(index, "qty", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, index, "qty")}
                    />
                  </div>
                  <div className="w-24 border-r bg-white relative">
                    <select
                      className="w-full h-full p-2 bg-transparent outline-none text-xs font-bold appearance-none"
                      value={row.unit}
                      onChange={(e) => handleUnitChange(index, e.target.value)}
                    >
                      {row.unit1 && (
                        <option value={row.unit1}>{row.unit1}</option>
                      )}
                      {row.unit2 && (
                        <option value={row.unit2}>{row.unit2}</option>
                      )}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-1 top-3 text-gray-400 pointer-events-none"
                    />
                  </div>
                  <div className="w-24 border-r bg-white">
                    <input
                      ref={(el) => (gridRefs.current[`${index}-price`] = el)}
                      type="number"
                      inputMode="numeric"
                      className="w-full h-full p-2 text-right outline-none bg-transparent text-black focus:bg-yellow-100 text-sm font-medium"
                      value={row.price}
                      onChange={(e) =>
                        handleInputChange(index, "price", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, index, "price")}
                    />
                  </div>
                  <div className="w-32 p-2 flex items-center justify-end font-bold text-gray-900 bg-gray-50 border-r text-sm">
                    {row.amount ? row.amount.toLocaleString("en-IN") : "-"}
                  </div>
                  <div
                    className="w-12 flex items-center justify-center cursor-pointer text-gray-300 active:text-red-500 active:bg-red-50"
                    onClick={() => removeRow(index)}
                  >
                    <Trash2 size={16} />
                  </div>
                </div>
              ))}
              <button
                onClick={addNewRow}
                className="w-full py-4 text-blue-600 font-bold border-t border-dashed bg-white active:bg-blue-50 text-xs uppercase flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Row
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-gray-100 border-t border-gray-300 p-3 shrink-0 z-40 w-full shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
        <div className="flex flex-row justify-between items-center gap-2">
          <div className="flex flex-col text-xs text-gray-600">
            <span>
              Items: <b>{rows.filter((r) => r.amount > 0).length}</b>
            </span>
            <span>
              Qty:{" "}
              <b>{rows.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0)}</b>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block uppercase">
                Total
              </span>
              <span className="text-xl font-bold text-blue-900 leading-none">
                ₹{grandTotal.toLocaleString("en-IN")}
              </span>
            </div>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-3 rounded shadow hover:bg-green-700 disabled:bg-gray-400 font-bold flex items-center gap-2 text-sm uppercase"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              <span className="hidden md:inline">Save & Print</span>
              <span className="md:hidden">Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TallyBillingPage;
