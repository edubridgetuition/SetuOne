import { useState } from "react";
import { useApp } from "../context/appContextCore";
import { demoUsers } from "../data/appData";

export default function LoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState("super@facilityops.test");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const success = await login(email, password);
    if (!success) setError("Invalid email or password. Please try again.");
  }

  async function demoLogin(demoEmail) {
    const success = await login(demoEmail, "demo123");
    if (!success) setError("Demo login failed.");
  }

  return (
    <div style={styles.authContainer}>
      {/* Left Hero Pane */}
      <div style={styles.heroPane}>
        <div style={styles.heroBg} />
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent}>
          <header style={styles.logo}>
            <span style={styles.logoBox} />
            <span style={styles.logoText}>SETUONE</span>
          </header>

          <div style={styles.heroMessage}>
            <span style={styles.heroTag}>FACILITY MANAGEMENT PLATFORM</span>
            <h1 style={styles.heroTitle}>
              Run the building.<br />Manage every record.<br />Without spreadsheets.
            </h1>
            <p style={styles.heroDesc}>
              A single dashboard for tickets, maintenance, vendors, security and energy — built for the people who keep the lights on.
            </p>
          </div>

          <footer style={styles.heroFooter}>V1 // MULTI-TENANT PREVIEW</footer>
        </div>
      </div>

      {/* Right Form Pane */}
      <div style={styles.formPane}>
        <div style={styles.formWrapper}>
          <span style={styles.formTag}>SIGN IN</span>
          <h2 style={styles.formTitle}>Welcome back.</h2>
          <p style={styles.formSubtitle}>Use your work email and password to continue.</p>

          {error && (
            <div style={styles.errorBanner}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>EMAIL</label>
              <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>PASSWORD</label>
              <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button style={styles.btnLogin} type="submit">
              Sign in <span>→</span>
            </button>
          </form>

          <div style={styles.helperInfo}>
            Quick demo login:
          </div>
          <div style={styles.demoGrid}>
            {Object.entries(demoUsers).map(([demoEmail, user]) => (
              <button key={demoEmail} style={styles.demoBtn} onClick={() => demoLogin(demoEmail)}>
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
  authContainer: { width: "100%", height: "100vh", display: "flex", background: "#ffffff", fontFamily: "'Plus Jakarta Sans', sans-serif" },

  heroPane: { flex: 1.1, position: "relative", background: "#0c1220", color: "#fff", overflow: "hidden" },
  heroBg: { position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200')", backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.45) contrast(1.05)", transform: "scale(1.02)" },
  heroOverlay: { position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(12,18,32,0.5) 0%, rgba(12,18,32,0.85) 100%)" },
  heroContent: { position: "relative", zIndex: 5, height: "100%", padding: "60px", display: "flex", flexDirection: "column", justifyContent: "space-between" },

  logo: { display: "flex", alignItems: "center", gap: "10px" },
  logoBox: { width: "16px", height: "16px", background: "#3b82f6", display: "inline-block" },
  logoText: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "0.95rem", letterSpacing: "1px", color: "#fff" },

  heroMessage: { maxWidth: "580px", margin: "auto 0" },
  heroTag: { fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "3px", color: "#94a3b8", display: "block", marginBottom: "24px", opacity: 0.85 },
  heroTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "2.7rem", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-1px", color: "#fff", marginBottom: "24px" },
  heroDesc: { fontSize: "0.9rem", lineHeight: 1.6, color: "#94a3b8", opacity: 0.9 },
  heroFooter: { fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", letterSpacing: "2px", color: "#94a3b8", opacity: 0.5 },

  formPane: { width: "45%", minWidth: "480px", background: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px" },
  formWrapper: { width: "100%", maxWidth: "360px" },
  formTag: { fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", letterSpacing: "2px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "12px" },
  formTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.85rem", fontWeight: 700, color: "#111625", marginBottom: "8px", letterSpacing: "-0.5px" },
  formSubtitle: { fontSize: "0.85rem", color: "#64748b", marginBottom: "28px" },

  errorBanner: { display: "flex", alignItems: "center", gap: "8px", background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "10px 14px", borderRadius: "4px", fontSize: "0.78rem", marginBottom: "16px" },

  form: { display: "flex", flexDirection: "column", gap: "20px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1.5px", color: "#111625" },
  input: { width: "100%", padding: "10px 14px", fontSize: "0.85rem", color: "#111625", border: "1px solid #e2e8f0", borderRadius: "4px", background: "#fff", outline: "none" },

  btnLogin: { width: "100%", marginTop: "10px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 20px", fontSize: "0.9rem", fontWeight: 600, borderRadius: "4px", border: "none", cursor: "pointer", background: "#0038a8", color: "#fff" },

  helperInfo: { marginTop: "28px", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "1px", color: "#64748b" },
  demoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" },
  demoBtn: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "9px 10px", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: "2px" },
  demoRole: { color: "#0038a8", fontSize: "0.68rem", fontWeight: 700 },
  demoName: { color: "#64748b", fontSize: "0.72rem" },
};