import { useMemo, useRef, useState } from "react";
import { useApp } from "../context/appContextCore";
import { menuBar } from "../data/menuBar";
import {
  MdDashboard,
  MdBuild,
  MdInventory,
  MdShoppingCart,
  MdBusiness,
  MdPeople,
  MdApartment,
  MdAccessTime,
  MdAssessment,
  MdAttachMoney,
  MdSettings,
  MdFolder
} from "react-icons/md";
const appIconColors = {
  dashboard: ["#eef2ff", "#4f46e5"],
  maintenance: ["#ecfeff", "#0891b2"],
  asset: ["#f5f3ff", "#7c3aed"],
  purchase: ["#fff7ed", "#ea580c"],
  vendors: ["#f0fdf4", "#16a34a"],
  visitors: ["#eff6ff", "#2563eb"],
  facility: ["#fdf2f8", "#db2777"],
  attendance: ["#f0fdfa", "#0f766e"],
  reports: ["#fefce8", "#ca8a04"],
  roles: ["#fff1f2", "#e11d48"],
};

export default function Layout({ children }) {
  const { session, activeView, setActiveView, activeRole, activeTenant, canAccess, logout } = useApp();
  const [launcherOpen, setLauncherOpen] = useState(false);
  const closeTimer = useRef(null);

  const accessibleModules = useMemo(() => menuBar
    .map((mod) => ({
      ...mod,
      subItems: mod.subItems.filter((sub) => canAccess(sub.key)),
    }))
    .filter((mod) => mod.subItems.length > 0), [canAccess]);

  const activeModule = accessibleModules.find((mod) => mod.subItems.some((sub) => sub.key === activeView)) || accessibleModules[0];
  const activeSubLabel = activeModule?.subItems.find((sub) => sub.key === activeView)?.label || "Dashboard";
  const tenantName = activeRole === "Super Admin" ? (activeTenant === "orion" ? "Orion Corporate Park" : "Greenfield School") : (session?.companyName || "Orion Corporate Park");

  function openLauncher() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setLauncherOpen(true);
  }

  function scheduleCloseLauncher() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setLauncherOpen(false), 220);
  }

  function toggleLauncher(event) {
    event.stopPropagation();
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setLauncherOpen((open) => !open);
  }

  function selectModule(mod) {
    setActiveView(mod.subItems[0].key);
    setLauncherOpen(false);
  }

  function selectSubItem(sub) {
    setActiveView(sub.key);
  }

  function getIcon(mod) {
    const [bg, color] = appIconColors[mod.key] || ["#f8fafc", "#64748b"];
    return { background: bg, color, borderColor: color + "33" };
  }
function getModuleIcon(key) {
  switch (key) {
    case "dashboard":
      return <MdDashboard />;

    case "maintenance":
      return <MdBuild />;

    case "asset":
      return <MdInventory />;

    case "purchase":
      return <MdShoppingCart />;

    case "vendors":
      return <MdBusiness />;

    case "visitors":
      return <MdPeople />;

    case "facility":
      return <MdApartment />;

    case "attendance":
      return <MdAccessTime />;

    case "reports":
      return <MdAssessment />;

    case "roles":
      return <MdSettings />;

    default:
      return <MdFolder />;
  }
}
  return (
    <div style={s.shell} onClick={() => launcherOpen && setLauncherOpen(false)}>
      <header style={s.topbar}>
        <div style={s.leftCluster}>
          <div
            style={s.launcherWrap}
            onMouseEnter={openLauncher}
            onMouseLeave={scheduleCloseLauncher}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Open apps menu"
              style={{ ...s.launcherButton, ...(launcherOpen ? s.launcherButtonActive : {}) }}
              onClick={toggleLauncher}
            >
              <span style={s.dotGrid}>
                {Array.from({ length: 9 }).map((_, index) => <span key={index} style={s.gridDot} />)}
              </span>
            </button>

            {launcherOpen && (
              <div style={s.launcherPanel}>
                <div style={s.launcherTitle}>Your Apps</div>
                {accessibleModules.map((mod) => {
                  const active = activeModule?.key === mod.key;
                  return (
                    <button
                      type="button"
                      key={mod.key}
                      style={{ ...s.launcherItem, ...(active ? s.launcherItemActive : {}) }}
                      onClick={() => selectModule(mod)}
                    >
                      <span
  style={{
    ...s.launcherIcon,
    ...getIcon(mod),
    ...(active ? s.launcherIconActive : {})
  }}
>
  {getModuleIcon(mod.key)}
</span>
                      <span style={s.launcherLabel}>{mod.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {activeModule && <span style={s.activeAppPill}>{activeModule.label}</span>}
          <nav style={s.subNav} aria-label="Module menu">
            {activeModule?.subItems.map((sub) => (
              <button
                type="button"
                key={sub.key}
                style={{ ...s.subNavButton, ...(activeView === sub.key ? s.subNavButtonActive : {}) }}
                onClick={() => selectSubItem(sub)}
              >
                {sub.label}
              </button>
            ))}
          </nav>
        </div>

        <div style={s.topRight}>
          <div style={s.tenantChip}>
            <span style={s.tenantDot} />
            <span style={s.tenantName}>{tenantName}</span>
          </div>
          <div style={s.userChip}>
            <div style={s.userAv}>{session?.name?.[0]}</div>
            <div>
              <div style={s.userName}>{session?.name}</div>
              <div style={s.userRole}>{activeRole}</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      <main style={s.mainWrap}>
        <section style={s.pageHeader}>
  <div style={s.breadcrumb}>
    <span 
      style={{ ...s.breadcrumbMuted, cursor: "pointer", transition: "color 0.2s" }} 
      onClick={() => setActiveView("dashboard")}
      onMouseEnter={(e) => e.target.style.color = "#0038a8"}
      onMouseLeave={(e) => e.target.style.color = s.breadcrumbMuted.color}
    >
      Home
    </span>
    <span style={s.breadcrumbSep}>›</span>
    
    {activeView === "dashboard" ? (
      <span style={s.breadcrumbActive}>Dashboard</span>
    ) : (
      <>
        {activeSubLabel !== activeModule?.label ? (
          <>
            <span 
              style={{ ...s.breadcrumbMuted, cursor: "pointer", transition: "color 0.2s" }} 
              onClick={() => setActiveView(activeModule?.subItems[0]?.key)}
              onMouseEnter={(e) => e.target.style.color = "#0038a8"}
              onMouseLeave={(e) => e.target.style.color = s.breadcrumbMuted.color}
            >
              {activeModule?.label}
            </span>
            <span style={s.breadcrumbSep}>›</span>
            <span style={s.breadcrumbActive}>{activeSubLabel}</span>
          </>
        ) : (
          <span style={s.breadcrumbActive}>{activeModule?.label}</span>
        )}
      </>
    )}
  </div>
</section>
        <section style={s.content}>{children}</section>
      </main>
    </div>
  );
}

const s = {
  shell: { height: "100vh", fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", background: "#f8fafc", overflow: "hidden", display: "flex", flexDirection: "column" },
  topbar: { height: "45px", background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 10px 0 14px", flexShrink: 0, position: "relative", zIndex: 50 },
  leftCluster: { display: "flex", alignItems: "center", minWidth: 0, flex: 1, height: "100%", gap: "8px" },
  launcherWrap: { position: "relative", display: "flex", alignItems: "center", height: "100%", flexShrink: 0 },
  launcherButton: { width: "34px", height: "34px", border: "none", borderRadius: "8px", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "background 0.15s ease" },
  launcherButtonActive: { background: "#f1f5ff" },
  dotGrid: { width: "10px", display: "grid", gridTemplateColumns: "repeat(3, 3px)", gap: "2px" },
  gridDot: { width: "3px", height: "3px", borderRadius: "50%", background: "#2563eb" },
  brandTile: { width: "34px", height: "34px", borderRadius: "9px", background: "#ffffff", color: "#0038a8", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 900, flexShrink: 0 },
  activeAppPill: { background: "#e6fffb", color: "#0f766e", border: "1px solid #99f6e4", borderRadius: "5px", padding: "5px 5px", fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 },
  subNav: { display: "flex", alignItems: "center", gap: "0px", minWidth: 0, overflowX: "auto", height: "100%" },
  subNavButton: { height: "28px", border: "none", background: "transparent", color: "#475569", padding: "0 12px", borderRadius: "8px", fontSize: "13px", fontWeight: 650, cursor: "pointer", whiteSpace: "nowrap" },
  subNavButtonActive: { color: "#0038a8", background: "#eff6ff" },
  launcherPanel: { position: "absolute", top: "44px", left: "0", width: "220px", maxHeight: "calc(100vh - 82px)", overflowY: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", boxShadow: "0 16px 40px rgba(15, 23, 42, 0.14)", padding: "10px", zIndex: 1000 },
  launcherTitle: { fontSize: "11px", color: "#94a3b8", fontWeight: 800, margin: "2px 6px 8px" },
  launcherItem: { width: "100%", border: "none", background: "transparent", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px", padding: "9px 8px", cursor: "pointer", color: "#334155", textAlign: "left" },
  launcherItemActive: { background: "#f1f5f9", color: "#0f172a", fontWeight: 800 },
  launcherIcon: { width: "34px", height: "34px", borderRadius: "8px", border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 900, flexShrink: 0 },
  launcherIconActive: { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)" },
  launcherLabel: { fontSize: "13px", fontWeight: 700 },
  topRight: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginLeft: "12px" },
  tenantChip: { display: "flex", alignItems: "center", gap: "5px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "6px", padding: "5px 9px" },
  tenantDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#0ea5e9" },
  tenantName: { fontSize: "11px", fontWeight: 700, color: "#0369a1" },
  userChip: { display: "flex", alignItems: "center", gap: "8px" },
  userAv: { width: "30px", height: "30px", borderRadius: "50%", background: "#0038a8", color: "#fff", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" },
  userName: { fontSize: "12px", fontWeight: 800, color: "#0f172a" },
  userRole: { fontSize: "10px", color: "#94a3b8" },
  logoutBtn: { background: "transparent", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", color: "#64748b", cursor: "pointer" },
  mainWrap: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" },
  pageHeader: { padding: "10px 20px", borderBottom: "1px solid #f1f5f9", background: "#fff", flexShrink: 0 },
  breadcrumb: { display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 500,},
  breadcrumbMuted: { color: "#94a3b8"},
  breadcrumbSep: { color: "#cbd5e1", fontSize: "13px",},
  breadcrumbActive: { color: "#334155", fontWeight: 600,},
  pageTitle: { fontSize: "18px", fontWeight: 900, color: "#0f172a" },
  pageSub: { fontSize: "12px", color: "#94a3b8", marginTop: "2px" },
  content: { flex: 1, overflow: "auto", padding: "15px" },
};

