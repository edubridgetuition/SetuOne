import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";

const statusColors = { Inside: "#6366f1", "Checked Out": "#22c55e", Expired: "#f59e0b", Cancelled: "#ef4444" };

export default function VisitorManagement() {
  const {
    session,
    visitors,
    loadVisitors,
    checkInVisitor,
    checkOutVisitor,
    uploadVisitorPhoto,
    searchVisitors,
    assignees,
    masterDefinitionsList
  } = useApp();

  const [activeTab, setActiveTab] = useState("Inside");
  const [selectedVisitorId, setSelectedVisitorId] = useState(null);
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  // Forms states
  const [searchQuery, setSearchQuery] = useState("");
  const [checkoutRemarks, setCheckoutRemarks] = useState("Meeting Completed");
  const [photoInput, setPhotoInput] = useState("");

  const purpDef = masterDefinitionsList?.find(d => d.master_key === "VISITOR_PURPOSES");
  const visitorPurposes = purpDef 
    ? purpDef.master_values.map(val => val.value_label) 
    : ["Meeting", "Interview", "Vendor Service", "Delivery", "Maintenance", "AMC Visit", "Audit", "Guest"];

  const idDef = masterDefinitionsList?.find(d => d.master_key === "VISITOR_ID_TYPES");
  const visitorIdTypes = idDef 
    ? idDef.master_values.map(val => val.value_label) 
    : ["Aadhaar", "Driving License", "Passport", "PAN", "Company ID"];

  const vehDef = masterDefinitionsList?.find(d => d.master_key === "VEHICLE_TYPES");
  const vehicleTypes = vehDef 
    ? vehDef.master_values.map(val => val.value_label) 
    : ["None", "Car", "Bike", "Truck", "Tempo", "Cab"];

  const [checkInForm, setCheckInForm] = useState({
    name: "",
    hostId: "",
    mobile: "",
    purpose: visitorPurposes[0] || "Meeting",
    idType: visitorIdTypes[0] || "Aadhaar",
    idNumber: "",
    visitorType: "Walk In",
    vehicleType: vehicleTypes[0] || "Car",
    vehicleNo: ""
  });

  // Load visitors data on mount
  useEffect(() => {
    loadVisitors();
  }, []);

  // Update selected visitor details panel
  useEffect(() => {
    if (!selectedVisitorId) {
      setSelectedVisitor(null);
      return;
    }
    const match = visitors.find(v => v.id === selectedVisitorId);
    setSelectedVisitor(match);
  }, [selectedVisitorId, visitors]);

  // Set default host ID once assignees list loads
  useEffect(() => {
    if (assignees.length > 0 && !checkInForm.hostId) {
      setCheckInForm(prev => ({ ...prev, hostId: assignees[0].id }));
    }
  }, [assignees]);

  // Sync default form options once dynamic masters load
  useEffect(() => {
    if (visitorPurposes.length > 0 && !visitorPurposes.includes(checkInForm.purpose)) {
      setCheckInForm(prev => ({ ...prev, purpose: visitorPurposes[0] }));
    }
    if (visitorIdTypes.length > 0 && !visitorIdTypes.includes(checkInForm.idType)) {
      setCheckInForm(prev => ({ ...prev, idType: visitorIdTypes[0] }));
    }
    if (vehicleTypes.length > 0 && !vehicleTypes.includes(checkInForm.vehicleType)) {
      setCheckInForm(prev => ({ ...prev, vehicleType: vehicleTypes[0] }));
    }
  }, [visitorPurposes, visitorIdTypes, vehicleTypes]);

  async function handleCheckIn(e) {
    e.preventDefault();
    if (!checkInForm.hostId) {
      alert("Please select a host employee.");
      return;
    }
    const res = await checkInVisitor(checkInForm);
    if (res) {
      alert(`Visitor pass generated: ${res.pass_no}`);
      setCheckInForm({
        name: "",
        hostId: assignees[0]?.id || "",
        mobile: "",
        purpose: visitorPurposes[0] || "Meeting",
        idType: visitorIdTypes[0] || "Aadhaar",
        idNumber: "",
        visitorType: "Walk In",
        vehicleType: vehicleTypes[0] || "Car",
        vehicleNo: ""
      });
      setActiveTab("Inside");
    }
  }

  async function handleCheckOut() {
    if (!selectedVisitorId) return;
    const res = await checkOutVisitor(selectedVisitorId, checkoutRemarks);
    if (res) {
      alert("Visitor checked out successfully.");
      setSelectedVisitorId(null);
      setCheckoutRemarks("Meeting Completed");
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file || !selectedVisitorId) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      const res = await uploadVisitorPhoto(selectedVisitorId, base64String);
      if (res.success) {
        alert("Visitor photo captured successfully!");
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim() === "") {
      loadVisitors();
    } else {
      await searchVisitors(searchQuery);
    }
  }

  // Segment visitors by tab status
  const insideVisitors = visitors.filter(v => v.status === "Inside");
  const checkedOutVisitors = visitors.filter(v => v.status === "Checked Out");
  const preApprovedVisitors = visitors.filter(v => v.visitor_type === "Pre Approved" && v.status === "Inside");
  const walkInVisitors = visitors.filter(v => v.visitor_type === "Walk In" && v.status === "Inside");

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.panel}>
          
          {/* Header & Tabs */}
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Visitor Registry Portal</div>
              <div style={styles.panelSub}>Log walk-in guests, approve pre-scheduled entries, and check out visitors.</div>
            </div>
          </div>

          <div style={styles.tabHeader}>
            {[
              { key: "Inside", label: `Inside (${insideVisitors.length})` },
              { key: "Checked Out", label: `Checked Out (${checkedOutVisitors.length})` },
              { key: "Pre Approved", label: `Expected (${preApprovedVisitors.length})` },
              { key: "Log Walk-in", label: "Check-in Walk-in" }
            ].map(tab => (
              <button
                key={tab.key}
                style={{ ...styles.tabBtn, ...(activeTab === tab.key ? styles.tabBtnActive : {}) }}
                onClick={() => { setActiveTab(tab.key); setSelectedVisitorId(null); }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          {activeTab !== "Log Walk-in" && (
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
              <input
                style={{ ...styles.input, flex: 1 }}
                placeholder="Emergency search by Mobile, Vehicle No, or Pass No..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button style={styles.primaryBtn} type="submit">Search</button>
            </form>
          )}

          {/* Tab Content 1: Inside Visitors */}
          {activeTab === "Inside" && (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Pass Number", "Visitor Name", "Host / Employee", "Mobile", "Purpose", "In Time"].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {insideVisitors.map(v => (
                    <tr key={v.id} style={{ ...styles.tr, ...(selectedVisitorId === v.id ? styles.trActive : {}) }} onClick={() => setSelectedVisitorId(v.id)}>
                      <td style={styles.td}><strong>{v.pass_no || "VIS-Pending"}</strong></td>
                      <td style={styles.td}>{v.visitor_name}</td>
                      <td style={styles.td}>{v.profiles?.full_name || "N/A"}</td>
                      <td style={styles.td}>{v.mobile || "N/A"}</td>
                      <td style={styles.td}>{v.purpose || "Meeting"}</td>
                      <td style={styles.td}>{new Date(v.in_time).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {insideVisitors.length === 0 && <div style={styles.empty}>No active visitors inside the campus.</div>}
            </div>
          )}

          {/* Tab Content 2: Checked Out History */}
          {activeTab === "Checked Out" && (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Pass Number", "Visitor Name", "Host", "Out Time", "Checkout Remarks"].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {checkedOutVisitors.map(v => (
                    <tr key={v.id} style={{ ...styles.tr, ...(selectedVisitorId === v.id ? styles.trActive : {}) }} onClick={() => setSelectedVisitorId(v.id)}>
                      <td style={styles.td}><strong>{v.pass_no}</strong></td>
                      <td style={styles.td}>{v.visitor_name}</td>
                      <td style={styles.td}>{v.profiles?.full_name || "N/A"}</td>
                      <td style={styles.td}>{new Date(v.out_time).toLocaleString()}</td>
                      <td style={styles.td}>{v.checkout_remarks || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {checkedOutVisitors.length === 0 && <div style={styles.empty}>No checkout history records found.</div>}
            </div>
          )}

          {/* Tab Content 3: Pre Approved */}
          {activeTab === "Pre Approved" && (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Pass Number", "Visitor Name", "Host", "Mobile", "Scheduled In"].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preApprovedVisitors.map(v => (
                    <tr key={v.id} style={{ ...styles.tr, ...(selectedVisitorId === v.id ? styles.trActive : {}) }} onClick={() => setSelectedVisitorId(v.id)}>
                      <td style={styles.td}><strong>{v.pass_no}</strong></td>
                      <td style={styles.td}>{v.visitor_name}</td>
                      <td style={styles.td}>{v.profiles?.full_name || "N/A"}</td>
                      <td style={styles.td}>{v.mobile || "N/A"}</td>
                      <td style={styles.td}>{new Date(v.in_time).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preApprovedVisitors.length === 0 && <div style={styles.empty}>No pre-approved expected visitors for today.</div>}
            </div>
          )}

          {/* Tab Content 4: Log Walk-in Guest Form */}
          {activeTab === "Log Walk-in" && (
            <form onSubmit={handleCheckIn} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Visitor Name</label>
                  <input style={styles.input} required placeholder="Full Name" value={checkInForm.name} onChange={e => setCheckInForm({ ...checkInForm, name: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Mobile Number</label>
                  <input style={styles.input} required placeholder="+91XXXXXXXXXX" value={checkInForm.mobile} onChange={e => setCheckInForm({ ...checkInForm, mobile: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Choose Host Employee</label>
                  <select style={styles.input} value={checkInForm.hostId} onChange={e => setCheckInForm({ ...checkInForm, hostId: e.target.value })}>
                    {assignees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Purpose of Visit</label>
                  <select style={styles.input} value={checkInForm.purpose} onChange={e => setCheckInForm({ ...checkInForm, purpose: e.target.value })}>
                    {visitorPurposes.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>ID Proof Type</label>
                  <select style={styles.input} value={checkInForm.idType} onChange={e => setCheckInForm({ ...checkInForm, idType: e.target.value })}>
                    {visitorIdTypes.map(id => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>ID Document Number</label>
                  <input style={styles.input} required placeholder="XXXX-XXXX-XXXX" value={checkInForm.idNumber} onChange={e => setCheckInForm({ ...checkInForm, idNumber: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Vehicle Type</label>
                  <select style={styles.input} value={checkInForm.vehicleType} onChange={e => setCheckInForm({ ...checkInForm, vehicleType: e.target.value })}>
                    {vehicleTypes.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Vehicle Number (If any)</label>
                  <input style={styles.input} placeholder="GJ-01-XX-XXXX" value={checkInForm.vehicleNo} onChange={e => setCheckInForm({ ...checkInForm, vehicleNo: e.target.value })} />
                </div>
              </div>
              <button style={styles.primaryBtn} type="submit" style={{ marginTop: "10px" }}>Issue Gate Pass & Check-in</button>
            </form>
          )}

        </div>
      </div>

      {/* Sidebar Details & Checkout Panel */}
      <div style={styles.detailPanel}>
        {!selectedVisitor ? (
          <div style={styles.emptyDetail}>Select a visitor record to view details, capture photo, or check out.</div>
        ) : (
          <div>
            <div style={styles.detailHeader}>
              <div>
                <div style={styles.muted}>Pass details</div>
                <div style={styles.detailNo}>{selectedVisitor.pass_no || "VIS-Pending"}</div>
              </div>
              <span style={{ ...styles.badge, background: statusColors[selectedVisitor.status] + "22", color: statusColors[selectedVisitor.status] }}>
                {selectedVisitor.status}
              </span>
            </div>

            {/* Photo Capture Section */}
            <div style={styles.descBox} style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
              {selectedVisitor.photo_url ? (
                <img src={selectedVisitor.photo_url} alt="Visitor Face" style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "2px solid #0038a8" }} />
              ) : (
                <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "2rem" }}>
                  👤
                </div>
              )}
              {selectedVisitor.status === "Inside" && (
                <div>
                  <label style={{ ...styles.secondaryBtn, cursor: "pointer", display: "inline-block" }}>
                    Capture / Upload Photo
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
                  </label>
                </div>
              )}
            </div>

            {/* Visitor info details */}
            <div style={styles.descBox}>
              <div style={styles.muted} style={{ marginBottom: "8px" }}>Visitor Specifications</div>
              <div style={{ fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div>Full Name: <strong>{selectedVisitor.visitor_name}</strong></div>
                <div>Mobile Number: <strong>{selectedVisitor.mobile || "N/A"}</strong></div>
                <div>Host Employee: <strong>{selectedVisitor.profiles?.full_name || "N/A"}</strong></div>
                <div>Purpose: <strong>{selectedVisitor.purpose || "Meeting"}</strong></div>
                <div>ID Proof: <strong>{selectedVisitor.id_type} ({selectedVisitor.id_number || "N/A"})</strong></div>
                <div>Vehicle: <strong>{selectedVisitor.vehicle_type || "None"} ({selectedVisitor.vehicle_no || "N/A"})</strong></div>
                <div>In Time: <strong>{new Date(selectedVisitor.in_time).toLocaleString()}</strong></div>
              </div>
            </div>

            {/* Checkout Action Form */}
            {selectedVisitor.status === "Inside" && (
              <div style={styles.descBox}>
                <div style={styles.muted} style={{ marginBottom: "8px" }}>Visitor Checkout</div>
                <div style={styles.formGroup} style={{ marginBottom: "12px" }}>
                  <label style={styles.label}>Checkout Remarks</label>
                  <select style={styles.input} value={checkoutRemarks} onChange={e => setCheckoutRemarks(e.target.value)}>
                    {["Meeting Completed", "Material Delivered", "Cancelled", "No Show"].map(rem => (
                      <option key={rem} value={rem}>{rem}</option>
                    ))}
                  </select>
                </div>
                <button style={{ ...styles.primaryBtn, width: "100%", background: "#ef4444" }} onClick={handleCheckOut}>
                  Stamps Out (Checkout)
                </button>
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

  tabHeader: { display: "flex", gap: "10px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" },
  tabBtn: { background: "none", border: "none", color: "#64748b", fontSize: "0.85rem", fontWeight: 600, padding: "8px 16px", cursor: "pointer", outline: "none" },
  tabBtnActive: { color: "#0038a8", borderBottom: "2px solid #0038a8" },

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
