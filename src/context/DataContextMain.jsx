import React, { useState, createContext, useContext, useEffect } from "react";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const apiURL =
    "https://script.google.com/macros/s/AKfycbwM2dfAR9qP-4rQQNn5dac_UHzb1QCTca8EyWjyVCDDmcG9jcwB8WzTsasZJml7UO5y/exec";
  // "https://script.google.com/macros/s/AKfycbwM2dfAR9qP-4rQQNn5dac_UHzb1QCTca8EyWjyVCDDmcG9jcwB8WzTsasZJml7UO5y/exec";

  const storeAndSearchProducts = async () => {
    try {
      let rawData;

      let localStorageKeyForStoringProducts = "allProductListValue";

      if (localStorage.getItem(localStorageKeyForStoringProducts)) {
        console.log(`Data is there in the localStorage`);
        rawData = JSON.parse(
          localStorage.getItem(localStorageKeyForStoringProducts),
        );
      } else {
        console.log("Fetching from Google Sheets...");

        let searchProductRequest = `${apiURL}?action=searchProducts`;
        let response = await fetch(searchProductRequest);
        rawData = await response.json();
        localStorage.setItem(
          localStorageKeyForStoringProducts,
          JSON.stringify(rawData),
        );
      }

      // 2. Format the data perfectly
      let formattedItems = rawData.map((e) => {
        return {
          id: e.ROW_INDEX,
          desc: [e.ITEM, e.BRAND, e.SIZE, e.MODEL_NAME, e.COLOR]
            .filter(Boolean)
            .join(" "),
          hsn: e.HSN,
          stock: e.STOCK,
          mrp: e.MRP,
          purchase: e.PURCHASE,
          uqc: e.UQC,
          sale: e.SALE,
          salePerUQC: e.SALE_PER_UQC,
          perUQC: e.PER_UQC,
          party: e.PARTY,
        };
      });

      return formattedItems;
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  const getAllBillData = async () => {
    try {
      let rawData;

      let localStorageKeyForStoringBills = "allBillListValue";

      if (localStorage.getItem(localStorageKeyForStoringBills)) {
        console.log(`Bills Data is there in the localStorage`);
        rawData = JSON.parse(
          localStorage.getItem(localStorageKeyForStoringBills),
        );
      } else {
        console.log("Fetching from Google Sheets...");

        let searchBillRequest = `${apiURL}?action=searchCustomers`;
        let response = await fetch(searchBillRequest);
        rawData = await response.json();
        localStorage.setItem(
          localStorageKeyForStoringBills,
          JSON.stringify(rawData),
        );
      }

      // 2. Format the data perfectly
      // let formattedItems = rawData.map((e) => {
      //   return {
      //     id: e.ROW_INDEX,
      //     desc: [e.ITEM, e.BRAND, e.SIZE, e.MODEL_NAME, e.COLOR]
      //       .filter(Boolean)
      //       .join(" "),
      //     hsn: e.HSN,
      //     stock: e.STOCK,
      //     mrp: e.MRP,
      //     purchase: e.PURCHASE,
      //     uqc: e.UQC,
      //     sale: e.SALE,
      //     salePerUQC: e.SALE_PER_UQC,
      //     perUQC: e.PER_UQC,
      //     party: e.PARTY,
      //   };
      // });

      return rawData;
    } catch (err) {
      console.error("Failed to fetch all bills:", err);
      return { success: false, error: err.message };
    }
  };

  // ADD THIS NEW FUNCTION
  const saveBillToSheet = async (billData) => {
    try {
      const response = await fetch(apiURL, {
        method: "POST",
        body: JSON.stringify(billData),
      });
      const result = await response.json();
      return result;
    } catch (err) {
      console.error("Failed to save bill:", err);
      return { success: false, error: err.message };
    }
  };

  return (
    <DataContext.Provider
      value={{ storeAndSearchProducts, saveBillToSheet, getAllBillData }}
    >
      {children}
    </DataContext.Provider>
  );
};
