import { useApp } from "../context/AppContext";

const statCards = [
  { key:"openComplaints", label:"Open Complaints", sub:"Across all departments" },
  { key:"todayTasks", label:"Today's Tasks", sub:"Checklist and tickets" },
  { key:"amcDue", label:"AMC Due This Month", sub:"PPM renewals/services" },
  { key:"vendorPayments", label:"Vendor Pending Payments", sub:"Invoices due" },
  { key:"electricity", label:"Electricity Consumption", sub:"This month" },
  { key:"water", label:"Water Consumption", sub:"This month" },
  { key:"visitors", label:"Visitor Count", sub:"Today" },
  { key:"assets", label:"Asset Summary", sub:"Active assets" },
];

const expenses = [
  { label:"Electricity", value:82 },
  { label:"Diesel", value:44 },
  { label:"Water", value:28 },
  { label:"Repair", value:67 },
  { label:"Stationery", value:19 },
];

const priorityColors = { High:"#f59e0b", Critical:"#ef4444", Medium:"#6366f1", Low:"#22c55e" };

export default function Dashboard() {
  const { tenantData, tickets, session, activeRole, setActiveView } = useApp();
  const stats = tenantData?.stats || {};
  const priorityTickets = tickets.filter(t => ["High","Critical"].includes(t.priority));

  return (
    <div style={styles.page}>
      {/* Welcome */}
      <div style={styles.welcome}>
        Welcome back, <strong style={{ color:"#818cf8" }}>{session?.name}</strong> — {activeRole}
      </div>

      {/* Stat Cards */}
      <div style={styles.statsGrid}>
        {statCards.map(card => (
          <div key={card.key} style={styles.statCard}>
            <div style={styles.statLabel}>{card.label}</div>
            <div style={styles.statValue}>{stats[card.key] ?? "-"}</div>
            <div style={styles.statSub}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={styles.grid2}>
        {/* Priority Tickets */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Priority Tickets</div>
              <div style={styles.panelSub}>High priority complaints requiring action.</div>
            </div>
            <button style={styles.ghostBtn} onClick={() => setActiveView("tickets")}>View All</button>
          </div>
          <div style={styles.ticketList}>
            {priorityTickets.length === 0 && <div style={styles.empty}>No priority tickets.</div>}
            {priorityTickets.map(ticket => (
              <div key={ticket.no} style={styles.ticketItem}>
                <div>
                  <div style={styles.ticketNo}>{ticket.no} — {ticket.category}</div>
                  <div style={styles.ticketLoc}>{ticket.location} · {ticket.assignedTo}</div>
                </div>
                <span style={{ ...styles.badge, background: priorityColors[ticket.priority] + "22", color: priorityColors[ticket.priority] }}>
                  {ticket.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Summary */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Monthly Expense Summary</div>
              <div style={styles.panelSub}>Facility expenses by category.</div>
            </div>
          </div>
          <div style={styles.barList}>
            {expenses.map(exp => (
              <div key={exp.label} style={styles.barRow}>
                <div style={styles.barMeta}>
                  <span style={styles.barLabel}>{exp.label}</span>
                  <span style={styles.barPct}>{exp.value}%</span>
                </div>
                <div style={styles.barBg}>
                  <div style={{ ...styles.barFill, width:`${exp.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display:"flex", flexDirection:"column", gap:"20px" },
  welcome: { color:"#94a3b8", fontSize:"14px", background:"#1e293b", padding:"12px 16px", borderRadius:"10px" },
  statsGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:"14px" },
  statCard: { background:"#1e293b", borderRadius:"12px", padding:"18px", border:"1px solid #334155" },
  statLabel: { color:"#64748b", fontSize:"12px", fontWeight:"500", marginBottom:"8px" },
  statValue: { color:"#f1f5f9", fontSize:"24px", fontWeight:"700", marginBottom:"4px" },
  statSub: { color:"#475569", fontSize:"11px" },
  grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" },
  panel: { background:"#1e293b", borderRadius:"12px", padding:"20px", border:"1px solid #334155" },
  panelHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" },
  panelTitle: { color:"#f1f5f9", fontSize:"15px", fontWeight:"600" },
  panelSub: { color:"#64748b", fontSize:"12px", marginTop:"2px" },
  ghostBtn: { background:"transparent", border:"1px solid #334155", borderRadius:"7px", padding:"6px 12px", color:"#94a3b8", fontSize:"12px", cursor:"pointer" },
  ticketList: { display:"flex", flexDirection:"column", gap:"10px" },
  ticketItem: { display:"flex", justifyContent:"space-between", alignItems:"center", background:"#0f172a", padding:"12px", borderRadius:"8px" },
  ticketNo: { color:"#e2e8f0", fontSize:"13px", fontWeight:"600" },
  ticketLoc: { color:"#64748b", fontSize:"12px", marginTop:"2px" },
  badge: { fontSize:"11px", fontWeight:"600", padding:"3px 8px", borderRadius:"5px" },
  empty: { color:"#475569", fontSize:"13px", textAlign:"center", padding:"20px" },
  barList: { display:"flex", flexDirection:"column", gap:"12px" },
  barRow: { display:"flex", flexDirection:"column", gap:"4px" },
  barMeta: { display:"flex", justifyContent:"space-between" },
  barLabel: { color:"#94a3b8", fontSize:"13px" },
  barPct: { color:"#64748b", fontSize:"12px" },
  barBg: { background:"#0f172a", borderRadius:"4px", height:"6px" },
  barFill: { background:"linear-gradient(90deg,#6366f1,#8b5cf6)", height:"6px", borderRadius:"4px", transition:"width 0.3s" },
};