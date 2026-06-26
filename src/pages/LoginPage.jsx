import { useState } from "react";
import { useApp } from "../context/AppContext";
import { demoUsers } from "../data/appData";

export default function LoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState("super@facilityops.test");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const success = await login(email, password);
    if (!success) setError("Invalid credentials. Use password: demo123");
  }

  async function demoLogin(demoEmail) {
    const success = await login(demoEmail, "demo123");
    if (!success) setError("Demo login failed.");
  }

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>S1</div>
          <div>
            <div style={styles.brandName}>SetuOne</div>
            <div style={styles.brandSub}>Facility Management Platform</div>
          </div>
        </div>

        <h2 style={styles.heading}>Sign in to your workspace</h2>
        <p style={styles.subtext}>Use a demo account to explore the platform.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={styles.btn} type="submit">Sign In →</button>
        </form>

        <div style={styles.demoSection}>
          <div style={styles.demoLabel}>Quick demo login</div>
          <div style={styles.demoGrid}>
            {Object.entries(demoUsers).map(([email, user]) => (
              <button key={email} style={styles.demoBtn} onClick={() => demoLogin(email)}>
                <span style={styles.demoRole}>{user.role}</span>
                <span style={styles.demoName}>{user.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    minHeight: "100vh",
    background: "#F6F8FC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },

  card: {
    width: "100%",
    maxWidth: "520px",
    background: "#FFFFFF",
    borderRadius: "24px",
    padding: "42px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 20px 60px rgba(15,23,42,.08)",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "30px",
  },

  brandMark: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "#2563EB",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px",
  },

  brandName: {
    color: "#111827",
    fontSize: "24px",
    fontWeight: "700",
  },

  brandSub: {
    color: "#6B7280",
    fontSize: "13px",
    marginTop: "2px",
  },

  heading: {
    color: "#111827",
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "8px",
  },

  subtext: {
    color: "#6B7280",
    marginBottom: "24px",
    lineHeight: 1.5,
  },

  error: {
    background: "#FEF2F2",
    color: "#DC2626",
    border: "1px solid #FECACA",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "18px",
    fontSize: "14px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "28px",
  },

  label: {
    color: "#374151",
    fontSize: "14px",
    fontWeight: "600",
  },

  input: {
    height: "48px",
    borderRadius: "12px",
    border: "1px solid #D1D5DB",
    background: "#FFFFFF",
    padding: "0 16px",
    fontSize: "15px",
    color: "#111827",
    outline: "none",
  },

  btn: {
    marginTop: "8px",
    height: "50px",
    border: "none",
    borderRadius: "12px",
    background: "#2563EB",
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
  },

  demoSection: {
    borderTop: "1px solid #E5E7EB",
    paddingTop: "22px",
  },

  demoLabel: {
    color: "#6B7280",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: "14px",
  },

  demoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },

  demoBtn: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "14px",
    cursor: "pointer",
    textAlign: "left",
    transition: ".2s",
  },

  demoRole: {
    color: "#2563EB",
    fontSize: "12px",
    fontWeight: "700",
  },

  demoName: {
    color: "#374151",
    fontSize: "13px",
    marginTop: "4px",
  },
};