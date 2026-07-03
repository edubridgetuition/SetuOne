import { useState } from "react";
import { useApp } from "../context/appContextCore";

const defaultChecklist = [
  { area:"Common Area", item:"Check all common area lights are working", frequency:"Daily", department:"Electrical", assignedTo:"Facility Team", status:"Pending", remarks:"" },
  { area:"Electrical Room", item:"Check electrical panel temperature and abnormal sound", frequency:"Daily", department:"Electrical", assignedTo:"Electrician", status:"Pending", remarks:"" },
  { area:"Pump Room", item:"Check pump running status and leakage", frequency:"Daily", department:"Plumbing", assignedTo:"Technician", status:"Pending", remarks:"" },
  { area:"DG Area", item:"Check DG fuel level and battery condition", frequency:"Daily", department:"Electrical", assignedTo:"DG Operator", status:"Pending", remarks:"" },
  { area:"Fire Panel", item:"Check fire panel normal status", frequency:"Daily", department:"Fire Safety", assignedTo:"Security Supervisor", status:"Pending", remarks:"" },
  { area:"HVAC Room", item:"Check AC filter cleaning and drain line condition", frequency:"Weekly", department:"HVAC", assignedTo:"HVAC Vendor", status:"Pending", remarks:"" },
  { area:"Washroom", item:"Check taps, flush, drains, smell, tissue, and soap", frequency:"Weekly", department:"Plumbing", assignedTo:"Housekeeping Supervisor", status:"Pending", remarks:"" },
  { area:"Lift", item:"Review lift service report and callback history", frequency:"Monthly", department:"Electrical", assignedTo:"Lift Vendor", status:"Pending", remarks:"" },
  { area:"STP", item:"Check STP operation log and treated water quality", frequency:"Monthly", department:"Plumbing", assignedTo:"STP Vendor", status:"Pending", remarks:"" },
];

const statusColors = { Pending:"#f59e0b", "In Progress":"#6366f1", Completed:"#22c55e", Escalated:"#ef4444" };

export default function Checklist() {
  const { createTicket, setActiveView } = useApp();
  const [checklist, setChecklist] = useState(defaultChecklist);
  const [frequency, setFrequency] = useState("All");
  const [department, setDepartment] = useState("All");
  const [ticketForm, setTicketForm] = useState({ location:"Tower A - Pump Room", category:"Electrical Complaint", priority:"Medium", description:"Pump vibration observed during daily round." });

  const filtered = checklist.filter(i => (frequency === "All" || i.frequency === frequency) && (department === "All" || i.department === department));

  function updateStatus(index, value) {
    const updated = [...checklist];
    updated[index] = { ...updated[index], status: value };
    setChecklist(updated);
  }

  function updateRemarks(index, value) {
    const updated = [...checklist];
    updated[index] = { ...updated[index], remarks: value };
    setChecklist(updated);
  }

  function handleSave() {
    alert("Checklist saved! In production this will sync with server and create audit logs.");
  }

  function handleTicketSubmit(e) {
    e.preventDefault();
    createTicket({ ...ticketForm, raisedBy:"Checklist", assignedTo:"Facility Team" });
    setActiveView("tickets");
  }

  return (
    <div style={styles.page}>
      {/* Main Checklist */}
      <div style={styles.mainPanel}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Maintenance Checklist</div>
              <div style={styles.panelSub}>Daily, weekly, and monthly checks for facility teams.</div>
            </div>
            <button style={styles.primaryBtn} onClick={handleSave}>Save Checklist</button>
          </div>

          {/* Filters */}
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Frequency</label>
              <select style={styles.select} value={frequency} onChange={e => setFrequency(e.target.value)}>
                {["All","Daily","Weekly","Monthly"].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Department</label>
              <select style={styles.select} value={department} onChange={e => setDepartment(e.target.value)}>
                {["All","Electrical","Plumbing","HVAC","Fire Safety","Housekeeping","Security"].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Area","Checklist Item","Frequency","Assigned To","Status","Remarks"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>{item.area}</td>
                    <td style={{ ...styles.td, maxWidth:"200px" }}>{item.item}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background:"#6366f122", color:"#818cf8" }}>{item.frequency}</span>
                    </td>
                    <td style={styles.td}>{item.assignedTo}</td>
                    <td style={styles.td}>
                      <select
                        style={{ ...styles.select, fontSize:"12px", padding:"4px 8px", background: statusColors[item.status]+"22", color: statusColors[item.status], border:`1px solid ${statusColors[item.status]}44` }}
                        value={item.status}
                        onChange={e => updateStatus(checklist.indexOf(item), e.target.value)}
                      >
                        {["Pending","In Progress","Completed","Escalated"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={styles.td}>
                      <input
                        style={styles.remarkInput}
                        value={item.remarks}
                        onChange={e => updateRemarks(checklist.indexOf(item), e.target.value)}
                        placeholder="Add remarks"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Ticket Form */}
      <div style={styles.sidePanel}>
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Create Issue From Checklist</div>
          <div style={styles.panelSub}>When a checklist item fails, create a complaint ticket.</div>
          <form onSubmit={handleTicketSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Location</label>
              <input style={styles.input} value={ticketForm.location} onChange={e => setTicketForm({...ticketForm, location:e.target.value})} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select style={styles.input} value={ticketForm.category} onChange={e => setTicketForm({...ticketForm, category:e.target.value})}>
                {["Electrical Complaint","Plumbing Complaint","HVAC Complaint","Housekeeping Complaint","Civil Complaint","IT Complaint"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Priority</label>
              <select style={styles.input} value={ticketForm.priority} onChange={e => setTicketForm({...ticketForm, priority:e.target.value})}>
                {["Low","Medium","High","Critical"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Issue Description</label>
              <textarea style={{...styles.input, height:"80px", resize:"vertical"}} value={ticketForm.description} onChange={e => setTicketForm({...ticketForm, description:e.target.value})} required />
            </div>
            <button style={styles.primaryBtn} type="submit">Create Ticket</button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display:"flex", gap:"16px" },
  mainPanel: { flex:1, minWidth:0 },
  sidePanel: { width:"260px", minWidth:"260px" },
  panel: { background:"#1e293b", borderRadius:"12px", padding:"20px", border:"1px solid #334155" },
  panelHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" },
  panelTitle: { color:"#f1f5f9", fontSize:"15px", fontWeight:"600", marginBottom:"4px" },
  panelSub: { color:"#64748b", fontSize:"12px", marginBottom:"16px" },
  primaryBtn: { background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", border:"none", borderRadius:"8px", padding:"8px 16px", fontSize:"13px", fontWeight:"600", cursor:"pointer" },
  filterRow: { display:"flex", gap:"12px", marginBottom:"16px" },
  filterGroup: { display:"flex", flexDirection:"column", gap:"4px" },
  label: { color:"#94a3b8", fontSize:"12px", fontWeight:"500" },
  select: { background:"#0f172a", border:"1px solid #334155", borderRadius:"7px", padding:"7px 10px", color:"#94a3b8", fontSize:"13px", outline:"none" },
  tableWrap: { overflowX:"auto" },
  table: { width:"100%", borderCollapse:"collapse" },
  th: { color:"#64748b", fontSize:"12px", fontWeight:"600", padding:"10px 12px", textAlign:"left", borderBottom:"1px solid #334155", whiteSpace:"nowrap" },
  tr: { borderBottom:"1px solid #1e293b" },
  td: { color:"#94a3b8", fontSize:"13px", padding:"10px 12px" },
  badge: { fontSize:"11px", fontWeight:"600", padding:"3px 8px", borderRadius:"5px" },
  remarkInput: { background:"#0f172a", border:"1px solid #334155", borderRadius:"6px", padding:"6px 8px", color:"#94a3b8", fontSize:"12px", width:"130px", outline:"none" },
  form: { display:"flex", flexDirection:"column", gap:"12px" },
  formGroup: { display:"flex", flexDirection:"column", gap:"4px" },
  input: { background:"#0f172a", border:"1px solid #334155", borderRadius:"7px", padding:"8px 10px", color:"#f1f5f9", fontSize:"13px", outline:"none" },
};
