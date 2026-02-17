import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Package,
  Save,
  RefreshCw,
} from "lucide-react";

// 🔴 PASTE YOUR GOOGLE SCRIPT URL HERE
const API_URL =
  "https://script.google.com/macros/s/AKfycbxEyFNimLW1HMuafE8vzIDbUD_D2cYho4AgSkQHmaMbCYSIcXCYiv2yhsD9ygBapqOE/exec";

// --- HELPER COMPONENT (Moved to top to prevent crashes) ---
const Input = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  autoFocus = false,
}) => (
  <div className="flex flex-col">
    <label className="text-xs font-bold text-gray-500 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      className="p-2 rounded border border-gray-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm font-medium"
      value={value || ""} // ⚡️ FIX: Ensures value is never undefined
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  </div>
);

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(getEmptyProduct());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=getInventory`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error("Server returned non-array:", data);
      }
    } catch (e) {
      console.error("Error fetching inventory", e);
    }
    setLoading(false);
  };

  function getEmptyProduct() {
    return {
      id: "",
      item: "",
      brand: "",
      size: "",
      model: "",
      color: "",
      purchasePrice: "",
      purchaseUnit: "",
      price1: "",
      unit1: "",
      price2: "",
      unit2: "",
      party: "",
      stock: 0,
    };
  }

  // --- CRUD HANDLERS ---
  const handleAddNew = () => {
    setCurrentProduct(getEmptyProduct());
    setEditMode(false);
    setIsModalOpen(true);
  };

  const handleEdit = (product) => {
    // Create a copy to avoid reference issues
    setCurrentProduct({ ...product });
    setEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (realRowIndex) => {
    if (!window.confirm("Delete this product?")) return;

    // Optimistic Update
    setProducts((prev) => prev.filter((p) => p.realRowIndex !== realRowIndex));

    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "deleteProduct",
          realRowIndex: realRowIndex,
        }),
      });
      // Background refresh to ensure sync
      fetchInventory();
    } catch (e) {
      alert("Failed to delete from server");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const action = editMode ? "updateProduct" : "addProduct";

    // Optimistic UI Update
    if (editMode) {
      setProducts((prev) =>
        prev.map((p) =>
          p.realRowIndex === currentProduct.realRowIndex ? currentProduct : p,
        ),
      );
    } else {
      // Add temp product with timestamp ID so it shows up immediately
      setProducts((prev) => [
        ...prev,
        { ...currentProduct, id: "TEMP", stock: Number(currentProduct.stock) },
      ]);
    }

    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: action, product: currentProduct }),
      });

      setIsModalOpen(false);
      setSaving(false);
      fetchInventory(); // Get fresh data (real IDs) from server
    } catch (e) {
      alert("Error saving product");
      setSaving(false);
    }
  };

  // --- FILTERING ---
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lowerTerm = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        (p.item && p.item.toLowerCase().includes(lowerTerm)) ||
        (p.brand && p.brand.toLowerCase().includes(lowerTerm)) ||
        (p.model && p.model.toLowerCase().includes(lowerTerm)),
    );
  }, [products, searchTerm]);

  const displayProducts = searchTerm
    ? filteredProducts
    : filteredProducts.slice(0, 50);

  return (
    <div className="flex flex-col h-full bg-gray-50 font-sans">
      {/* HEADER */}
      <div className="bg-white p-4 shadow-sm z-10 sticky top-0 border-b">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <Package className="text-blue-600" /> Product List
            {loading && (
              <RefreshCw
                size={16}
                className="animate-spin text-gray-400 ml-2"
              />
            )}
          </h1>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow hover:bg-blue-700 transition active:scale-95"
          >
            <Plus size={18} />{" "}
            <span className="hidden md:inline">Add Product</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            className="w-full bg-gray-100 p-2.5 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
            placeholder="Search by Name, Brand, or Model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-24">
        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            <Package size={48} className="mb-2 opacity-20" />
            <p>No products found</p>
          </div>
        )}

        {/* 💻 DESKTOP TABLE */}
        <div className="hidden md:block bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-700 font-bold border-b uppercase text-xs">
              <tr>
                <th className="p-3 w-16 text-center">Act</th>
                <th className="p-3 w-1/4">Product Details</th>
                <th className="p-3 w-1/6">Specs</th>
                <th className="p-3 text-right bg-yellow-50">Stock</th>
                <th className="p-3 text-right text-green-700">Sale 1</th>
                <th className="p-3 text-right text-green-700">Sale 2</th>
                <th className="p-3 text-right text-red-700">Purch</th>
                <th className="p-3">Party</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayProducts.map((p, i) => (
                <tr
                  key={p.realRowIndex || i}
                  className="hover:bg-blue-50 transition group"
                >
                  <td className="p-2 text-center">
                    <div className="flex justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.realRowIndex)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-blue-900 leading-tight">
                      {p.item}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      {p.brand}{" "}
                      {p.id ? (
                        <span className="text-gray-300">#{p.id}</span>
                      ) : (
                        ""
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-gray-600">
                    <div>
                      {p.model ? (
                        <span className="font-semibold text-gray-800">
                          {p.model}
                        </span>
                      ) : (
                        "-"
                      )}
                    </div>
                    <div>
                      {p.size} {p.color ? `• ${p.color}` : ""}
                    </div>
                  </td>
                  <td className="p-3 text-right font-bold text-black bg-yellow-50 border-x border-yellow-100">
                    {p.stock}
                  </td>
                  <td className="p-3 text-right">
                    <div className="font-bold text-gray-800">₹{p.price1}</div>
                    <div className="text-[10px] text-gray-400 uppercase">
                      {p.unit1}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    {p.price2 ? (
                      <>
                        <div className="font-medium text-gray-600">
                          ₹{p.price2}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase">
                          {p.unit2}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="p-3 text-right text-gray-500">
                    {p.purchasePrice ? (
                      <>
                        <div className="text-xs">₹{p.purchasePrice}</div>
                        <div className="text-[10px] opacity-70">
                          {p.purchaseUnit}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td
                    className="p-3 text-xs font-semibold text-blue-800 truncate max-w-[120px]"
                    title={p.party}
                  >
                    {p.party || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📱 MOBILE CARDS */}
        <div className="md:hidden space-y-3">
          {displayProducts.map((p, i) => (
            <div
              key={p.realRowIndex || i}
              className="bg-white p-3 rounded-xl shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="w-[75%]">
                  <h3 className="font-bold text-gray-900 leading-tight text-base">
                    {p.item}
                  </h3>
                  <div className="text-xs text-gray-500 mt-1 flex gap-2">
                    {p.brand}
                    {p.model && (
                      <span className="text-gray-800">• {p.model}</span>
                    )}
                    {p.id && <span className="text-gray-300">#{p.id}</span>}
                  </div>
                </div>
                <div className="text-right bg-green-50 px-2 py-1 rounded border border-green-100 shrink-0">
                  <span className="block text-lg font-bold text-green-700 leading-none">
                    {p.stock}
                  </span>
                  <span className="text-[9px] text-green-600 uppercase font-bold tracking-wider">
                    Stock
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2 border-b border-dashed border-gray-200 pb-2">
                <div>
                  Size:{" "}
                  <span className="font-semibold text-gray-900">
                    {p.size || "-"}
                  </span>
                </div>
                <div>
                  Color:{" "}
                  <span className="font-semibold text-gray-900">
                    {p.color || "-"}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded p-2 mb-3 space-y-1.5 border border-gray-100">
                <div className="flex justify-between text-xs items-center">
                  <span className="text-gray-500 font-medium">Sale Price:</span>
                  <span className="font-bold text-blue-900 text-sm">
                    ₹{p.price1}{" "}
                    <span className="text-gray-400 font-normal text-xs">
                      /{p.unit1}
                    </span>
                  </span>
                </div>
                {p.price2 && (
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-gray-500 font-medium">
                      Secondary:
                    </span>
                    <span className="font-bold text-blue-800">
                      ₹{p.price2}{" "}
                      <span className="text-gray-400 font-normal">
                        /{p.unit2}
                      </span>
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 my-1"></div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Buy:</span>
                  <span className="font-semibold text-gray-700">
                    ₹{p.purchasePrice || "-"}{" "}
                    <span className="text-gray-400 font-normal">
                      /{p.purchaseUnit}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Party:</span>
                  <span className="font-semibold text-gray-700 truncate max-w-[150px]">
                    {p.party || "-"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(p)}
                  className="flex-1 bg-white border border-blue-200 text-blue-700 py-2 rounded-lg font-bold text-xs flex justify-center items-center gap-2 active:bg-blue-50 transition"
                >
                  <Edit size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(p.realRowIndex)}
                  className="w-10 bg-white border border-red-200 text-red-600 rounded-lg flex justify-center items-center active:bg-red-50 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✏️ ADD / EDIT MODAL */}
      {isModalOpen && currentProduct && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full md:max-w-2xl rounded-t-2xl md:rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-auto md:max-h-[90vh]">
            <div className="bg-blue-900 text-white p-4 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                {editMode ? <Edit size={20} /> : <Plus size={20} />}
                {editMode ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="hover:bg-blue-800 p-1 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4 bg-white"
            >
              {/* Section 1: Basic Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">
                  Basic Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Item Name"
                    value={currentProduct.item}
                    onChange={(v) =>
                      setCurrentProduct({ ...currentProduct, item: v })
                    }
                    required
                    autoFocus
                  />
                  <Input
                    label="Brand"
                    value={currentProduct.brand}
                    onChange={(v) =>
                      setCurrentProduct({ ...currentProduct, brand: v })
                    }
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Model"
                      value={currentProduct.model}
                      onChange={(v) =>
                        setCurrentProduct({ ...currentProduct, model: v })
                      }
                    />
                    <Input
                      label="Size"
                      value={currentProduct.size}
                      onChange={(v) =>
                        setCurrentProduct({ ...currentProduct, size: v })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Color"
                      value={currentProduct.color}
                      onChange={(v) =>
                        setCurrentProduct({ ...currentProduct, color: v })
                      }
                    />
                    <Input
                      label="Row ID"
                      value={currentProduct.id}
                      onChange={(v) =>
                        setCurrentProduct({ ...currentProduct, id: v })
                      }
                      placeholder="Auto"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing & Stock */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">
                  Pricing & Stock
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Input
                    label="Stock Qty"
                    type="number"
                    value={currentProduct.stock}
                    onChange={(v) =>
                      setCurrentProduct({ ...currentProduct, stock: v })
                    }
                  />
                  <Input
                    label="Party Name"
                    value={currentProduct.party}
                    onChange={(v) =>
                      setCurrentProduct({ ...currentProduct, party: v })
                    }
                  />
                  <Input
                    label="Purch. Price"
                    type="number"
                    value={currentProduct.purchasePrice}
                    onChange={(v) =>
                      setCurrentProduct({ ...currentProduct, purchasePrice: v })
                    }
                  />
                  <Input
                    label="Purch. Unit"
                    value={currentProduct.purchaseUnit}
                    onChange={(v) =>
                      setCurrentProduct({ ...currentProduct, purchaseUnit: v })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div>
                    <label className="text-[10px] font-bold text-blue-800 uppercase mb-1 block">
                      Sale Price 1
                    </label>
                    <div className="flex gap-2">
                      <input
                        className="w-2/3 p-2 rounded border border-blue-200 outline-none text-sm"
                        placeholder="₹"
                        type="number"
                        value={currentProduct.price1 || ""}
                        onChange={(e) =>
                          setCurrentProduct({
                            ...currentProduct,
                            price1: e.target.value,
                          })
                        }
                      />
                      <input
                        className="w-1/3 p-2 rounded border border-blue-200 outline-none text-sm"
                        placeholder="Unit"
                        value={currentProduct.unit1 || ""}
                        onChange={(e) =>
                          setCurrentProduct({
                            ...currentProduct,
                            unit1: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                      Sale Price 2
                    </label>
                    <div className="flex gap-2">
                      <input
                        className="w-2/3 p-2 rounded border border-gray-200 outline-none text-sm"
                        placeholder="₹"
                        type="number"
                        value={currentProduct.price2 || ""}
                        onChange={(e) =>
                          setCurrentProduct({
                            ...currentProduct,
                            price2: e.target.value,
                          })
                        }
                      />
                      <input
                        className="w-1/3 p-2 rounded border border-gray-200 outline-none text-sm"
                        placeholder="Unit"
                        value={currentProduct.unit2 || ""}
                        onChange={(e) =>
                          setCurrentProduct({
                            ...currentProduct,
                            unit2: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Spacer for mobile safe area */}
              <div className="h-20 md:hidden"></div>
            </form>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0 pb-8 md:pb-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 md:flex-none px-5 py-3 md:py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition bg-white border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 md:flex-none px-6 py-3 md:py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400 flex justify-center items-center gap-2 transition active:scale-95"
              >
                {saving ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                {saving ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
