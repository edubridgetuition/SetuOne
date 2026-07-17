import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";
import { supabase } from "../lib/supabase";
import { MdInventory, MdImportantDevices, MdMemory, MdWarning, MdAddAlert, MdHomeRepairService } from "react-icons/md";

export default function AssetDashboard() {
  const { setActiveView } = useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssets: 0,
    itAssets: 0,
    facilityAssets: 0,
    inService: 0,
    inStore: 0,
    underRepair: 0,
    disposed: 0,
    totalInventoryValue: 0
  });
  
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentAssets, setRecentAssets] = useState([]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // 1. Fetch all assets with category divisions
      const { data: assetsData, error: assetsErr } = await supabase
        .from("assets")
        .select(`
          id, status, purchase_cost, created_at, name, asset_code,
          asset_categories (id, name, division)
        `);

      // 2. Fetch inventory items
      const { data: inventoryData, error: inventoryErr } = await supabase
        .from("inventory_items")
        .select("*");

      if (!assetsErr && assetsData) {
        let total = assetsData.length;
        let it = 0;
        let facility = 0;
        let inService = 0;
        let inStore = 0;
        let underRepair = 0;
        let disposed = 0;

        const catMap = {};

        assetsData.forEach(asset => {
          const div = asset.asset_categories?.division;
          if (div === "IT Assets") it++;
          else if (div === "Facility Assets") facility++;

          if (asset.status === "In Service") inService++;
          else if (asset.status === "In Store") inStore++;
          else if (asset.status === "Under Repair") underRepair++;
          else if (asset.status === "Disposed") disposed++;

          const catName = asset.asset_categories?.name || "Uncategorized";
          if (!catMap[catName]) {
            catMap[catName] = { name: catName, division: div || "N/A", count: 0 };
          }
          catMap[catName].count++;
        });

        // Category distribution sorted by count
        const catDist = Object.values(catMap).sort((a, b) => b.count - a.count).slice(0, 5);

        // Recent assets
        const sortedAssets = [...assetsData]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);

        // Set stats
        let totalInvValue = 0;
        let lowStock = [];
        if (!inventoryErr && inventoryData) {
          inventoryData.forEach(item => {
            totalInvValue += (item.unit_price || 0) * (item.quantity || 0);
            if ((item.quantity || 0) <= (item.safety_stock || 5)) {
              lowStock.push(item);
            }
          });
        }

        setStats({
          totalAssets: total,
          itAssets: it,
          facilityAssets: facility,
          inService,
          inStore,
          underRepair,
          disposed,
          totalInventoryValue: totalInvValue
        });

        setCategoryDistribution(catDist);
        setRecentAssets(sortedAssets);
        setLowStockItems(lowStock.slice(0, 5));
      }
    } catch (err) {
      console.error("Error loading Asset Dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.tableHeaderSection}>
        <h3 style={styles.tableTitle}>Asset Management Overview</h3>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading dashboard analytics...</div>
      ) : (
        <>
          {/* KPI Widget Cards Row */}
          <div style={styles.dashStatsGrid}>
            <div style={styles.dashCard}>
              <div style={styles.dashCardHeader}>
                <div style={styles.dashCardInfo}>
                  <span style={styles.dashLabel}>Total Asset Stock</span>
                  <span style={styles.dashValue}>{stats.totalAssets}</span>
                </div>
                <div style={{ ...styles.dashIconCircle, background: "#eff6ff", color: "#3b82f6" }}>
                  <MdInventory size={22} />
                </div>
              </div>
              <div style={styles.dashCardFooter} onClick={() => setActiveView("assets")}>
                View Asset Register →
              </div>
            </div>

            <div style={styles.dashCard}>
              <div style={styles.dashCardHeader}>
                <div style={styles.dashCardInfo}>
                  <span style={styles.dashLabel}>IT Assets</span>
                  <span style={styles.dashValue}>{stats.itAssets}</span>
                </div>
                <div style={{ ...styles.dashIconCircle, background: "#f5f3ff", color: "#7c3aed" }}>
                  <MdImportantDevices size={22} />
                </div>
              </div>
              <div style={styles.dashCardFooter} onClick={() => setActiveView("it_assets")}>
                Manage IT Division →
              </div>
            </div>

            <div style={styles.dashCard}>
              <div style={styles.dashCardHeader}>
                <div style={styles.dashCardInfo}>
                  <span style={styles.dashLabel}>Facility Assets</span>
                  <span style={styles.dashValue}>{stats.facilityAssets}</span>
                </div>
                <div style={{ ...styles.dashIconCircle, background: "#fff7ed", color: "#ea580c" }}>
                  <MdMemory size={22} />
                </div>
              </div>
              <div style={styles.dashCardFooter} onClick={() => setActiveView("facility_assets")}>
                Manage Facility Division →
              </div>
            </div>

            <div style={styles.dashCard}>
              <div style={styles.dashCardHeader}>
                <div style={styles.dashCardInfo}>
                  <span style={styles.dashLabel}>Inventory Value</span>
                  <span style={styles.dashValue}>₹{stats.totalInventoryValue.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ ...styles.dashIconCircle, background: "#f0fdf4", color: "#10b981" }}>
                  <MdInventory size={22} />
                </div>
              </div>
              <div style={styles.dashCardFooter} onClick={() => setActiveView("inventory")}>
                View Store Inventory →
              </div>
            </div>
          </div>

          {/* Asset Status Breakdown Ribbon */}
          <div style={styles.ribbon}>
            <div style={styles.ribbonItem}>
              <span style={styles.ribbonLabel}>In Service:</span>
              <span style={{ ...styles.ribbonVal, color: "#10b981" }}>{stats.inService}</span>
            </div>
            <div style={styles.ribbonItem}>
              <span style={styles.ribbonLabel}>In Store:</span>
              <span style={{ ...styles.ribbonVal, color: "#3b82f6" }}>{stats.inStore}</span>
            </div>
            <div style={styles.ribbonItem}>
              <span style={styles.ribbonLabel}>Under Repair:</span>
              <span style={{ ...styles.ribbonVal, color: "#ef4444" }}>{stats.underRepair}</span>
            </div>
            <div style={styles.ribbonItem}>
              <span style={styles.ribbonLabel}>Disposed:</span>
              <span style={{ ...styles.ribbonVal, color: "#64748b" }}>{stats.disposed}</span>
            </div>
          </div>

          {/* Two Column Layout */}
          <div style={styles.dashTwoColumnGrid}>
            
            {/* Column 1: Category Distribution & Low Stock Warnings */}
            <div style={styles.dashGridCol}>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div>
                  <h4 style={styles.dashColTitle}>Top Asset Categories</h4>
                  <div style={styles.dashColTableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Category</th>
                          <th style={styles.th}>Division</th>
                          <th style={styles.th}>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryDistribution.map((cat, idx) => (
                          <tr key={idx} style={styles.tr}>
                            <td style={styles.td}><strong>{cat.name}</strong></td>
                            <td style={styles.td}>{cat.division}</td>
                            <td style={styles.td}>
                              <span style={styles.countBadge}>{cat.count}</span>
                            </td>
                          </tr>
                        ))}
                        {categoryDistribution.length === 0 && (
                          <tr><td colSpan={3} style={styles.empty}>No categories mapped.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 style={styles.dashColTitle}>⚠️ Low Stock Inventory alerts</h4>
                  <div style={styles.dashColTableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Item Name</th>
                          <th style={styles.th}>Stock Qty</th>
                          <th style={styles.th}>Safety Level</th>
                          <th style={styles.th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockItems.map(item => (
                          <tr key={item.id} style={styles.tr}>
                            <td style={styles.td}><strong>{item.name}</strong></td>
                            <td style={styles.td}>{item.quantity} {item.unit || "units"}</td>
                            <td style={styles.td}>{item.safety_stock || 5}</td>
                            <td style={styles.td}>
                              <span style={{ ...styles.badge, background: "#fdf2f2", color: "#ef4444" }}>
                                Low Stock
                              </span>
                            </td>
                          </tr>
                        ))}
                        {lowStockItems.length === 0 && (
                          <tr><td colSpan={4} style={{ ...styles.empty, color: "#10b981" }}>✅ All inventory stocks healthy.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Recent Asset Onboardings */}
            <div style={styles.dashGridCol}>
              <h4 style={styles.dashColTitle}>Recently Registered Assets</h4>
              <div style={styles.dashColTableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Asset Code</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAssets.map(asset => (
                      <tr key={asset.id} style={styles.tr}>
                        <td style={styles.td}><span style={styles.codeTag}>{asset.asset_code || "N/A"}</span></td>
                        <td style={styles.td}><strong>{asset.name}</strong></td>
                        <td style={styles.td}>{asset.asset_categories?.name || "Unknown"}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            background: asset.status === "In Service" ? "#e6fbf2" : asset.status === "Under Repair" ? "#fdf2f2" : "#f1f5f9",
                            color: asset.status === "In Service" ? "#10b981" : asset.status === "Under Repair" ? "#ef4444" : "#475569"
                          }}>
                            {asset.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {recentAssets.length === 0 && (
                      <tr><td colSpan={4} style={styles.empty}>No asset registrations logged.</td></tr>
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

  ribbon: { display: "flex", gap: "24px", padding: "12px 20px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", flexWrap: "wrap" },
  ribbonItem: { display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem" },
  ribbonLabel: { color: "#64748b", fontWeight: 600 },
  ribbonVal: { fontWeight: 800, fontSize: "0.88rem" },

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
  countBadge: { background: "#eff6ff", color: "#2563eb", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", fontSize: "0.78rem" },
  codeTag: { background: "#f1f5f9", padding: "3px 6px", borderRadius: "4px", fontSize: "0.75rem", fontFamily: "monospace", color: "#334155", border: "1px solid #cbd5e1" }
};
