import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";

const priorityColors = { 
  "High": "#f59e0b", 
  "Critical": "#ef4444", 
  "Medium": "#0038a8", 
  "Low": "#10b981" 
};

export default function Dashboard() {
  const {
    session,
    setActiveView,
    activeRole,
    dashboardWidgetsList,
    activeDashboardLayout,
    loadDashboardWidgets,
    loadUserDashboardLayout,
    saveUserDashboardLayout,
    resetUserDashboardLayout,
    fetchWidgetDataPayload
  } = useApp();

  const [editMode, setEditMode] = useState(false);
  const [widgetsData, setWidgetsData] = useState({});
  const [currentGridItems, setCurrentGridItems] = useState([]);
  const [toolboxCategory, setToolboxCategory] = useState("Operations");

  // Load configuration details on mount
  useEffect(() => {
    async function loadConfig() {
      await loadDashboardWidgets();
      await loadUserDashboardLayout();
    }
    loadConfig();
  }, []);

  // Update layout from fetched settings
  useEffect(() => {
    if (activeDashboardLayout && activeDashboardLayout.desktop_layout) {
      setCurrentGridItems(activeDashboardLayout.desktop_layout);
    } else {
      // Default fallback grid items
      setCurrentGridItems([
        { widget_key: "OPEN_TICKETS", x: 1, y: 1, w: 4, h: 2 },
        { widget_key: "TODAYS_VISITORS", x: 5, y: 1, w: 4, h: 2 },
        { widget_key: "ATTENDANCE_SUMMARY", x: 9, y: 1, w: 4, h: 2 }
      ]);
    }
  }, [activeDashboardLayout]);

  // Load widget count values periodically
  useEffect(() => {
    if (currentGridItems.length === 0) return;
    
    async function loadAllWidgetStats() {
      const stats = {};
      await Promise.all(
        currentGridItems.map(async item => {
          const res = await fetchWidgetDataPayload(item.widget_key);
          if (res && res.success) {
            stats[item.widget_key] = res.data;
          }
        })
      );
      setWidgetsData(stats);
    }

    loadAllWidgetStats();
    const interval = setInterval(loadAllWidgetStats, 30000); // 30 sec refresh rate
    return () => clearInterval(interval);
  }, [currentGridItems]);

  // Customize layout functions
  function moveItem(index, dx, dy) {
    const items = [...currentGridItems];
    const item = { ...items[index] };
    item.x = Math.max(1, item.x + dx);
    item.y = Math.max(1, item.y + dy);
    items[index] = item;
    setCurrentGridItems(items);
  }

  function resizeItem(index, dw, dh) {
    const items = [...currentGridItems];
    const item = { ...items[index] };
    item.w = Math.max(2, item.w + dw);
    item.h = Math.max(2, item.h + dh);
    items[index] = item;
    setCurrentGridItems(items);
  }

  function removeItem(index) {
    const item = currentGridItems[index];
    const widgetDef = dashboardWidgetsList.find(w => w.widget_key === item.widget_key);
    if (widgetDef && widgetDef.is_required) {
      alert("Error: This widget is mandatory and cannot be removed!");
      return;
    }
    const items = currentGridItems.filter((_, i) => i !== index);
    setCurrentGridItems(items);
  }

  function addWidget(widgetKey) {
    if (currentGridItems.some(i => i.widget_key === widgetKey)) {
      alert("This widget is already active on the dashboard grid!");
      return;
    }
    const widgetDef = dashboardWidgetsList.find(w => w.widget_key === widgetKey);
    const newX = 1;
    const newY = currentGridItems.length ? Math.max(...currentGridItems.map(i => i.y + i.h)) : 1;
    
    setCurrentGridItems([
      ...currentGridItems,
      {
        widget_key: widgetKey,
        x: newX,
        y: newY,
        w: widgetDef?.default_w || 4,
        h: widgetDef?.default_h || 3
      }
    ]);
  }

  async function handleSave() {
    await saveUserDashboardLayout({
      desktop: currentGridItems,
      tablet: currentGridItems,
      mobile: currentGridItems
    });
    setEditMode(false);
    alert("Dashboard layout saved successfully!");
  }

  async function handleReset() {
    if (window.confirm("Are you sure you want to restore default dashboard layout configurations?")) {
      await resetUserDashboardLayout();
      alert("Dashboard layout reset to role defaults!");
    }
  }

  // Render Widgets components dynamically
  function renderWidgetContent(item) {
    const data = widgetsData[item.widget_key];
    const widgetDef = dashboardWidgetsList.find(w => w.widget_key === item.widget_key);

    switch (item.widget_key) {
      case "OPEN_TICKETS":
        return (
          <div style={styles.widgetContent}>
            <div style={styles.metricBig}>{data?.count ?? 0}</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
              Active complaints currently unresolved.
            </div>
            <button style={{ ...styles.actionBtn, marginTop: "12px" }} onClick={() => setActiveView("tickets")}>
              Go to Tickets
            </button>
          </div>
        );
      case "TODAYS_VISITORS":
        return (
          <div style={styles.widgetContent}>
            <div style={styles.metricBig} style={{ color: "#10b981", fontSize: "2rem", fontWeight: "bold" }}>{data?.count ?? 0}</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
              Gate passes logged today.
            </div>
            <button style={{ ...styles.actionBtn, marginTop: "12px" }} onClick={() => setActiveView("visitors")}>
              Visitor Log
            </button>
          </div>
        );
      case "ATTENDANCE_SUMMARY":
        return (
          <div style={styles.widgetContent}>
            <div style={styles.metricBig} style={{ color: "#0038a8", fontSize: "2rem", fontWeight: "bold" }}>{data?.activeCount ?? 0} Staff</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
              Checked-in personnel today.
            </div>
            <button style={{ ...styles.actionBtn, marginTop: "12px" }} onClick={() => setActiveView("attendance")}>
              Daily Sheet
            </button>
          </div>
        );
      case "PENDING_PURCHASE":
        return (
          <div style={styles.widgetContent}>
            <div style={styles.metricBig} style={{ color: "#f59e0b", fontSize: "2rem", fontWeight: "bold" }}>{data?.count ?? 0} Pending</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
              Procurement requests waiting action.
            </div>
            <button style={{ ...styles.actionBtn, marginTop: "12px" }} onClick={() => setActiveView("purchase")}>
              Review Queue
            </button>
          </div>
        );
      case "STOCK_LEVELS":
        return (
          <div style={styles.widgetContent}>
            <div style={styles.metricBig} style={{ color: "#ef4444", fontSize: "2rem", fontWeight: "bold" }}>{data?.alertItems ?? 3} Spares</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
              Spares running below safe inventory stock limits.
            </div>
            <button style={{ ...styles.actionBtn, marginTop: "12px" }} onClick={() => setActiveView("inventory")}>
              Inventory Stocks
            </button>
          </div>
        );
      case "ENERGY_MONITOR":
        return (
          <div style={styles.widgetContent}>
            <div style={{ ...styles.metricBig, fontSize: "1.8rem" }}>4,120 KWh</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
              Cumulative utility consumption this cycle.
            </div>
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => (
                <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ background: "#0038a8", width: "12px", height: `${30 + (i * 8)}px`, borderRadius: "2px" }} />
                  <span style={{ fontSize: "0.6rem", color: "#64748b", marginTop: "4px" }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div style={styles.widgetContent}>
            <div style={styles.metricBig}>120</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Generic metric summary data.</div>
          </div>
        );
    }
  }

  return (
    <div style={styles.page}>
      
      {/* Welcome & Customize header */}
      <div style={styles.welcome}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div>
            Welcome back, <strong style={{ color: "#0038a8" }}>{session?.name || "User"}</strong>
            <span style={{ marginLeft: "10px", fontSize: "0.76rem", color: "#64748b" }}>
              Role: <strong>{activeRole}</strong>
            </span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {!editMode ? (
              <>
                <button style={styles.ghostBtn} onClick={() => setEditMode(true)}>
                  ⚙️ Customize Dashboard
                </button>
                <button style={{ ...styles.ghostBtn, background: "#f8fafc" }} onClick={handleReset}>
                  🔄 Reset Layout
                </button>
              </>
            ) : (
              <>
                <button style={{ ...styles.ghostBtn, background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }} onClick={handleSave}>
                  💾 Save Layout
                </button>
                <button style={{ ...styles.ghostBtn, background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" }} onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        
        {/* Dashboard Grid canvas */}
        <div style={{ flex: 2, minWidth: "0" }}>
          <div style={styles.gridContainer}>
            {currentGridItems.map((item, index) => {
              const widgetDef = dashboardWidgetsList.find(w => w.widget_key === item.widget_key);
              return (
                <div
                  key={item.widget_key}
                  style={{
                    ...styles.gridCard,
                    gridColumn: `span ${item.w}`,
                    gridRow: `span ${item.h}`
                  }}
                >
                  <div style={styles.cardHeader}>
                    <div style={styles.cardTitle}>{widgetDef?.widget_name || item.widget_key}</div>
                    
                    {/* Position and dimension control buttons in Edit Mode */}
                    {editMode && (
                      <div style={styles.editorControls}>
                        {/* Move controls */}
                        <button title="Move Left" style={styles.ctrlBtn} onClick={() => moveItem(index, -1, 0)}>◀</button>
                        <button title="Move Right" style={styles.ctrlBtn} onClick={() => moveItem(index, 1, 0)}>▶</button>
                        
                        {/* Dimension controls */}
                        <button title="Increase Width" style={styles.ctrlBtn} onClick={() => resizeItem(index, 1, 0)}>➕W</button>
                        <button title="Decrease Width" style={styles.ctrlBtn} onClick={() => resizeItem(index, -1, 0)}>➖W</button>
                        <button title="Increase Height" style={styles.ctrlBtn} onClick={() => resizeItem(index, 0, 1)}>➕H</button>
                        <button title="Decrease Height" style={styles.ctrlBtn} onClick={() => resizeItem(index, 0, -1)}>➖H</button>
                        
                        {/* Remove */}
                        <button title="Remove widget" style={{ ...styles.ctrlBtn, color: "#ef4444" }} onClick={() => removeItem(index)}>❌</button>
                      </div>
                    )}
                  </div>
                  <div style={styles.cardBody}>
                    {renderWidgetContent(item)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Toolbox Drawer visible during Edit mode */}
        {editMode && (
          <div style={styles.toolbox}>
            <div style={styles.toolboxHeader}>
              <div style={styles.cardTitle}>Widgets Drawer</div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>Grouped by categories. Click "+ Add" to drop card.</div>
            </div>

            {/* Toolbox Category switches */}
            <div style={styles.categoryWrap}>
              {["Operations", "Inventory", "Assets", "HR", "Finance", "Visitors", "Energy"].map(cat => (
                <button
                  key={cat}
                  style={{ ...styles.catBtn, ...(toolboxCategory === cat ? styles.catBtnActive : {}) }}
                  onClick={() => setToolboxCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={styles.toolboxList}>
              {dashboardWidgetsList
                .filter(w => w.widget_category === toolboxCategory)
                .map(w => {
                  const isActive = currentGridItems.some(i => i.widget_key === w.widget_key);
                  return (
                    <div key={w.id} style={styles.toolboxItem}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#111625" }}>{w.widget_name}</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>{w.description}</div>
                      </div>
                      <button
                        disabled={isActive}
                        style={{ ...styles.actionBtn, background: isActive ? "#cbd5e1" : "#0038a8", color: "#fff" }}
                        onClick={() => addWidget(w.widget_key)}
                      >
                        {isActive ? "Added" : "+ Add"}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", gap: "20px" },
  welcome: { color: "#64748b", fontSize: "0.85rem", background: "#fff", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: "4px" },
  ghostBtn: { background: "#fff", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "6px 12px", color: "#111625", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", outline: "none" },
  
  gridContainer: { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px", width: "100%" },
  gridCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", minHeight: "200px" },
  
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", padding: "12px 16px" },
  cardTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.85rem", fontWeight: 700, color: "#111625" },
  cardBody: { padding: "16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" },

  widgetContent: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%" },
  metricBig: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "2.2rem", fontWeight: 700, color: "#111625" },
  actionBtn: { background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "4px", padding: "6px 12px", fontSize: "0.74rem", fontWeight: 600, cursor: "pointer" },

  editorControls: { display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" },
  ctrlBtn: { background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "3px", padding: "2px 6px", fontSize: "0.68rem", fontWeight: "bold", cursor: "pointer" },

  toolbox: { flex: 0.8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", minWidth: "280px" },
  toolboxHeader: { borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" },
  categoryWrap: { display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "4px" },
  catBtn: { background: "none", border: "none", color: "#64748b", fontSize: "0.72rem", fontWeight: 600, padding: "4px 8px", cursor: "pointer", outline: "none", whiteSpace: "nowrap" },
  catBtnActive: { color: "#0038a8", borderBottom: "2px solid #0038a8" },

  toolboxList: { display: "flex", flexDirection: "column", gap: "10px" },
  toolboxItem: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "10px", borderRadius: "4px", border: "1px solid #e2e8f0" }
};
