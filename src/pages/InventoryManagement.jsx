import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";

export default function InventoryManagement() {
  const {
    session,
    activeRole,
    stockBalances,
    loadStockBalances,
    inventoryItems,
    loadInventoryItems,
    createInventoryItem,
    stockAdjustment,
    grns,
    loadGRNs,
    approveGRN,
    invoices,
    loadInvoices,
    payments,
    loadPayments,
    recordPayment
  } = useApp();

  const [selectedBranch, setSelectedBranch] = useState("");
  
  // Tabs: "Stock", "GRN", "Invoices"
  const [activeTab, setActiveTab] = useState("Stock");

  // Selection states
  const [selectedGRNId, setSelectedGRNId] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // Forms
  const [showItemForm, setShowItemForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", unit: "pcs", reorderLevel: 100 });
  
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ itemId: "", quantity: 0, reason: "", approvedBy: "" });

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, reference: "", mode: "UPI" });

  // Initialize
  useEffect(() => {
    loadInventoryItems();
    loadGRNs();
    loadInvoices();
    loadPayments();
  }, []);

  useEffect(() => {
    if (session) {
      const branch = session.branchId || "Ahmedabad Branch";
      setSelectedBranch(branch);
      loadStockBalances(branch);
    }
  }, [session]);

  async function handleAddInventoryItem(e) {
    e.preventDefault();
    if (!newItem.name) return;
    const res = await createInventoryItem(newItem);
    if (res) {
      alert("Inventory item catalog master registered.");
      setShowItemForm(false);
      setNewItem({ name: "", unit: "pcs", reorderLevel: 100 });
      loadStockBalances(selectedBranch);
    }
  }

  async function handleAdjustSubmit(e) {
    e.preventDefault();
    if (!adjustForm.itemId) return;
    const res = await stockAdjustment(
      adjustForm.itemId,
      selectedBranch,
      Number(adjustForm.quantity),
      adjustForm.reason,
      adjustForm.approvedBy || session.name
    );
    if (res.success) {
      alert(res.message);
      setShowAdjustForm(false);
      setAdjustForm({ itemId: "", quantity: 0, reason: "", approvedBy: "" });
    }
  }

  async function handleApproveGRN(grnId) {
    if (confirm("Verify and approve this Goods Received Note? This will increase stock counts.")) {
      const res = await approveGRN(grnId, selectedBranch);
      if (res.success) {
        alert("GRN approved and stock ledger adjusted.");
        setSelectedGRNId(null);
      }
    }
  }

  async function handleRecordPayment(e) {
    e.preventDefault();
    if (!selectedInvoiceId) return;
    const res = await recordPayment(
      selectedInvoiceId,
      Number(paymentForm.amount),
      paymentForm.reference,
      paymentForm.mode
    );
    if (res) {
      alert("Payment recorded successfully.");
      setShowPaymentForm(false);
      setPaymentForm({ amount: 0, reference: "", mode: "UPI" });
      setSelectedInvoiceId(null);
    }
  }

  const isManager = activeRole === "Admin Manager" || activeRole === "Super Admin";

  const selectedGRN = grns.find(g => g.id === selectedGRNId);
  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.panel}>
          {/* Navigation Tabs */}
          <div style={styles.tabHeader}>
            {["Stock Balance", "Goods Receipts (GRN)", "Billing & Invoices"].map(tab => (
              <button
                key={tab}
                style={{ ...styles.tabBtn, ...(activeTab === tab ? styles.tabBtnActive : {}) }}
                onClick={() => { setActiveTab(tab); setSelectedGRNId(null); setSelectedInvoiceId(null); }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB 1: STOCK LEDGER */}
          {activeTab === "Stock Balance" && (
            <div>
              <div style={styles.panelHeader} style={{ marginBottom: "15px" }}>
                <div>
                  <div style={styles.panelTitle}>Warehouse Stock Ledger Balances</div>
                  <div style={styles.panelSub}>Realtime items custody counts.</div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button style={styles.secondaryBtn} onClick={() => setShowAdjustForm(!showAdjustForm)}>Physical Stock Audit</button>
                  <button style={styles.primaryBtn} onClick={() => setShowItemForm(!showItemForm)}>+ Register Catalog Item</button>
                </div>
              </div>

              {/* Add Master Item Form */}
              {showItemForm && (
                <form onSubmit={handleAddInventoryItem} style={{ ...styles.form, marginBottom: "15px" }}>
                  <div style={styles.formRow}>
                    <input style={{ ...styles.input, flex: 2 }} required placeholder="Chemicals/Toners/Bags" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                    <input style={{ ...styles.input, flex: 0.8 }} required placeholder="Unit (e.g. L)" value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} />
                    <input style={{ ...styles.input, flex: 1 }} type="number" required placeholder="Reorder Level" value={newItem.reorderLevel} onChange={e => setNewItem({ ...newItem, reorderLevel: Number(e.target.value) })} />
                  </div>
                  <button style={styles.primaryBtn} type="submit" style={{ marginTop: "10px" }}>Add Item</button>
                </form>
              )}

              {/* Adjust Stock Form */}
              {showAdjustForm && (
                <form onSubmit={handleAdjustSubmit} style={{ ...styles.form, marginBottom: "15px" }}>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select Item</label>
                      <select style={styles.input} required value={adjustForm.itemId} onChange={e => setAdjustForm({ ...adjustForm, itemId: e.target.value })}>
                        <option value="">Choose Item</option>
                        {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>New Physical Quantity</label>
                      <input style={styles.input} type="number" required value={adjustForm.quantity} onChange={e => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Reason</label>
                      <input style={styles.input} placeholder="Audit discrepancy count." value={adjustForm.reason} onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })} />
                    </div>
                  </div>
                  <button style={styles.primaryBtn} type="submit" style={{ marginTop: "10px" }}>Apply Stock Adjustments</button>
                </form>
              )}

              {/* Stock balances list grid */}
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["Item Name", "Closing Stock", "Reorder Level", "Unit", "Alert Status"].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stockBalances.map(st => {
                      const isLow = Number(st.closingStock) <= Number(st.reorderLevel);
                      return (
                        <tr key={st.id} style={styles.tr}>
                          <td style={styles.td}><strong>{st.name}</strong></td>
                          <td style={styles.td}>{st.closingStock}</td>
                          <td style={styles.td}>{st.reorderLevel}</td>
                          <td style={styles.td}>{st.unit}</td>
                          <td style={styles.td}>
                            {isLow ? (
                              <span style={{ ...styles.badge, background: "#ef444422", color: "#ef4444" }}>⚠️ Low Stock</span>
                            ) : (
                              <span style={{ ...styles.badge, background: "#22c55e22", color: "#22c55e" }}>Optimal</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: GOODS RECEIPTS (GRN) */}
          {activeTab === "Goods Receipts (GRN)" && (
            <div>
              <div style={styles.panelHeader} style={{ marginBottom: "15px" }}>
                <div>
                  <div style={styles.panelTitle}>Verify Goods Received Notes (GRN)</div>
                  <div style={styles.panelSub}>Ensure items physical counts match purchase orders before stock entries.</div>
                </div>
              </div>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["GRN Number", "Received By", "Date", "Verification Status"].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grns.map(g => (
                      <tr key={g.id} style={{ ...styles.tr, ...(selectedGRNId === g.id ? styles.trActive : {}) }} onClick={() => setSelectedGRNId(g.id)}>
                        <td style={styles.td}><strong>{g.grn_no}</strong></td>
                        <td style={styles.td}>{g.profiles?.full_name || "Warehouse Staff"}</td>
                        <td style={styles.td}>{new Date(g.received_date).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, background: g.status === "Verified" ? "#22c55e22" : "#f59e0b22", color: g.status === "Verified" ? "#22c55e" : "#f59e0b" }}>
                            {g.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: INVOICES & PAYMENTS */}
          {activeTab === "Billing & Invoices" && (
            <div>
              <div style={styles.panelHeader} style={{ marginBottom: "15px" }}>
                <div>
                  <div style={styles.panelTitle}>Supplier Invoices</div>
                  <div style={styles.panelSub}>Match invoice codes and ledger receipts.</div>
                </div>
              </div>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["Invoice No", "Amount", "Due Date", "Status"].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(i => (
                      <tr key={i.id} style={{ ...styles.tr, ...(selectedInvoiceId === i.id ? styles.trActive : {}) }} onClick={() => setSelectedInvoiceId(i.id)}>
                        <td style={styles.td}><strong>{i.invoice_no}</strong></td>
                        <td style={styles.td}>₹{i.amount}</td>
                        <td style={styles.td}>{i.due_date}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, background: i.status === "Paid" ? "#22c55e22" : "#ef444422", color: i.status === "Paid" ? "#22c55e" : "#ef4444" }}>
                            {i.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Details Panel */}
      <div style={styles.detailPanel}>
        {activeTab === "Goods Receipts (GRN)" && (
          selectedGRN ? (
            <div>
              <div style={styles.detailHeader}>
                <div>
                  <div style={styles.muted}>GRN details</div>
                  <div style={styles.detailNo}>{selectedGRN.grn_no}</div>
                </div>
                <div style={styles.muted}>{new Date(selectedGRN.received_date).toLocaleDateString()}</div>
              </div>

              <div style={styles.descBox}>
                <div style={styles.muted}>Received Line Items</div>
                <div style={{ marginTop: "10px" }}>
                  {selectedGRN.grn_items?.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", borderBottom: "1px dashed #f1f5f9", paddingBottom: "6px", marginBottom: "6px" }}>
                      <div>{item.item_name}</div>
                      <div>Ordered: {item.quantity_ordered} | Accepted: {item.quantity_accepted}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedGRN.status === "Pending Verification" && isManager && (
                <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={() => handleApproveGRN(selectedGRN.id)}>
                  Approve GRN & Add Stock
                </button>
              )}
            </div>
          ) : (
            <div style={styles.emptyDetail}>Select a GRN record to verify stock intakes.</div>
          )
        )}

        {activeTab === "Billing & Invoices" && (
          selectedInvoice ? (
            <div>
              <div style={styles.detailHeader}>
                <div>
                  <div style={styles.muted}>Invoice details</div>
                  <div style={styles.detailNo}>{selectedInvoice.invoice_no}</div>
                </div>
                <div style={{ fontSize: "1rem", color: "#0038a8", fontWeight: 700 }}>₹{selectedInvoice.amount}</div>
              </div>

              {/* Record Payment Form */}
              {selectedInvoice.status !== "Paid" && isManager && (
                <div>
                  <button style={{ ...styles.primaryBtn, width: "100%", marginBottom: "15px" }} onClick={() => setShowPaymentForm(!showPaymentForm)}>
                    {showPaymentForm ? "Cancel" : "Record Payment Entry"}
                  </button>

                  {showPaymentForm && (
                    <form onSubmit={handleRecordPayment} style={styles.form}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Paid Amount</label>
                        <input style={styles.input} type="number" max={selectedInvoice.amount} required value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })} />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Payment Reference (Cheque No / Transaction ID)</label>
                        <input style={styles.input} required placeholder="TXN-9823415" value={paymentForm.reference} onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Payment Mode</label>
                        <select style={styles.input} value={paymentForm.mode} onChange={e => setPaymentForm({ ...paymentForm, mode: e.target.value })}>
                          {["UPI", "Bank Transfer", "Cheque", "Cash"].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <button style={styles.primaryBtn} type="submit">Post Payment</button>
                    </form>
                  )}
                </div>
              )}

              {/* Payments ledger log */}
              <div style={styles.timelineBox}>
                <div style={styles.muted}>Payments Ledger Receipts</div>
                <div style={{ marginTop: "10px" }}>
                  {payments.filter(p => p.invoice_id === selectedInvoice.id).map((pay, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", borderBottom: "1px dashed #f1f5f9", paddingBottom: "6px", marginBottom: "6px" }}>
                      <div>₹{pay.amount_paid} ({pay.payment_mode})</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Ref: {pay.payment_reference}</div>
                    </div>
                  ))}
                  {payments.filter(p => p.invoice_id === selectedInvoice.id).length === 0 && <div style={styles.empty}>No payments posted.</div>}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyDetail}>Select an Invoice to record payments or check ledger logs.</div>
          )
        )}

        {activeTab === "Stock Balance" && (
          <div style={styles.emptyDetail}>Select GRN or Billing views to edit custody records.</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", gap: "20px", width: "100%" },
  left: { flex: 1.8, minWidth: "0" },
  panel: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" },
  panelTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem", fontWeight: 700, color: "#111625" },
  panelSub: { fontSize: "0.78rem", color: "#64748b", marginTop: "2px" },
  primaryBtn: { background: "#0038a8", color: "#fff", border: "none", borderRadius: "4px", padding: "10px 16px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },
  secondaryBtn: { background: "#fff", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 14px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", display: "inline-block", textAlign: "center" },

  tabHeader: { display: "flex", gap: "10px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" },
  tabBtn: { background: "none", border: "none", color: "#64748b", fontSize: "0.85rem", fontWeight: 600, padding: "8px 16px", cursor: "pointer", outline: "none" },
  tabBtnActive: { color: "#0038a8", borderBottom: "2px solid #0038a8" },

  form: { background: "#f8fafc", padding: "20px", borderRadius: "4px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" },
  formRow: { display: "flex", gap: "10px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1.5px", color: "#111625", textTransform: "uppercase" },
  input: { padding: "8px 12px", fontSize: "0.82rem", color: "#111625", border: "1px solid #e2e8f0", borderRadius: "4px", background: "#fff", outline: "none" },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, color: "#64748b", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "left", letterSpacing: "1px" },
  tr: { borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.2s" },
  trActive: { background: "#f1f5f9" },
  td: { padding: "12px 16px", fontSize: "0.8rem", color: "#111625" },
  badge: { fontSize: "0.68rem", fontWeight: 600, padding: "3px 8px", borderRadius: "20px", display: "inline-block" },
  empty: { color: "#94a3b8", fontSize: "0.82rem", textAlign: "center", padding: "30px" },

  detailPanel: { flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px", minWidth: "350px", maxHeight: "100vh", overflowY: "auto" },
  emptyDetail: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "0.85rem", padding: "40px", textAlign: "center" },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "16px" },
  muted: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1px", color: "#64748b", textTransform: "uppercase" },
  detailNo: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "#111625", marginTop: "4px" },

  descBox: { background: "#f8fafc", padding: "16px", borderRadius: "4px", border: "1px solid #e2e8f0", marginBottom: "20px" },
  timelineBox: { border: "1px solid #e2e8f0", borderRadius: "4px", padding: "16px", marginBottom: "20px", background: "#fcfcfd" }
};
