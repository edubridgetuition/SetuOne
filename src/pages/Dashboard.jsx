import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";
import { fetchDashboardSummary, fetchPriorityTickets } from "../lib";
import { TICKET_PRIORITY } from "../constants";

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

const priorityColors = { 
  [TICKET_PRIORITY.HIGH]: "#f59e0b", 
  [TICKET_PRIORITY.CRITICAL]: "#ef4444", 
  [TICKET_PRIORITY.MEDIUM]: "#0038a8", 
  [TICKET_PRIORITY.LOW]: "#10b981" 
};

export default function Dashboard() {
  const { session, setActiveView, tenantData } = useApp();
  const [stats, setStats] = useState({});
  const [priorityTickets, setPriorityTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      const [summaryRes, ticketsRes] = await Promise.all([
        fetchDashboardSummary(),
        fetchPriorityTickets()
      ]);

      if (summaryRes.success && summaryRes.data) {
        setStats(summaryRes.data);
      } else {
        // Fallback to local appData stats
        setStats(tenantData?.stats || {});
      }

      if (ticketsRes.success) {
        setPriorityTickets(ticketsRes.data);
      }
      setLoading(false);
    }

    if (session) {
      loadDashboardData();
    }
  }, [session, tenantData]);

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"100px", color:"#64748b" }}>
        Loading dashboard metrics...
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.welcome}>
        Welcome back, <strong style={{ color:"#0038a8" }}>{session?.name || "User"}</strong>
      </div>

      <div style={styles.statsRow}>
        {statCards.map(card => (
          <div key={card.key} style={styles.statCard}>
            <div style={styles.statLabel}>{card.label}</div>
            <div style={styles.statValue}>{stats[card.key] ?? "-"}</div>
            <div style={styles.statSub}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>Priority Tickets</div>
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
                <span style={{ ...styles.badge, background: priorityColors[ticket.priority]+"1a", color: priorityColors[ticket.priority] }}>
                  {ticket.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>Monthly Expense Summary</div>
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
  welcome: { color:"#64748b", fontSize:"0.85rem", background:"#fff", border:"1px solid #e2e8f0", padding:"12px 16px", borderRadius:"4px" },

  statsRow: { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:"20px" },
  statCard: { background:"#fff", border:"1px solid #e2e8f0", borderRadius:"4px", padding:"20px", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" },
  statLabel: { fontSize:"0.72rem", fontWeight:600, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"8px" },
  statValue: { fontFamily:"'Space Grotesk', sans-serif", fontSize:"1.65rem", fontWeight:700, color:"#111625", marginBottom:"4px" },
  statSub: { fontSize:"0.72rem", color:"#94a3b8" },

  grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" },
  card: { background:"#fff", border:"1px solid #e2e8f0", borderRadius:"4px", boxShadow:"0 1px 3px rgba(0,0,0,0.05)", padding:"24px", display:"flex", flexDirection:"column", gap:"16px" },
  cardHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #e2e8f0", paddingBottom:"14px" },
  cardTitle: { fontFamily:"'Space Grotesk', sans-serif", fontSize:"0.95rem", fontWeight:700, color:"#111625" },
  ghostBtn: { background:"#fff", border:"1px solid #e2e8f0", borderRadius:"4px", padding:"6px 12px", color:"#111625", fontSize:"0.78rem", fontWeight:600, cursor:"pointer" },

  ticketList: { display:"flex", flexDirection:"column", gap:"10px" },
  ticketItem: { display:"flex", justifyContent:"space-between", alignItems:"center", background:"#f8fafc", padding:"12px", borderRadius:"4px" },
  ticketNo: { color:"#111625", fontSize:"0.82rem", fontWeight:600 },
  ticketLoc: { color:"#64748b", fontSize:"0.75rem", marginTop:"2px" },
  badge: { fontSize:"0.7rem", fontWeight:600, padding:"3px 8px", borderRadius:"20px" },
  empty: { color:"#94a3b8", fontSize:"0.82rem", textAlign:"center", padding:"20px" },

  barList: { display:"flex", flexDirection:"column", gap:"12px" },
  barRow: { display:"flex", flexDirection:"column", gap:"4px" },
  barMeta: { display:"flex", justifyContent:"space-between" },
  barLabel: { color:"#111625", fontSize:"0.82rem" },
  barPct: { color:"#64748b", fontSize:"0.78rem" },
  barBg: { background:"#f1f5f9", borderRadius:"4px", height:"6px" },
  barFill: { background:"#0038a8", height:"6px", borderRadius:"4px" },
};