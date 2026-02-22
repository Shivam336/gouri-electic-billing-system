import React, { useState, useRef, useEffect } from "react";
import { Trash2, X } from "lucide-react";

const TallyBillingPage = () => {
  const pageRef = useRef(null);

  // --- 1. STATE ---
  const [items, setItems] = useState([
    {
      id: 1,
      desc: "",
      hsn: "",
      stock: 150,
      mrp: "",
      qty: "",
      unit: "Pcs",
      rate: "",
      tax: "",
      disc: "",
      amount: "0.00",
    },
  ]);

  const [showSavePopup, setShowSavePopup] = useState(false);

  // --- SAVE AND PRINT LOGIC ---
  const handleSaveBill = () => {
    console.log("Bill saved successfully!");
    setShowSavePopup(true);
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
      setShowSavePopup(false);
      setTimeout(() => {
        document.getElementById("closing-balance-input")?.focus();
      }, 10);
    }, 100);
  };

  const handleCancelModal = () => {
    setShowSavePopup(false);
    setTimeout(() => {
      document.getElementById("closing-balance-input")?.focus();
    }, 10);
  };

  // --- 2. GLOBAL KEYBOARD NAVIGATION ---
  const handleKeyDown = (e) => {
    if (showSavePopup) return;

    if (
      !["Enter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
        e.key,
      )
    )
      return;

    const target = e.target;
    const currentId = target.id;

    // CUSTOM NAVIGATION OVERRIDES
    if (currentId === "remarks-input") {
      if (
        (e.key === "ArrowUp" || e.key === "ArrowLeft") &&
        target.selectionStart === 0
      ) {
        e.preventDefault();
        document
          .querySelector(`input[data-row="${items.length - 1}"][data-col="8"]`)
          ?.focus();
        return;
      }
      if (
        (e.key === "ArrowDown" || e.key === "ArrowRight") &&
        target.selectionEnd === target.value.length
      ) {
        e.preventDefault();
        document.getElementById("sub-total-input")?.focus();
        return;
      }
    }

    if (currentId === "total-paid-input") {
      if (["Enter", "ArrowRight", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        document.getElementById("closing-balance-input")?.focus();
        return;
      }
    }

    if (currentId === "closing-balance-input") {
      if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        document.getElementById("total-paid-input")?.focus();
        return;
      }
      if (["Enter", "ArrowRight", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        handleSaveBill();
        return;
      }
    }

    const isTableInput = target.dataset.row !== undefined;
    const isSelect = target.tagName === "SELECT";
    const isDate = target.type === "date";
    const isTextArea = target.tagName === "TEXTAREA";

    const focusableElements = pageRef.current.querySelectorAll(
      "input:not([tabindex='-1']), select:not([tabindex='-1']), textarea:not([tabindex='-1']), button:not([tabindex='-1'])",
    );
    const elementsArray = Array.from(focusableElements);
    const currentIndex = elementsArray.indexOf(target);

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    if (e.key === "Enter") {
      e.preventDefault();
      nextIndex = currentIndex + 1;
    } else if (!isTableInput) {
      if (e.key === "ArrowDown" && !isSelect && !isDate && !isTextArea) {
        e.preventDefault();
        nextIndex = currentIndex + 1;
      } else if (e.key === "ArrowUp" && !isSelect && !isDate && !isTextArea) {
        e.preventDefault();
        nextIndex = currentIndex - 1;
      } else if (e.key === "ArrowLeft" && !isTextArea) {
        if (isDate) return;
        if (target.readOnly || isSelect || target.selectionStart === 0) {
          e.preventDefault();
          nextIndex = currentIndex - 1;
        }
      } else if (e.key === "ArrowRight" && !isTextArea) {
        if (isDate) return;
        if (
          target.readOnly ||
          isSelect ||
          target.selectionEnd === (target.value?.length || 0)
        ) {
          e.preventDefault();
          nextIndex = currentIndex + 1;
        }
      }
    }

    if (
      nextIndex !== currentIndex &&
      nextIndex >= 0 &&
      nextIndex < elementsArray.length
    ) {
      elementsArray[nextIndex].focus();
    }
  };

  // --- 3. MANDATORY FIELD VALIDATION ---
  const enforceMandatory = (e) => {
    const navKeys = [
      "Enter",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ];
    if (navKeys.includes(e.key) && e.target.value.toString().trim() === "") {
      e.preventDefault();
      e.stopPropagation();
      e.target.classList.add("!border-red-500", "!bg-red-50");
      setTimeout(
        () => e.target.classList.remove("!border-red-500", "!bg-red-50"),
        400,
      );
    }
  };

  // --- 4. TABLE SPECIFIC NAVIGATION (Grid System) ---
  const handleTableArrowKeys = (e) => {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
      return;

    const target = e.target;
    if (target.dataset.row === undefined || target.dataset.col === undefined)
      return;

    const row = parseInt(target.dataset.row);
    const col = parseInt(target.dataset.col);

    let nextRow = row;
    let nextCol = col;

    if (e.key === "ArrowUp") {
      nextRow = row - 1;
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      nextRow = row + 1;
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      if (target.readOnly || target.selectionStart === 0) {
        nextCol = col - 1;
        e.preventDefault();
      } else return;
    } else if (e.key === "ArrowRight") {
      if (
        target.readOnly ||
        target.selectionEnd === (target.value?.length || 0)
      ) {
        nextCol = col + 1;
        e.preventDefault();
      } else return;
    }

    if (nextRow !== row || nextCol !== col) {
      const nextCell = document.querySelector(
        `input[data-row="${nextRow}"][data-col="${nextCol}"]`,
      );
      if (nextCell) {
        nextCell.focus();
      }
    }
  };

  const handleDescKeyDown = (e, index) => {
    const isDescEmpty = items[index].desc.trim() === "";

    if (e.key === "Enter" && isDescEmpty) {
      e.preventDefault();
      e.stopPropagation();
      if (items.length > 1) setItems(items.filter((_, i) => i !== index));
      document.getElementById("remarks-input")?.focus();
      return;
    }

    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
      isDescEmpty
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.target.classList.add("!border-red-500", "!bg-red-50");
      setTimeout(
        () => e.target.classList.remove("!border-red-500", "!bg-red-50"),
        400,
      );
    }
  };

  const handleLastColumnKeyDown = (e, index) => {
    if (e.key === "Enter") {
      if (index === items.length - 1 && items[index].desc.trim() !== "") {
        e.preventDefault();
        e.stopPropagation();

        const previousTax = items[index].tax;
        const previousDisc = items[index].disc;

        setItems([
          ...items,
          {
            id: Date.now(),
            desc: "",
            hsn: "",
            stock: 0,
            mrp: "",
            qty: "",
            unit: "Pcs",
            rate: "",
            tax: previousTax,
            disc: previousDisc,
            amount: "0.00",
          },
        ]);

        setTimeout(
          () =>
            document
              .querySelector(`input[data-row="${index + 1}"][data-col="0"]`)
              ?.focus(),
          10,
        );
      }
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const deleteItem = (indexToDelete) => {
    if (items.length === 1) {
      setItems([
        {
          id: Date.now(),
          desc: "",
          hsn: "",
          stock: 0,
          mrp: "",
          qty: "",
          unit: "Pcs",
          rate: "",
          tax: "",
          disc: "",
          amount: "0.00",
        },
      ]);
    } else {
      setItems(items.filter((_, index) => index !== indexToDelete));
    }
  };

  let labelHeadingCSS = "text-[12px] font-semibold text-gray-700 mb-1 block";
  let fieldCSS =
    "px-2 py-1.5 border border-gray-300 rounded-md outline-none focus:border-[#1e3a8a] focus:bg-blue-50 focus:ring-1 focus:ring-[#1e3a8a] font-medium text-gray-900 text-[12px] transition-all";
  let tableInputCSS =
    "w-full outline-none bg-transparent px-1 py-0.5 text-[12px] text-gray-900 rounded focus:bg-blue-100 focus:ring-1 focus:ring-[#1e3a8a] transition-all";

  return (
    <>
      <style>{`
        @media print {
          @page { size: A5; margin: 0 !important; }
          html, body { background-color: white !important; margin: 0 !important; padding: 0 !important; }
          nav, header, footer, aside, .print-hidden-all { display: none !important; }
        }
      `}</style>

      {/* =====================================================================
          1. MAIN FORM (Visually hidden during print)
          ===================================================================== */}
      <div
        ref={pageRef}
        onKeyDown={handleKeyDown}
        className="flex flex-col min-h-full p-4 gap-4 w-full outline-none print:hidden print-hidden-all"
      >
        {/* Top Form Bar */}
        <div className="flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col">
              <label className={labelHeadingCSS}>Type</label>
              <select className={`${fieldCSS} cursor-pointer w-28`}>
                <option value="SALE">Sale</option>
                <option value="RETURN">Return</option>
                <option value="ESTIMATE">Estimate</option>
                <option value="PAYMENT">Receipt</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className={labelHeadingCSS}>Bill No.</label>
              <input
                id="bill-no-input"
                type="text"
                defaultValue="103"
                className={`${fieldCSS} w-24 bg-gray-50`}
                readOnly
              />
            </div>
            <div className="flex flex-col">
              <label className={labelHeadingCSS}>Date</label>
              <input
                id="date-input"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                className={`${fieldCSS} cursor-pointer w-32`}
              />
            </div>
            <div className="flex flex-col flex-1 min-w-[200px]">
              <label className={labelHeadingCSS}>
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                id="customer-name-input"
                type="text"
                placeholder="Enter name..."
                className={`${fieldCSS} w-full`}
                onKeyDown={enforceMandatory}
              />
            </div>
            <div className="flex flex-col">
              <label className={labelHeadingCSS}>
                Phone No. <span className="text-red-500">*</span>
              </label>
              <input
                id="customer-phone-input"
                type="tel"
                placeholder="Mobile number..."
                className={`${fieldCSS} w-32`}
                onKeyDown={enforceMandatory}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col flex-1 min-w-[200px]">
              <label className={labelHeadingCSS}>Customer Address</label>
              <input
                type="text"
                placeholder="Enter Address..."
                className={`${fieldCSS} w-full`}
              />
            </div>
            <div className="flex flex-col">
              <label className={labelHeadingCSS}>Last Bill No.</label>
              <select
                id="last-bill-no-input"
                className={`${fieldCSS} cursor-pointer w-32`}
              >
                <option value="">Select...</option>
                <option value="INV-9566">INV-9566</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className={labelHeadingCSS}>Last Bill Date</label>
              <input
                id="last-bill-date-input"
                type="date"
                className={`${fieldCSS} cursor-pointer w-32`}
              />
            </div>
            <div className="flex flex-col flex-1 min-w-[150px]">
              <label className={labelHeadingCSS}>Ref Name</label>
              <input
                id="ref-name-input"
                type="text"
                placeholder="Reference Name..."
                className={`${fieldCSS} w-full`}
              />
            </div>
            <div className="flex flex-col">
              <label className={labelHeadingCSS}>Ref Phone No.</label>
              <input
                id="ref-phone-input"
                type="tel"
                placeholder="Ref Mobile..."
                className={`${fieldCSS} w-32`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && items.length === 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    setItems([
                      {
                        id: Date.now(),
                        desc: "",
                        hsn: "",
                        stock: 0,
                        mrp: "",
                        qty: "",
                        unit: "Pcs",
                        rate: "",
                        tax: "",
                        disc: "",
                        amount: "0.00",
                      },
                    ]);
                    setTimeout(
                      () => document.getElementById("desc-0")?.focus(),
                      10,
                    );
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="w-full h-[320px] overflow-auto relative">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-[12px] font-semibold text-gray-700 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-2 w-10 text-center border-b border-r border-gray-300">
                    #
                  </th>
                  <th className="p-2 w-64 border-b border-r border-gray-300">
                    Item Description
                  </th>
                  <th className="p-2 w-20 border-b border-r border-gray-300">
                    HSN
                  </th>
                  <th className="p-2 w-16 border-b border-r border-gray-300">
                    Stock
                  </th>
                  <th className="p-2 w-16 border-b border-r border-gray-300">
                    MRP
                  </th>
                  <th className="p-2 w-16 border-b border-r border-gray-300">
                    Qty <span className="text-red-500">*</span>
                  </th>
                  <th className="p-2 w-20 border-b border-r border-gray-300">
                    Unit <span className="text-red-500">*</span>
                  </th>
                  <th className="p-2 w-24 border-b border-r border-gray-300">
                    Rate <span className="text-red-500">*</span>
                  </th>
                  <th className="p-2 w-16 border-b border-r border-gray-300">
                    Tax %
                  </th>
                  <th className="p-2 w-16 border-b border-r border-gray-300">
                    Disc %
                  </th>
                  <th className="p-2 w-28 border-b border-r border-gray-300 text-right">
                    Amount
                  </th>
                  <th className="p-2 w-12 border-b border-gray-300 text-center">
                    Del
                  </th>
                </tr>
              </thead>
              <tbody onKeyDown={handleTableArrowKeys}>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-1 border-r border-gray-200 text-center text-[12px] text-gray-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="p-1 border-r border-gray-200">
                      <input
                        id={`desc-${index}`}
                        data-row={index}
                        data-col="0"
                        value={item.desc}
                        onChange={(e) =>
                          updateItem(index, "desc", e.target.value)
                        }
                        onKeyDown={(e) => handleDescKeyDown(e, index)}
                        className={`${tableInputCSS} font-medium`}
                        placeholder="Type item..."
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="1"
                        value={item.hsn}
                        onChange={(e) =>
                          updateItem(index, "hsn", e.target.value)
                        }
                        className={tableInputCSS}
                        placeholder="-"
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200 px-2 text-[12px] text-gray-500 bg-gray-50 text-center">
                      {item.stock}
                    </td>
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="2"
                        type="text"
                        inputMode="decimal"
                        value={item.mrp}
                        onChange={(e) =>
                          updateItem(index, "mrp", e.target.value)
                        }
                        className={`${tableInputCSS} text-center`}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="3"
                        type="text"
                        inputMode="decimal"
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(index, "qty", e.target.value)
                        }
                        onKeyDown={enforceMandatory}
                        className={`${tableInputCSS} text-center font-bold`}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="4"
                        type="text"
                        value={item.unit}
                        onChange={(e) =>
                          updateItem(index, "unit", e.target.value)
                        }
                        onKeyDown={enforceMandatory}
                        className={`${tableInputCSS} text-center`}
                        placeholder="Pcs"
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="5"
                        type="text"
                        inputMode="decimal"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(index, "rate", e.target.value)
                        }
                        onKeyDown={enforceMandatory}
                        className={`${tableInputCSS} text-right font-bold`}
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="6"
                        type="text"
                        inputMode="decimal"
                        value={item.tax}
                        onChange={(e) =>
                          updateItem(index, "tax", e.target.value)
                        }
                        className={`${tableInputCSS} text-center`}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="7"
                        type="text"
                        inputMode="decimal"
                        value={item.disc}
                        onChange={(e) =>
                          updateItem(index, "disc", e.target.value)
                        }
                        className={`${tableInputCSS} text-center`}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="8"
                        value={item.amount}
                        readOnly
                        onKeyDown={(e) => handleLastColumnKeyDown(e, index)}
                        className={`${tableInputCSS} font-bold text-right bg-gray-50`}
                      />
                    </td>
                    <td className="p-1 text-center">
                      <button
                        onClick={() => deleteItem(index)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 rounded focus:ring-1 focus:ring-red-400 focus:outline-none"
                        tabIndex="-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex gap-4 mt-auto">
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex-1 flex flex-col">
              <label className="text-[12px] font-semibold text-gray-700 mb-2 block">
                Remarks / Warranty Notes
              </label>
              <textarea
                id="remarks-input"
                className="w-full flex-1 p-2 border border-gray-300 rounded-md outline-none focus:border-[#1e3a8a] focus:bg-blue-50 focus:ring-1 focus:ring-[#1e3a8a] text-[12px] resize-none text-gray-800 font-medium transition-all"
                placeholder="Enter warranty details, delivery notes, or customer remarks here..."
              ></textarea>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex gap-6 h-28">
              <div className="flex-1">
                <label className="text-[12px] font-semibold text-gray-700 mb-1 block">
                  Terms & Conditions
                </label>
                <ul className="text-[11px] text-gray-600 list-disc pl-4 space-y-0.5">
                  <li>Goods once sold will not be taken back.</li>
                  <li>Warranty subject to manufacturer terms.</li>
                  <li>Subject to local jurisdiction.</li>
                </ul>
              </div>
              <div className="flex-1 border-l border-gray-200 pl-6">
                <label className="text-[12px] font-semibold text-gray-700 mb-1 block">
                  Bank / UPI Details
                </label>
                <div className="text-[11px] text-gray-600 space-y-1">
                  <p>
                    <span className="font-semibold text-gray-800">Bank:</span>{" "}
                    HDFC Bank
                  </p>
                  <p>
                    <span className="font-semibold text-gray-800">A/C:</span>{" "}
                    50200012345678
                  </p>
                  <p>
                    <span className="font-semibold text-gray-800">IFSC:</span>{" "}
                    HDFC0001234
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-[400px] bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col shrink-0">
            <div className="p-4 flex flex-col gap-3 flex-1">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-semibold text-gray-700">
                  Sub Total
                </span>
                <input
                  id="sub-total-input"
                  readOnly
                  defaultValue="0.00"
                  className={`${fieldCSS} w-32 text-right bg-gray-50`}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-semibold text-gray-700">
                  (-) Discount
                </span>
                <input
                  id="discount-input"
                  type="text"
                  inputMode="decimal"
                  defaultValue="0"
                  className={`${fieldCSS} w-32 text-right text-[#1e3a8a]`}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-semibold text-gray-700">
                  Current Bill
                </span>
                <input
                  id="current-bill-input"
                  readOnly
                  defaultValue="0.00"
                  className={`${fieldCSS} w-32 text-right bg-gray-50 text-[#1e3a8a]`}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-semibold text-gray-700">
                  (+) Previous Balance
                </span>
                <input
                  id="prev-balance-input"
                  type="text"
                  inputMode="decimal"
                  defaultValue="0"
                  className={`${fieldCSS} w-32 text-right text-[#1e3a8a]`}
                />
              </div>
              <hr className="my-1 border-gray-200" />
              <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-md border border-blue-100">
                <span className="text-[13px] font-bold text-[#1e3a8a]">
                  Grand Total Due
                </span>
                <input
                  id="grand-total-input"
                  readOnly
                  defaultValue="0.00"
                  className={`${fieldCSS} w-32 text-right bg-transparent border-none text-lg`}
                />
              </div>
              <hr className="my-1 border-gray-200" />
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Payments Received
                </span>
                <div className="flex justify-between items-center pl-2">
                  <span className="text-[12px] font-medium text-gray-700">
                    Cash
                  </span>
                  <input
                    id="cash-input"
                    type="text"
                    inputMode="decimal"
                    defaultValue="0"
                    className={`${fieldCSS} w-28 text-right`}
                  />
                </div>
                <div className="flex justify-between items-center pl-2">
                  <span className="text-[12px] font-medium text-gray-700">
                    UPI / Bank
                  </span>
                  <input
                    id="upi-input"
                    type="text"
                    inputMode="decimal"
                    defaultValue="0"
                    className={`${fieldCSS} w-28 text-right`}
                  />
                </div>
              </div>
              <hr className="my-1 border-gray-200" />
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-semibold text-gray-700">
                  Total Paid Now
                </span>
                <input
                  id="total-paid-input"
                  readOnly
                  defaultValue="0.00"
                  className={`${fieldCSS} w-32 text-right bg-transparent border-none text-[13px] text-green-700`}
                />
              </div>
            </div>

            <div className="bg-gray-800 text-white px-5 py-3 flex justify-between items-center">
              <span className="text-[13px] font-medium tracking-wide">
                Closing Balance
              </span>
              <input
                id="closing-balance-input"
                readOnly
                value="0.00"
                className="bg-transparent text-xl font-bold text-white outline-none text-right w-40 cursor-default focus:ring-2 focus:ring-white rounded px-1 transition-shadow"
              />
            </div>

            <div className="p-3 bg-gray-100 flex gap-3 rounded-b-lg border-t border-gray-300">
              <button
                className="flex-1 bg-gray-500 hover:bg-gray-600 focus:ring-2 focus:ring-gray-400 focus:outline-none text-white text-[13px] font-semibold py-2.5 rounded-md shadow-sm transition-colors active:scale-95"
                tabIndex="-1"
              >
                Reset
              </button>
              <button
                id="save-btn"
                onClick={handleSaveBill}
                className="flex-1 bg-[#1e3a8a] hover:bg-blue-800 focus:ring-2 focus:ring-blue-400 focus:outline-none text-white text-[13px] font-semibold py-2.5 rounded-md shadow-sm transition-colors active:scale-95"
              >
                Save
              </button>
              <button
                onClick={handleSaveBill}
                className="flex-[1.5] bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-400 focus:outline-none text-white text-[13px] font-semibold py-2.5 rounded-md shadow-sm transition-colors active:scale-95"
                tabIndex="-1"
              >
                Save & Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. SCREEN PREVIEW MODAL (Visually hidden during print)
          ===================================================================== */}
      {showSavePopup && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity outline-none print:hidden print-hidden-all"
          tabIndex={0}
          ref={(el) => {
            if (el) el.focus();
          }}
          onKeyDown={(e) => {
            if (e.repeat) return;
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              handleCancelModal();
            } else if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              handlePrint();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg shrink-0">
              <h2 className="font-bold text-lg text-gray-800">
                Print Preview (A5)
              </h2>
              <button
                onClick={handleCancelModal}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-auto bg-gray-200 flex justify-center">
              <div className="bg-white p-6 shadow-sm w-full max-w-lg border border-gray-300 h-max min-h-full font-mono text-[13px] leading-snug text-black uppercase">
                <table
                  className="w-full border-collapse"
                  style={{ tableLayout: "fixed" }}
                >
                  <colgroup>
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "58%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "15%" }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <td colSpan="5" className="pb-2 border-0 p-0">
                        {/* Row 1: Bill No, Heading, Date */}
                        <div className="border-t border-b border-dashed border-black py-1 mb-2 flex justify-between items-center font-bold">
                          <span className="text-left whitespace-nowrap">
                            BILL NO:{" "}
                            {document.getElementById("bill-no-input")?.value ||
                              "103"}
                          </span>
                          <span className="text-center tracking-wide text-[14px]">
                            ROUGH ESTIMATE
                          </span>
                          <span className="text-right whitespace-nowrap">
                            DATE:{" "}
                            {document
                              .getElementById("date-input")
                              ?.value.split("-")
                              .reverse()
                              .join("-") || "18-02-2026"}
                          </span>
                        </div>

                        {/* Row 2: Customer (Left) and Ref (Right) */}
                        <div className="flex w-full justify-between mb-1">
                          <span className="w-1/2 text-left truncate pr-2">
                            CUSTOMER:{" "}
                            {document.getElementById("customer-name-input")
                              ?.value || "Walking Customer"}
                            {document.getElementById("customer-phone-input")
                              ?.value
                              ? ` - ${document.getElementById("customer-phone-input")?.value}`
                              : ""}
                          </span>
                          <span className="w-1/2 text-right truncate pl-2">
                            REF:{" "}
                            {document.getElementById("ref-name-input")?.value ||
                              "N/A"}
                            {document.getElementById("ref-phone-input")?.value
                              ? ` - ${document.getElementById("ref-phone-input")?.value}`
                              : ""}
                          </span>
                        </div>

                        {/* Row 3: Last Bill No and Date */}
                        <div className="flex w-full justify-between mb-2">
                          <span className="w-1/2 text-left truncate pr-2">
                            LAST BILL NO:{" "}
                            {document.getElementById("last-bill-no-input")
                              ?.value || "N/A"}
                          </span>
                          <span className="w-1/2 text-right truncate pl-2">
                            LAST BILL DT:{" "}
                            {document.getElementById("last-bill-date-input")
                              ?.value
                              ? document
                                  .getElementById("last-bill-date-input")
                                  .value.split("-")
                                  .reverse()
                                  .join("-")
                              : "N/A"}
                          </span>
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
                        QTY
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
                    {items.map((item, index) => {
                      if (item.desc.trim() === "") return null;
                      return (
                        <tr key={item.id} className="break-inside-avoid">
                          <td className="py-1 align-top text-left">
                            {index + 1}
                          </td>
                          <td className="py-1 pr-2 align-top text-left break-words">
                            {item.desc}
                          </td>
                          <td className="py-1 text-center align-top">
                            {item.qty || "1"}
                          </td>
                          <td className="py-1 text-right align-top">
                            {item.rate || "0.00"}
                          </td>
                          <td className="py-1 text-right align-top">
                            {item.amount || "0.00"}
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td colSpan="5" className="pt-2 border-0 p-0">
                        <div className="break-inside-avoid">
                          <div className="border-t border-dashed border-black pt-2 flex flex-col items-end">
                            <div className="flex justify-between w-[60%]">
                              <span>SUB TOTAL:</span>
                              <span>
                                {document.getElementById("sub-total-input")
                                  ?.value || "0.00"}
                              </span>
                            </div>
                            <div className="flex justify-between mb-1 w-[60%]">
                              <span>DISCOUNT:</span>
                              <span>
                                {document.getElementById("discount-input")
                                  ?.value || "0"}
                              </span>
                            </div>
                          </div>
                          <div className="border-t border-dashed border-black pt-1">
                            <div className="flex justify-between">
                              <span>CURRENT BILL AMOUNT:</span>
                              <span>
                                {document.getElementById("current-bill-input")
                                  ?.value || "0.00"}
                              </span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span>(+) PREVIOUS BALANCE:</span>
                              <span>
                                {document.getElementById("prev-balance-input")
                                  ?.value || "0.00"}
                              </span>
                            </div>
                          </div>
                          <div className="border-t border-dashed border-black pt-1">
                            <div className="flex justify-between">
                              <span>(=) GRAND TOTAL DUE:</span>
                              <span>
                                {document.getElementById("grand-total-input")
                                  ?.value || "0.00"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>(-) PAID NOW (CASH):</span>
                              <span>
                                {document.getElementById("cash-input")?.value ||
                                  "0.00"}
                              </span>
                            </div>
                            {/* NEW UPI FIELD */}
                            <div className="flex justify-between mb-1">
                              <span>(-) PAID NOW (UPI/BANK):</span>
                              <span>
                                {document.getElementById("upi-input")?.value ||
                                  "0.00"}
                              </span>
                            </div>
                          </div>
                          <div className="border-t border-b border-dashed border-black py-1 mt-1 flex justify-between font-bold">
                            <span>CLOSING BALANCE:</span>
                            <span>
                              {document.getElementById("closing-balance-input")
                                ?.value || "0.00"}{" "}
                              (PAID)
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-lg shrink-0">
              <button
                onClick={handleCancelModal}
                className="px-5 py-2 border border-gray-300 rounded font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-green-600 text-white rounded font-bold shadow-sm hover:bg-green-700 transition-colors"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. PURE PRINT LAYOUT (Hidden on screen, ONLY visible to printer)
          ===================================================================== */}
      {showSavePopup && (
        <div className="hidden print:block absolute top-0 left-0 w-[148mm] bg-white text-black px-[10mm] z-[999999] font-mono text-[13px] leading-tight uppercase">
          <table
            className="w-full border-collapse"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: "5%" }} />
              <col style={{ width: "58%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "15%" }} />
            </colgroup>

            <thead className="table-header-group">
              <tr>
                <td colSpan="5" className="h-[10mm] border-0 p-0"></td>
              </tr>
              <tr>
                <td colSpan="5" className="pb-2 border-0 p-0">
                  {/* Row 1: Bill No, Heading, Date */}
                  <div className="border-t border-b border-dashed border-black py-1 mb-2 flex justify-between items-center font-bold">
                    <span className="text-left whitespace-nowrap">
                      BILL NO:{" "}
                      {document.getElementById("bill-no-input")?.value || "103"}
                    </span>
                    <span className="text-center tracking-wide text-[14px]">
                      ROUGH ESTIMATE
                    </span>
                    <span className="text-right whitespace-nowrap">
                      DATE:{" "}
                      {document
                        .getElementById("date-input")
                        ?.value.split("-")
                        .reverse()
                        .join("-") || "18-02-2026"}
                    </span>
                  </div>

                  {/* Row 2: Customer (Left) and Ref (Right) */}
                  <div className="flex w-full justify-between mb-1">
                    <span className="w-1/2 text-left truncate pr-2">
                      CUSTOMER:{" "}
                      {document.getElementById("customer-name-input")?.value ||
                        "Walking Customer"}
                      {document.getElementById("customer-phone-input")?.value
                        ? ` - ${document.getElementById("customer-phone-input")?.value}`
                        : ""}
                    </span>
                    <span className="w-1/2 text-right truncate pl-2">
                      REF:{" "}
                      {document.getElementById("ref-name-input")?.value ||
                        "N/A"}
                      {document.getElementById("ref-phone-input")?.value
                        ? ` - ${document.getElementById("ref-phone-input")?.value}`
                        : ""}
                    </span>
                  </div>

                  {/* Row 3: Last Bill No and Date */}
                  <div className="flex w-full justify-between mb-2">
                    <span className="w-1/2 text-left truncate pr-2">
                      LAST BILL NO:{" "}
                      {document.getElementById("last-bill-no-input")?.value ||
                        "N/A"}
                    </span>
                    <span className="w-1/2 text-right truncate pl-2">
                      LAST BILL DT:{" "}
                      {document.getElementById("last-bill-date-input")?.value
                        ? document
                            .getElementById("last-bill-date-input")
                            .value.split("-")
                            .reverse()
                            .join("-")
                        : "N/A"}
                    </span>
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
                  QTY
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
              {items.map((item, index) => {
                if (item.desc.trim() === "") return null;
                return (
                  <tr key={item.id} className="break-inside-avoid">
                    <td className="py-1 align-top text-left">{index + 1}</td>
                    <td className="py-1 pr-2 align-top text-left break-words">
                      {item.desc}
                    </td>
                    <td className="py-1 text-center align-top">
                      {item.qty || "1"}
                    </td>
                    <td className="py-1 text-right align-top">
                      {item.rate || "0.00"}
                    </td>
                    <td className="py-1 text-right align-top">
                      {item.amount || "0.00"}
                    </td>
                  </tr>
                );
              })}

              <tr className="break-inside-avoid">
                <td colSpan="5" className="pt-2 border-0 p-0">
                  <div className="border-t border-dashed border-black pt-2 flex flex-col items-end">
                    <div className="flex justify-between w-[60%]">
                      <span>SUB TOTAL:</span>
                      <span>
                        {document.getElementById("sub-total-input")?.value ||
                          "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between mb-1 w-[60%]">
                      <span>DISCOUNT:</span>
                      <span>
                        {document.getElementById("discount-input")?.value ||
                          "0"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-black pt-1">
                    <div className="flex justify-between">
                      <span>CURRENT BILL AMOUNT:</span>
                      <span>
                        {document.getElementById("current-bill-input")?.value ||
                          "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>(+) PREVIOUS BALANCE:</span>
                      <span>
                        {document.getElementById("prev-balance-input")?.value ||
                          "0.00"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-black pt-1">
                    <div className="flex justify-between">
                      <span>(=) GRAND TOTAL DUE:</span>
                      <span>
                        {document.getElementById("grand-total-input")?.value ||
                          "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>(-) PAID NOW (CASH):</span>
                      <span>
                        {document.getElementById("cash-input")?.value || "0.00"}
                      </span>
                    </div>
                    {/* NEW UPI FIELD */}
                    <div className="flex justify-between mb-1">
                      <span>(-) PAID NOW (UPI/BANK):</span>
                      <span>
                        {document.getElementById("upi-input")?.value || "0.00"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-b border-dashed border-black py-1 mt-1 flex justify-between font-bold">
                    <span>CLOSING BALANCE:</span>
                    <span>
                      {document.getElementById("closing-balance-input")
                        ?.value || "0.00"}{" "}
                      (PAID)
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
      )}
    </>
  );
};

export default TallyBillingPage;
