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
  Search,
  X,
  Minus,
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false); // New Mobile State
  const [mobileSearchTerm, setMobileSearchTerm] = useState(""); // New Mobile Search

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

  // Auto-scroll suggestion list (Desktop)
  useEffect(() => {
    if (
      suggestions.visible &&
      suggestionRefs.current[suggestions.highlightIndex]
    ) {
      suggestionRefs.current[suggestions.highlightIndex].scrollIntoView({
        behavior: "auto",
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

    // Desktop Search Logic
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

  // Select Item Logic (Shared)
  const selectItem = (rowIndex, product) => {
    const newRows = [...rows];
    // If we are adding via mobile search, we might need to add a new row first
    if (!newRows[rowIndex]) newRows[rowIndex] = getEmptyRow();

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

    // Focus logic for desktop
    setTimeout(() => focusCell(rowIndex, "qty"), 50);
  };

  const handleMobileAddItem = (product) => {
    // 1. Check if the last row is empty. If so, use it. If not, add new.
    let targetIndex = rows.length - 1;
    if (rows[targetIndex].item !== "") {
      setRows((prev) => [...prev, getEmptyRow()]);
      targetIndex++;
    }
    selectItem(targetIndex, product);
    setMobileSearchOpen(false);
    setMobileSearchTerm("");
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
    if (rows.length <= 1) {
      setRows([getEmptyRow()]); // Reset to empty if last one
    } else {
      setRows(rows.filter((_, i) => i !== index));
    }
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

  // --- MOBILE SEARCH FILTER ---
  const mobileFilteredInventory = inventory
    .filter(
      (p) =>
        p.item.toLowerCase().includes(mobileSearchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(mobileSearchTerm.toLowerCase()),
    )
    .slice(0, 50);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 font-sans text-sm h-[100dvh] w-screen overflow-hidden">
      {/* --- HEADER (Unified) --- */}
      <div className="bg-blue-900 text-white p-3 shadow-md shrink-0 w-full z-40">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-1.5 bg-blue-800 rounded-full text-blue-100 active:scale-95 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] text-blue-300 uppercase tracking-widest font-bold">
                Bill No
              </span>
              <span className="font-bold text-lg leading-none">
                {billMeta.billNo}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-blue-300 uppercase tracking-widest font-bold">
              Date
            </span>
            <input
              type="date"
              className="bg-transparent font-bold outline-none text-white text-sm text-right w-28"
              value={billMeta.date}
              onChange={(e) =>
                setBillMeta({ ...billMeta, date: e.target.value })
              }
            />
          </div>
        </div>

        {/* Customer Inputs */}
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex items-center bg-blue-800 rounded-lg border border-blue-700 w-full px-3 py-1">
            <User className="text-blue-300 shrink-0" size={18} />
            <input
              className="bg-transparent p-2 text-white placeholder-blue-300 outline-none font-semibold w-full"
              placeholder="Customer Name"
              value={billMeta.customerName}
              onChange={(e) =>
                setBillMeta({ ...billMeta, customerName: e.target.value })
              }
            />
          </div>
          <div className="flex gap-2 w-full">
            <div className="flex items-center bg-blue-800 rounded-lg border border-blue-700 flex-1 px-3 py-1">
              <Phone className="text-blue-300 shrink-0" size={18} />
              <input
                className="bg-transparent p-2 text-white placeholder-blue-300 outline-none w-full"
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

      {/* ================================================================================= */}
      {/* 📱 MOBILE LAYOUT (VISIBLE ONLY ON MOBILE)                                        */}
      {/* ================================================================================= */}
      <div className="flex-1 md:hidden overflow-y-auto p-3 space-y-3 pb-24">
        {/* ITEM CARDS */}
        {rows.map((row, index) => {
          if (!row.item) return null; // Don't show empty rows in card view
          return (
            <div
              key={row.id}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3"
            >
              {/* Row 1: Name & Delete */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-sm">
                    {row.item}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Stock: {row.stock}
                  </p>
                </div>
                <button
                  onClick={() => removeRow(index)}
                  className="text-gray-300 p-1 hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Row 2: Controls */}
              <div className="flex items-center gap-3">
                {/* Qty Stepper */}
                <div className="flex items-center border rounded-lg bg-gray-50 h-10 w-1/3">
                  <button
                    className="px-3 h-full flex items-center justify-center text-gray-500 active:bg-gray-200 rounded-l-lg"
                    onClick={() =>
                      handleInputChange(
                        index,
                        "qty",
                        Math.max(1, (parseFloat(row.qty) || 0) - 1),
                      )
                    }
                  >
                    {" "}
                    <Minus size={14} />{" "}
                  </button>
                  <input
                    className="w-full text-center bg-transparent font-bold outline-none text-sm"
                    type="number"
                    value={row.qty}
                    onChange={(e) =>
                      handleInputChange(index, "qty", e.target.value)
                    }
                  />
                  <button
                    className="px-3 h-full flex items-center justify-center text-gray-500 active:bg-gray-200 rounded-r-lg"
                    onClick={() =>
                      handleInputChange(
                        index,
                        "qty",
                        (parseFloat(row.qty) || 0) + 1,
                      )
                    }
                  >
                    {" "}
                    <Plus size={14} />{" "}
                  </button>
                </div>

                {/* Unit Select */}
                <div className="relative h-10 w-1/3 border rounded-lg bg-white">
                  <select
                    className="w-full h-full px-2 text-xs font-bold appearance-none bg-transparent outline-none"
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
                    className="absolute right-2 top-3 text-gray-400 pointer-events-none"
                  />
                </div>

                {/* Price Input */}
                <div className="h-10 w-1/3 border rounded-lg bg-white flex items-center px-2">
                  <span className="text-gray-400 text-xs mr-1">₹</span>
                  <input
                    className="w-full font-bold text-right outline-none text-sm"
                    type="number"
                    value={row.price}
                    onChange={(e) =>
                      handleInputChange(index, "price", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Row 3: Total */}
              <div className="border-t pt-2 flex justify-end items-center gap-2">
                <span className="text-xs text-gray-400 uppercase">Total:</span>
                <span className="text-lg font-bold text-blue-900">
                  ₹{(row.amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}

        {/* EMPTY STATE */}
        {rows.filter((r) => r.item).length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 opacity-50">
            <Search size={40} />
            <span className="text-xs mt-2">No items added yet</span>
          </div>
        )}

        {/* ADD BUTTON (MOBILE) */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-200 active:scale-90 transition z-10"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* 📱 MOBILE SEARCH OVERLAY */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom duration-200">
          <div className="p-4 border-b flex gap-3 items-center">
            <Search className="text-gray-400" size={20} />
            <input
              autoFocus
              className="flex-1 text-lg outline-none font-medium"
              placeholder="Search Item..."
              value={mobileSearchTerm}
              onChange={(e) => setMobileSearchTerm(e.target.value)}
            />
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="bg-gray-100 p-2 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {mobileFilteredInventory.map((item, i) => (
              <div
                key={i}
                onClick={() => handleMobileAddItem(item)}
                className="p-4 border-b border-gray-50 active:bg-blue-50 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-gray-800">{item.item}</p>
                  <p className="text-xs text-gray-400">{item.brand}</p>
                </div>
                <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded">
                  Stk: {item.stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================================= */}
      {/* 💻 DESKTOP LAYOUT (VISIBLE ONLY ON LAPTOP)                                        */}
      {/* ================================================================================= */}
      <div className="hidden md:flex flex-1 w-full overflow-hidden flex-col relative bg-white">
        <div className="overflow-auto w-full h-full">
          <div className="w-full flex flex-col">
            {/* TABLE HEAD */}
            <div className="flex bg-gray-100 border-b border-gray-300 text-xs font-bold text-gray-700 uppercase sticky top-0 z-30">
              <div className="w-10 p-3 text-center border-r border-gray-300">
                #
              </div>
              <div className="flex-1 p-3 border-r border-gray-300">
                Item Description
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

            {/* TABLE BODY */}
            <div className="pb-24 bg-white min-h-[500px]">
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  className={`flex border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  <div className="w-10 p-2 flex items-center justify-center text-gray-400 border-r text-xs">
                    {index + 1}
                  </div>

                  {/* Desktop Item Input */}
                  <div className="flex-1 relative border-r">
                    <input
                      ref={(el) => (gridRefs.current[`${index}-item`] = el)}
                      className="w-full h-full p-3 outline-none bg-transparent font-semibold text-gray-800 uppercase text-sm text-left"
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
                    {suggestions.visible && suggestions.rowIndex === index && (
                      <div className="absolute left-0 top-full w-full bg-white border border-blue-600 shadow-2xl z-50 max-h-[50vh] overflow-y-auto mt-1 rounded-b-lg">
                        {suggestions.list.map((item, i) => (
                          <div
                            key={item.realRowIndex}
                            ref={(el) => (suggestionRefs.current[i] = el)}
                            className={`flex justify-start items-center p-2.5 px-4 cursor-pointer border-b border-gray-100 text-left ${i === suggestions.highlightIndex ? "bg-blue-600 text-white" : "text-gray-800 hover:bg-gray-50"}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectItem(index, item);
                            }}
                          >
                            <span className="font-bold text-sm uppercase truncate flex-1 text-left mr-4">
                              {item.item}
                            </span>
                            <span
                              className={`text-xs font-mono whitespace-nowrap ${i === suggestions.highlightIndex ? "text-blue-100" : "text-gray-500"}`}
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
                      className="w-full h-full p-2 bg-transparent outline-none text-xs font-bold appearance-none cursor-pointer"
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

      {/* FOOTER (Unified) */}
      <div className="bg-white border-t border-gray-200 p-3 shrink-0 z-40 w-full shadow-[0_-5px_20px_rgba(0,0,0,0.05)] md:shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
        <div className="flex flex-row justify-between items-center gap-2">
          <div className="flex flex-col text-xs text-gray-600">
            <span>
              Items: <b>{rows.filter((r) => r.amount > 0).length}</b>
            </span>
            <span className="hidden md:inline">
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
              className="bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg hover:bg-green-700 disabled:bg-gray-400 font-bold flex items-center gap-2 text-sm uppercase transition-transform active:scale-95"
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
