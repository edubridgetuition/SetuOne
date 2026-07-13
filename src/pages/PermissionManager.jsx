import { useEffect, useState } from "react";
import { roles, permissionTabs, defaultCompanyPermissions } from "../data/defaultPermissions";
import { menuBar } from "../data/menuBar";

const companies = [
  { key: "orion", label: "On2Cook Pvt Ltd" },
  { key: "greenfield", label: "Greenfield School" },
];

const STORAGE_KEY = "setuone_company_permissions";

function loadPermissions() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultCompanyPermissions;

  try {
    return JSON.parse(saved);
  } catch {
    return defaultCompanyPermissions;
  }
}

export default function PermissionManager() {
  const [permissions, setPermissions] = useState(loadPermissions);
  const [unsavedPermissions, setUnsavedPermissions] = useState(loadPermissions);
  const [company, setCompany] = useState("orion");
  const [role, setRole] = useState("Admin Manager");

  const selectedPermissions = unsavedPermissions?.[company]?.[role] || [];
  const hasChanges = JSON.stringify(permissions) !== JSON.stringify(unsavedPermissions);

  const isKeyPermitted = (key) => permissionTabs.some((tab) => tab.key === key);

  function togglePermission(tabKey) {
    setUnsavedPermissions((current) => {
      const companyPermissions = current[company] || {};
      const rolePermissions = companyPermissions[role] || [];

      const nextRolePermissions = rolePermissions.includes(tabKey)
        ? rolePermissions.filter((key) => key !== tabKey)
        : [...rolePermissions, tabKey];

      return {
        ...current,
        [company]: {
          ...companyPermissions,
          [role]: nextRolePermissions,
        },
      };
    });
  }

  function toggleGroupAll(groupKey, subKeys, checkAll) {
    setUnsavedPermissions((current) => {
      const companyPermissions = current[company] || {};
      const rolePermissions = companyPermissions[role] || [];

      let nextRolePermissions = [...rolePermissions];
      
      // Handle parent key toggle
      if (isKeyPermitted(groupKey)) {
        if (checkAll) {
          if (!nextRolePermissions.includes(groupKey)) nextRolePermissions.push(groupKey);
        } else {
          nextRolePermissions = nextRolePermissions.filter(k => k !== groupKey);
        }
      }

      // Handle child keys toggles
      subKeys.forEach(key => {
        if (checkAll) {
          if (!nextRolePermissions.includes(key)) nextRolePermissions.push(key);
        } else {
          nextRolePermissions = nextRolePermissions.filter(k => k !== key);
        }
      });

      return {
        ...current,
        [company]: {
          ...companyPermissions,
          [role]: nextRolePermissions,
        },
      };
    });
  }

  function allowAll() {
    setUnsavedPermissions((current) => ({
      ...current,
      [company]: {
        ...(current[company] || {}),
        [role]: permissionTabs.map((tab) => tab.key),
      },
    }));
  }

  function clearAll() {
    setUnsavedPermissions((current) => ({
      ...current,
      [company]: {
        ...(current[company] || {}),
        [role]: [],
      },
    }));
  }

  function resetToDefaults() {
    setUnsavedPermissions((current) => ({
      ...current,
      [company]: {
        ...(current[company] || {}),
        [role]: defaultCompanyPermissions?.[company]?.[role] || []
      },
    }));
  }

  function handleSaveChanges() {
    setPermissions(unsavedPermissions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unsavedPermissions));
    alert("Permissions saved successfully! Active sessions will receive the updated permission matrix.");
  }

  function handleDiscardChanges() {
    setUnsavedPermissions(permissions);
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Permission Manager</h2>
          <p style={styles.subtitle}>Company wise role tab permission setup.</p>
        </div>
        <div style={styles.actions}>
          {hasChanges && (
            <button style={{ ...styles.secondaryBtn, borderColor: "#ef4444", color: "#ef4444" }} onClick={handleDiscardChanges}>
              Discard Unsaved Changes
            </button>
          )}
          <button style={styles.secondaryBtn} onClick={clearAll}>Clear All</button>
          <button style={styles.secondaryBtn} onClick={resetToDefaults}>Reset Defaults</button>
          <button style={styles.secondaryBtn} onClick={allowAll}>Allow All</button>
          <button 
            style={{ ...styles.primaryBtn, background: hasChanges ? "#22c55e" : "#cbd5e1", cursor: hasChanges ? "pointer" : "not-allowed" }} 
            onClick={handleSaveChanges}
            disabled={!hasChanges}
          >
            Save Permissions {hasChanges && "*"}
          </button>
        </div>
      </div>

      <div style={styles.filters}>
        <label style={styles.field}>
          Company
          <select style={styles.select} value={company} onChange={(e) => setCompany(e.target.value)}>
            {companies.map((item) => (
              <option key={item.key} value={item.key}>{item.label}</option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          Role
          <select style={styles.select} value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={styles.panel}>
        <div style={styles.panelTitle}>
          Permissions for {role} in {companies.find((item) => item.key === company)?.label}
          {hasChanges && <span style={{ color: "#ef4444", marginLeft: "10px", fontSize: "12px", fontWeight: "normal" }}>(You have unsaved changes)</span>}
        </div>

        <div style={styles.groupsContainer}>
          {menuBar.map((mod) => {
            const parentPermitted = isKeyPermitted(mod.key);
            const childrenPermitted = mod.subItems.filter(sub => isKeyPermitted(sub.key) && sub.key !== mod.key);
            const hasChildren = childrenPermitted.length > 0;

            if (!parentPermitted && !hasChildren) return null;

            // Case 1: Simple module with no child tabs
            if (!hasChildren && parentPermitted) {
              const checked = selectedPermissions.includes(mod.key);
              return (
                <div key={mod.key} style={styles.groupCardSingle}>
                  <label style={{ ...styles.permissionCard, ...(checked ? styles.permissionCardActive : {}), width: "100%", margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(mod.key)}
                    />
                    <span style={{ fontSize: "14px", fontWeight: 700 }}>{mod.label}</span>
                  </label>
                </div>
              );
            }

            // Case 2: Hierarchical module (Main Menu with sub-items)
            const parentChecked = parentPermitted ? selectedPermissions.includes(mod.key) : false;
            
            // Check if all permitted child items are checked
            const childrenKeys = childrenPermitted.map(sub => sub.key);
            const allChildrenChecked = childrenKeys.every(k => selectedPermissions.includes(k));
            const someChildrenChecked = childrenKeys.some(k => selectedPermissions.includes(k));
            const groupAllChecked = parentPermitted 
              ? (parentChecked && allChildrenChecked)
              : allChildrenChecked;

            return (
              <div key={mod.key} style={styles.groupCard}>
                <div style={styles.groupHeader}>
                  <div style={styles.groupHeaderLeft}>
                    {parentPermitted ? (
                      <label style={styles.groupHeaderLabel}>
                        <input
                          type="checkbox"
                          checked={parentChecked}
                          onChange={() => togglePermission(mod.key)}
                        />
                        <span>{mod.label}</span>
                      </label>
                    ) : (
                      <span style={styles.groupHeaderTitle}>{mod.label}</span>
                    )}
                  </div>

                  <div style={styles.groupHeaderRight}>
                    <button
                      type="button"
                      onClick={() => toggleGroupAll(mod.key, childrenKeys, !groupAllChecked)}
                      style={styles.groupToggleBtn}
                    >
                      {groupAllChecked ? "Deselect Group" : "Select Group"}
                    </button>
                    <span style={styles.groupHeaderBadge}>Module Group</span>
                  </div>
                </div>

                <div style={styles.childGrid}>
                  {childrenPermitted.map((sub) => {
                    const checked = selectedPermissions.includes(sub.key);
                    const label = permissionTabs.find(t => t.key === sub.key)?.label || sub.label;
                    return (
                      <label key={sub.key} style={{ ...styles.permissionCard, ...(checked ? styles.permissionCardActive : {}) }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(sub.key)}
                        />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "16px",
  },
  header: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    color: "#0f172a",
  },
  subtitle: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  primaryBtn: {
    border: "none",
    background: "#0038a8",
    color: "#fff",
    borderRadius: "8px",
    padding: "9px 13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryBtn: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#334155",
    borderRadius: "8px",
    padding: "9px 13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
    gap: "12px",
  },
  field: {
    display: "grid",
    gap: "6px",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
  },
  select: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "10px",
    background: "#fff",
    color: "#0f172a",
  },
  panel: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "16px",
  },
  panelTitle: {
    fontSize: "15px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "18px",
  },
  groupsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  groupCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "16px",
  },
  groupCardSingle: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "12px",
  },
  groupHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "10px",
    marginBottom: "14px",
  },
  groupHeaderLeft: {
    display: "flex",
    alignItems: "center",
  },
  groupHeaderRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  groupHeaderLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 800,
    fontSize: "15px",
    color: "#0038a8",
    cursor: "pointer",
  },
  groupHeaderTitle: {
    fontWeight: 800,
    fontSize: "15px",
    color: "#475569",
  },
  groupToggleBtn: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#475569",
    borderRadius: "6px",
    padding: "4px 8px",
    fontSize: "11px",
    fontWeight: 750,
    cursor: "pointer",
  },
  groupHeaderBadge: {
    fontSize: "10px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    padding: "3px 8px",
    borderRadius: "20px",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  childGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "10px",
    paddingLeft: "4px",
  },
  permissionCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    color: "#334155",
    background: "#fff",
    fontWeight: 650,
  },
  permissionCardActive: {
    background: "#eff6ff",
    borderColor: "#93c5fd",
    color: "#0038a8",
  },
};