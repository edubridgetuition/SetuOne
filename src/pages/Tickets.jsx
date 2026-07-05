import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/appContextCore";
import { fetchTicketTimeline } from "../lib";
import { TICKET_PRIORITY, TICKET_STATUS } from "../constants";

const priorityColors = { 
  [TICKET_PRIORITY.HIGH]: "#f59e0b", 
  [TICKET_PRIORITY.CRITICAL]: "#ef4444", 
  [TICKET_PRIORITY.MEDIUM]: "#6366f1", 
  [TICKET_PRIORITY.LOW]: "#22c55e" 
};

const statusColors = { 
  [TICKET_STATUS.OPEN]: "#6366f1", 
  [TICKET_STATUS.IN_PROGRESS]: "#f59e0b", 
  [TICKET_STATUS.COMPLETED]: "#22c55e", 
  [TICKET_STATUS.ESCALATED]: "#ef4444", 
  [TICKET_STATUS.CLOSED]: "#475569", 
  [TICKET_STATUS.ASSIGNED]: "#06b6d4" 
};

const statuses = ["Open", "Assigned", "In Progress", "Completed", "Escalated", "Closed"];

export default function Tickets() {
  const { tickets, locations, assignees, createTicket, updateTicket, session, activeRole } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  
  // Timeline audit logs state
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const [actionForm, setActionForm] = useState({ assignedToId:"", status:"Assigned", remarks:"" });
  const [form, setForm] = useState({ category:"Electrical Complaint", locationId:"", priority:"Medium", description:"" });

  const visibleTickets = useMemo(() => tickets.filter(t => {
    if (activeRole === "Vendor") return t.assignedTo !== "Unassigned";
    if (activeRole === "Employee") return t.raisedByEmail === session?.email;
    return true;
  }).filter(t => statusFilter === "All" || t.status === statusFilter)
    .filter(t => !search || t.no.toLowerCase().includes(search.toLowerCase()) || t.location.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase())), [tickets, activeRole, session, statusFilter, search]);

  const selected = tickets.find((ticket) => ticket.id === selectedId) || visibleTickets[0] || null;
  const selectedTicketId = selected?.id;
  const selectedAssignedToId = selected?.assignedToId;
  const selectedStatus = selected?.status;

  // Initialize form default location selection once locations load
  useEffect(() => {
    if (locations.length > 0 && !form.locationId) {
      setForm(prev => ({ ...prev, locationId: locations[0].id }));
    }
  }, [locations, form.locationId]);

  // Load ticket state settings
  useEffect(() => {
    if (!selectedTicketId) return;
    setSelectedId(selectedTicketId);
    setActionForm({ 
      assignedToId: selectedAssignedToId || "", 
      status: selectedStatus === "Open" ? "Assigned" : selectedStatus, 
      remarks: "" 
    });
  }, [selectedTicketId, selectedAssignedToId, selectedStatus]);

  // Fetch dynamic timeline logs whenever a ticket is selected
  useEffect(() => {
    if (!selected?.id) return;
    async function loadTimeline() {
      setLoadingTimeline(true);
      const res = await fetchTicketTimeline(selected.id);
      if (res.success) {
        setTimeline(res.data);
      }
      setLoadingTimeline(false);
    }
    loadTimeline();
  }, [selected]);

  async function handleSubmit(e) {
    e.preventDefault();
    const created = await createTicket({
      category: form.category,
      locationId: form.locationId,
      priority: form.priority,
      description: form.description
    });
    if (created) {
      setSelectedId(created.id);
      setForm(prev => ({ ...prev, description:"" }));
      setShowForm(false);
    }
  }

  async function handleWorkflowSubmit(e) {
    e.preventDefault();
    if (!selected) return;

    const updated = await updateTicket(selected.id, {
      assignedToId: actionForm.assignedToId || null,
      status: actionForm.status
    }, actionForm.remarks);

    if (updated) {
      setSelectedId(updated.id);
      setActionForm(prev => ({ ...prev, remarks:"" }));
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Complaint / Ticket Management</div>
              <div style={styles.panelSub}>Raise, assign, complete, and track facility complaints.</div>
            </div>
            <button style={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "+ New Ticket"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Location</label>
                  <select style={styles.input} value={form.locationId} onChange={e => setForm({...form, locationId:e.target.value})} required>
                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name} ({loc.location_type})</option>)}
                  </select>
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
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea style={{...styles.input, height:"80px", resize:"vertical"}} value={form.description} onChange={e => setForm({...form, description:e.target.value})} required placeholder="Describe the issue" />
              </div>
              <button style={styles.primaryBtn} type="submit">Create Ticket</button>
            </form>
          )}

          <div style={styles.toolbar}>
            <select style={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              {["All", ...statuses].map(s => <option key={s}>{s}</option>)}
            </select>
            <input style={styles.filterSelect} placeholder="Search ticket, location..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Ticket No.","Category","Location","Priority","Raised By","Status"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleTickets.map(ticket => (
                  <tr key={ticket.id} style={{ ...styles.tr, ...(selected?.id === ticket.id ? styles.trActive : {}) }} onClick={() => setSelectedId(ticket.id)}>
                    <td style={styles.td}>{ticket.no}</td>
                    <td style={styles.td}>{ticket.category}</td>
                    <td style={styles.td}>{ticket.location}</td>
                    <td style={styles.td}><span style={{ ...styles.badge, background: (priorityColors[ticket.priority] || "#64748b")+"22", color: priorityColors[ticket.priority] || "#94a3b8" }}>{ticket.priority}</span></td>
                    <td style={styles.td}>{ticket.raisedBy}</td>
                    <td style={styles.td}><span style={{ ...styles.badge, background: (statusColors[ticket.status] || "#64748b")+"22", color: statusColors[ticket.status] || "#94a3b8" }}>{ticket.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleTickets.length === 0 && <div style={styles.empty}>No tickets found.</div>}
          </div>
        </div>
      </div>

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
              <span style={{ ...styles.badge, background: (statusColors[selected.status] || "#64748b")+"22", color: statusColors[selected.status] || "#94a3b8" }}>{selected.status}</span>
            </div>
            <div style={styles.detailGrid}>
              {[["Category",selected.category],["Priority",selected.priority],["Location",selected.location],["Raised By",selected.raisedBy],["Assigned To",selected.assignedTo]].map(([k,v]) => (
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

            {/* Workflow Timeline logs grid views */}
            <div style={styles.timelineBox}>
              <div style={styles.panelTitle} style={{ fontSize:"0.8rem", marginBottom:"10px" }}>Ticket History / Timeline</div>
              {loadingTimeline ? (
                <div style={styles.empty}>Loading logs...</div>
              ) : (
                <div style={styles.timelineList}>
                  {timeline.map((item, idx) => (
                    <div key={idx} style={styles.timelineItem}>
                      <div style={styles.timelineHeader}>
                        <strong style={{ color:"#0038a8" }}>{item.action}</strong>
                        <span style={styles.muted}>{item.at}</span>
                      </div>
                      <div style={styles.timelineBody}>By {item.by} — <em>"{item.remarks}"</em></div>
                    </div>
                  ))}
                  {timeline.length === 0 && <div style={styles.empty}>No timeline audit logs.</div>}
                </div>
              )}
            </div>

            <form onSubmit={handleWorkflowSubmit} style={styles.actionForm}>
              <div style={styles.panelTitle}>Workflow Update</div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assign To</label>
                <select style={styles.input} value={actionForm.assignedToId} onChange={e => setActionForm({...actionForm, assignedToId:e.target.value})}>
                  <option value="">Unassigned</option>
                  {assignees.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select style={styles.input} value={actionForm.status} onChange={e => setActionForm({...actionForm, status:e.target.value})}>
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Remarks</label>
                <textarea style={{...styles.input, height:"70px", resize:"vertical"}} value={actionForm.remarks} onChange={e => setActionForm({...actionForm, remarks:e.target.value})} placeholder="Add update remarks" />
              </div>
              <button style={styles.primaryBtn} type="submit">Update Workflow</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { display:"flex", gap:"20px", width:"100%" },
  left: { flex:1.8, minWidth:"0" },
  panel: { background:"#fff", border:"1px solid #e2e8f0", borderRadius:"4px", padding:"24px", display:"flex", flexDirection:"column", gap:"20px" },
  panelHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"20px" },
  panelTitle: { fontFamily:"'Space Grotesk', sans-serif", fontSize:"1rem", fontWeight:700, color:"#111625" },
  panelSub: { fontSize:"0.78rem", color:"#64748b", marginTop:"2px" },
  primaryBtn: { background:"#0038a8", color:"#fff", border:"none", borderRadius:"4px", padding:"10px 16px", fontSize:"0.82rem", fontWeight:600, cursor:"pointer" },

  form: { background:"#f8fafc", padding:"20px", borderRadius:"4px", border:"1px solid #e2e8f0", display:"flex", flexDirection:"column", gap:"16px" },
  formGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:"16px" },
  formGroup: { display:"flex", flexDirection:"column", gap:"6px" },
  label: { fontSize:"0.65rem", fontWeight:700, letterSpacing:"1.5px", color:"#111625", textTransform:"uppercase" },
  input: { width:"100%", padding:"10px 12px", fontSize:"0.82rem", color:"#111625", border:"1px solid #e2e8f0", borderRadius:"4px", background:"#fff", outline:"none" },

  toolbar: { display:"flex", gap:"12px" },
  filterSelect: { padding:"8px 12px", fontSize:"0.8rem", color:"#111625", border:"1px solid #e2e8f0", borderRadius:"4px", outline:"none", minWidth:"150px" },

  tableWrap: { overflowX:"auto" },
  table: { width:"100%", borderCollapse:"collapse" },
  th: { textTransform:"uppercase", fontSize:"0.65rem", fontWeight:700, color:"#64748b", padding:"12px 16px", borderBottom:"1px solid #e2e8f0", textAlign:"left", letterSpacing:"1px" },
  tr: { borderBottom:"1px solid #f1f5f9", cursor:"pointer", transition:"background 0.2s" },
  trActive: { background:"#f1f5f9" },
  td: { padding:"12px 16px", fontSize:"0.8rem", color:"#111625" },
  badge: { fontSize:"0.68rem", fontWeight:600, padding:"3px 8px", borderRadius:"20px", display:"inline-block" },
  empty: { color:"#94a3b8", fontSize:"0.82rem", textAlign:"center", padding:"30px" },

  detailPanel: { flex:1, background:"#fff", border:"1px solid #e2e8f0", borderRadius:"4px", padding:"24px", minWidth:"320px" },
  emptyDetail: { height:"100%", display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8", fontSize:"0.85rem", padding:"40px", textAlign:"center" },
  detailHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #e2e8f0", paddingBottom:"16px", marginBottom:"16px" },
  muted: { fontSize:"0.65rem", fontWeight:700, letterSpacing:"1px", color:"#64748b", textTransform:"uppercase" },
  detailNo: { fontFamily:"'Space Grotesk', sans-serif", fontSize:"1.2rem", fontWeight:700, color:"#111625", marginTop:"4px" },

  detailGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"20px" },
  detailItem: { display:"flex", flexDirection:"column", gap:"4px" },
  detailVal: { fontSize:"0.82rem", color:"#111625", fontWeight:600 },

  descBox: { background:"#f8fafc", padding:"16px", borderRadius:"4px", border:"1px solid #e2e8f0", marginBottom:"20px", display:"flex", flexDirection:"column", gap:"6px" },
  descText: { fontSize:"0.82rem", color:"#334155", lineHeight:1.5 },

  timelineBox: { border:"1px solid #e2e8f0", borderRadius:"4px", padding:"16px", marginBottom:"20px", background:"#fcfcfd" },
  timelineList: { display:"flex", flexDirection:"column", gap:"14px", maxHeight:"200px", overflowY:"auto" },
  timelineItem: { display:"flex", flexDirection:"column", gap:"4px", borderLeft:"2px solid #e2e8f0", paddingLeft:"12px" },
  timelineHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:"0.72rem" },
  timelineBody: { fontSize:"0.78rem", color:"#475569" },

  actionForm: { borderTop:"1px solid #e2e8f0", paddingTop:"20px", display:"flex", flexDirection:"column", gap:"16px" }
};
