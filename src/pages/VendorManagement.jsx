import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";
import { supabase } from "../lib/supabase";

export default function VendorManagement() {
  const { session } = useApp();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gst, setGst] = useState("");
  const [serviceType, setServiceType] = useState("Cleaning Services");
  const [contractValue, setContractValue] = useState("");
  const [paymentDue, setPaymentDue] = useState("");
  const [rating, setRating] = useState("5");

  async function loadVendors() {
    setLoading(true);
    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .order("name", { ascending: true });
    if (!error && data) {
      setVendors(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    loadVendors();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a vendor name.");
      return;
    }

    const companyId = session?.companyId || "7e85d57c-2dcd-4943-9066-6467c5bb10e4";

    // Build serialized service type to hold address & gst if columns are missing
    const serializedService = `${serviceType} | GST: ${gst || "N/A"} | Address: ${address || "N/A"}`;

    const { error } = await supabase
      .from("vendors")
      .insert({
        company_id: companyId,
        name,
        email,
        phone,
        contact_person: ownerName,
        service_type: serializedService,
        contract_value: parseFloat(contractValue) || 0,
        payment_due: parseFloat(paymentDue) || 0,
        rating: parseFloat(rating) || 5
      });

    if (error) {
      alert("Failed to register vendor: " + error.message);
    } else {
      alert("Vendor registered successfully!");
      setShowForm(false);
      setName("");
      setOwnerName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setGst("");
      setServiceType("Cleaning Services");
      setContractValue("");
      setPaymentDue("");
      setRating("5");
      loadVendors();
    }
  }

  const selectedVendor = vendors.find(v => v.id === selectedId);

  // Helper to parse serialized service type details
  function parseServiceDetails(serviceStr) {
    if (!serviceStr) return { type: "N/A", gst: "N/A", address: "N/A" };
    const parts = serviceStr.split(" | ");
    const type = parts[0] || "N/A";
    let gstVal = "N/A";
    let addressVal = "N/A";

    parts.forEach(part => {
      if (part.startsWith("GST: ")) {
        gstVal = part.replace("GST: ", "");
      } else if (part.startsWith("Address: ")) {
        addressVal = part.replace("Address: ", "");
      }
    });

    return { type, gst: gstVal, address: addressVal };
  }

  const parsed = selectedVendor ? parseServiceDetails(selectedVendor.service_type) : null;

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Vendor Directory & Management</div>
              <div style={styles.panelSub}>Register and monitor business suppliers, ratings, and ledgers.</div>
            </div>
            <button style={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "+ Register Vendor"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={styles.label}>Vendor Name</label>
                  <input style={styles.input} required placeholder="e.g. CleanPro Services" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={styles.label}>Owner / Contact Name</label>
                  <input style={styles.input} required placeholder="e.g. Suresh Patel" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={styles.label}>Email ID</label>
                  <input type="email" style={styles.input} required placeholder="e.g. contact@cleanpro.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={styles.label}>Phone Number</label>
                  <input style={styles.input} required placeholder="e.g. 9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={styles.label}>GST Number</label>
                  <input style={styles.input} required placeholder="e.g. 24AAACC1234F1Z1" value={gst} onChange={e => setGst(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={styles.label}>Service / Product Type</label>
                  <select style={styles.input} value={serviceType} onChange={e => setServiceType(e.target.value)}>
                    <option value="Cleaning Services">Cleaning Services</option>
                    <option value="IT Hardware Suppliers">IT Hardware Suppliers</option>
                    <option value="Office Stationery">Office Stationery</option>
                    <option value="Security Services">Security Services</option>
                    <option value="Electrical Supplies">Electrical Supplies</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={styles.label}>Contract Value (INR)</label>
                  <input type="number" style={styles.input} placeholder="e.g. 150000" value={contractValue} onChange={e => setContractValue(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={styles.label}>Initial Payment Due (INR)</label>
                  <input type="number" style={styles.input} placeholder="e.g. 25000" value={paymentDue} onChange={e => setPaymentDue(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "10px" }}>
                <label style={styles.label}>Vendor Address</label>
                <textarea style={{ ...styles.input, minHeight: "60px", fontFamily: "inherit" }} required placeholder="Enter full office address..." value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <button style={{ ...styles.primaryBtn, marginTop: "15px", width: "100%" }} type="submit">
                Register Vendor & Save details
              </button>
            </form>
          )}

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Vendor Name</th>
                  <th style={styles.th}>Owner Name</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Service Type</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => {
                  const details = parseServiceDetails(v.service_type);
                  return (
                    <tr key={v.id} style={{ ...styles.tr, ...(selectedId === v.id ? styles.trActive : {}) }} onClick={() => setSelectedId(v.id)}>
                      <td style={styles.td}><strong>{v.name}</strong></td>
                      <td style={styles.td}>{v.contact_person || "N/A"}</td>
                      <td style={styles.td}>{v.phone || "N/A"}</td>
                      <td style={styles.td}>{v.email || "N/A"}</td>
                      <td style={styles.td}>{details.type}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {vendors.length === 0 && !loading && <div style={styles.empty}>No vendors registered.</div>}
            {loading && <div style={styles.empty}>Loading vendor list...</div>}
          </div>
        </div>
      </div>

      <div style={styles.detailPanel}>
        {!selectedVendor ? (
          <div style={styles.emptyDetail}>Select a vendor from the list to view specifications.</div>
        ) : (
          <div>
            <div style={styles.detailHeader}>
              <div>
                <div style={styles.muted}>Vendor Details</div>
                <div style={styles.detailNo}>{selectedVendor.name}</div>
              </div>
            </div>

            <div style={styles.descBox}>
              <div style={styles.muted}>Official Registration</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", marginTop: "10px", fontSize: "0.82rem" }}>
                <div><strong>Owner / Contact:</strong> {selectedVendor.contact_person || "N/A"}</div>
                <div><strong>GST Number:</strong> {parsed.gst}</div>
                <div><strong>Service Sector:</strong> {parsed.type}</div>
                <div><strong>Email Address:</strong> {selectedVendor.email}</div>
                <div><strong>Phone Number:</strong> {selectedVendor.phone}</div>
                <div><strong>Office Address:</strong> {parsed.address}</div>
              </div>
            </div>

            <div style={styles.descBox}>
              <div style={styles.muted}>Contract Ledger Overview</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", marginTop: "10px", fontSize: "0.82rem" }}>
                <div><strong>Total Contract Value:</strong> ₹{selectedVendor.contract_value || 0}</div>
                <div><strong>Payment Outstanding:</strong> <span style={{ color: "#ef4444", fontWeight: "bold" }}>₹{selectedVendor.payment_due || 0}</span></div>
                <div><strong>Vendor Rating:</strong> <span style={{ color: "#f59e0b", fontWeight: "bold" }}>⭐ {selectedVendor.rating || 5} / 5</span></div>
              </div>
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

  form: { background: "#f8fafc", padding: "20px", borderRadius: "4px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" },
  formRow: { display: "flex", gap: "10px" },
  label: { fontSize: "0.78rem", fontWeight: "bold", color: "#475569" },
  input: { padding: "8px 12px", fontSize: "0.82rem", color: "#111625", border: "1px solid #e2e8f0", borderRadius: "4px", background: "#fff", outline: "none" },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, color: "#64748b", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "left", letterSpacing: "1px" },
  tr: { borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.2s" },
  trActive: { background: "#eff6ff", borderLeft: "4px solid #0038a8" },
  td: { padding: "12px 16px", fontSize: "0.8rem", color: "#111625" },
  empty: { color: "#94a3b8", fontSize: "0.82rem", textAlign: "center", padding: "30px" },

  detailPanel: { flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px", minWidth: "350px", maxHeight: "100vh", overflowY: "auto" },
  emptyDetail: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "0.85rem", padding: "40px", textAlign: "center" },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "16px" },
  detailNo: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#111625", marginTop: "2px" },
  muted: { fontSize: "0.78rem", color: "#64748b" },
  descBox: { background: "#f8fafc", borderRadius: "4px", padding: "16px", border: "1px solid #cbd5e1", marginBottom: "12px" }
};
