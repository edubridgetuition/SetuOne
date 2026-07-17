import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";
import { supabase } from "../lib/supabase";

export default function GuestHouseManagement({ defaultFilter = "All" }) {
  const { session } = useApp();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultFilter);
  const [selectedId, setSelectedId] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState("Flat");
  const [address, setAddress] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerContact, setOwnerContact] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Vacant");

  async function loadProperties() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hired_properties")
        .select("*")
        .order("name", { ascending: true });
      if (!error && data) {
        setProperties(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load properties:", err);
    } finally {
      setLoading(false);
    }
  }

  // Update active tab when sidebar link changes
  useEffect(() => {
    setActiveTab(defaultFilter);
  }, [defaultFilter]);

  useEffect(() => {
    loadProperties();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      alert("Please enter property name and address.");
      return;
    }

    const companyId = session?.companyId || "7e85d57c-2dcd-4943-9066-6467c5bb10e4";
    const branchId = session?.branchId || "fea717ef-95da-443f-a0ac-cab8be2995f5";

    const { error } = await supabase
      .from("hired_properties")
      .insert({
        company_id: companyId,
        branch_id: branchId,
        name: name.trim(),
        type,
        address: address.trim(),
        owner_name: ownerName.trim(),
        owner_contact: ownerContact.trim(),
        monthly_rent: parseFloat(monthlyRent) || 0,
        security_deposit: parseFloat(securityDeposit) || 0,
        agreement_start_date: startDate || null,
        agreement_end_date: endDate || null,
        status
      });

    if (error) {
      alert("Failed to register property: " + error.message);
    } else {
      alert("Property and agreement registered successfully!");
      setShowForm(false);
      setName("");
      setType("Flat");
      setAddress("");
      setOwnerName("");
      setOwnerContact("");
      setMonthlyRent("");
      setSecurityDeposit("");
      setStartDate("");
      setEndDate("");
      setStatus("Vacant");
      loadProperties();
    }
  }

  async function togglePropertyStatus(id, currentStatus) {
    const nextStatus = currentStatus === "Inactive" ? "Vacant" : "Inactive";
    const { error } = await supabase
      .from("hired_properties")
      .update({ status: nextStatus })
      .eq("id", id);

    if (error) {
      alert("Failed to update status: " + error.message);
    } else {
      loadProperties();
    }
  }

  // Filter logic
  const filteredProperties = properties.filter(p => {
    if (activeTab === "Active") return p.status !== "Inactive";
    if (activeTab === "Inactive") return p.status === "Inactive";
    return true; // "All" or "Agreements" tab
  });

  const selectedProperty = properties.find(p => p.id === selectedId);

  // Stats calculation
  const totalCount = properties.length;
  const activeCount = properties.filter(p => p.status !== "Inactive").length;
  const inactiveCount = properties.filter(p => p.status === "Inactive").length;
  const totalRent = properties
    .filter(p => p.status !== "Inactive")
    .reduce((sum, p) => sum + (p.monthly_rent || 0), 0);

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Property & Landlord Agreement Console</h2>
              <p style={styles.panelSub}>
                Manage company-leased guest houses, employee hired flats, rental payouts, and landlord agreements.
              </p>
            </div>
            <button style={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>
              {showForm ? "View Directory" : "Onboard Leased Property"}
            </button>
          </div>

          {/* Stats Widget Row */}
          {!showForm && (
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Total Leases</span>
                <span style={styles.statValue}>{totalCount}</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Active Stays</span>
                <span style={{ ...styles.statValue, color: "#16a34a" }}>{activeCount}</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Inactive Agreements</span>
                <span style={{ ...styles.statValue, color: "#ef4444" }}>{inactiveCount}</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Monthly rent payout</span>
                <span style={{ ...styles.statValue, color: "#0038a8" }}>₹{totalRent.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}

          {/* Tab Selection Filter */}
          {!showForm && (
            <div style={styles.tabHeader}>
              {[
                { key: "All", label: `All Leases (${totalCount})` },
                { key: "Active", label: `Active (${activeCount})` },
                { key: "Inactive", label: `Inactive (${inactiveCount})` },
                { key: "Agreements", label: "Landlord Agreements" }
              ].map(tab => (
                <button
                  key={tab.key}
                  style={{ ...styles.tabBtn, ...(activeTab === tab.key ? styles.tabBtnActive : {}) }}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {showForm ? (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.muted}>New Property & Agreement Details</div>
              
              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 2 }}>
                  <label style={styles.label}>Property / Flat Name</label>
                  <input style={styles.input} required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Orion Residency, Flat 302" />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Property Type</label>
                  <select style={styles.input} value={type} onChange={e => setType(e.target.value)}>
                    <option value="Flat">Flat</option>
                    <option value="Guest House">Guest House</option>
                    <option value="Villa">Villa</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Full Address</label>
                <input style={styles.input} required value={address} onChange={e => setAddress(e.target.value)} placeholder="Full street details, city, pincode" />
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Landlord Name</label>
                  <input style={styles.input} value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="e.g. Suresh Kumar" />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Landlord Contact</label>
                  <input style={styles.input} value={ownerContact} onChange={e => setOwnerContact(e.target.value)} placeholder="e.g. +91 98765 43210" />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Monthly Rent (₹)</label>
                  <input type="number" style={styles.input} required value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} placeholder="e.g. 25000" />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Security Deposit (₹)</label>
                  <input type="number" style={styles.input} required value={securityDeposit} onChange={e => setSecurityDeposit(e.target.value)} placeholder="e.g. 75000" />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Agreement Start Date</label>
                  <input type="date" style={styles.input} value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Agreement End Date</label>
                  <input type="date" style={styles.input} value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Initial Status</label>
                <select style={styles.input} value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="Vacant">Vacant</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Inactive">Inactive / Suspended</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button style={styles.primaryBtn} type="submit">Submit Registration</button>
                <button style={styles.secondaryBtn} type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  {activeTab === "Agreements" ? (
                    <tr>
                      <th style={styles.th}>Property</th>
                      <th style={styles.th}>Landlord</th>
                      <th style={styles.th}>Monthly Rent</th>
                      <th style={styles.th}>Deposit</th>
                      <th style={styles.th}>Start / End Date</th>
                    </tr>
                  ) : (
                    <tr>
                      <th style={styles.th}>Property</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Landlord / Owner</th>
                      <th style={styles.th}>Monthly Rent</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {filteredProperties.map(p => {
                    const isSelected = p.id === selectedId;
                    return (
                      <tr
                        key={p.id}
                        style={{ ...styles.tr, ...(isSelected ? styles.trActive : {}) }}
                        onClick={() => setSelectedId(p.id)}
                      >
                        {activeTab === "Agreements" ? (
                          <>
                            <td style={styles.td}><strong>{p.name}</strong></td>
                            <td style={styles.td}>{p.owner_name || "N/A"}</td>
                            <td style={styles.td}>₹{(p.monthly_rent || 0).toLocaleString("en-IN")}</td>
                            <td style={styles.td}>₹{(p.security_deposit || 0).toLocaleString("en-IN")}</td>
                            <td style={styles.td}>
                              <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                                {p.agreement_start_date || "N/A"} to {p.agreement_end_date || "N/A"}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={styles.td}>
                              <div><strong>{p.name}</strong></div>
                              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>{p.address}</div>
                            </td>
                            <td style={styles.td}>{p.type}</td>
                            <td style={styles.td}>{p.owner_name || "N/A"}</td>
                            <td style={styles.td}>₹{(p.monthly_rent || 0).toLocaleString("en-IN")}</td>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.badge,
                                background: p.status === 'Occupied' ? '#eff6ff' : p.status === 'Vacant' ? '#f0fdf4' : p.status === 'Under Maintenance' ? '#fffbeb' : '#f1f5f9',
                                color: p.status === 'Occupied' ? '#2563eb' : p.status === 'Vacant' ? '#16a34a' : p.status === 'Under Maintenance' ? '#d97706' : '#64748b'
                              }}>
                                {p.status}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredProperties.length === 0 && !loading && <div style={styles.empty}>No properties found.</div>}
              {loading && <div style={styles.empty}>Loading property records...</div>}
            </div>
          )}
        </div>
      </div>

      <div style={styles.detailPanel}>
        {!selectedProperty ? (
          <div style={styles.emptyDetail}>Select a property from the directory to view landlord terms and details.</div>
        ) : (
          <div>
            <div style={styles.detailHeader}>
              <div>
                <span style={styles.muted}>Property Specification</span>
                <h3 style={styles.detailNo}>{selectedProperty.name}</h3>
              </div>
            </div>

            <div style={styles.descBox}>
              <span style={styles.muted}>Lease Address</span>
              <p style={{ fontSize: "0.85rem", color: "#334155", marginTop: "6px", lineHeight: "1.4" }}>
                {selectedProperty.address}
              </p>
            </div>

            <div style={styles.descBox}>
              <span style={styles.muted}>Landlord / Contact Details</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", marginTop: "10px", fontSize: "0.82rem" }}>
                <div><strong>Full Name:</strong> {selectedProperty.owner_name || "N/A"}</div>
                <div><strong>Phone / Contact:</strong> {selectedProperty.owner_contact || "N/A"}</div>
              </div>
            </div>

            <div style={styles.descBox}>
              <span style={styles.muted}>Rent & Agreement Ledger</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", marginTop: "10px", fontSize: "0.82rem" }}>
                <div><strong>Monthly Rent Payout:</strong> ₹{(selectedProperty.monthly_rent || 0).toLocaleString("en-IN")}</div>
                <div><strong>Security Deposit:</strong> ₹{(selectedProperty.security_deposit || 0).toLocaleString("en-IN")}</div>
                <div><strong>Agreement Period:</strong> {selectedProperty.agreement_start_date || "N/A"} to {selectedProperty.agreement_end_date || "N/A"}</div>
                <div>
                  <strong>Lease Status: </strong>
                  <span style={{ fontWeight: "bold", color: selectedProperty.status === 'Inactive' ? '#ef4444' : '#16a34a' }}>
                    {selectedProperty.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <button
                type="button"
                style={{ 
                  ...styles.primaryBtn, 
                  width: "100%", 
                  background: selectedProperty.status === 'Inactive' ? '#16a34a' : '#ef4444',
                  textAlign: "center"
                }}
                onClick={() => togglePropertyStatus(selectedProperty.id, selectedProperty.status)}
              >
                {selectedProperty.status === "Inactive" ? "Mark Agreement as Active" : "Terminate Agreement / Mark Inactive"}
              </button>
            </div>
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

  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "4px", border: "1px solid #e2e8f0" },
  statCard: { display: "flex", flexDirection: "column", gap: "4px" },
  statLabel: { fontSize: "0.65rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" },
  statValue: { fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" },

  tabHeader: { display: "flex", gap: "6px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", flexWrap: "wrap" },
  tabBtn: { background: "none", border: "none", color: "#64748b", fontSize: "0.8rem", fontWeight: 600, padding: "8px 12px", cursor: "pointer", outline: "none" },
  tabBtnActive: { color: "#0038a8", borderBottom: "2px solid #0038a8" },

  form: { background: "#f8fafc", padding: "20px", borderRadius: "4px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px" },
  formRow: { display: "flex", gap: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1px", color: "#111625", textTransform: "uppercase" },
  input: { padding: "8px 12px", fontSize: "0.82rem", color: "#111625", border: "1px solid #e2e8f0", borderRadius: "4px", background: "#fff", outline: "none" },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, color: "#64748b", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "left", letterSpacing: "1px" },
  tr: { borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.2s" },
  trActive: { background: "#eff6ff", borderLeft: "4px solid #0038a8" },
  td: { padding: "12px 16px", fontSize: "0.8rem", color: "#111625" },
  empty: { color: "#94a3b8", fontSize: "0.82rem", textAlign: "center", padding: "30px" },
  badge: { fontSize: "0.68rem", fontWeight: 600, padding: "3px 8px", borderRadius: "20px", display: "inline-block" },

  detailPanel: { flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px", minWidth: "320px", maxHeight: "100vh", overflowY: "auto" },
  emptyDetail: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "0.85rem", padding: "40px", textAlign: "center" },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "16px" },
  detailNo: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#111625", marginTop: "2px" },
  muted: { fontSize: "0.65rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" },
  descBox: { background: "#f8fafc", borderRadius: "4px", padding: "16px", border: "1px solid #cbd5e1", marginBottom: "12px" }
};
