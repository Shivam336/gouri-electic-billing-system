import React, { useState, useEffect, useRef } from "react";
import {
  Save,
  Printer,
  Trash2,
  Plus,
  User,
  Phone,
  ArrowLeft,
  RefreshCw,
  Calculator,
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

  // Bill Meta
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

  // Refs
  const gridRefs = useRef({});
  const suggestionRefs = useRef([]); // New: For scrolling suggestions

  // --- INIT ---
  useEffect(() => {
    fetchStock();
  }, []);

  // New: Auto-scroll suggestion list when highlight changes
  useEffect(() => {
    if (
      suggestions.visible &&
      suggestionRefs.current[suggestions.highlightIndex]
    ) {
      suggestionRefs.current[suggestions.highlightIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [suggestions.highlightIndex, suggestions.visible]);

  // const fetchStock = async () => {
  //   setStockLoading(true);
  //   try {
  //     const res = await fetch(`${API_URL}?action=getInventory`);
  //     const data = await res.json();
  //     setInventory(data);
  //   } catch (e) {
  //     console.error(e);
  //   }
  //   setStockLoading(false);
  // };

  const fetchStock = async () => {
    setStockLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=getInventory`);
      const data = await res.json();

      // --- NEW: CONCATENATION LOGIC ---
      const processedData = data.map((prod) => ({
        ...prod,
        // Overwrite 'item' with the full combined name
        item: [prod.item, prod.brand, prod.size, prod.model, prod.color]
          .filter((part) => part && part.toString().trim() !== "") // Remove empty columns
          .join(" "), // Join with a space
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

  // --- INPUT HANDLERS ---
  const handleInputChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;

    if (field === "qty" || field === "price") {
      const q = parseFloat(newRows[index].qty) || 0;
      const p = parseFloat(newRows[index].price) || 0;
      newRows[index].amount = q * p;
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
          .filter(
            (p) =>
              p.item.toLowerCase().includes(value.toLowerCase()) ||
              p.brand.toLowerCase().includes(value.toLowerCase()),
          )
          .slice(0, 20); // Show more results now that we can scroll
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

  // --- SELECTION LOGIC ---
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

  // --- KEYBOARD NAVIGATION ---
  const handleKeyDown = (e, index, field) => {
    // 1. DROPDOWN NAVIGATION
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
        if (suggestions.list.length > 0) {
          selectItem(index, suggestions.list[suggestions.highlightIndex]);
        }
        return;
      }
      if (e.key === "Escape") {
        setSuggestions({
          visible: false,
          rowIndex: -1,
          list: [],
          highlightIndex: 0,
        });
        return;
      }
    }

    // 2. GRID NAVIGATION
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "item") focusCell(index, "qty");
      else if (field === "qty") focusCell(index, "price");
      else if (field === "price") {
        if (index === rows.length - 1) addNewRow();
        else focusCell(index + 1, "item");
      }
    }
    // Arrow Key Navigation between cells (Optional but nice)
    if (!suggestions.visible) {
      if (e.key === "ArrowUp" && index > 0) focusCell(index - 1, field);
      if (e.key === "ArrowDown" && index < rows.length - 1)
        focusCell(index + 1, field);
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
    // FULL SCREEN WRAPPER - NO PADDING, NO MARGIN
    <div className="flex flex-col w-full h-full bg-white font-sans text-sm absolute inset-0">
      {/* 1. HEADER (EDGE TO EDGE) */}
      <div className="bg-blue-900 text-white p-3 shadow-md w-full z-20">
        <div className="flex justify-between items-center w-full px-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-1 hover:bg-blue-800 rounded text-blue-200"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] text-blue-300 uppercase tracking-wider">
                Bill No
              </span>
              <span className="font-bold text-lg leading-none">
                {billMeta.billNo}
              </span>
            </div>
            <div className="h-8 w-px bg-blue-700 mx-2"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-blue-300 uppercase tracking-wider">
                Date
              </span>
              <input
                type="date"
                className="bg-transparent font-bold outline-none text-white text-sm w-32 cursor-pointer"
                value={billMeta.date}
                onChange={(e) =>
                  setBillMeta({ ...billMeta, date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="flex flex-col items-end mr-4">
              <span className="text-[10px] text-blue-300">STOCK STATUS</span>
              <div className="flex items-center gap-2 text-xs">
                {stockLoading ? (
                  <span className="animate-pulse">Syncing...</span>
                ) : (
                  <span className="text-green-400">● Live</span>
                )}
                <button onClick={fetchStock}>
                  <RefreshCw
                    size={12}
                    className={stockLoading ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center bg-blue-800 rounded-md p-1 border border-blue-700">
              <User className="text-blue-300 ml-2" size={16} />
              <input
                className="bg-transparent p-2 text-white placeholder-blue-400 outline-none font-bold w-40"
                placeholder="Customer Name"
                value={billMeta.customerName}
                onChange={(e) =>
                  setBillMeta({ ...billMeta, customerName: e.target.value })
                }
                autoFocus
              />
            </div>
            <div className="flex items-center bg-blue-800 rounded-md p-1 border border-blue-700">
              <Phone className="text-blue-300 ml-2" size={16} />
              <input
                className="bg-transparent p-2 text-white placeholder-blue-400 outline-none w-28"
                placeholder="Mobile"
                value={billMeta.mobile}
                onChange={(e) =>
                  setBillMeta({ ...billMeta, mobile: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN GRID (FILLS REMAINING SPACE) */}
      <div className="flex-1 flex flex-col w-full overflow-hidden relative">
        {/* Table Header */}
        <div className="flex w-full bg-gray-100 border-b border-gray-300 text-xs font-bold text-gray-700 uppercase tracking-wide shrink-0">
          <div className="w-12 p-3 text-center border-r border-gray-300">#</div>
          <div className="flex-1 p-3 border-r border-gray-300">
            Item Description
          </div>
          <div className="w-24 p-3 text-right border-r border-gray-300">
            Stock
          </div>
          <div className="w-24 p-3 text-right border-r border-gray-300">
            Qty
          </div>
          <div className="w-24 p-3 border-r border-gray-300">Unit</div>
          <div className="w-28 p-3 text-right border-r border-gray-300">
            Rate
          </div>
          <div className="w-32 p-3 text-right border-r border-gray-300">
            Amount
          </div>
          <div className="w-12 text-center p-3">Del</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto w-full bg-white pb-20">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className={`flex w-full border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
            >
              {/* # */}
              <div className="w-12 p-2 flex items-center justify-center text-gray-400 border-r text-xs">
                {index + 1}
              </div>

              {/* ITEM INPUT */}
              <div className="flex-1 relative border-r">
                <input
                  ref={(el) => (gridRefs.current[`${index}-item`] = el)}
                  className="w-full h-full p-2.5 outline-none bg-transparent font-semibold text-gray-800 uppercase text-sm"
                  value={row.item}
                  placeholder={index === rows.length - 1 ? "Type Item..." : ""}
                  onChange={(e) =>
                    handleInputChange(index, "item", e.target.value)
                  }
                  onKeyDown={(e) => handleKeyDown(e, index, "item")}
                  autoComplete="off"
                />
                {/* SUGGESTIONS DROPDOWN (SCROLLABLE) */}
                {suggestions.visible && suggestions.rowIndex === index && (
                  <div className="absolute top-full left-0 w-full bg-white border border-blue-500 shadow-2xl z-50 max-h-60 overflow-y-auto">
                    {suggestions.list.map((item, i) => (
                      <div
                        key={item.realRowIndex}
                        ref={(el) => (suggestionRefs.current[i] = el)} // Ref for scrolling
                        className={`p-2.5 flex justify-between cursor-pointer border-b border-gray-100 ${i === suggestions.highlightIndex ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-gray-800"}`}
                        onMouseDown={() => selectItem(index, item)}
                      >
                        <span className="font-bold text-sm">{item.item}</span>
                        <span
                          className={`text-xs ${i === suggestions.highlightIndex ? "text-blue-200" : "text-gray-500"}`}
                        >
                          Stock: {item.stock}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* STOCK */}
              <div className="w-24 p-2 flex items-center justify-end text-xs text-gray-500 border-r bg-gray-50 font-mono">
                {row.stock}
              </div>

              {/* QTY */}
              <div className="w-24 border-r">
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

              {/* UNIT */}
              <div className="w-24 border-r">
                <select
                  className="w-full h-full p-2 bg-transparent outline-none text-xs font-bold text-gray-600 cursor-pointer focus:bg-yellow-50"
                  value={row.unit}
                  onChange={(e) => handleUnitChange(index, e.target.value)}
                >
                  {row.unit1 && <option value={row.unit1}>{row.unit1}</option>}
                  {row.unit2 && <option value={row.unit2}>{row.unit2}</option>}
                </select>
              </div>

              {/* RATE */}
              <div className="w-28 border-r">
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

              {/* AMOUNT */}
              <div className="w-32 p-2 flex items-center justify-end font-bold text-gray-900 bg-gray-50 border-r text-sm">
                {row.amount ? row.amount.toLocaleString("en-IN") : "-"}
              </div>

              {/* DELETE */}
              <div
                className="w-12 flex items-center justify-center cursor-pointer text-gray-300 hover:text-red-500 hover:bg-red-50"
                onClick={() => removeRow(index)}
              >
                <Trash2 size={16} />
              </div>
            </div>
          ))}

          <button
            onClick={addNewRow}
            className="w-full py-4 text-blue-500 font-bold border-t border-dashed hover:bg-blue-50 text-xs uppercase tracking-wide flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add New Row (Enter)
          </button>
        </div>
      </div>

      {/* 3. FOOTER (STICKY BOTTOM) */}
      <div className="bg-gray-100 border-t border-gray-300 p-3 px-6 shrink-0 z-30 shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center">
          <div className="flex gap-8 text-sm text-gray-600">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-gray-400">
                Total Items
              </span>
              <span className="font-bold text-lg leading-none">
                {rows.filter((r) => r.amount > 0).length}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-gray-400">
                Total Qty
              </span>
              <span className="font-bold text-lg leading-none">
                {rows.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-gray-400 text-[10px] block uppercase tracking-wider">
                Grand Total
              </span>
              <span className="text-3xl font-bold text-blue-900 leading-none">
                ₹{grandTotal.toLocaleString("en-IN")}
              </span>
            </div>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="bg-green-600 text-white px-8 py-3 rounded shadow-lg hover:bg-green-700 disabled:bg-gray-400 font-bold flex items-center gap-2 uppercase text-sm tracking-wide transition-all active:scale-95"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              {loading ? "Saving..." : "Save & Print"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TallyBillingPage;
