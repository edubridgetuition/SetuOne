import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";

const reportColumns = {
  Attendance: ["in_time", "shift", "status", "gps_verified", "check_in_method", "duty_status"],
  Tickets: ["created_at", "title", "category", "priority", "status"],
  Inventory: ["transaction_date", "inventory_items.name", "type", "quantity"],
  Assets: ["created_at", "name", "category", "status", "amc_expiry_date"],
  Visitors: ["in_time", "visitor_name", "purpose", "status", "pass_no"],
  Purchase: ["created_at", "status", "estimated_cost"],
  PPM: ["created_at", "checklist_name", "status"]
};

export default function Reports() {
  const {
    dashboardKPIs,
    loadDashboardKPIs,
    savedFilters,
    loadSavedFilters,
    saveFilter,
    createTemplate,
    fetchAttendanceReport,
    fetchTicketReport,
    fetchInventoryReport,
    fetchAssetReport,
    fetchVisitorReport,
    fetchPurchaseReport,
    fetchPPMReport,
    exportReport,
    scheduleReport
  } = useApp();

  const [reportType, setReportType] = useState("Attendance");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const handleStartDateChange = (val) => {
    if (endDate && val > endDate) {
      alert("Error: Start Date cannot be later than End Date!");
      return;
    }
    setStartDate(val);
  };
  const handleEndDateChange = (val) => {
    if (startDate && val < startDate) {
      alert("Error: End Date cannot be earlier than Start Date!");
      return;
    }
    setEndDate(val);
  };
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedColumns, setSelectedColumns] = useState([]);
  
  // Custom template & filter names
  const [filterName, setFilterName] = useState("");
  const [templateName, setTemplateName] = useState("");

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load basic configurations on load
  useEffect(() => {
    loadDashboardKPIs();
    loadSavedFilters();
    // Default columns matching Report Type
    setSelectedColumns(reportColumns[reportType]);
  }, []);

  // Update selected columns list when Report Type changes
  useEffect(() => {
    setSelectedColumns(reportColumns[reportType]);
  }, [reportType]);

  async function handleGenerate() {
    setLoading(true);
    let res = { success: false, data: [] };
    const filters = { startDate, endDate, sortOrder };

    switch (reportType) {
      case "Attendance":
        res = await fetchAttendanceReport(filters);
        break;
      case "Tickets":
        res = await fetchTicketReport({ ...filters, priority: "All" });
        break;
      case "Inventory":
        res = await fetchInventoryReport(filters);
        break;
      case "Assets":
        res = await fetchAssetReport({ ...filters, status: "All" });
        break;
      case "Visitors":
        res = await fetchVisitorReport(filters);
        break;
      case "Purchase":
        res = await fetchPurchaseReport(filters);
        break;
      case "PPM":
        res = await fetchPPMReport(filters);
        break;
    }

    if (res.success) {
      setReportData(res.data);
    }
    setLoading(false);
  }

  // Drill down from KPIs click
  function triggerDrillDown(type) {
    setReportType(type);
    handleGenerate();
  }

  async function handleSaveFilter() {
    if (!filterName.trim()) return;
    const payload = { reportType, startDate, endDate, sortOrder, selectedColumns };
    await saveFilter(filterName, reportType, payload);
    alert("Filter saved successfully!");
    setFilterName("");
  }

  async function handleCreateTemplate() {
    if (!templateName.trim()) return;
    const config = { selectedColumns, sortOrder };
    await createTemplate(templateName, reportType, config);
    alert("Report Template generated successfully!");
    setTemplateName("");
  }

  function applySavedFilter(f) {
    const payload = f.filters_payload;
    setReportType(f.report_type);
    if (payload.startDate) setStartDate(payload.startDate);
    if (payload.endDate) setEndDate(payload.endDate);
    if (payload.sortOrder) setSortOrder(payload.sortOrder);
    if (payload.selectedColumns) setSelectedColumns(payload.selectedColumns);
    alert(`Filter "${f.filter_name}" applied.`);
  }

  // Trigger file downloader
  async function triggerExport(format) {
    const res = await exportReport(reportData, format);
    if (res.success) {
      alert(`Report exported to ${format} successfully!`);
    } else {
      alert("Export failed: " + res.message);
    }
  }

  return (
    <div style={styles.page}>
      
      {/* 1. KPIs RIBBON */}
      {dashboardKPIs && (
        <div style={styles.kpiContainer}>
          {[
            { label: "Open Tickets", val: dashboardKPIs.openTickets, click: "Tickets", color: "#ef4444" },
            { label: "Total Assets", val: dashboardKPIs.totalAssets, click: "Assets", color: "#0038a8" },
            { label: "Attendance %", val: `${dashboardKPIs.attendancePct}%`, click: "Attendance", color: "#22c55e" },
            { label: "Visitors Today", val: dashboardKPIs.visitorsToday, click: "Visitors", color: "#f59e0b" },
            { label: "Pending PRs", val: dashboardKPIs.pendingPRs, click: "Purchase", color: "#6366f1" },
            { label: "AMC Due (30d)", val: dashboardKPIs.amcDueCount, click: "Assets", color: "#ec4899" },
            { label: "Avg Resolution", val: `${dashboardKPIs.avgResHours} hrs`, click: "Tickets", color: "#06b6d4" }
          ].map(k => (
            <div key={k.label} style={styles.kpiCard} onClick={() => triggerDrillDown(k.click)}>
              <div style={styles.muted}>{k.label}</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: "6px", color: k.color }}>{k.val}</div>
              <div style={{ fontSize: "0.62rem", color: "#94a3b8", marginTop: "4px" }}>Click to drill-down</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "20px" }}>
        
        {/* Left Side: Report Builder Engine Configuration */}
        <div style={{ flex: 1.2, minWidth: "0" }}>
          <div style={styles.panel}>
            <div style={styles.panelTitle}>Dynamic Report Builder</div>
            
            {/* Controls */}
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Report Category</label>
                <select style={styles.input} value={reportType} onChange={e => setReportType(e.target.value)}>
                  {["Attendance", "Tickets", "Inventory", "Assets", "Visitors", "Purchase", "PPM"].map(type => (
                    <option key={type} value={type}>{type} Reports</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Start Date</label>
                <input type="date" style={styles.input} value={startDate} onChange={e => handleStartDateChange(e.target.value)} />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>End Date</label>
                <input type="date" style={styles.input} value={endDate} onChange={e => handleEndDateChange(e.target.value)} />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Sorting</label>
                <select style={styles.input} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Custom columns toggler */}
            <div style={{ margin: "16px 0" }}>
              <div style={styles.label} style={{ marginBottom: "8px" }}>Select Fields (Columns) to Display</div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {(reportColumns[reportType] || []).map(col => {
                  const isChecked = selectedColumns.includes(col);
                  return (
                    <label key={col} style={{ ...styles.checkboxLabel, background: isChecked ? "#0038a811" : "#f1f5f9", borderColor: isChecked ? "#0038a8" : "#cbd5e1" }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedColumns(selectedColumns.filter(c => c !== col));
                          } else {
                            setSelectedColumns([...selectedColumns, col]);
                          }
                        }}
                        style={{ marginRight: "6px" }}
                      />
                      {col.replace("_", " ")}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Generate Trigger buttons */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "space-between" }}>
              <button style={styles.primaryBtn} onClick={handleGenerate}>
                {loading ? "Generating Ledger..." : "Generate Custom Report"}
              </button>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <button style={{ ...styles.secondaryBtn, color: "#22c55e", borderColor: "#22c55e" }} onClick={() => triggerExport("CSV")}>Export CSV</button>
                <button style={styles.secondaryBtn} onClick={() => window.print()}>Print / PDF</button>
              </div>
            </div>

            {/* Rendered data table output */}
            <div style={{ marginTop: "24px" }}>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {selectedColumns.map(col => (
                        <th key={col} style={styles.th}>{col.replace("_", " ")}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx} style={styles.tr}>
                        {selectedColumns.map(col => {
                          const val = col.includes(".") ? row[col.split(".")[0]]?.[col.split(".")[1]] : row[col];
                          return (
                            <td key={col} style={styles.td}>
                              {typeof val === "boolean" ? (val ? "Yes" : "No") : String(val || "--")}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.length === 0 && <div style={styles.empty}>Generate a report query to display grid details.</div>}
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Saved Filters & reusable templates settings */}
        <div style={styles.detailPanel}>
          
          {/* Saved filters registry */}
          <div style={styles.descBox}>
            <div style={styles.muted} style={{ marginBottom: "10px" }}>Saved Reports Filters</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {savedFilters.map(f => (
                <div key={f.id} style={styles.savedFilterRow} onClick={() => applySavedFilter(f)}>
                  <div>
                    <strong>{f.filter_name}</strong>
                    <div style={{ fontSize: "0.68rem", color: "#64748b" }}>Category: {f.report_type}</div>
                  </div>
                  <span style={{ fontSize: "0.9rem" }}>📁</span>
                </div>
              ))}
              {savedFilters.length === 0 && <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>No saved filters registered.</div>}
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <input style={{ ...styles.input, flex: 1, padding: "6px" }} placeholder="Filter Name" value={filterName} onChange={e => setFilterName(e.target.value)} />
              <button style={{ ...styles.primaryBtn, padding: "6px 12px" }} onClick={handleSaveFilter}>Save Current</button>
            </div>
          </div>

          {/* Report templates */}
          <div style={styles.descBox}>
            <div style={styles.muted} style={{ marginBottom: "10px" }}>Report Templates</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { name: "Monthly Admin Report", type: "Attendance" },
                { name: "Weekly Facility Roster", type: "PPM" },
                { name: "Asset Audit Ledger", type: "Assets" },
                { name: "Consumables Consumption", type: "Inventory" }
              ].map(t => (
                <div key={t.name} style={styles.savedFilterRow} onClick={() => { setReportType(t.type); handleGenerate(); }}>
                  <div>
                    <strong>{t.name}</strong>
                    <div style={{ fontSize: "0.68rem", color: "#64748b" }}>Type: {t.type} template</div>
                  </div>
                  <span style={{ fontSize: "0.9rem" }}>📄</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", gap: "20px", width: "100%" },
  kpiContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "12px" },
  kpiCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "14px", cursor: "pointer", transition: "transform 0.2s", textAlign: "center" },
  
  panel: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px" },
  panelTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem", fontWeight: 700, color: "#111625", marginBottom: "16px" },
  
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1.5px", color: "#111625", textTransform: "uppercase" },
  input: { padding: "8px 12px", fontSize: "0.82rem", color: "#111625", border: "1px solid #e2e8f0", borderRadius: "4px", background: "#fff", outline: "none" },
  
  checkboxLabel: { display: "inline-flex", alignItems: "center", padding: "6px 12px", border: "1px solid", borderRadius: "20px", fontSize: "0.78rem", cursor: "pointer" },
  
  primaryBtn: { background: "#0038a8", color: "#fff", border: "none", borderRadius: "4px", padding: "10px 16px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },
  secondaryBtn: { background: "#fff", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 14px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, color: "#64748b", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "left", letterSpacing: "1px" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px 16px", fontSize: "0.8rem", color: "#111625" },
  empty: { color: "#94a3b8", fontSize: "0.82rem", textAlign: "center", padding: "40px" },

  detailPanel: { flex: 0.8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px", minWidth: "300px" },
  descBox: { background: "#f8fafc", padding: "16px", borderRadius: "4px", border: "1px solid #e2e8f0", marginBottom: "20px" },
  muted: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1px", color: "#64748b", textTransform: "uppercase" },

  savedFilterRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: "1px solid #e2e8f0", padding: "8px 12px", borderRadius: "4px", cursor: "pointer", transition: "background 0.2s" }
};
