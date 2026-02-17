import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Create styles
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#333" },
  companyInfo: { fontSize: 10, color: "#666", lineHeight: 1.5 },
  billDetails: { marginTop: 10, fontSize: 10 },

  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: { margin: "auto", flexDirection: "row" },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    backgroundColor: "#f3f4f6",
    padding: 5,
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    padding: 5,
  },
  tableCellHeader: { margin: "auto", fontSize: 10, fontWeight: "bold" },
  tableCell: { margin: "auto", fontSize: 10 },

  totalSection: { marginTop: 20, alignItems: "flex-end" },
  totalText: { fontSize: 14, fontWeight: "bold" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 10,
    textAlign: "center",
    color: "#999",
  },
});

const InvoicePDF = ({ billId, customerName, items, total, type }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>INVOICE</Text>
          <Text
            style={{
              fontSize: 12,
              color: type === "Estimate" ? "orange" : "green",
            }}
          >
            {type.toUpperCase()}
          </Text>
        </View>
        <View style={styles.companyInfo}>
          <Text>Gouri Electricals</Text>
          <Text>Muzaffarnagar, UP</Text>
          <Text>Phone: +91 98765 43210</Text>
        </View>
      </View>

      {/* Bill Details */}
      <View
        style={{ marginBottom: 20, padding: 10, backgroundColor: "#f9fafb" }}
      >
        <Text style={styles.billDetails}>Bill ID: {billId}</Text>
        <Text style={styles.billDetails}>
          Date: {new Date().toLocaleDateString()}
        </Text>
        <Text style={styles.billDetails}>Customer: {customerName}</Text>
      </View>

      {/* Table Header */}
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={{ ...styles.tableColHeader, width: "40%" }}>
            <Text style={styles.tableCellHeader}>Item</Text>
          </View>
          <View style={{ ...styles.tableColHeader, width: "20%" }}>
            <Text style={styles.tableCellHeader}>Price</Text>
          </View>
          <View style={{ ...styles.tableColHeader, width: "20%" }}>
            <Text style={styles.tableCellHeader}>Qty</Text>
          </View>
          <View style={{ ...styles.tableColHeader, width: "20%" }}>
            <Text style={styles.tableCellHeader}>Total</Text>
          </View>
        </View>

        {/* Table Rows */}
        {items.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={{ ...styles.tableCol, width: "40%" }}>
              <Text style={styles.tableCell}>{item.item}</Text>
            </View>
            <View style={{ ...styles.tableCol, width: "20%" }}>
              <Text style={styles.tableCell}>{item.price}</Text>
            </View>
            <View style={{ ...styles.tableCol, width: "20%" }}>
              <Text style={styles.tableCell}>{item.qty}</Text>
            </View>
            <View style={{ ...styles.tableCol, width: "20%" }}>
              <Text style={styles.tableCell}>{item.price * item.qty}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Total Section */}
      <View style={styles.totalSection}>
        <Text style={styles.totalText}>Grand Total: ₹{total}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thank you for your business!</Text>
        <Text>Goods once sold will not be taken back.</Text>
      </View>
    </Page>
  </Document>
);

export default InvoicePDF;
