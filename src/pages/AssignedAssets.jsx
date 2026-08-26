import React, { useState, useEffect } from "react";
import { useApp } from "../context/appContextCore";

export default function AssignedAssets() {
  const { assets, loadAssets, assetMetadata, assignAsset, returnAsset } = useApp();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [actionType, setActionType] = useState(null); // "return" | "reassign"
  const [newEmployeeId, setNewEmployeeId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  // Filter only assigned assets (custodian present & not unassigned/store)
  const assignedAssetsList = (assets || []).filter(a => {
    const custodian = a.custodian || a.assigned_to || "";
    if (!custodian || custodian.toLowerCase() === "unassigned" || custodian.toLowerCase() === "store") {
      return false;
    }
    
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase().trim();
    const empName = (a.custodian || a.assigned_to || "").toLowerCase();
    const code = (a.code || "").toLowerCase();
    const name = (a.name || "").toLowerCase();
    const location = (a.location || "").toLowerCase();
    const serialNo = (a.serialNo || "").toLowerCase();

    return empName.includes(term) || code.includes(term) || name.includes(term) || location.includes(term) || serialNo.includes(term);
  });

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setIsSubmitting(true);
    
    const res = await returnAsset(selectedAsset.id, remarks || "Returned custody to store");
    setIsSubmitting(false);

    if (res && res.success !== false) {
      alert(`Custody for asset ${selectedAsset.code} returned to store successfully.`);
      closeModal();
      loadAssets();
    } else {
      alert("Failed to return custody: " + (res?.message || "Unknown error"));
    }
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset || !newEmployeeId) {
      alert("Please select a new custodian.");
      return;
    }
    setIsSubmitting(true);

    // 1. Return current custody
    await returnAsset(selectedAsset.id, "Re-assigning custody transfer");
    // 2. Assign to new custodian
    const res = await assignAsset(selectedAsset.id, newEmployeeId, remarks || "Custody transferred");
    setIsSubmitting(false);

    if (res && res.success !== false) {
      alert(`Asset ${selectedAsset.code} successfully re-assigned to new custodian.`);
      closeModal();
      loadAssets();
    } else {
      alert("Failed to re-assign asset: " + (res?.message || "Unknown error"));
    }
  };

  const closeModal = () => {
    setSelectedAsset(null);
    setActionType(null);
    setNewEmployeeId("");
    setRemarks("");
  };

  const employeesList = assetMetadata?.employees || [];

  return (
    <div style={styles.page}>
      <div style={styles.panel}>
        {/* Panel Header */}
        <div style={styles.panelHeader}>
          <div>
            <div style={styles.panelTitle}>Assigned Assets Management</div>
            <div style={styles.panelSub}>
              Track checked-out assets, search by employee / asset code / model name, and manage custody returns or re-assignments.
            </div>
          </div>
          <div style={styles.badgeCount}>
            Assigned Assets: {assignedAssetsList.length}
          </div>
        </div>

        {/* Real-time Multi-Field Search Bar */}
        <div style={styles.searchBarWrap}>
          <div style={styles.searchInputBox}>
            <span style={{ color: "#64748b", fontSize: "0.9rem" }}>🔍</span>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="Search by Employee Name / Asset Code / Asset Model Name / Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button style={styles.clearSearchBtn} onClick={() => setSearchTerm("")}>
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "60px" }}>Sr. No.</th>
                <th style={styles.th}>Employee Name</th>
                <th style={styles.th}>Asset Code</th>
                <th style={styles.th}>Asset Model Name</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>Asset Serial Number</th>
                <th style={{ ...styles.th, textAlign: "center", width: "260px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignedAssetsList.length === 0 ? (
                <tr>
                  <td colSpan="7" style={styles.emptyTd}>
                    {searchTerm ? "No assigned assets match your search query." : "No assigned assets found in system."}
                  </td>
                </tr>
              ) : (
                assignedAssetsList.map((asset, idx) => (
                  <tr key={asset.id} style={styles.tr}>
                    <td style={{ ...styles.td, color: "#64748b", fontWeight: 600 }}>{idx + 1}</td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 700, color: "#0038a8" }}>
                        👤 {asset.custodian || asset.assigned_to || "N/A"}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.codeBadge}>{asset.code}</span>
                    </td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{asset.name}</td>
                    <td style={styles.td}>{asset.location || "Store / Main Premises"}</td>
                    <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "0.82rem" }}>
                      {asset.serialNo || "N/A"}
                    </td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button
                          type="button"
                          style={{ ...styles.actionBtn, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                          onClick={() => {
                            setSelectedAsset(asset);
                            setActionType("return");
                          }}
                          title="Return asset custody back to store"
                        >
                          ↩ Return Custody
                        </button>
                        <button
                          type="button"
                          style={{ ...styles.actionBtn, background: "#eff6ff", color: "#0038a8", border: "1px solid #bfdbfe" }}
                          onClick={() => {
                            setSelectedAsset(asset);
                            setActionType("reassign");
                          }}
                          title="Re-assign custody to another employee"
                        >
                          🔄 Re-assign Custodian
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Custody Modal */}
      {selectedAsset && actionType === "return" && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>↩ Return Asset Custody</div>
              <button style={styles.modalCloseBtn} onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleReturnSubmit} style={styles.modalBody}>
              <div style={styles.infoBadge}>
                <div><strong>Asset Code:</strong> {selectedAsset.code}</div>
                <div><strong>Asset Model Name:</strong> {selectedAsset.name}</div>
                <div><strong>Current Custodian:</strong> {selectedAsset.custodian || selectedAsset.assigned_to}</div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Return Remarks / Condition</label>
                <textarea
                  style={styles.textarea}
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Asset returned in good working condition to IT store."
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" style={styles.secondaryBtn} onClick={closeModal}>Cancel</button>
                <button type="submit" style={styles.primaryBtn} disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Confirm Return to Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Re-assign Custodian Modal */}
      {selectedAsset && actionType === "reassign" && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>🔄 Re-assign Asset Custodian</div>
              <button style={styles.modalCloseBtn} onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleReassignSubmit} style={styles.modalBody}>
              <div style={styles.infoBadge}>
                <div><strong>Asset Code:</strong> {selectedAsset.code}</div>
                <div><strong>Asset Model Name:</strong> {selectedAsset.name}</div>
                <div><strong>Current Custodian:</strong> {selectedAsset.custodian || selectedAsset.assigned_to}</div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Select New Custodian (Employee)</label>
                <select
                  style={styles.select}
                  required
                  value={newEmployeeId}
                  onChange={(e) => setNewEmployeeId(e.target.value)}
                >
                  <option value="">-- Choose New Custodian --</option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name || emp.full_name} ({emp.email || emp.designation || "Employee"})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Transfer Remarks / Reason</label>
                <textarea
                  style={styles.textarea}
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Internal department transfer."
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" style={styles.secondaryBtn} onClick={closeModal}>Cancel</button>
                <button type="submit" style={styles.primaryBtn} disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Confirm Re-assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { display: "flex", width: "100%", padding: "10px", boxSizing: "border-box" },
  panel: { flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" },
  panelTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" },
  panelSub: { fontSize: "0.8rem", color: "#64748b", marginTop: "2px" },
  badgeCount: { background: "#eff6ff", color: "#0038a8", border: "1px solid #bfdbfe", padding: "6px 14px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700 },

  searchBarWrap: { display: "flex", gap: "12px", width: "100%" },
  searchInputBox: { display: "flex", alignItems: "center", gap: "10px", width: "100%", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "10px 14px" },
  searchInput: { flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "0.85rem", color: "#0f172a" },
  clearSearchBtn: { background: "none", border: "none", color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 },

  tableWrap: { overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "6px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, color: "#64748b", padding: "14px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "left", letterSpacing: "1px", background: "#f8fafc" },
  tr: { borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" },
  td: { padding: "14px 16px", fontSize: "0.82rem", color: "#0f172a" },
  emptyTd: { padding: "30px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" },
  codeBadge: { background: "#f1f5f9", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "3px 8px", fontFamily: "monospace", fontWeight: 700, fontSize: "0.82rem" },

  actionBtn: { padding: "6px 12px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" },

  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalBox: { background: "#fff", borderRadius: "8px", width: "90%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)", overflow: "hidden" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" },
  modalTitle: { fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" },
  modalCloseBtn: { background: "none", border: "none", fontSize: "1rem", color: "#64748b", cursor: "pointer" },
  modalBody: { padding: "20px", display: "flex", flexDirection: "column", gap: "16px" },
  infoBadge: { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", padding: "12px", fontSize: "0.8rem", color: "#1e3a8a", display: "flex", flexDirection: "column", gap: "4px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.7rem", fontWeight: 700, letterSpacing: "1px", color: "#475569", textTransform: "uppercase" },
  select: { width: "100%", padding: "10px 12px", fontSize: "0.82rem", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#fff", outline: "none" },
  textarea: { width: "100%", padding: "10px 12px", fontSize: "0.82rem", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#fff", outline: "none", resize: "vertical" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" },
  primaryBtn: { background: "#0038a8", color: "#fff", border: "none", borderRadius: "4px", padding: "10px 16px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },
  secondaryBtn: { background: "#fff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 14px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }
};
