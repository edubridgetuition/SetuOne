import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";

const statusColors = { Pending: "#f59e0b", "In Progress": "#6366f1", Completed: "#22c55e", Escalated: "#ef4444" };

export default function PPMScheduler() {
  const {
    session,
    activeRole,
    ppmSchedules,
    loadPPMSchedules,
    createPPMSchedule,
    updatePPMStatus,
    assets,
    loadAssets,
    inventoryItems,
    loadInventoryItems,
    amcContracts,
    loadAMCContracts,
    renewAMC
  } = useApp();

  const [selectedPPMId, setSelectedPPMId] = useState(null);
  const [selectedPPM, setSelectedPPM] = useState(null);
  
  // Forms states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRenewForm, setShowRenewForm] = useState(false);
  const [showSparesForm, setShowSparesForm] = useState(false);

  // New PPM Schedule state
  const [addForm, setAddForm] = useState({ assetId: "", serviceType: "Monthly", vendorId: "", nextServiceDate: "" });
  
  // PPM updates state
  const [ppmRemarks, setPpmRemarks] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [costs, setCosts] = useState({ labour: 0, material: 0, vendor: 0 });
  const [spares, setSpares] = useState([]); // Array of { itemId, quantity }
  const [currentSpare, setCurrentSpare] = useState({ itemId: "", quantity: 1 });

  // AMC renewal state
  const [renewVendorId, setRenewVendorId] = useState("");
  const [renewValue, setRenewValue] = useState(10000);
  const [renewExpiry, setRenewExpiry] = useState("");

  // Load datasets
  useEffect(() => {
    loadPPMSchedules();
    loadAssets({}, 1, 50); // Eager load assets list
    loadInventoryItems();
    loadAMCContracts();
  }, []);

  // Update selected PPM details panel
  useEffect(() => {
    if (!selectedPPMId) {
      setSelectedPPM(null);
      return;
    }
    const p = ppmSchedules.find(item => item.id === selectedPPMId);
    setSelectedPPM(p);
  }, [selectedPPMId, ppmSchedules]);

  // Set default dropdown selectors once load finishes
  useEffect(() => {
    if (assets.length > 0 && !addForm.assetId) {
      setAddForm(prev => ({
        ...prev,
        assetId: assets[0].id,
        vendorId: amcContracts[0]?.id || ""
      }));
    }
  }, [assets, amcContracts]);

  async function handleAddPPM(e) {
    e.preventDefault();
    const res = await createPPMSchedule(addForm);
    if (res) {
      alert("PPM scheduled successfully.");
      setShowAddForm(false);
      setAddForm(prev => ({ ...prev, nextServiceDate: "" }));
    }
  }

  async function handlePPMTransition(status) {
    if (!selectedPPMId) return;
    
    // Package updates payload
    const updates = {
      remarks: ppmRemarks,
      costs,
      spares
    };

    if (status === "Rescheduled") {
      if (!rescheduleDate) {
        alert("Please choose a reschedule date.");
        return;
      }
      updates.nextServiceDate = rescheduleDate;
    }

    const res = await updatePPMStatus(selectedPPMId, status, updates);
    if (res.success) {
      alert(`PPM status updated to ${status}.`);
      setSelectedPPMId(null);
      setPpmRemarks("");
      setRescheduleDate("");
      setSpares([]);
    }
  }

  function handleAddSpare() {
    if (!currentSpare.itemId) return;
    const matchItem = inventoryItems.find(i => i.id === currentSpare.itemId);
    setSpares([...spares, { itemId: currentSpare.itemId, name: matchItem?.name || "Spare", quantity: currentSpare.quantity }]);
    setCurrentSpare({ itemId: "", quantity: 1 });
  }

  async function handleRenewAMC(e) {
    e.preventDefault();
    if (!renewVendorId) return;
    const res = await renewAMC(renewVendorId, renewExpiry, renewValue);
    if (res) {
      alert("AMC contract renewed successfully.");
      setShowRenewForm(false);
    }
  }

  const isManager = activeRole === "Admin Manager" || activeRole === "Super Admin";

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Planned Preventive Maintenance (PPM)</div>
              <div style={styles.panelSub}>Schedule recurring check-ups, track costs, and parts inventory logs.</div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button style={styles.secondaryBtn} onClick={() => setShowRenewForm(!showRenewForm)}>Renew AMC Contract</button>
              <button style={styles.primaryBtn} onClick={() => setShowAddForm(!showAddForm)}>+ Schedule PPM</button>
            </div>
          </div>

          {/* Renew AMC Contract Form */}
          {showRenewForm && (
            <form onSubmit={handleRenewAMC} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Select Vendor</label>
                  <select style={styles.input} required value={renewVendorId} onChange={e => setRenewVendorId(e.target.value)}>
                    <option value="">Choose Supplier</option>
                    {amcContracts.map(vendor => <option key={vendor.id} value={vendor.id}>{vendor.name} ({vendor.service_type})</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>New Contract Value (₹)</label>
                  <input style={styles.input} type="number" required value={renewValue} onChange={e => setRenewValue(Number(e.target.value))} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>New Expiry Date</label>
                  <input style={styles.input} type="date" required value={renewExpiry} onChange={e => setRenewExpiry(e.target.value)} />
                </div>
              </div>
              <button style={styles.primaryBtn} type="submit" style={{ marginTop: "10px" }}>Post Renewal Contract</button>
            </form>
          )}

          {/* Schedule PPM Form */}
          {showAddForm && (
            <form onSubmit={handleAddPPM} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Choose Asset</label>
                  <select style={styles.input} value={addForm.assetId} onChange={e => setAddForm({ ...addForm, assetId: e.target.value })}>
                    {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.code} — {asset.name}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Recurrence Period</label>
                  <select style={styles.input} value={addForm.serviceType} onChange={e => setAddForm({ ...addForm, serviceType: e.target.value })}>
                    {["Weekly", "Monthly", "Quarterly", "Half-Yearly", "Yearly"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>AMC Vendor (Optional)</label>
                  <select style={styles.input} value={addForm.vendorId} onChange={e => setAddForm({ ...addForm, vendorId: e.target.value })}>
                    <option value="">In-house Technician</option>
                    {amcContracts.map(vendor => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Next Service Date</label>
                  <input style={styles.input} type="date" required value={addForm.nextServiceDate} onChange={e => setAddForm({ ...addForm, nextServiceDate: e.target.value })} />
                </div>
              </div>
              <button style={styles.primaryBtn} type="submit" style={{ marginTop: "10px" }}>Create PPM Task</button>
            </form>
          )}

          {/* PPM schedules table grid */}
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Asset Code", "Asset Name", "PPM Frequency", "Supplier / Contractor", "Due Date", "Status"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ppmSchedules.map(ppm => (
                  <tr key={ppm.id} style={{ ...styles.tr, ...(selectedPPMId === ppm.id ? styles.trActive : {}) }} onClick={() => setSelectedPPMId(ppm.id)}>
                    <td style={styles.td}><strong>{ppm.assetCode}</strong></td>
                    <td style={styles.td}>{ppm.assetName}</td>
                    <td style={styles.td}>{ppm.serviceType}</td>
                    <td style={styles.td}>{ppm.vendorName}</td>
                    <td style={styles.td}>{ppm.nextServiceDate}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: statusColors[ppm.status] + "22", color: statusColors[ppm.status] }}>
                        {ppm.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ppmSchedules.length === 0 && <div style={styles.empty}>No Planned Preventive Maintenance schedules defined.</div>}
          </div>
        </div>
      </div>

      {/* Operations Details Panel */}
      <div style={styles.detailPanel}>
        {!selectedPPM ? (
          <div style={styles.emptyDetail}>Select a PPM schedule task to transition statuses and log spare parts consumption.</div>
        ) : (
          <div>
            <div style={styles.detailHeader}>
              <div>
                <div style={styles.muted}>PPM details</div>
                <div style={styles.detailNo}>{selectedPPM.assetCode}</div>
              </div>
              <div style={styles.muted}>{selectedPPM.nextServiceDate}</div>
            </div>

            {/* Basic Info */}
            <div style={styles.descBox}>
              <div>Machine Asset: <strong>{selectedPPM.assetName}</strong></div>
              <div>Frequency Period: <strong>{selectedPPM.serviceType}</strong></div>
              <div>Allocated Vendor: <strong>{selectedPPM.vendorName}</strong></div>
            </div>

            {/* Reschedule Date form */}
            {selectedPPM.status === "Pending" && (
              <div style={styles.descBox}>
                <div style={styles.muted}>PPM Transitions</div>
                <button style={{ ...styles.primaryBtn, width: "100%", marginTop: "10px" }} onClick={() => handlePPMTransition("In Progress")}>
                  Start PPM Task
                </button>
                <div style={{ borderTop: "1px dashed #cbd5e1", marginTop: "15px", paddingTop: "15px" }}>
                  <label style={styles.label}>Reschedule Task Date</label>
                  <input style={{ ...styles.input, marginTop: "5px", marginBottom: "8px" }} type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} />
                  <button style={{ ...styles.secondaryBtn, width: "100%" }} onClick={() => handlePPMTransition("Rescheduled")}>
                    Postpone / Reschedule
                  </button>
                </div>
              </div>
            )}

            {/* In Progress verification inputs */}
            {selectedPPM.status === "In Progress" && (
              <div>
                <div style={styles.descBox}>
                  <div style={styles.muted}>Service Cost Breakdowns (₹)</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Labour Cost</label>
                      <input style={styles.input} type="number" value={costs.labour} onChange={e => setCosts({ ...costs, labour: Number(e.target.value) })} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Material Cost</label>
                      <input style={styles.input} type="number" value={costs.material} onChange={e => setCosts({ ...costs, material: Number(e.target.value) })} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Vendor Fee</label>
                      <input style={styles.input} type="number" value={costs.vendor} onChange={e => setCosts({ ...costs, vendor: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>

                {/* Spares inventory integration */}
                <div style={styles.descBox}>
                  <div style={styles.muted}>Spare Parts Used (Inventory Out)</div>
                  
                  <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                    <select style={{ ...styles.input, flex: 2 }} value={currentSpare.itemId} onChange={e => setCurrentSpare({ ...currentSpare, itemId: e.target.value })}>
                      <option value="">Choose Part</option>
                      {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                    <input style={{ ...styles.input, flex: 0.8 }} type="number" min="1" value={currentSpare.quantity} onChange={e => setCurrentSpare({ ...currentSpare, quantity: Number(e.target.value) })} />
                    <button type="button" style={styles.secondaryBtn} onClick={handleAddSpare}>Add</button>
                  </div>

                  <div style={{ marginTop: "10px" }}>
                    {spares.map((sp, idx) => (
                      <div key={idx} style={{ fontSize: "0.78rem", borderBottom: "1px dashed #e2e8f0", paddingBottom: "4px", marginBottom: "4px" }}>
                        {sp.name} — Quantity: <strong>{sp.quantity}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Completion actions */}
                <div style={styles.descBox}>
                  <label style={styles.label}>Service Remarks / Audit Comments</label>
                  <textarea style={{ ...styles.input, height: "60px", resize: "vertical", marginTop: "5px", marginBottom: "10px" }} value={ppmRemarks} onChange={e => setPpmRemarks(e.target.value)} required placeholder="Filters cleaned, compressor verified." />
                  
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button style={{ ...styles.primaryBtn, flex: 1, background: "#22c55e" }} onClick={() => handlePPMTransition("Completed")}>Complete PPM</button>
                    <button style={{ ...styles.secondaryBtn, flex: 0.8, color: "#ef4444", borderColor: "#ef4444" }} onClick={() => handlePPMTransition("Escalated")}>Skip Task</button>
                  </div>
                </div>
              </div>
            )}

            {/* Completed logs */}
            {selectedPPM.status === "Completed" && (
              <div style={styles.descBox}>
                <div style={{ color: "#22c55e", fontWeight: 700, fontSize: "0.85rem" }}>✓ Maintenance Audit Completed</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "5px" }}>The next recurring maintenance interval has been auto-scheduled. Check your pending lists.</div>
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
  secondaryBtn: { background: "#fff", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 14px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },

  form: { background: "#f8fafc", padding: "20px", borderRadius: "4px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" },
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
