import { useEffect, useState } from "react";
import { roles, permissionTabs, defaultCompanyPermissions } from "../data/defaultPermissions";

const companies = [
  { key: "orion", label: "Orion Corporate Park" },
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
  const [company, setCompany] = useState("orion");
  const [role, setRole] = useState("Admin Manager");

  const selectedPermissions = permissions?.[company]?.[role] || [];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
  }, [permissions]);

  function togglePermission(tabKey) {
    setPermissions((current) => {
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

  function allowAll() {
    setPermissions((current) => ({
      ...current,
      [company]: {
        ...(current[company] || {}),
        [role]: permissionTabs.map((tab) => tab.key),
      },
    }));
  }

  function clearAll() {
    setPermissions((current) => ({
      ...current,
      [company]: {
        ...(current[company] || {}),
        [role]: [],
      },
    }));
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Permission Manager</h2>
          <p style={styles.subtitle}>Company wise role tab permission setup.</p>
        </div>
        <div style={styles.actions}>
          <button style={styles.secondaryBtn} onClick={clearAll}>Clear All</button>
          <button style={styles.primaryBtn} onClick={allowAll}>Allow All</button>
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
        </div>

        <div style={styles.grid}>
          {permissionTabs.map((tab) => {
            const checked = selectedPermissions.includes(tab.key);

            return (
              <label key={tab.key} style={{ ...styles.permissionCard, ...(checked ? styles.permissionCardActive : {}) }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePermission(tab.key)}
                />
                <span>{tab.label}</span>
              </label>
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
    marginBottom: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "10px",
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