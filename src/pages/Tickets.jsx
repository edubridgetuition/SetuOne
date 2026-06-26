import { useState } from "react";
import { useApp } from "../context/AppContext";

const priorityColors = { High:"#f59e0b", Critical:"#ef4444", Medium:"#6366f1", Low:"#22c55e" };
const statusColors = { Open:"#6366f1", "In Progress":"#f59e0b", Completed:"#22c55e", Escalated:"#ef4444", Closed:"#475569", Assigned:"#06b6d4", Reopened:"#f97316" };

export default function Tickets() {
  const { tickets, createTicket, session, activeRole } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ category:"Electrical Complaint", location:"", priority:"Medium", raisedBy:"", assignedTo:"Unassigned", description:"" });

  const visibleTickets = tickets.filter(t => {
    if (activeRole === "Vendor") return t.assignedTo.includes("Vendor") || t.assignedTo.includes("HVAC");
    if (activeRole === "Employee") return t.raisedBy === session?.name;
    return true;
  }).filter(t => statusFilter === "All" || t.status === statusFilter)
    .filter(t => !search || t.no.toLowerCase().includes(search.toLowerCase()) || t.location.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));

  function handleSubmit(e) {
    e.preventDefault();
    createTicket(form);
    setForm({ category:"Electrical Complaint", location:"", priority:"Medium", raisedBy:"", assignedTo:"Unassigned", description:"" });
    setShowForm(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.panel}>
          {/* Header */}
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Complaint / Ticket Management</div>
              <div style={styles.panelSub}>Raise, assign, and track facility complaints.</div>
            </div>
            <button style={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "+ New Ticket"}
            </button>
          </div>

          {/* New Ticket Form */}
          {showForm && (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Location</label>
                  <input style={styles.input} value={form.location} onChange={e => setForm({...form, location:e.target.value})} required placeholder="Tower A - Lobby" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category</label>
                  <select style={styles.input} value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                    {["Electrical Complaint","Plumbing Complaint","HVAC Complaint","Civil Complaint","Housekeeping Complaint","IT Complaint"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Priority</label>
                  <select style={styles.input} value={form.priority} onChange={e => setForm({...form, priority:e.target.value})}>
                    {["Low","Medium","High","Critical"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Raised By</label>
                  <input style={styles.input} value={form.raisedBy} onChange={e => setForm({...form, raisedBy:e.target.value})} required placeholder="Your name" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Assign To</label>
                  <select style={styles.input} value={form.assignedTo} onChange={e => setForm({...form, assignedTo:e.target.value})}>
                    {["Unassigned","Facility Electrician","Plumbing Vendor","HVAC Vendor","Housekeeping Supervisor","IT Support"].map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea style={{...styles.input, height:"80px", resize:"vertical"}} value={form.description} onChange={e => setForm({...form, description:e.target.value})} required placeholder="Describe the issue" />
              </div>
              <button style={styles.primaryBtn} type="submit">Create Ticket</button>
            </form>
          )}

          {/* Filters */}
          <div style={styles.toolbar}>
            <select style={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              {["All","Open","Assigned","In Progress","Completed","Escalated","Closed"].map(s => <option key={s}>{s}</option>)}
            </select>
            <input style={styles.filterSelect} placeholder="Search ticket, location..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Table */}
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Ticket No.","Category","Location","Priority","Raised By","Assigned To","Status","TAT"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleTickets.map(ticket => (
                  <tr key={ticket.no} style={{ ...styles.tr, ...(selected?.no === ticket.no ? styles.trActive : {}) }} onClick={() => setSelected(ticket)}>
                    <td style={styles.td}>{ticket.no}</td>
                    <td style={styles.td}>{ticket.category}</td>
                    <td style={styles.td}>{ticket.location}</td>
                    <td style={styles.td}><span style={{ ...styles.badge, background: priorityColors[ticket.priority]+"22", color: priorityColors[ticket.priority] }}>{ticket.priority}</span></td>
                    <td style={styles.td}>{ticket.raisedBy}</td>
                    <td style={styles.td}>{ticket.assignedTo}</td>
                    <td style={styles.td}><span style={{ ...styles.badge, background: statusColors[ticket.status]+"22", color: statusColors[ticket.status] }}>{ticket.status}</span></td>
                    <td style={styles.td}>{ticket.completion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleTickets.length === 0 && <div style={styles.empty}>No tickets found.</div>}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <div style={styles.detailPanel}>
        {!selected ? (
          <div style={styles.emptyDetail}>Select a ticket to view details.</div>
        ) : (
          <div>
            <div style={styles.detailHeader}>
              <div>
                <div style={styles.muted}>Selected ticket</div>
                <div style={styles.detailNo}>{selected.no}</div>
              </div>
              <span style={{ ...styles.badge, background: statusColors[selected.status]+"22", color: statusColors[selected.status] }}>{selected.status}</span>
            </div>
            <div style={styles.detailGrid}>
              {[["Category",selected.category],["Priority",selected.priority],["Location",selected.location],["TAT",selected.completion],["Raised By",selected.raisedBy],["Assigned To",selected.assignedTo]].map(([k,v]) => (
                <div key={k} style={styles.detailItem}>
                  <div style={styles.muted}>{k}</div>
                  <div style={styles.detailVal}>{v}</div>
                </div>
              ))}
            </div>
            <div style={styles.descBox}>
              <div style={styles.muted}>Description</div>
              <div style={styles.descText}>{selected.description}</div>
            </div>
            <div style={styles.timelineSection}>
              <div style={styles.panelTitle}>Activity Timeline</div>
              {selected.timeline?.map((t, i) => (
                <div key={i} style={styles.timelineItem}>
                  <div style={styles.timelineDot} />
                  <div>
                    <div style={styles.timelineAction}>{t.action} <span style={styles.muted}>by {t.by}</span></div>
                    <div style={styles.timelineAt}>{t.at}</div>
                    {t.remarks && <div style={styles.timelineRemarks}>{t.remarks}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { display:"flex", gap:"16px", height:"100%" },
  left: { flex:1, minWidth:0 },
  panel: { background:"#1e293b", borderRadius:"12px", padding:"20px", border:"1px solid #334155" },
  panelHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" },
  panelTitle: { color:"#f1f5f9", fontSize:"15px", fontWeight:"600" },
  panelSub: { color:"#64748b", fontSize:"12px", marginTop:"2px" },
  primaryBtn: { background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", border:"none", borderRadius:"8px", padding:"8px 16px", fontSize:"13px", fontWeight:"600", cursor:"pointer" },
  form: { background:"#0f172a", borderRadius:"10px", padding:"16px", marginBottom:"16px", display:"flex", flexDirection:"column", gap:"12px" },
  formGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" },
  formGroup: { display:"flex", flexDirection:"column", gap:"4px" },
  label: { color:"#94a3b8", fontSize:"12px", fontWeight:"500" },
  input: { background:"#1e293b", border:"1px solid #334155", borderRadius:"7px", padding:"8px 10px", color:"#f1f5f9", fontSize:"13px", outline:"none" },
  toolbar: { display:"flex", gap:"10px", marginBottom:"14px" },
  filterSelect: { background:"#0f172a", border:"1px solid #334155", borderRadius:"7px", padding:"7px 10px", color:"#94a3b8", fontSize:"13px", flex:1, outline:"none" },
  tableWrap: { overflowX:"auto" },
  table: { width:"100%", borderCollapse:"collapse" },
  th: { color:"#64748b", fontSize:"12px", fontWeight:"600", padding:"10px 12px", textAlign:"left", borderBottom:"1px solid #334155", whiteSpace:"nowrap" },
  tr: { cursor:"pointer", borderBottom:"1px solid #1e293b" },
  trActive: { background:"#6366f110" },
  td: { color:"#94a3b8", fontSize:"13px", padding:"10px 12px", whiteSpace:"nowrap" },
  badge: { fontSize:"11px", fontWeight:"600", padding:"3px 8px", borderRadius:"5px" },
  empty: { color:"#475569", textAlign:"center", padding:"30px", fontSize:"13px" },
  detailPanel: { width:"300px", minWidth:"300px", background:"#1e293b", borderRadius:"12px", padding:"20px", border:"1px solid #334155", overflowY:"auto" },
  emptyDetail: { color:"#475569", fontSize:"13px", textAlign:"center", marginTop:"40px" },
  detailHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" },
  muted: { color:"#64748b", fontSize:"12px" },
  detailNo: { color:"#f1f5f9", fontSize:"16px", fontWeight:"700", marginTop:"2px" },
  detailGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"14px" },
  detailItem: { display:"flex", flexDirection:"column", gap:"3px" },
  detailVal: { color:"#e2e8f0", fontSize:"13px", fontWeight:"500" },
  descBox: { background:"#0f172a", borderRadius:"8px", padding:"12px", marginBottom:"16px" },
  descText: { color:"#94a3b8", fontSize:"13px", marginTop:"4px", lineHeight:"1.5" },
  timelineSection: { display:"flex", flexDirection:"column", gap:"12px" },
  timelineItem: { display:"flex", gap:"10px", alignItems:"flex-start" },
  timelineDot: { width:"8px", height:"8px", borderRadius:"50%", background:"#6366f1", marginTop:"4px", flexShrink:0 },
  timelineAction: { color:"#e2e8f0", fontSize:"13px", fontWeight:"500" },
  timelineAt: { color:"#475569", fontSize:"11px", marginTop:"2px" },
  timelineRemarks: { color:"#64748b", fontSize:"12px", marginTop:"4px" },
};