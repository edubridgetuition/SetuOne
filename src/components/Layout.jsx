import { useApp } from "../context/AppContext";
import { navItems, tenants } from "../data/appData";

export default function Layout({ children }) {
  const { session, activeView, setActiveView, activeRole, activeTenant, setActiveTenant, setActiveRole, canAccess, logout } = useApp();

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>S1</div>
          <div>
            <div style={styles.brandName}>SetuOne</div>
            <div style={styles.brandSub}>Admin Platform</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.filter(item => canAccess(item.key)).map(item => (
            <button
              key={item.key}
              style={{ ...styles.navItem, ...(activeView === item.key ? styles.navActive : {}) }}
              onClick={() => setActiveView(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <header style={styles.topbar}>
          <div>
            <div style={styles.eyebrow}>Multi-tenant Facility Management</div>
            <h1 style={styles.pageTitle}>
              {navItems.find(i => i.key === activeView)?.label || "Dashboard"}
            </h1>
          </div>
          <div style={styles.topbarRight}>
            {activeRole === "Super Admin" && (
              <select style={styles.select} value={activeTenant} onChange={e => setActiveTenant(e.target.value)}>
                {Object.entries(tenants).map(([key, t]) => (
                  <option key={key} value={key}>{t.name}</option>
                ))}
              </select>
            )}
            <div style={styles.userBadge}>
              <div style={styles.userAvatar}>{session?.name?.[0]}</div>
              <div>
                <div style={styles.userName}>{session?.name}</div>
                <div style={styles.userRole}>{activeRole}</div>
              </div>
            </div>
          </div>
        </header>

        <div style={styles.tenantStrip}>
          <div><span style={styles.muted}>Site</span> <strong style={styles.stripVal}>{tenants[activeTenant]?.name}</strong></div>
          <div><span style={styles.muted}>Role</span> <strong style={styles.stripVal}>{activeRole}</strong></div>
          <div><span style={styles.muted}>Plan</span> <strong style={styles.stripVal}>Enterprise</strong></div>
          <div><span style={styles.muted}>Mode</span> <strong style={styles.stripVal}>Demo</strong></div>
        </div>

        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
}

const styles = {
  shell: { display:"flex", minHeight:"100vh", background:"#0f172a" },
  sidebar: { width:"220px", minWidth:"220px", background:"#1e293b", display:"flex", flexDirection:"column", padding:"20px 12px", borderRight:"1px solid #334155" },
  brand: { display:"flex", alignItems:"center", gap:"10px", marginBottom:"28px", padding:"0 8px" },
  brandMark: { width:"36px", height:"36px", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:"800", fontSize:"12px", flexShrink:0 },
  brandName: { color:"#f1f5f9", fontWeight:"700", fontSize:"15px" },
  brandSub: { color:"#64748b", fontSize:"11px" },
  nav: { display:"flex", flexDirection:"column", gap:"2px", flex:1, overflowY:"auto" },
  navItem: { background:"transparent", border:"none", borderRadius:"8px", padding:"9px 12px", color:"#94a3b8", fontSize:"13px", fontWeight:"500", cursor:"pointer", textAlign:"left", transition:"all 0.15s" },
  navActive: { background:"#6366f120", color:"#818cf8", fontWeight:"600" },
  logoutBtn: { background:"transparent", border:"1px solid #334155", borderRadius:"8px", padding:"9px 12px", color:"#64748b", fontSize:"13px", cursor:"pointer", marginTop:"12px" },
  main: { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
  topbar: { background:"#1e293b", borderBottom:"1px solid #334155", padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" },
  eyebrow: { color:"#64748b", fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2px" },
  pageTitle: { color:"#f1f5f9", fontSize:"20px", fontWeight:"700", margin:0 },
  topbarRight: { display:"flex", alignItems:"center", gap:"12px" },
  select: { background:"#0f172a", border:"1px solid #334155", borderRadius:"8px", padding:"7px 10px", color:"#f1f5f9", fontSize:"13px" },
  userBadge: { display:"flex", alignItems:"center", gap:"10px" },
  userAvatar: { width:"34px", height:"34px", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:"700", fontSize:"14px" },
  userName: { color:"#f1f5f9", fontSize:"13px", fontWeight:"600" },
  userRole: { color:"#64748b", fontSize:"11px" },
  tenantStrip: { background:"#0f172a", borderBottom:"1px solid #1e293b", padding:"10px 24px", display:"flex", gap:"32px" },
  muted: { color:"#64748b", fontSize:"12px", marginRight:"6px" },
  stripVal: { color:"#94a3b8", fontSize:"12px" },
  content: { flex:1, overflowY:"auto", padding:"24px" },
};