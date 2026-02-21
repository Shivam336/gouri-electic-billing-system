import React, { useState } from "react";
import { Trash2, Plus } from "lucide-react";

const TallyBillingPage = () => {
  // Uniform CSS for all labels and inputs
  let labelHeadingCSS = "text-[12px] font-semibold text-gray-700 mb-1";
  let fieldCSS =
    "px-2 py-1.5 border border-gray-300 rounded-md outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] font-medium text-gray-900 text-[12px] transition-all";

  return (
    // Added uniform background and padding to the main wrapper
    <div className="flex flex-col min-h-full p-4 gap-4 w-full">
      {/* 1. TOP FORM BAR */}
      <div className="flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* ROW 1: Basic Bill Info & Customer Details */}
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
              type="text"
              defaultValue="INV-9567"
              className={`${fieldCSS} w-24 bg-gray-50`}
              readOnly
            />
          </div>

          <div className="flex flex-col">
            <label className={labelHeadingCSS}>Date</label>
            <input
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
              type="text"
              placeholder="Enter name..."
              className={`${fieldCSS} w-full`}
            />
          </div>

          <div className="flex flex-col">
            <label className={labelHeadingCSS}>
              Phone No. <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="Mobile number..."
              className={`${fieldCSS} w-32`}
            />
          </div>
        </div>

        {/* ROW 2: Address & Reference Details */}
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
            <select className={`${fieldCSS} cursor-pointer w-32`}>
              <option value="">Select...</option>
              <option value="INV-9566">INV-9566</option>
            </select>
          </div>

          <div className="flex flex-col flex-1 min-w-[150px]">
            <label className={labelHeadingCSS}>Ref Name</label>
            <input
              type="text"
              placeholder="Reference Name..."
              className={`${fieldCSS} w-full`}
            />
          </div>

          <div className="flex flex-col">
            <label className={labelHeadingCSS}>Ref Phone No.</label>
            <input
              type="tel"
              placeholder="Ref Mobile..."
              className={`${fieldCSS} w-32`}
            />
          </div>
        </div>
      </div>
      {/* 2. ITEM ENTRY TABLE */}
      <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="w-full h-[320px] overflow-auto relative">
          <table className="w-full text-left border-collapse">
            {/* Softened headers to Title Case */}
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
                  Qty
                </th>
                <th className="p-2 w-20 border-b border-r border-gray-300">
                  Unit
                </th>
                <th className="p-2 w-24 border-b border-r border-gray-300">
                  Rate
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

            <tbody>
              <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td className="p-1 border-r border-gray-200 text-center text-[12px] text-gray-500 font-medium">
                  1
                </td>
                <td className="p-1 border-r border-gray-200">
                  <input
                    className="w-full outline-none bg-transparent px-1 text-[12px] text-gray-900 font-medium"
                    placeholder="Type item..."
                  />
                </td>
                <td className="p-1 border-r border-gray-200">
                  <input
                    className="w-full outline-none bg-transparent px-1 text-[12px] text-gray-900"
                    placeholder="-"
                  />
                </td>
                <td className="p-1 border-r border-gray-200 px-2 text-[12px] text-gray-500 bg-gray-50 text-center">
                  150
                </td>
                <td className="p-1 border-r border-gray-200">
                  <input
                    type="number"
                    className="w-full outline-none bg-transparent px-1 text-[12px] text-gray-900 text-center"
                    placeholder="0"
                  />
                </td>
                <td className="p-1 border-r border-gray-200">
                  <input
                    className="w-full outline-none bg-transparent px-1 text-[12px] text-gray-900 text-center"
                    placeholder="Pcs"
                  />
                </td>
                <td className="p-1 border-r border-gray-200">
                  <input
                    type="number"
                    className="w-full outline-none bg-transparent px-1 text-[12px] text-gray-900 text-right"
                    placeholder="0.00"
                  />
                </td>
                <td className="p-1 border-r border-gray-200">
                  <input
                    type="number"
                    className="w-full outline-none bg-transparent px-1 text-[12px] text-gray-900 text-center"
                    placeholder="0"
                  />
                </td>
                <td className="p-1 border-r border-gray-200">
                  <input
                    type="number"
                    className="w-full outline-none bg-transparent px-1 text-[12px] text-gray-900 text-center"
                    placeholder="0"
                  />
                </td>
                <td className="p-1 border-r border-gray-200">
                  <input
                    type="number"
                    className="w-full outline-none bg-transparent px-1 text-[12px] text-gray-900 text-center"
                    placeholder="0"
                  />
                </td>
                <td className="p-1 border-r border-gray-200">
                  <input
                    className="w-full outline-none bg-transparent px-1 text-[12px] font-bold text-gray-900 text-right bg-gray-50"
                    readOnly
                    defaultValue="0.00"
                  />
                </td>
                <td className="p-1 text-center">
                  <button className="text-red-400 hover:text-red-600 transition-colors p-1">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Added "Add Row" button docked at the bottom of the table */}
        <div className="p-2 border-t border-gray-200 bg-gray-50 flex justify-start">
          <button className="text-[#1e3a8a] font-semibold text-[12px] flex items-center gap-1 hover:underline px-2 py-1">
            <Plus size={14} /> Add Row
          </button>
        </div>
      </div>
      {/* 3. BOTTOM SECTION: Notes & Financial Engine */}
      <div className="flex gap-4 mt-auto">
        {/* Left Side: Remarks & Terms */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex-1 flex flex-col">
            <label className="text-[12px] font-semibold text-gray-700 mb-2 block">
              Remarks / Warranty Notes
            </label>
            <textarea
              className="w-full flex-1 p-2 border border-gray-300 rounded-md outline-none focus:border-[#1e3a8a] text-[12px] resize-none text-gray-800"
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

        {/* Right Side: Financial Ledger */}
        <div className="w-[400px] bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col shrink-0">
          <div className="p-4 flex flex-col gap-3 flex-1">
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-semibold text-gray-700">
                Sub Total
              </span>
              <input
                readOnly
                defaultValue="0.00"
                className="w-32 px-2 py-1.5 text-right border border-gray-200 rounded-md bg-gray-50 text-[13px] font-semibold text-gray-900 outline-none"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[12px] font-semibold text-gray-700">
                (-) Discount
              </span>
              <input
                type="number"
                defaultValue="0"
                className="w-32 px-2 py-1.5 text-right border border-gray-300 rounded-md text-[13px] font-semibold text-[#1e3a8a] outline-none focus:border-[#1e3a8a] transition-colors"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[12px] font-semibold text-gray-700">
                Current Bill
              </span>
              <input
                readOnly
                defaultValue="0.00"
                className="w-32 px-2 py-1.5 text-right border border-gray-200 rounded-md bg-gray-50 text-[13px] font-semibold text-[#1e3a8a] outline-none"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[12px] font-semibold text-gray-700">
                (+) Previous Balance
              </span>
              <input
                type="number"
                defaultValue="0"
                className="w-32 px-2 py-1.5 text-right border border-gray-300 rounded-md text-[13px] font-semibold text-[#1e3a8a] outline-none focus:border-[#1e3a8a] transition-colors"
              />
            </div>

            <hr className="my-1 border-gray-200" />

            <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-md border border-blue-100">
              <span className="text-[13px] font-bold text-[#1e3a8a]">
                Grand Total Due
              </span>
              <input
                readOnly
                defaultValue="0.00"
                className="w-32 text-right bg-transparent text-lg font-bold text-[#1e3a8a] outline-none"
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
                  type="number"
                  defaultValue="0"
                  className="w-28 px-2 py-1 text-right border border-gray-300 rounded-md text-[12px] font-semibold outline-none focus:border-green-500 transition-colors"
                />
              </div>

              <div className="flex justify-between items-center pl-2">
                <span className="text-[12px] font-medium text-gray-700">
                  UPI / Bank
                </span>
                <input
                  type="number"
                  defaultValue="0"
                  className="w-28 px-2 py-1 text-right border border-gray-300 rounded-md text-[12px] font-semibold outline-none focus:border-green-500 transition-colors"
                />
              </div>
            </div>

            <hr className="my-1 border-gray-200" />

            <div className="flex justify-between items-center">
              <span className="text-[12px] font-semibold text-gray-700">
                Total Paid Now
              </span>
              <input
                readOnly
                defaultValue="0.00"
                className="w-32 text-right bg-transparent text-[13px] font-bold text-green-700 outline-none"
              />
            </div>
          </div>

          <div className="bg-gray-800 text-white px-5 py-3 flex justify-between items-center">
            <span className="text-[13px] font-medium tracking-wide">
              Closing Balance
            </span>
            <span className="text-xl font-bold">₹ 0.00</span>
          </div>

          <div className="p-3 bg-gray-100 flex gap-3 rounded-b-lg border-t border-gray-300">
            <button className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-[13px] font-semibold py-2.5 rounded-md shadow-sm transition-colors active:scale-95">
              Reset
            </button>
            <button className="flex-1 bg-[#1e3a8a] hover:bg-blue-800 text-white text-[13px] font-semibold py-2.5 rounded-md shadow-sm transition-colors active:scale-95">
              Save
            </button>
            <button className="flex-[1.5] bg-green-600 hover:bg-green-700 text-white text-[13px] font-semibold py-2.5 rounded-md shadow-sm transition-colors active:scale-95">
              Save & Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TallyBillingPage;
