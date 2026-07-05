import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";

export default function PurchaseRequisition() {
  const {
    session,
    activeRole,
    purchaseRequests,
    loadPurchaseRequests,
    createPurchaseRequest,
    updatePRStatus,
    loadQuotations,
    submitQuotationComparison,
    purchaseOrders,
    loadPurchaseOrders
  } = useApp();

  const [selectedId, setSelectedId] = useState(null);
  const [selectedPR, setSelectedPR] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New PR Form State
  const [items, setItems] = useState([{ name: "", quantity: 1, targetPrice: 100 }]);
  const [estimatedAmount, setEstimatedAmount] = useState(100);

  // Remarks state for comparison selection
  const [comparisonRemarks, setComparisonRemarks] = useState("");

  // Load Data
  useEffect(() => {
    loadPurchaseRequests();
    loadPurchaseOrders();
  }, []);

  // Update selected PR details and load quotations if selected
  useEffect(() => {
    if (!selectedId) {
      setSelectedPR(null);
      setQuotes([]);
      return;
    }
    const pr = purchaseRequests.find(p => p.id === selectedId);
    setSelectedPR(pr);

    if (pr && (pr.status === "Approved" || pr.status === "Pending Approval")) {
      async function getQuotes() {
        setLoadingQuotes(true);
        const res = await loadQuotations(selectedId);
        if (res.success) {
          setQuotes(res.data);
        }
        setLoadingQuotes(false);
      }
      getQuotes();
    }
  }, [selectedId, purchaseRequests]);

  // Dynamic estimated budget calculation
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.targetPrice)), 0);
    setEstimatedAmount(total);
  }, [items]);

  function handleAddItem() {
    setItems([...items, { name: "", quantity: 1, targetPrice: 100 }]);
  }

  function handleItemChange(index, field, value) {
    const next = [...items];
    next[index][field] = value;
    setItems(next);
  }

  async function handleRaisePR(e) {
    e.preventDefault();
    if (items.some(i => !i.name)) {
      alert("Please fill all item names.");
      return;
    }

    const pr = await createPurchaseRequest({
      items,
      estimatedAmount
    });

    if (pr) {
      alert("Purchase Request raised successfully.");
      setShowAddForm(false);
      setItems([{ name: "", quantity: 1, targetPrice: 100 }]);
    }
  }

  async function handlePRApproveReject(status) {
    if (!selectedId) return;
    if (confirm(`Are you sure you want to change PR status to ${status}?`)) {
      const res = await updatePRStatus(selectedId, status);
      if (res.success) {
        alert(`PR ${status} successfully.`);
        setSelectedId(null);
      }
    }
  }

  async function handleSelectQuotation(quoteId) {
    if (!selectedId) return;
    if (confirm("Proceed to approve this quote and generate PO?")) {
      const res = await submitQuotationComparison(selectedId, quoteId, comparisonRemarks);
      if (res.success) {
        alert("Quotation approved and Purchase Order issued!");
        setSelectedId(null);
        setComparisonRemarks("");
      }
    }
  }

  const isManager = activeRole === "Admin Manager" || activeRole === "Super Admin";

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Purchase Requisitions (PR)</div>
              <div style={styles.panelSub}>Raise, compare, and approve procurement workflows.</div>
            </div>
            <button style={styles.primaryBtn} onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "Cancel" : "+ New Requisition"}
            </button>
          </div>

          {/* New PR Form */}
          {showAddForm && (
            <form onSubmit={handleRaisePR} style={styles.form}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={styles.muted}>Estimated Amount: <strong>₹{estimatedAmount}</strong></span>
                <button type="button" style={styles.secondaryBtn} onClick={handleAddItem}>+ Add Item</button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} style={styles.formRow}>
                  <input style={{ ...styles.input, flex: 2 }} required placeholder="Item Name (e.g. Printer Toner)" value={item.name} onChange={e => handleItemChange(idx, "name", e.target.value)} />
                  <input style={{ ...styles.input, flex: 0.8 }} type="number" required min="1" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(idx, "quantity", Number(e.target.value))} />
                  <input style={{ ...styles.input, flex: 1 }} type="number" required min="1" placeholder="Target Price" value={item.targetPrice} onChange={e => handleItemChange(idx, "targetPrice", Number(e.target.value))} />
                </div>
              ))}

              <button style={styles.primaryBtn} type="submit" style={{ marginTop: "10px" }}>Submit Requisition</button>
            </form>
          )}

          {/* PR Table List */}
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["PR Number", "Raised By", "Budget Amount", "Raised Date", "Status"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchaseRequests.map(pr => (
                  <tr key={pr.id} style={{ ...styles.tr, ...(selectedId === pr.id ? styles.trActive : {}) }} onClick={() => setSelectedId(pr.id)}>
                    <td style={styles.td}><strong>{pr.no}</strong></td>
                    <td style={styles.td}>{pr.raisedBy}</td>
                    <td style={styles.td}>₹{pr.amount}</td>
                    <td style={styles.td}>{pr.createdAt}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: pr.status === "Approved" ? "#22c55e22" : pr.status === "Pending Approval" ? "#f59e0b22" : "#cbd5e122", color: pr.status === "Approved" ? "#22c55e" : pr.status === "Pending Approval" ? "#f59e0b" : "#64748b" }}>
                        {pr.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {purchaseRequests.length === 0 && <div style={styles.empty}>No purchase requisitions raised.</div>}
          </div>
        </div>

        {/* PO Ledger list */}
        <div style={{ ...styles.panel, marginTop: "20px" }}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Purchase Orders Ledger (PO)</div>
              <div style={styles.panelSub}>Historical listing of procurement orders issued to suppliers.</div>
            </div>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["PO Number", "Vendor", "Total Amount", "Issued Date", "Status"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map(po => (
                  <tr key={po.id} style={styles.tr}>
                    <td style={styles.td}><strong>{po.no}</strong></td>
                    <td style={styles.td}>{po.vendorName}</td>
                    <td style={styles.td}>₹{po.amount}</td>
                    <td style={styles.td}>{po.createdAt}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: po.status === "Delivered" ? "#22c55e22" : "#6366f122", color: po.status === "Delivered" ? "#22c55e" : "#6366f1" }}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {purchaseOrders.length === 0 && <div style={styles.empty}>No Purchase Orders issued.</div>}
          </div>
        </div>
      </div>

      {/* Details Side Panel */}
      <div style={styles.detailPanel}>
        {!selectedPR ? (
          <div style={styles.emptyDetail}>Select a Purchase Requisition to view quotations matrix and approve POs.</div>
        ) : (
          <div>
            <div style={styles.detailHeader}>
              <div>
                <div style={styles.muted}>Requisition details</div>
                <div style={styles.detailNo}>{selectedPR.no}</div>
              </div>
              <div style={styles.muted}>{selectedPR.createdAt}</div>
            </div>

            {/* Line Items List */}
            <div style={styles.descBox}>
              <div style={styles.muted}>Requested Products</div>
              <div style={{ marginTop: "10px" }}>
                {selectedPR.items.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", borderBottom: "1px dashed #f1f5f9", paddingBottom: "6px", marginBottom: "6px" }}>
                    <div>{item.item_name} (x{item.quantity})</div>
                    <div>₹{item.target_price} / unit</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin/Manager approvals */}
            {selectedPR.status === "Pending Approval" && isManager && (
              <div style={styles.descBox}>
                <div style={styles.muted}>Awaiting Manager Approval</div>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button style={{ ...styles.primaryBtn, flex: 1, background: "#22c55e" }} onClick={() => handlePRApproveReject("Approved")}>Approve PR</button>
                  <button style={{ ...styles.secondaryBtn, flex: 1, color: "#ef4444", borderColor: "#ef4444" }} onClick={() => handlePRApproveReject("Rejected")}>Reject PR</button>
                </div>
              </div>
            )}

            {/* Quotes comparison matrix */}
            {(selectedPR.status === "Approved" || selectedPR.status === "Pending Approval") && (
              <div style={styles.timelineBox}>
                <div style={styles.muted}>Supplier Quotations Comparison Matrix</div>
                
                {loadingQuotes ? (
                  <div style={{ fontSize: "0.8rem", color: "#64748b", padding: "10px 0" }}>Loading quotes...</div>
                ) : (
                  <div style={{ marginTop: "10px" }}>
                    {quotes.map((q, idx) => (
                      <div key={idx} style={{ ...styles.descBox, background: "#fff", border: "1px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong>{q.vendorName}</strong>
                          <span style={{ fontSize: "0.82rem", color: "#0038a8", fontWeight: 700 }}>₹{q.totalAmount}</span>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "5px" }}>
                          {q.items.map((qi, i) => (
                            <div key={i}>{qi.item_name}: {qi.quantity} units @ ₹{qi.unit_price}</div>
                          ))}
                        </div>
                        {selectedPR.status === "Approved" && isManager && (
                          <div style={{ marginTop: "10px" }}>
                            <input style={{ ...styles.input, marginBottom: "8px" }} placeholder="Approval comments..." value={comparisonRemarks} onChange={e => setComparisonRemarks(e.target.value)} />
                            <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={() => handleSelectQuotation(q.id)}>
                              Approve Quote & Issue PO
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {quotes.length === 0 && <div style={styles.empty}>No supplier quotes submitted for this request.</div>}
                  </div>
                )}
              </div>
            )}
          </div>
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

  form: { background: "#f8fafc", padding: "20px", borderRadius: "4px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" },
  formRow: { display: "flex", gap: "10px" },
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
