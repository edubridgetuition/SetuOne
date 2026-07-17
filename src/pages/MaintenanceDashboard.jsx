import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";
import { supabase } from "../lib/supabase";
import { MdBuild, MdTimer, MdTaskAlt, MdAssessment, MdSearch } from "react-icons/md";

export default function MaintenanceDashboard() {
  const { setActiveView } = useApp();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    openTickets: 0,
    ppmSchedules: 0,
    ppmCompliance: 0,
    checklistsSubmitted: 0
  });

  const [recentTickets, setRecentTickets] = useState([]);
  const [upcomingPPMs, setUpcomingPPMs] = useState([]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // 1. Fetch tickets
      const { data: ticketsData, error: ticketsErr } = await supabase
        .from("tickets")
        .select("*");

      // 2. Fetch PPM tasks
      const { data: ppmData, error: ppmErr } = await supabase
        .from("ppm_schedules")
        .select(`
          id, service_type, next_service_date, status,
          assets (name)
        `);

      // 3. Fetch checklist entry submissions
      const { data: checklistData, error: checklistErr } = await supabase
        .from("checklist_schedules")
        .select("id, status");

      if (!ticketsErr && ticketsData) {
        let openCount = ticketsData.filter(t => t.status !== "Closed" && t.status !== "Completed").length;
        
        let sortedTickets = [...ticketsData]
          .sort((a, b) => new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at))
          .slice(0, 5);

        // Map database fields to standard schema matching tickets page
        // The table lists payload jsonb: category, priority, description, location, status, no.
        const mappedRecentTickets = sortedTickets.map(t => {
          return {
            id: t.id,
            no: t.no || `TKT-${t.id.slice(0,4).toUpperCase()}`,
            category: t.category || "General Maintenance",
            location: t.location || "N/A",
            priority: t.priority || "Medium",
            status: t.status || "Open",
            created_at: t.created_at
          };
        });

        let ppmTotal = 0;
        let ppmCompleted = 0;
        let sortedPPMs = [];

        if (!ppmErr && ppmData) {
          ppmTotal = ppmData.length;
          ppmCompleted = ppmData.filter(p => p.status === "Completed").length;
          sortedPPMs = [...ppmData]
            .filter(p => p.status !== "Completed" && p.next_service_date)
            .sort((a, b) => new Date(a.next_service_date) - new Date(b.next_service_date))
            .slice(0, 5);
        }

        let complianceRate = ppmTotal > 0 ? Math.round((ppmCompleted / ppmTotal) * 100) : 100;
        let checklistsCount = (checklistData || []).filter(c => c.status === "Submitted" || c.status === "Completed").length;

        setStats({
          openTickets: openCount,
          ppmSchedules: ppmTotal,
          ppmCompliance: complianceRate,
          checklistsSubmitted: checklistsCount
        });

        setRecentTickets(mappedRecentTickets);
        setUpcomingPPMs(sortedPPMs);
      }
    } catch (err) {
      console.error("Error loading Maintenance Dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(date.getDate()).padStart(2, "0");
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  return (
    <div style={styles.container}>
      <div style={styles.tableHeaderSection}>
        <h3 style={styles.tableTitle}>Maintenance & PPM Overview</h3>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading maintenance metrics...</div>
      ) : (
        <>
          {/* KPI Row */}
          <div style={styles.dashStatsGrid}>
            <div style={styles.dashCard}>
              <div style={styles.dashCardHeader}>
                <div style={styles.dashCardInfo}>
                  <span style={styles.dashLabel}>Active Tickets</span>
                  <span style={styles.dashValue}>{stats.openTickets}</span>
                </div>
                <div style={{ ...styles.dashIconCircle, background: "#fdf2f2", color: "#ef4444" }}>
                  <MdBuild size={22} />
                </div>
              </div>
              <div style={styles.dashCardFooter} onClick={() => setActiveView("tickets")}>
                Resolve Complaints →
              </div>
            </div>

            <div style={styles.dashCard}>
              <div style={styles.dashCardHeader}>
                <div style={styles.dashCardInfo}>
                  <span style={styles.dashLabel}>PPM Tasks Scheduled</span>
                  <span style={styles.dashValue}>{stats.ppmSchedules}</span>
                </div>
                <div style={{ ...styles.dashIconCircle, background: "#f5f3ff", color: "#7c3aed" }}>
                  <MdTimer size={22} />
                </div>
              </div>
              <div style={styles.dashCardFooter} onClick={() => setActiveView("ppm")}>
                View PPM Planner →
              </div>
            </div>

            <div style={styles.dashCard}>
              <div style={styles.dashCardHeader}>
                <div style={styles.dashCardInfo}>
                  <span style={styles.dashLabel}>PPM Compliance</span>
                  <span style={styles.dashValue}>{stats.ppmCompliance}%</span>
                </div>
                <div style={{ ...styles.dashIconCircle, background: "#f0fdf4", color: "#10b981" }}>
                  <MdTaskAlt size={22} />
                </div>
              </div>
              <div style={styles.dashCardFooter} onClick={() => setActiveView("ppm")}>
                Compliance Log →
              </div>
            </div>

            <div style={styles.dashCard}>
              <div style={styles.dashCardHeader}>
                <div style={styles.dashCardInfo}>
                  <span style={styles.dashLabel}>Submitted Checksheets</span>
                  <span style={styles.dashValue}>{stats.checklistsSubmitted}</span>
                </div>
                <div style={{ ...styles.dashIconCircle, background: "#eff6ff", color: "#3b82f6" }}>
                  <MdAssessment size={22} />
                </div>
              </div>
              <div style={styles.dashCardFooter} onClick={() => setActiveView("checklist")}>
                Checklist Audits →
              </div>
            </div>
          </div>

          {/* Two Columns Grid */}
          <div style={styles.dashTwoColumnGrid}>
            
            {/* Column 1: Recent Complaints/Tickets */}
            <div style={styles.dashGridCol}>
              <h4 style={styles.dashColTitle}>Recent active Complaints</h4>
              <div style={styles.dashColTableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Ticket No</th>
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>Priority</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTickets.map(ticket => (
                      <tr key={ticket.id} style={styles.tr}>
                        <td style={styles.td}><span style={styles.codeTag}>{ticket.no}</span></td>
                        <td style={styles.td}><strong>{ticket.category}</strong></td>
                        <td style={styles.td}>
                          <span style={{
                            fontWeight: "bold",
                            color: ticket.priority === "Critical" || ticket.priority === "High" ? "#ef4444" : "#f59e0b"
                          }}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            background: ticket.status === "Open" ? "#fdf2f2" : "#fffbeb",
                            color: ticket.status === "Open" ? "#ef4444" : "#d97706"
                          }}>
                            {ticket.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {recentTickets.length === 0 && (
                      <tr><td colSpan={4} style={styles.empty}>No ticket alerts logged.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column 2: Upcoming PPM Tasks */}
            <div style={styles.dashGridCol}>
              <h4 style={styles.dashColTitle}>Upcoming PPM Schedules</h4>
              <div style={styles.dashColTableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Asset Name</th>
                      <th style={styles.th}>Interval</th>
                      <th style={styles.th}>Planned Date</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingPPMs.map(ppm => (
                      <tr key={ppm.id} style={styles.tr}>
                        <td style={styles.td}><strong>{ppm.assets?.name || "Equipment"}</strong></td>
                        <td style={styles.td}>{ppm.service_type}</td>
                        <td style={styles.td}><span style={{ color: "#2563eb", fontWeight: 600 }}>{formatDate(ppm.next_service_date)}</span></td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, background: "#fffbeb", color: "#d97706" }}>
                            {ppm.status || "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {upcomingPPMs.length === 0 && (
                      <tr><td colSpan={4} style={styles.empty}>No upcoming preventive tasks.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" },
  tableHeaderSection: { borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" },
  tableTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" },
  loading: { color: "#94a3b8", fontSize: "0.85rem", textAlign: "center", padding: "40px" },

  dashStatsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" },
  dashCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" },
  dashCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  dashCardInfo: { display: "flex", flexDirection: "column", gap: "6px" },
  dashLabel: { fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" },
  dashValue: { fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Space Grotesk', sans-serif" },
  dashIconCircle: { width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  dashCardFooter: { borderTop: "1px solid #f1f5f9", paddingTop: "12px", fontSize: "0.78rem", color: "#0038a8", fontWeight: 600, cursor: "pointer" },

  dashTwoColumnGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" },
  dashGridCol: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" },
  dashColTitle: { fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Space Grotesk', sans-serif" },
  dashColTableWrap: { background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", overflowX: "auto" },

  table: { width: "100%", borderCollapse: "collapse" },
  th: { textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, color: "#64748b", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "left", letterSpacing: "0.5px" },
  tr: { borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" },
  td: { padding: "12px 16px", fontSize: "0.8rem", color: "#111625" },
  empty: { color: "#94a3b8", fontSize: "0.82rem", textAlign: "center", padding: "20px" },
  badge: { fontSize: "0.68rem", fontWeight: 600, padding: "3px 8px", borderRadius: "20px", display: "inline-block" },
  codeTag: { background: "#f1f5f9", padding: "3px 6px", borderRadius: "4px", fontSize: "0.75rem", fontFamily: "monospace", color: "#334155", border: "1px solid #cbd5e1" }
};
