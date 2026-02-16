import React, { useState, useEffect } from "react";
import { Trash2, Printer, Save, RefreshCw, Search } from "lucide-react";

import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "./InvoicePDF"; // Import the file you just made

// Replace with your DEPLOYED Web App URL
const API_URL =
  "https://script.google.com/macros/s/AKfycbxkAL4ORInQGzVUIATMvk5BRBesKahsHm74IUbB0oywwzUnCXbmLXTGgXKR7UM3ep4/exec";

const BillingPage = () => {
  // State
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [billId] = useState(
    `BILL-${Math.floor(100000 + Math.random() * 900000)}`,
  );

  // Fetch Data on Load
  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?action=getInventory`);
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error("Error fetching stock", error);
    }
    setLoading(false);
  };

  // Add Item to Cart
  const addToCart = (product) => {
    const existing = cart.find((item) => item.rowIndex === product.rowIndex);

    if (existing) {
      if (existing.qty + 1 > product.stock) {
        alert("Not enough stock!");
        return;
      }
      setCart(
        cart.map((item) =>
          item.rowIndex === product.rowIndex
            ? { ...item, qty: item.qty + 1 }
            : item,
        ),
      );
    } else {
      if (product.stock < 1) {
        alert("Out of stock!");
        return;
      }
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  // Remove from Cart
  const removeFromCart = (rowIndex) => {
    setCart(cart.filter((item) => item.rowIndex !== rowIndex));
  };

  // Calculate Total
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  const handlePrintEstimate = async () => {
    if (!customerName || cart.length === 0) return alert("Fill details first!");

    // Create the PDF Blob
    const blob = await pdf(
      <InvoicePDF
        billId={billId}
        customerName={customerName}
        items={cart}
        total={totalAmount}
        type="Estimate"
      />,
    ).toBlob();

    // Open it in a new tab
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  // Confirm Bill Handler
  const handleConfirmBill = async () => {
    if (!customerName || cart.length === 0) {
      alert("Please enter customer name and add items.");
      return;
    }

    if (!window.confirm("Confirm this bill? This will reduce stock.")) return;

    setLoading(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "confirmBill",
          billId: billId,
          customerName: customerName,
          total: totalAmount,
          items: cart.map((i) => ({
            rowIndex: i.rowIndex,
            item: i.item,
            qty: i.qty,
          })),
        }),
      });

      const blob = await pdf(
        <InvoicePDF
          billId={billId}
          customerName={customerName}
          items={cart}
          total={totalAmount}
          type="Confirmed" // This changes the color to Green!
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      alert("Bill Saved Successfully!");
      setCart([]);
      setCustomerName("");
      fetchStock(); // Refresh stock to see updates
    } catch (error) {
      alert("Error saving bill.");
    }
    setLoading(false);
  };

  // Filter Inventory based on Search
  const filteredInventory = inventory.filter(
    (p) =>
      p.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.model && p.model.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col md:flex-row gap-6">
      {/* LEFT SIDE: Product List */}
      <div className="w-full md:w-2/3 bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Product Inventory</h2>
          <button
            onClick={fetchStock}
            className="p-2 bg-blue-100 rounded-full hover:bg-blue-200"
          >
            <RefreshCw
              size={20}
              className={
                loading ? "animate-spin text-blue-600" : "text-blue-600"
              }
            />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search Item, Brand, or Model..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Product Table */}
        <div className="overflow-auto h-[600px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-3 border-b font-medium text-gray-600">Item</th>
                <th className="p-3 border-b font-medium text-gray-600">
                  Details
                </th>
                <th className="p-3 border-b font-medium text-gray-600">
                  Price
                </th>
                <th className="p-3 border-b font-medium text-gray-600">
                  Stock
                </th>
                <th className="p-3 border-b font-medium text-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((product) => (
                <tr
                  key={product.rowIndex}
                  className="hover:bg-gray-50 border-b"
                >
                  <td className="p-3 font-medium">{product.item}</td>
                  <td className="p-3 text-sm text-gray-500">
                    {product.brand} {product.model} <br />
                    <span className="text-xs bg-gray-200 px-1 rounded">
                      {product.size}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-green-600">
                    ₹{product.price}
                  </td>
                  <td
                    className={`p-3 font-bold ${product.stock < 5 ? "text-red-500" : "text-gray-700"}`}
                  >
                    {product.stock}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT SIDE: Billing Cart */}
      <div className="w-full md:w-1/3 bg-white rounded-lg shadow-md p-4 flex flex-col h-[600px]">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
          New Bill
        </h2>

        {/* Customer Info */}
        <div className="mb-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Bill ID: {billId}</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <input
            type="text"
            placeholder="Customer Name"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto mb-4 border rounded p-2 bg-gray-50">
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 mt-10">Cart is empty</p>
          ) : (
            cart.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center bg-white p-2 mb-2 rounded shadow-sm"
              >
                <div>
                  <p className="font-medium text-sm">{item.item}</p>
                  <p className="text-xs text-gray-500">
                    Qty: {item.qty} x ₹{item.price}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">₹{item.qty * item.price}</span>
                  <button
                    onClick={() => removeFromCart(item.rowIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-bold mb-4">
            <span>Total:</span>
            <span>₹{totalAmount}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              className="flex items-center justify-center gap-2 border border-gray-300 p-2 rounded hover:bg-gray-100"
              onClick={handlePrintEstimate}
            >
              <Printer size={18} /> Estimate
            </button>
            <button
              onClick={handleConfirmBill}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save size={18} /> Confirm Bill
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
