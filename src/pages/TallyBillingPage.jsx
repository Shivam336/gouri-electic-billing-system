import React, { useState, useRef, useEffect, useContext } from "react";
import { Trash2, X, Plus } from "lucide-react";
import { DataContext } from "../context/DataContextMain";

const TallyBillingPage = () => {
  const dataContext = useContext(DataContext);
  const [dataForProductList, setDataForProductList] = useState([]);
  const [dataForBillList, setDataForBillList] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const [productSuggestionList, setProductSuggestionList] = useState([]);
  const [activeItemRow, setActiveItemRow] = useState(null);

  // --- CUSTOMER SUGGESTION STATES ---
  const [customerSuggestionList, setCustomerSuggestionList] = useState([]);
  const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState(0);

  const [activeUnitRow, setActiveUnitRow] = useState(null);
  const [highlightedUnitIndex, setHighlightedUnitIndex] = useState(0);

  // --- LINKED BILLS STATE ---
  const [linkedBills, setLinkedBills] = useState([]);
  const [linkBillNo, setLinkBillNo] = useState("");
  const [linkBillAmount, setLinkBillAmount] = useState("");

  // --- PAYMENT SUMMARY STATES ---
  const [globalDiscount, setGlobalDiscount] = useState("");
  const [cashPaid, setCashPaid] = useState("");
  const [upiPaid, setUpiPaid] = useState("");

  // --- ADD THESE NEW STATES ---
  const [isSaved, setIsSaved] = useState(false);
  const [billNo, setBillNo] = useState(() => {
    // Check if we have a saved bill number, otherwise start at 1001
    const savedNo = localStorage.getItem("ge_last_bill_no");
    return savedNo ? (parseInt(savedNo) + 1).toString() : "1001";
  });

  useEffect(() => {
    const loadData = async () => {
      const data = await dataContext.storeAndSearchProducts();
      setDataForProductList(data || []);

      const billData = await dataContext.getAllBillData();
      setDataForBillList(billData || []);
    };
    loadData();
  }, [dataContext]);

  const pageRef = useRef(null);

  // --- 1. STATE ---
  const [items, setItems] = useState([
    {
      id: 1,
      mode: "Sale", // NEW!
      refBill: "", // NEW!
      desc: "",
      hsn: "",
      stock: 0,
      mrp: "",
      qty: "",
      unit: "",
      rate: "",
      tax: "",
      disc: "",
      amount: "0.00",
    },
  ]);

  const [showSavePopup, setShowSavePopup] = useState(false);
  const [customerPastBills, setCustomerPastBills] = useState([]);

  // --- DYNAMIC GLOBAL CALCULATIONS ---
  const salesTotal = items
    .filter((i) => i.mode === "Sale")
    .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  const returnsTotal = items
    .filter((i) => i.mode === "Return")
    .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0); // Is naturally negative

  const netTotal = salesTotal + returnsTotal;
  const currentBill = netTotal - (parseFloat(globalDiscount) || 0);

  const prevBalance = linkedBills.reduce(
    (sum, bill) => sum + parseFloat(bill.amount || 0),
    0,
  );

  const grandTotal = currentBill + prevBalance;
  const totalPaid = (parseFloat(cashPaid) || 0) + (parseFloat(upiPaid) || 0);
  const closingBalance = grandTotal - totalPaid;

  // --- AUTOSCROLL CUSTOMER DROPDOWN ---
  useEffect(() => {
    if (customerSuggestionList.length > 0) {
      const activeElement = document.getElementById(
        `cust-suggestion-${highlightedCustomerIndex}`,
      );
      if (activeElement) {
        activeElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedCustomerIndex, customerSuggestionList]);

  // --- CUSTOMER AUTOCOMPLETE LOGIC ---
  const filterCustomerNameBill = (value) => {
    const searchWords = value.toLowerCase().trim().split(/\s+/);

    if (value.length >= 3 && searchWords.length >= 1) {
      // Lowered to 3 chars for quicker search
      let filteredResults = dataForBillList.filter((item) => {
        const customerNameLowerCase = (item.customer_name || "").toLowerCase();
        return searchWords.every((word) =>
          customerNameLowerCase.includes(word),
        );
      });

      // Filter out duplicate customers so we don't show the same person 10 times
      const uniqueCustomers = [];
      const seen = new Set();
      for (const item of filteredResults) {
        const key = `${item.customer_name}-${item.customer_mobile}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueCustomers.push(item);
        }
      }

      setCustomerSuggestionList(uniqueCustomers);
      setHighlightedCustomerIndex(0);
    } else {
      setCustomerSuggestionList([]);
    }
  };

  const handleCustomerSelect = (customer) => {
    // 1. Fill the DOM inputs
    const nameInput = document.getElementById("customer-name-input");
    if (nameInput) nameInput.value = customer.customer_name || "";

    const phoneInput = document.getElementById("customer-phone-input");
    if (phoneInput) phoneInput.value = customer.customer_mobile || "";

    const addressInput = document.querySelector(
      'input[placeholder="Enter Address..."]',
    );
    if (addressInput) addressInput.value = customer.customer_address || "";

    const refNameInput = document.getElementById("ref-name-input");
    if (refNameInput) refNameInput.value = customer.ref_name || "";

    const refPhoneInput = document.getElementById("ref-phone-input");
    if (refPhoneInput) refPhoneInput.value = customer.ref_mobile || "";

    // 2. Clear the dropdown
    setCustomerSuggestionList([]);

    // --- NEW: FETCH PAST BILLS FOR THIS CUSTOMER ---
    const pastBills = dataForBillList.filter(
      (b) =>
        b.customer_name === customer.customer_name &&
        b.customer_mobile === customer.customer_mobile,
    );
    setCustomerPastBills(pastBills);

    // 3. Jump focus to the items grid automatically!
    setTimeout(() => {
      document.querySelector('[data-col="0"]')?.focus();
    }, 10);
  };

  const handleCustomerNameKeyDown = (e) => {
    // If the dropdown is open, intercept the keys!
    if (customerSuggestionList.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation(); // Stops the global handleKeyDown from stealing the key
        setHighlightedCustomerIndex((prev) =>
          prev < customerSuggestionList.length - 1 ? prev + 1 : prev,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setHighlightedCustomerIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (customerSuggestionList[highlightedCustomerIndex]) {
          handleCustomerSelect(
            customerSuggestionList[highlightedCustomerIndex],
          );
        }
        return;
      }
      if (e.key === "Escape") {
        setCustomerSuggestionList([]);
        return;
      }
    }
    // If dropdown is closed, just run the mandatory red-flash check
    enforceMandatory(e);
  };

  // --- LINKED BILLS LOGIC ---
  const handleAddLinkedBill = () => {
    if (linkBillNo.trim() && linkBillAmount) {
      setLinkedBills([
        ...linkedBills,
        { no: linkBillNo.trim(), amount: parseFloat(linkBillAmount) },
      ]);
      setLinkBillNo("");
      setLinkBillAmount("");
    }
  };

  const handleRemoveLinkedBill = (indexToRemove) => {
    setLinkedBills(linkedBills.filter((_, i) => i !== indexToRemove));
  };

  // --- AUTOSCROLL THE DROPDOWN ---
  useEffect(() => {
    if (activeItemRow !== null && productSuggestionList.length > 0) {
      const activeElement = document.getElementById(
        `suggestion-${highlightedIndex}`,
      );
      if (activeElement) {
        activeElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, activeItemRow, productSuggestionList]);

  // --- SAVE AND PRINT LOGIC ---
  // --- UPDATED SAVE/PRINT LOGIC ---
  const handleSaveBill = async (isPrintAction = false) => {
    // 1. IF CLICKING PRINT AND ALREADY SAVED, JUST OPEN PREVIEW
    if (isPrintAction && isSaved) {
      setShowSavePopup(true);
      return;
    }

    const customerName = document
      .getElementById("customer-name-input")
      ?.value.trim();
    const customerPhone = document
      .getElementById("customer-phone-input")
      ?.value.trim();
    const customerAddress =
      document
        .querySelector('input[placeholder="Enter Address..."]')
        ?.value.trim() || "";

    if (!customerName) {
      alert("Customer Name is required to save the bill.");
      document.getElementById("customer-name-input")?.focus();
      return;
    }

    const validItems = items.filter((i) => i.desc.trim() !== "");
    if (validItems.length === 0) {
      alert("Please add at least one item to the bill.");
      return;
    }

    const payload = {
      billNo: billNo, // Use the state variable here
      date: document.getElementById("date-input")?.value,
      customerName: customerName,
      customerPhone: customerPhone,
      customerAddress: customerAddress,
      refName: document.getElementById("ref-name-input")?.value.trim() || "",
      refPhone: document.getElementById("ref-phone-input")?.value.trim() || "",
      items: validItems,
      salesTotal: salesTotal,
      returnsTotal: returnsTotal,
      netTotal: netTotal,
      linkedBills: linkedBills,
      prevBalance: prevBalance,
      globalDiscount: globalDiscount || 0,
      grandTotal: grandTotal,
      payments: { cash: cashPaid || 0, upi: upiPaid || 0 },
      totalPayment: totalPaid,
      closingBalance: closingBalance,
      remarks: document.getElementById("remarks-input")?.value || "",
    };

    // 2. OPTIMISTIC UI: Open print preview INSTANTLY before waiting for Google Sheets
    if (isPrintAction) {
      setShowSavePopup(true);
    }

    // 3. Lock the bill to prevent duplicate saves
    setIsSaved(true);
    localStorage.setItem("ge_last_bill_no", billNo); // Remember this number

    // 4. Fire the save to Google Sheets in the background!
    dataContext.saveBillToSheet(payload).then((result) => {
      if (!result?.success) {
        console.error("Background save failed:", result?.error);
        alert("Warning: Failed to save to Google Sheets.");
        setIsSaved(false); // Unlock if it failed so they can try again
      } else if (!isPrintAction) {
        alert("Bill saved successfully!");
      }
    });
  };

  // --- NEW RESET FUNCTION ---
  const resetForm = () => {
    // Bump Bill Number
    setBillNo((prev) => (parseInt(prev) + 1).toString());

    // Reset Data
    setItems([
      {
        id: Date.now(),
        mode: "Sale",
        refBill: "",
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
    setLinkedBills([]);
    setCustomerSuggestionList([]);
    setCustomerPastBills([]); // Clear past bills table
    setGlobalDiscount("");
    setCashPaid("");
    setUpiPaid("");
    setIsSaved(false); // Unlock saving for the new bill

    // Clear Inputs
    document.getElementById("customer-name-input").value = "";
    document.getElementById("customer-phone-input").value = "";
    const addr = document.querySelector(
      'input[placeholder="Enter Address..."]',
    );
    if (addr) addr.value = "";
    document.getElementById("ref-name-input").value = "";
    document.getElementById("ref-phone-input").value = "";
    document.getElementById("remarks-input").value = "";

    document.getElementById("customer-name-input")?.focus();
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

    // --- NEW FIX: Let buttons handle their own Enter key naturally! ---
    if (target.tagName === "BUTTON" && e.key === "Enter") {
      return; // Stop the global handler from swallowing the click
    }

    if (currentId === "remarks-input") {
      if (
        (e.key === "ArrowUp" || e.key === "ArrowLeft") &&
        target.selectionStart === 0
      ) {
        e.preventDefault();
        document
          .querySelector(`input[data-row="${items.length - 1}"][data-col="10"]`) // Jump to Amount col
          ?.focus();
        return;
      }
      if (
        (e.key === "ArrowDown" || e.key === "ArrowRight") &&
        target.selectionEnd === target.value.length
      ) {
        e.preventDefault();
        document.getElementById("discount-input")?.focus();
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
        document.getElementById("upi-input")?.focus();
        return;
      }
      if (["Enter", "ArrowRight", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        // Move focus to the Save button instead of instantly saving
        document.getElementById("save-btn")?.focus();
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
      if (currentId === "link-bill-amt") return; // Prevent skipping when adding linked bill
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

  const handleUnitSelect = (rowIndex, selectedUnit) => {
    updateItem(rowIndex, "unit", selectedUnit);
    setActiveUnitRow(null);

    // Jumps to Tax % (col 9) after selecting Unit
    setTimeout(() => {
      document
        .querySelector(`input[data-row="${rowIndex}"][data-col="9"]`)
        ?.focus();
    }, 10);
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
      if (
        target.readOnly ||
        target.selectionStart === 0 ||
        target.tagName === "SELECT"
      ) {
        nextCol = col - 1;
        e.preventDefault();
      } else return;
    } else if (e.key === "ArrowRight") {
      if (
        target.readOnly ||
        target.tagName === "SELECT" ||
        target.selectionEnd === (target.value?.length || 0)
      ) {
        nextCol = col + 1;
        e.preventDefault();
      } else return;
    }

    if (nextRow !== row || nextCol !== col) {
      const nextCell = document.querySelector(
        `[data-row="${nextRow}"][data-col="${nextCol}"]`,
      );
      if (nextCell) {
        nextCell.focus();
      }
    }
  };

  const handleDescKeyDown = (e, index) => {
    const isDescEmpty = items[index].desc.trim() === "";
    const isDropdownOpen =
      activeItemRow === index && productSuggestionList.length > 0;

    // --- 1. NEW: DROPDOWN KEYBOARD NAVIGATION ---
    if (isDropdownOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setHighlightedIndex((prev) =>
          prev < productSuggestionList.length - 1 ? prev + 1 : prev,
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (productSuggestionList[highlightedIndex]) {
          handleProductSelect(index, productSuggestionList[highlightedIndex]);
        }
        return;
      }

      if (e.key === "Escape") {
        setProductSuggestionList([]);
        setActiveItemRow(null);
        return;
      }
    }

    // --- 2. EXISTING LOGIC (If dropdown is closed) ---
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
            mode: "Sale",
            refBill: "",
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
              .querySelector(`[data-row="${index + 1}"][data-col="0"]`) // Jumps to Mode Select
              ?.focus(),
          10,
        );
      }
    }
  };

  // --- WHEN A PRODUCT IS SELECTED ---
  const handleProductSelect = (rowIndex, product) => {
    const newItems = [...items];

    newItems[rowIndex].desc = product.desc;
    newItems[rowIndex].hsn = product.hsn || "";
    newItems[rowIndex].stock = product.stock || 0;
    newItems[rowIndex].mrp = product.mrp || "";

    newItems[rowIndex].primaryUnit = product.uqc;
    newItems[rowIndex].primaryRate = product.sale;
    newItems[rowIndex].altUnit = product.perUQC;
    newItems[rowIndex].altRate = product.salePerUQC;

    newItems[rowIndex].unit = product.uqc || "Pcs";
    newItems[rowIndex].rate = product.sale || product.mrp || "";
    newItems[rowIndex].qty = "1";

    // Amount Calculation (Respects Mode)
    const q = 1;
    const r = parseFloat(newItems[rowIndex].rate) || 0;
    const t = parseFloat(newItems[rowIndex].tax) || 0;
    let finalAmount = q * (r + (r * t) / 100);

    if (newItems[rowIndex].mode === "Return") {
      finalAmount = -Math.abs(finalAmount);
    }

    newItems[rowIndex].amount = finalAmount.toFixed(2);

    setItems(newItems);
    setProductSuggestionList([]);
    setActiveItemRow(null);

    // Jumps to col 3 (HSN)
    setTimeout(() => {
      document
        .querySelector(`input[data-row="${rowIndex}"][data-col="3"]`)
        ?.focus();
    }, 10);
  };

  // --- THE MASTER MATH ENGINE ---
  const updateItem = (index, field, value) => {
    // 1. CAPTURE THE OLD UNIT BEFORE WE UPDATE STATE
    const oldUnit = items[index].unit;

    const newItems = [...items];
    newItems[index][field] = value;
    const row = newItems[index];

    // Clear Ref Bill if swapped back to Sale
    if (field === "mode" && value === "Sale") {
      row.refBill = "";
    }

    // 1. UNIT SWAP: Change rate based on Unit
    if (field === "unit") {
      const typedUnit = value.toLowerCase().trim();
      const prevUnit = (oldUnit || "").toLowerCase().trim();
      if (typedUnit !== prevUnit) {
        if (row.altUnit && typedUnit === row.altUnit.toLowerCase().trim()) {
          row.rate = row.altRate || "";
        } else if (
          row.primaryUnit &&
          typedUnit === row.primaryUnit.toLowerCase().trim()
        ) {
          row.rate = row.primaryRate || "";
        }
      }
    }

    // 2. DISCOUNT LOGIC: Calculate Rate from MRP - Disc%
    if (field === "disc" || field === "mrp") {
      const d = parseFloat(row.disc) || 0;
      const m = parseFloat(row.mrp) || 0;

      if (d > 0 && m > 0) {
        row.rate = (m - (m * d) / 100).toFixed(2);
      } else if (field === "disc" && (value.trim() === "" || d === 0)) {
        const typedUnit = (row.unit || "").toLowerCase().trim();
        if (row.altUnit && typedUnit === row.altUnit.toLowerCase().trim()) {
          row.rate = row.altRate || "";
        } else {
          row.rate = row.primaryRate || "";
        }
      }
    }

    // 3. FINAL AMOUNT CALCULATION: Qty * (Rate + Tax)
    if (["qty", "rate", "disc", "tax", "mrp", "unit", "mode"].includes(field)) {
      // Force positive quantity internally to prevent double negatives
      const q = Math.abs(parseFloat(row.qty) || 0);
      const r = parseFloat(row.rate) || 0;
      const t = parseFloat(row.tax) || 0;

      const rateWithTax = r + (r * t) / 100;
      let finalAmount = q * rateWithTax;

      // Smart Return Math
      if (row.mode === "Return") {
        finalAmount = -Math.abs(finalAmount);
      } else {
        finalAmount = Math.abs(finalAmount);
      }

      row.amount = finalAmount.toFixed(2);
    }

    setItems(newItems);

    // --- ITEM SEARCH LOGIC ---
    if (field == "desc") {
      const searchWords = value.toLowerCase().trim().split(/\s+/);

      if (value.length >= 6 && searchWords.length >= 2) {
        let filteredResults = dataForProductList.filter((item) => {
          const itemDescLowerCase = item.desc.toLowerCase();
          return searchWords.every((word) => itemDescLowerCase.includes(word));
        });

        setProductSuggestionList(filteredResults);
        setActiveItemRow(index);
        setHighlightedIndex(0);
      } else {
        setProductSuggestionList([]);
        setActiveItemRow(null);
      }
    }
  };

  const deleteItem = (indexToDelete) => {
    if (items.length === 1) {
      setItems([
        {
          id: Date.now(),
          mode: "Sale",
          refBill: "",
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
        {/* Top Form Bar (Cleaned Up!) */}
        <div className="flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col">
              <label className={labelHeadingCSS}>Bill No.</label>
              <input
                id="bill-no-input"
                type="text"
                value={billNo}
                className={`${fieldCSS} w-24 bg-gray-50`}
                onChange={(e) => setBillNo(e.target.value)}
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
            <div className="flex flex-col flex-1 min-w-[200px] relative">
              <label className={labelHeadingCSS}>
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                id="customer-name-input"
                type="text"
                placeholder="Enter name..."
                className={`${fieldCSS} w-full`}
                onKeyDown={handleCustomerNameKeyDown}
                onChange={(e) => filterCustomerNameBill(e.target.value)}
                autoComplete="off"
              />

              {/* --- CUSTOMER SUGGESTION DROPDOWN --- */}
              {customerSuggestionList.length > 0 && (
                <div className="absolute top-[100%] left-0 w-full min-w-[300px] bg-white border border-gray-300 shadow-2xl rounded-b-md z-50 max-h-60 overflow-y-auto mt-1">
                  {customerSuggestionList.map((customer, i) => (
                    <div
                      key={i}
                      id={`cust-suggestion-${i}`}
                      onClick={() => handleCustomerSelect(customer)}
                      className={`p-2 text-[12px] cursor-pointer border-b border-gray-100 flex flex-col transition-colors ${
                        highlightedCustomerIndex === i
                          ? "bg-blue-100 border-l-4 border-l-blue-600"
                          : "hover:bg-blue-50 bg-white border-l-4 border-l-transparent"
                      }`}
                    >
                      <span className="font-bold text-[#1e3a8a]">
                        {customer.customer_name}
                      </span>
                      <div className="flex text-gray-500 text-[11px] mt-0.5 items-center">
                        <span>
                          Ph:{" "}
                          <span className="font-medium text-gray-700">
                            {customer.customer_mobile || "N/A"}
                          </span>
                        </span>
                        {customer.customer_address && (
                          <span className="border-l border-gray-300 pl-2 ml-2 truncate">
                            Addr: {customer.customer_address}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                        mode: "Sale",
                        refBill: "",
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
                      () => document.querySelector('[data-col="0"]')?.focus(),
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
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="bg-gray-100 text-[12px] font-semibold text-gray-700 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-2 w-10 text-center border-b border-r border-gray-300">
                    #
                  </th>
                  <th className="p-2 w-24 border-b border-r border-gray-300">
                    Mode
                  </th>
                  <th className="p-2 w-28 border-b border-r border-gray-300">
                    Ref Bill
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
                    Qty <span className="text-red-500">*</span>
                  </th>
                  <th className="p-2 w-16 border-b border-r border-gray-300">
                    MRP
                  </th>
                  <th className="p-2 w-16 border-b border-r border-gray-300">
                    Disc %
                  </th>
                  <th className="p-2 w-24 border-b border-r border-gray-300">
                    Rate <span className="text-red-500">*</span>
                  </th>
                  <th className="p-2 w-20 border-b border-r border-gray-300">
                    Unit <span className="text-red-500">*</span>
                  </th>
                  <th className="p-2 w-16 border-b border-r border-gray-300">
                    Tax %
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
                    className={`border-b border-gray-200 transition-colors ${item.mode === "Return" ? "bg-red-50/60 hover:bg-red-100/60" : "hover:bg-gray-50"}`}
                  >
                    <td className="p-1 border-r border-gray-200 text-center text-[12px] text-gray-500 font-medium">
                      {index + 1}
                    </td>

                    {/* Col 0: Mode Dropdown */}
                    <td className="p-1 border-r border-gray-200">
                      <select
                        data-row={index}
                        data-col="0"
                        value={item.mode}
                        onChange={(e) =>
                          updateItem(index, "mode", e.target.value)
                        }
                        className={`${tableInputCSS} cursor-pointer font-bold ${item.mode === "Return" ? "text-red-600" : "text-gray-700"}`}
                      >
                        <option value="Sale">Sale</option>
                        <option value="Return">Return</option>
                      </select>
                    </td>

                    {/* Col 1: Ref Bill */}
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="1"
                        value={item.refBill}
                        onChange={(e) =>
                          updateItem(index, "refBill", e.target.value)
                        }
                        readOnly={item.mode === "Sale"}
                        tabIndex={item.mode === "Sale" ? -1 : 0}
                        className={`${tableInputCSS} uppercase ${item.mode === "Sale" ? "opacity-30 cursor-not-allowed bg-transparent" : "bg-white font-bold"}`}
                        placeholder={item.mode === "Sale" ? "N/A" : "INV-..."}
                      />
                    </td>

                    {/* Col 2: Desc */}
                    <td className="p-1 border-r border-gray-200 relative">
                      <input
                        id={`desc-${index}`}
                        data-row={index}
                        data-col="2"
                        value={item.desc}
                        onChange={(e) =>
                          updateItem(index, "desc", e.target.value)
                        }
                        onKeyDown={(e) => handleDescKeyDown(e, index)}
                        className={`${tableInputCSS} font-medium`}
                        placeholder="Type item..."
                        autoComplete="off"
                      />
                      {activeItemRow === index &&
                        productSuggestionList.length > 0 && (
                          <div className="absolute top-[100%] left-0 w-[450px] bg-white border border-gray-300 shadow-2xl rounded-b-md z-50 max-h-60 overflow-y-auto">
                            {productSuggestionList.map((prod, i) => (
                              <div
                                key={i}
                                id={`suggestion-${i}`}
                                onClick={() => handleProductSelect(index, prod)}
                                className={`p-2 text-[12px] cursor-pointer border-b border-gray-100 flex flex-col transition-colors ${
                                  highlightedIndex === i
                                    ? "bg-blue-100 border-l-4 border-l-blue-600"
                                    : "hover:bg-blue-50 bg-white border-l-4 border-l-transparent"
                                }`}
                              >
                                <span className="font-bold text-[#1e3a8a]">
                                  {prod.desc}
                                </span>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-gray-500 text-[11px] mt-1 items-center">
                                  <span>
                                    Stock:{" "}
                                    <span
                                      className={
                                        prod.stock > 0
                                          ? "text-green-600 font-bold text-[12px]"
                                          : "text-red-500 font-bold text-[12px]"
                                      }
                                    >
                                      {prod.stock}
                                    </span>
                                  </span>
                                  <span className="border-l border-gray-300 pl-3">
                                    Pur:{" "}
                                    <span className="font-bold text-gray-700">
                                      ₹{prod.purchase || "0"}
                                    </span>
                                  </span>
                                  <span className="border-l border-gray-300 pl-3">
                                    MRP: ₹{prod.mrp}
                                  </span>
                                  <span className="border-l border-gray-300 pl-3 font-bold text-gray-700">
                                    ₹{prod.sale}/{prod.uqc}
                                  </span>
                                  {prod.perUQC && prod.salePerUQC && (
                                    <span className="border-l border-gray-300 pl-3 font-bold text-blue-600">
                                      ₹{prod.salePerUQC}/{prod.perUQC}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </td>

                    {/* Col 3: HSN */}
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="3"
                        value={item.hsn}
                        onChange={(e) =>
                          updateItem(index, "hsn", e.target.value)
                        }
                        className={tableInputCSS}
                        placeholder="-"
                      />
                    </td>

                    {/* Plain Text: Stock */}
                    <td className="p-1 border-r border-gray-200 px-2 text-[12px] text-gray-500 bg-transparent text-center">
                      {item.stock}
                    </td>

                    {/* Col 4: Qty */}
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="4"
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

                    {/* Col 5: MRP */}
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="5"
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

                    {/* Col 6: Disc % */}
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="6"
                        type="text"
                        inputMode="decimal"
                        value={item.disc}
                        onChange={(e) =>
                          updateItem(index, "disc", e.target.value)
                        }
                        className={`${tableInputCSS} text-center text-blue-600 font-bold`}
                        placeholder="0"
                      />
                    </td>

                    {/* Col 7: Rate */}
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="7"
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

                    {/* Col 8: Unit */}
                    <td className="p-1 border-r border-gray-200 relative">
                      {(() => {
                        const availableUnits = [
                          item.primaryUnit,
                          item.altUnit,
                        ].filter(Boolean);
                        if (availableUnits.length === 0)
                          availableUnits.push("Pcs");

                        const unitsToShow =
                          item.unit.trim() === ""
                            ? availableUnits
                            : availableUnits.filter((u) =>
                                u
                                  .toLowerCase()
                                  .includes(item.unit.toLowerCase()),
                              );

                        return (
                          <>
                            <input
                              data-row={index}
                              data-col="8"
                              type="text"
                              value={item.unit}
                              autoComplete="off"
                              placeholder="Pcs"
                              className={`${tableInputCSS} text-center font-bold text-[#1e3a8a]`}
                              onChange={(e) => {
                                updateItem(index, "unit", e.target.value);
                                setActiveUnitRow(index);
                                setHighlightedUnitIndex(0);
                              }}
                              onFocus={() => {
                                setActiveUnitRow(index);
                                setHighlightedUnitIndex(0);
                              }}
                              onBlur={() =>
                                setTimeout(() => setActiveUnitRow(null), 200)
                              }
                              onKeyDown={(e) => {
                                if (
                                  activeUnitRow === index &&
                                  unitsToShow.length > 0
                                ) {
                                  if (e.key === "ArrowDown") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setHighlightedUnitIndex((prev) =>
                                      prev < unitsToShow.length - 1
                                        ? prev + 1
                                        : prev,
                                    );
                                    return;
                                  }
                                  if (e.key === "ArrowUp") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setHighlightedUnitIndex((prev) =>
                                      prev > 0 ? prev - 1 : 0,
                                    );
                                    return;
                                  }
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (unitsToShow[highlightedUnitIndex]) {
                                      handleUnitSelect(
                                        index,
                                        unitsToShow[highlightedUnitIndex],
                                      );
                                    }
                                    return;
                                  }
                                  if (e.key === "Escape") {
                                    setActiveUnitRow(null);
                                    return;
                                  }
                                }
                                enforceMandatory(e);
                              }}
                            />
                            {activeUnitRow === index &&
                              unitsToShow.length > 0 && (
                                <div className="absolute top-[100%] left-0 w-full min-w-[80px] bg-white border border-gray-300 shadow-xl rounded-b-md z-50 overflow-hidden">
                                  {unitsToShow.map((unitOpt, i) => (
                                    <div
                                      key={i}
                                      onClick={() =>
                                        handleUnitSelect(index, unitOpt)
                                      }
                                      className={`p-2 text-[12px] font-bold text-center cursor-pointer border-b border-gray-100 transition-colors ${
                                        highlightedUnitIndex === i
                                          ? "bg-blue-100 text-[#1e3a8a]"
                                          : "hover:bg-blue-50 bg-white text-gray-700"
                                      }`}
                                    >
                                      {unitOpt}
                                    </div>
                                  ))}
                                </div>
                              )}
                          </>
                        );
                      })()}
                    </td>

                    {/* Col 9: Tax % */}
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="9"
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

                    {/* Col 10: Amount */}
                    <td className="p-1 border-r border-gray-200">
                      <input
                        data-row={index}
                        data-col="10"
                        value={item.amount}
                        readOnly
                        onKeyDown={(e) => handleLastColumnKeyDown(e, index)}
                        className={`${tableInputCSS} font-bold text-right ${item.mode === "Return" ? "text-red-700" : "text-gray-900"}`}
                      />
                    </td>

                    {/* Delete Row */}
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
            {/* LINKED PREVIOUS BILLS WIDGET */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col gap-3 flex-1 overflow-hidden">
              <label className="text-[12px] font-semibold text-gray-700 block uppercase tracking-wider">
                Link Previous Pending Bills (Dues)
              </label>

              {/* Input Fields & Add Button */}
              <div className="flex gap-3 items-center shrink-0">
                <input
                  type="text"
                  placeholder="Bill No (e.g. 102)"
                  value={linkBillNo}
                  onChange={(e) => setLinkBillNo(e.target.value)}
                  className={`${fieldCSS} w-36 uppercase`}
                />
                <input
                  id="link-bill-amt"
                  type="number"
                  placeholder="Amount (₹)"
                  value={linkBillAmount}
                  onChange={(e) => setLinkBillAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddLinkedBill()}
                  className={`${fieldCSS} w-32 text-right`}
                />
                <button
                  onClick={handleAddLinkedBill}
                  tabIndex="-1"
                  className="px-3 py-1.5 bg-blue-100 text-[#1e3a8a] font-bold rounded-md hover:bg-blue-200 transition-colors flex items-center gap-1 text-[12px]"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              {/* NEW: EXPANDED DYNAMIC PAST BILLS TABLE */}
              {customerPastBills.length > 0 && (
                <div className="mt-1 flex-1 overflow-auto border border-gray-200 rounded-md shadow-inner">
                  <table className="w-full text-left text-[11px] whitespace-nowrap min-w-max">
                    <thead className="bg-gray-100 sticky top-0 shadow-sm z-10">
                      <tr>
                        <th className="p-1.5 border-b font-semibold text-gray-600">
                          Bill No
                        </th>
                        <th className="p-1.5 border-b font-semibold text-gray-600">
                          Date
                        </th>
                        <th className="p-1.5 border-b font-semibold text-gray-600 text-right">
                          Sale Total
                        </th>
                        <th className="p-1.5 border-b font-semibold text-gray-600 text-right">
                          Returns
                        </th>
                        <th className="p-1.5 border-b font-semibold text-gray-600 text-right">
                          Net Bill
                        </th>
                        <th className="p-1.5 border-b font-semibold text-gray-600 text-center">
                          Prev Bills
                        </th>
                        <th className="p-1.5 border-b font-semibold text-gray-600 text-right">
                          Prev Total
                        </th>
                        <th className="p-1.5 border-b font-semibold text-gray-600 text-right">
                          Disc
                        </th>
                        <th className="p-1.5 border-b font-semibold text-gray-600 text-right">
                          Grand Total
                        </th>
                        <th className="p-1.5 border-b font-semibold text-gray-600 text-right">
                          Paid
                        </th>
                        <th className="p-1.5 border-b font-semibold text-gray-600 text-right">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerPastBills.map((bill, i) => {
                        const bal = parseFloat(bill.closing_balance) || 0;

                        // 1. SAFE DATE PARSING
                        let formattedDate = bill.date || "";
                        if (formattedDate) {
                          const d = new Date(formattedDate);
                          if (!isNaN(d)) {
                            // Formats to standard DD/MM/YYYY
                            formattedDate = d.toLocaleDateString("en-IN");
                          }
                        }

                        // 2. PARSE LINKED BILLS JSON
                        let prevBillsList = "-";
                        try {
                          if (bill.previous_bills) {
                            const parsedList = JSON.parse(bill.previous_bills);
                            if (
                              Array.isArray(parsedList) &&
                              parsedList.length > 0
                            ) {
                              prevBillsList = parsedList
                                .map((b) => b.id || b.no)
                                .join(", ");
                            }
                          }
                        } catch (e) {
                          // Failsafe in case it's not JSON
                        }

                        return (
                          <tr
                            key={i}
                            className="border-b cursor-pointer hover:bg-blue-100 transition-colors group"
                            onClick={() => {
                              setLinkBillNo(String(bill.id));
                              setLinkBillAmount(Math.abs(bal).toString());
                              setTimeout(
                                () =>
                                  document
                                    .getElementById("link-bill-amt")
                                    ?.focus(),
                                10,
                              );
                            }}
                          >
                            <td className="p-1.5 font-bold text-[#1e3a8a] group-hover:underline">
                              {bill.id}
                            </td>
                            <td className="p-1.5 text-gray-600">
                              {formattedDate}
                            </td>
                            <td className="p-1.5 text-right text-gray-600">
                              {bill.sale_total || "0"}
                            </td>
                            <td className="p-1.5 text-right text-red-500">
                              {bill.return_total || "0"}
                            </td>
                            <td className="p-1.5 text-right font-medium text-gray-800">
                              {bill.net_bill || "0"}
                            </td>
                            <td className="p-1.5 text-center text-gray-500 font-medium">
                              {prevBillsList}
                            </td>
                            <td className="p-1.5 text-right text-gray-600">
                              {bill.total_previous_bill || "0"}
                            </td>
                            <td className="p-1.5 text-right text-gray-600">
                              {bill.bill_discount || "0"}
                            </td>
                            <td className="p-1.5 text-right font-bold text-gray-800">
                              {bill.grand_total_due || "0"}
                            </td>
                            <td className="p-1.5 text-right text-green-600">
                              {bill.total_payment || "0"}
                            </td>
                            <td
                              className={`p-1.5 text-right font-bold ${bal > 0 ? "text-red-600" : bal < 0 ? "text-green-600" : "text-gray-500"}`}
                            >
                              {bal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pilled List of Linked Bills */}
              {linkedBills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-gray-100 shrink-0">
                  {linkedBills.map((lb, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 bg-gray-100 border border-gray-300 px-2.5 py-1 rounded text-[11px] font-bold text-gray-700"
                    >
                      {lb.no}:{" "}
                      <span className="text-red-600">
                        ₹{lb.amount.toFixed(2)}
                      </span>
                      <X
                        size={14}
                        className="cursor-pointer text-gray-400 hover:text-red-600 ml-1 transition-colors"
                        onClick={() => handleRemoveLinkedBill(i)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* REMARKS & BANK DETAILS (Height shrunk down) */}
            <div className="flex gap-4 shrink-0 h-[100px]">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 flex-1 flex flex-col">
                <label className="text-[11px] font-semibold text-gray-700 mb-1 block">
                  Remarks / Warranty
                </label>
                <textarea
                  id="remarks-input"
                  className="w-full flex-1 p-2 border border-gray-300 rounded outline-none focus:border-[#1e3a8a] focus:bg-blue-50 focus:ring-1 focus:ring-[#1e3a8a] text-[11px] resize-none text-gray-800 font-medium transition-all"
                  placeholder="Enter remarks..."
                ></textarea>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 flex-1">
                <label className="text-[11px] font-semibold text-gray-700 mb-1 block">
                  Bank Details
                </label>
                <div className="text-[11px] text-gray-600 space-y-0.5 mt-1">
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
            <div className="p-4 flex flex-col gap-2.5 flex-1">
              {/* SALE & RETURN SPLIT */}
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-semibold text-gray-700">
                  Sales Total
                </span>
                <input
                  readOnly
                  value={salesTotal.toFixed(2)}
                  className={`${fieldCSS} w-32 text-right bg-gray-50`}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-semibold text-gray-700">
                  Returns Total
                </span>
                <input
                  readOnly
                  value={returnsTotal.toFixed(2)}
                  className={`${fieldCSS} w-32 text-right bg-gray-50 text-red-600`}
                />
              </div>
              <hr className="my-1 border-gray-200" />

              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold text-gray-800">
                  Net Bill (Sale - Return)
                </span>
                <input
                  readOnly
                  value={netTotal.toFixed(2)}
                  className={`${fieldCSS} w-32 text-right bg-transparent border-none font-bold text-[13px]`}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[12px] font-semibold text-gray-700">
                  (-) Global Discount
                </span>
                <input
                  id="discount-input"
                  type="text"
                  inputMode="decimal"
                  value={globalDiscount}
                  onChange={(e) => setGlobalDiscount(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                  className={`${fieldCSS} w-32 text-right text-[#1e3a8a]`}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[12px] font-semibold text-gray-700">
                  (+) Previous Dues
                </span>
                <input
                  readOnly
                  value={prevBalance.toFixed(2)}
                  className={`${fieldCSS} w-32 text-right bg-gray-50 text-red-600`}
                />
              </div>

              <hr className="my-1 border-gray-200" />

              <div
                className={`flex justify-between items-center p-2 rounded-md border ${grandTotal < 0 ? "bg-green-50 border-green-200" : "bg-blue-50/50 border-blue-100"}`}
              >
                <span
                  className={`text-[13px] font-bold ${grandTotal < 0 ? "text-green-700" : "text-[#1e3a8a]"}`}
                >
                  {grandTotal < 0
                    ? "Refund Due To Customer"
                    : "Grand Total Due"}
                </span>
                <input
                  readOnly
                  value={Math.abs(grandTotal).toFixed(2)}
                  className={`px-2 py-1 outline-none w-32 text-right bg-transparent border-none text-lg font-bold ${grandTotal < 0 ? "text-green-700" : "text-[#1e3a8a]"}`}
                />
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  {grandTotal < 0 ? "Refund Issued Via" : "Payments Received"}
                </span>
                <div className="flex justify-between items-center pl-2">
                  <span className="text-[12px] font-medium text-gray-700">
                    Cash
                  </span>
                  <input
                    id="cash-input"
                    type="text"
                    inputMode="decimal"
                    value={cashPaid}
                    onChange={(e) => setCashPaid(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
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
                    value={upiPaid}
                    onChange={(e) => setUpiPaid(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    className={`${fieldCSS} w-28 text-right`}
                  />
                </div>
              </div>
            </div>

            <div
              className={`text-white px-5 py-3 flex justify-between items-center ${closingBalance < 0 ? "bg-green-700" : "bg-gray-800"}`}
            >
              <span className="text-[13px] font-medium tracking-wide">
                Closing Balance {closingBalance < 0 && "(Overpaid)"}
              </span>
              <input
                id="closing-balance-input"
                readOnly
                value={Math.abs(closingBalance).toFixed(2)}
                className="bg-transparent text-xl font-bold text-white outline-none text-right w-40 cursor-default focus:ring-2 focus:ring-white rounded px-1 transition-shadow"
              />
            </div>

            <div className="p-3 bg-gray-100 flex gap-3 rounded-b-lg border-t border-gray-300">
              <button
                id="reset-btn"
                onClick={resetForm}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-[13px] font-semibold py-2.5 rounded-md shadow-sm transition-colors active:scale-95 outline-none focus:ring-4 focus:ring-gray-300"
                tabIndex="-1"
              >
                New Bill / Reset
              </button>
              <button
                id="save-btn"
                onClick={() => {
                  handleSaveBill(false);
                  // Automatically shift focus to the Print button after saving/updating
                  setTimeout(
                    () => document.getElementById("print-btn")?.focus(),
                    50,
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    document.getElementById("print-btn")?.focus();
                  } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    document.getElementById("reset-btn")?.focus();
                  }
                }}
                // Notice we removed disabled={isSaved} from here
                className={`flex-1 text-white text-[13px] font-semibold py-2.5 rounded-md shadow-sm transition-colors active:scale-95 outline-none focus:ring-4 focus:ring-blue-300 ${isSaved ? "bg-teal-600 hover:bg-teal-700" : "bg-[#1e3a8a] hover:bg-blue-800"}`}
              >
                {isSaved ? "Update ✔" : "Save"}
              </button>
              <button
                id="print-btn"
                onClick={() => handleSaveBill(true)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    document.getElementById("save-btn")?.focus();
                  }
                }}
                className="flex-[1.5] bg-green-600 hover:bg-green-700 text-white text-[13px] font-semibold py-2.5 rounded-md shadow-sm transition-colors active:scale-95 outline-none focus:ring-4 focus:ring-green-300"
              >
                Print
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
            if (e.key === "Escape") handleCancelModal();
            else if (e.key === "Enter") handlePrint();
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
              <div className="bg-white p-6 shadow-sm w-full max-w-lg border border-gray-300 h-max min-h-full font-mono text-[12px] leading-snug text-black uppercase">
                <table
                  className="w-full border-collapse"
                  style={{ tableLayout: "fixed" }}
                >
                  <colgroup>
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "42%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "17%" }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <td colSpan="6" className="pb-2 border-0 p-0">
                        <div className="border-t border-b border-dashed border-black py-1 mb-2 flex justify-between items-center font-bold">
                          <span className="text-left">
                            BILL NO:{" "}
                            {document.getElementById("bill-no-input")?.value ||
                              "103"}
                          </span>
                          <span className="text-center tracking-wide text-[14px]">
                            {returnsTotal < 0 && salesTotal === 0
                              ? "CREDIT NOTE"
                              : "TAX INVOICE"}
                          </span>
                          <span className="text-right">
                            DATE:{" "}
                            {document
                              .getElementById("date-input")
                              ?.value.split("-")
                              .reverse()
                              .join("-") || "18-02-2026"}
                          </span>
                        </div>

                        <div className="flex w-full justify-between mb-2 text-[12px] leading-tight break-words whitespace-normal gap-2">
                          <div className="w-[60%] flex flex-col items-start pr-1">
                            <span className="font-bold">
                              CUSTOMER:{" "}
                              {document.getElementById("customer-name-input")
                                ?.value || "Walking Customer"}
                            </span>
                            {document.getElementById("customer-phone-input")
                              ?.value && (
                              <span>
                                Ph:{" "}
                                {
                                  document.getElementById(
                                    "customer-phone-input",
                                  )?.value
                                }
                              </span>
                            )}
                            {document.querySelector(
                              'input[placeholder="Enter Address..."]',
                            )?.value && (
                              <span>
                                Addr:{" "}
                                {
                                  document.querySelector(
                                    'input[placeholder="Enter Address..."]',
                                  )?.value
                                }
                              </span>
                            )}
                          </div>
                          <div className="w-[40%] flex flex-col items-end pl-1 text-right">
                            <span className="font-bold">
                              REF:{" "}
                              {document.getElementById("ref-name-input")
                                ?.value || "N/A"}
                            </span>
                            {document.getElementById("ref-phone-input")
                              ?.value && (
                              <span>
                                Ph:{" "}
                                {
                                  document.getElementById("ref-phone-input")
                                    ?.value
                                }
                              </span>
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
                        TYPE
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
                          <td className="py-1 align-top text-left">
                            {item.mode === "Return" ? "RTN" : "SALE"}
                          </td>
                          <td className="py-1 pr-2 align-top text-left break-words">
                            {item.desc}{" "}
                            {item.mode === "Return" && item.refBill
                              ? `(Ref: ${item.refBill})`
                              : ""}
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
                      <td colSpan="6" className="pt-2 border-0 p-0">
                        <div className="break-inside-avoid">
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
                              <span>{netTotal.toFixed(2)}</span>
                            </div>

                            {globalDiscount > 0 && (
                              <div className="flex justify-between mb-1 w-[65%]">
                                <span>DISCOUNT:</span>
                                <span>{globalDiscount || "0"}</span>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-dashed border-black pt-1">
                            <div className="flex justify-between">
                              <span>CURRENT BILL AMOUNT:</span>
                              <span>{currentBill.toFixed(2)}</span>
                            </div>

                            {linkedBills.length > 0 && (
                              <div className="flex justify-between mb-1">
                                <span>(+) PREVIOUS DUES:</span>
                                <span>{prevBalance.toFixed(2)}</span>
                              </div>
                            )}
                            {linkedBills.length > 0 && (
                              <div className="text-[10px] text-gray-600 flex gap-2 justify-end mb-1">
                                {linkedBills.map((lb, i) => (
                                  <span key={i}>
                                    [{lb.no}: {lb.amount}]
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="border-t border-dashed border-black pt-1">
                            <div className="flex justify-between font-bold text-[13px]">
                              <span>
                                {grandTotal < 0
                                  ? "REFUND DUE:"
                                  : "GRAND TOTAL DUE:"}
                              </span>
                              <span>{Math.abs(grandTotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>PAID NOW (CASH):</span>
                              <span>{cashPaid || "0"}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span>PAID NOW (UPI/BANK):</span>
                              <span>{upiPaid || "0"}</span>
                            </div>
                          </div>

                          <div className="border-t border-b border-dashed border-black py-1 mt-1 flex justify-between font-bold">
                            <span>CLOSING BALANCE:</span>
                            <span>
                              {Math.abs(closingBalance).toFixed(2)}{" "}
                              {closingBalance < 0 && "(OVERPAID)"}
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
        <div className="hidden print:block absolute top-0 left-0 w-[148mm] bg-white text-black px-[10mm] z-[999999] font-mono text-[12px] leading-tight uppercase">
          <table
            className="w-full border-collapse"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: "5%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "42%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "17%" }} />
            </colgroup>

            <thead className="table-header-group">
              <tr>
                <td colSpan="6" className="h-[10mm] border-0 p-0"></td>
              </tr>
              <tr>
                <td colSpan="6" className="pb-2 border-0 p-0">
                  <div className="border-t border-b border-dashed border-black py-1 mb-2 flex justify-between items-center font-bold">
                    <span className="text-left">
                      BILL NO:{" "}
                      {document.getElementById("bill-no-input")?.value || "103"}
                    </span>
                    <span className="text-center tracking-wide text-[14px]">
                      {returnsTotal < 0 && salesTotal === 0
                        ? "CREDIT NOTE"
                        : "TAX INVOICE"}
                    </span>
                    <span className="text-right">
                      DATE:{" "}
                      {document
                        .getElementById("date-input")
                        ?.value.split("-")
                        .reverse()
                        .join("-") || "18-02-2026"}
                    </span>
                  </div>

                  <div className="flex w-full justify-between mb-2 text-[12px] leading-tight break-words whitespace-normal gap-2">
                    <div className="w-[60%] flex flex-col items-start pr-1">
                      <span className="font-bold">
                        CUSTOMER:{" "}
                        {document.getElementById("customer-name-input")
                          ?.value || "Walking Customer"}
                      </span>
                      {document.getElementById("customer-phone-input")
                        ?.value && (
                        <span>
                          Ph:{" "}
                          {
                            document.getElementById("customer-phone-input")
                              ?.value
                          }
                        </span>
                      )}
                      {document.querySelector(
                        'input[placeholder="Enter Address..."]',
                      )?.value && (
                        <span>
                          Addr:{" "}
                          {
                            document.querySelector(
                              'input[placeholder="Enter Address..."]',
                            )?.value
                          }
                        </span>
                      )}
                    </div>
                    <div className="w-[40%] flex flex-col items-end pl-1 text-right">
                      <span className="font-bold">
                        REF:{" "}
                        {document.getElementById("ref-name-input")?.value ||
                          "N/A"}
                      </span>
                      {document.getElementById("ref-phone-input")?.value && (
                        <span>
                          Ph:{" "}
                          {document.getElementById("ref-phone-input")?.value}
                        </span>
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
                  TYPE
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
                    <td className="py-1 align-top text-left">
                      {item.mode === "Return" ? "RTN" : "SALE"}
                    </td>
                    <td className="py-1 pr-2 align-top text-left break-words">
                      {item.desc}{" "}
                      {item.mode === "Return" && item.refBill
                        ? `(Ref: ${item.refBill})`
                        : ""}
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
                <td colSpan="6" className="pt-2 border-0 p-0">
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
                      <span>{netTotal.toFixed(2)}</span>
                    </div>

                    {globalDiscount > 0 && (
                      <div className="flex justify-between mb-1 w-[65%]">
                        <span>DISCOUNT:</span>
                        <span>{globalDiscount || "0"}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-dashed border-black pt-1">
                    <div className="flex justify-between">
                      <span>CURRENT BILL AMOUNT:</span>
                      <span>{currentBill.toFixed(2)}</span>
                    </div>

                    {linkedBills.length > 0 && (
                      <div className="flex justify-between mb-1">
                        <span>(+) PREVIOUS DUES:</span>
                        <span>{prevBalance.toFixed(2)}</span>
                      </div>
                    )}
                    {linkedBills.length > 0 && (
                      <div className="text-[10px] text-gray-600 flex gap-2 justify-end mb-1">
                        {linkedBills.map((lb, i) => (
                          <span key={i}>
                            [{lb.no}: {lb.amount}]
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-dashed border-black pt-1">
                    <div className="flex justify-between font-bold text-[13px]">
                      <span>
                        {grandTotal < 0 ? "REFUND DUE:" : "GRAND TOTAL DUE:"}
                      </span>
                      <span>{Math.abs(grandTotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PAID NOW (CASH):</span>
                      <span>{cashPaid || "0"}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>PAID NOW (UPI/BANK):</span>
                      <span>{upiPaid || "0"}</span>
                    </div>
                  </div>

                  <div className="border-t border-b border-dashed border-black py-1 mt-1 flex justify-between font-bold">
                    <span>CLOSING BALANCE:</span>
                    <span>
                      {Math.abs(closingBalance).toFixed(2)}{" "}
                      {closingBalance < 0 && "(OVERPAID)"}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>

            <tfoot className="table-footer-group">
              <tr>
                <td colSpan="6" className="h-[10mm] border-0 p-0"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </>
  );
};

export default TallyBillingPage;
