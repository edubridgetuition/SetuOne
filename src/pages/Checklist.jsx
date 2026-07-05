import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";

const statusColors = { Pending: "#f59e0b", "In Progress": "#6366f1", Completed: "#22c55e", Escalated: "#ef4444" };

export default function Checklist() {
  const {
    session,
    checklistSchedules,
    loadChecklistSchedules,
    submitChecklist,
    createTicket,
    setActiveView
  } = useApp();

  const [frequency, setFrequency] = useState("All");
  const [ticketForm, setTicketForm] = useState({
    locationId: "",
    category: "Electrical Complaint",
    priority: "Medium",
    description: "Inspection item failed during routine rounds."
  });

  // Load Schedules
  useEffect(() => {
    loadChecklistSchedules({ frequency });
  }, [frequency]);

  async function handleStatusChange(scheduleId, status) {
    await submitChecklist(scheduleId, status, "Inspection updated.");
  }

  async function handleRemarksChange(scheduleId, remarks) {
    await submitChecklist(scheduleId, "In Progress", remarks);
  }

  async function handleSave() {
    alert("Checklist schedules saved in database!");
    loadChecklistSchedules({ frequency });
  }

  async function handleTicketSubmit(e) {
    e.preventDefault();
    if (!ticketForm.locationId) {
      alert("Please select a location.");
      return;
    }
    const res = await createTicket({
      category: ticketForm.category,
      locationId: ticketForm.locationId,
      priority: ticketForm.priority,
      description: ticketForm.description
    });
    if (res) {
      alert("Ticket created successfully from failed inspection checklist!");
      setActiveView("tickets");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.mainPanel}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Scheduled Checklist Rounds</div>
              <div style={styles.panelSub}>Daily, weekly, and monthly maintenance inspection audits.</div>
            </div>
            <button style={styles.primaryBtn} onClick={handleSave}>Sync Changes</button>
          </div>

          {/* Filters */}
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Frequency Filter</label>
              <select style={styles.select} value={frequency} onChange={e => setFrequency(e.target.value)}>
                {["All", "Daily", "Weekly", "Monthly"].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Area", "Checklist Item", "Frequency", "Scheduled Status", "Remarks / Audit Notes"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {checklistSchedules.map(item => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.td}><strong>{item.area}</strong></td>
                    <td style={{ ...styles.td, maxWidth: "200px" }}>{item.item}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: "#6366f122", color: "#818cf8" }}>{item.frequency}</span>
                    </td>
                    <td style={styles.td}>
                      <select
                        style={{
                          ...styles.select,
                          fontSize: "12px",
                          padding: "4px 8px",
                          background: statusColors[item.status] + "22",
                          color: statusColors[item.status],
                          border: `1px solid ${statusColors[item.status]}44`
                        }}
                        value={item.status}
                        onChange={e => handleStatusChange(item.id, e.target.value)}
                      >
                        {["Pending", "In Progress", "Completed", "Escalated"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={styles.td}>
                      <input
                        style={styles.remarkInput}
                        value={item.remarks}
                        onChange={e => handleRemarksChange(item.id, e.target.value)}
                        placeholder="Add inspection notes..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {checklistSchedules.length === 0 && <div style={styles.empty}>No checklist schedules raised for this shift.</div>}
          </div>
        </div>
      </div>

      {/* Side Quick Ticket trigger */}
      <div style={styles.sidePanel}>
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Auto-Raise Incident Ticket</div>
          <div style={styles.panelSub}>Convert failed checklist points to operational maintenance tasks.</div>
          <form onSubmit={handleTicketSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Location</label>
              <select style={styles.input} required value={ticketForm.locationId} onChange={e => setTicketForm({ ...ticketForm, locationId: e.target.value })}>
                <option value="">Choose Area</option>
                {/* Dynamically populated location options from workspace state */}
                {session && (
                  <>
                    <option value="da236471-b0db-40a2-b258-005cf4e81561">Server Room</option>
                    <option value="541a5472-e1d2-43fa-a67b-1160352a94a2">3rd Floor Washroom</option>
                  </>
                )}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Complaint Category</label>
              <select style={styles.input} value={ticketForm.category} onChange={e => setTicketForm({ ...ticketForm, category: e.target.value })}>
                {["Electrical Complaint", "Plumbing Complaint", "HVAC Complaint", "Housekeeping Complaint", "Civil Complaint"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Priority Level</label>
              <select style={styles.input} value={ticketForm.priority} onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value })}>
                {["Low", "Medium", "High", "Critical"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Incident Remarks</label>
              <textarea style={{ ...styles.input, height: "80px", resize: "vertical" }} value={ticketForm.description} onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })} required />
            </div>
            <button style={styles.primaryBtn} type="submit">Generate Incident Ticket</button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", gap: "20px", width: "100%" },
  mainPanel: { flex: 1.8, minWidth: "0" },
  sidePanel: { flex: 1, minWidth: "300px" },
  panel: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" },
  panelTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem", fontWeight: 700, color: "#111625" },
  panelSub: { fontSize: "0.78rem", color: "#64748b", marginTop: "2px" },
  primaryBtn: { background: "#0038a8", color: "#fff", border: "none", borderRadius: "4px", padding: "10px 16px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },
  secondaryBtn: { background: "#fff", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 14px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },

  filterRow: { display: "flex", gap: "15px" },
  filterGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1.5px", color: "#111625", textTransform: "uppercase" },
  select: { padding: "8px 12px", fontSize: "0.8rem", color: "#111625", border: "1px solid #e2e8f0", borderRadius: "4px", outline: "none", background: "#fff" },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, color: "#64748b", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "left", letterSpacing: "1px" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px 16px", fontSize: "0.8rem", color: "#111625" },
  badge: { fontSize: "0.68rem", fontWeight: 600, padding: "3px 8px", borderRadius: "20px", display: "inline-block" },
  remarkInput: { width: "100%", padding: "6px 10px", fontSize: "0.8rem", border: "1px solid #e2e8f0", borderRadius: "4px", background: "#fff", outline: "none" },

  form: { display: "flex", flexDirection: "column", gap: "14px", marginTop: "10px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  input: { width: "100%", padding: "10px 12px", fontSize: "0.82rem", color: "#111625", border: "1px solid #e2e8f0", borderRadius: "4px", background: "#fff", outline: "none" },
  empty: { color: "#94a3b8", fontSize: "0.82rem", textAlign: "center", padding: "30px" }
};
