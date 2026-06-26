import { genericViews } from "../data/appData";

const statusColors = {
  Pending:"#f59e0b", "In Progress":"#6366f1", Completed:"#22c55e",
  Escalated:"#ef4444", Active:"#22c55e", Repair:"#f97316",
  "Due Soon":"#f59e0b", Present:"#22c55e", Late:"#f59e0b",
  Inside:"#6366f1", "Checked Out":"#475569",
};

const statusList = ["Pending","In Progress","Completed","Escalated","Active","Repair","Due Soon","Present","Late","Inside","Checked Out"];

export default function GenericPage({ view }) {
  const config = genericViews[view];
  if (!config) return <div style={styles.empty}>Module coming soon.</div>;

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <div>
          <div style={styles.panelTitle}>{config.title}</div>
          <div style={styles.panelSub}>{config.subtitle}</div>
        </div>
        <button style={styles.primaryBtn} onClick={() => alert("This will open a create/edit form in production.")}>
          + Add Record
        </button>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {config.headers.map(h => <th key={h} style={styles.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {config.rows.map((row, i) => (
              <tr key={i} style={styles.tr}>
                {row.map((cell, j) => (
                  <td key={j} style={styles.td}>
                    {statusList.includes(cell)
                      ? <span style={{ ...styles.badge, background: statusColors[cell]+"22", color: statusColors[cell] }}>{cell}</span>
                      : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  panel: { background:"#1e293b", borderRadius:"12px", padding:"20px", border:"1px solid #334155" },
  panelHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px" },
  panelTitle: { color:"#f1f5f9", fontSize:"15px", fontWeight:"600" },
  panelSub: { color:"#64748b", fontSize:"12px", marginTop:"2px" },
  primaryBtn: { background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", border:"none", borderRadius:"8px", padding:"8px 16px", fontSize:"13px", fontWeight:"600", cursor:"pointer" },
  tableWrap: { overflowX:"auto" },
  table: { width:"100%", borderCollapse:"collapse" },
  th: { color:"#64748b", fontSize:"12px", fontWeight:"600", padding:"10px 12px", textAlign:"left", borderBottom:"1px solid #334155", whiteSpace:"nowrap" },
  tr: { borderBottom:"1px solid #0f172a" },
  td: { color:"#94a3b8", fontSize:"13px", padding:"10px 12px", whiteSpace:"nowrap" },
  badge: { fontSize:"11px", fontWeight:"600", padding:"3px 8px", borderRadius:"5px" },
  empty: { color:"#475569", textAlign:"center", padding:"60px", fontSize:"14px" },
};