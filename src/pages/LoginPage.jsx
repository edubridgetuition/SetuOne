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
  bg: { minHeight:"100vh", background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" },
  card: { background:"#1e293b", borderRadius:"16px", padding:"40px", width:"100%", maxWidth:"480px", boxShadow:"0 25px 50px rgba(0,0,0,0.4)" },
  brand: { display:"flex", alignItems:"center", gap:"12px", marginBottom:"28px" },
  brandMark: { width:"44px", height:"44px", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:"800", fontSize:"14px" },
  brandName: { color:"#f1f5f9", fontWeight:"700", fontSize:"18px" },
  brandSub: { color:"#64748b", fontSize:"12px" },
  heading: { color:"#f1f5f9", fontSize:"22px", fontWeight:"700", margin:"0 0 6px" },
  subtext: { color:"#64748b", fontSize:"14px", margin:"0 0 20px" },
  error: { background:"#450a0a", color:"#fca5a5", padding:"10px 14px", borderRadius:"8px", fontSize:"13px", marginBottom:"16px" },
  form: { display:"flex", flexDirection:"column", gap:"10px", marginBottom:"24px" },
  label: { color:"#94a3b8", fontSize:"13px", fontWeight:"500" },
  input: { background:"#0f172a", border:"1px solid #334155", borderRadius:"8px", padding:"10px 14px", color:"#f1f5f9", fontSize:"14px", outline:"none" },
  btn: { background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", border:"none", borderRadius:"8px", padding:"12px", fontSize:"15px", fontWeight:"600", cursor:"pointer", marginTop:"4px" },
  demoSection: { borderTop:"1px solid #334155", paddingTop:"20px" },
  demoLabel: { color:"#64748b", fontSize:"12px", fontWeight:"600", marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.05em" },
  demoGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" },
  demoBtn: { background:"#0f172a", border:"1px solid #334155", borderRadius:"8px", padding:"10px 12px", cursor:"pointer", textAlign:"left", display:"flex", flexDirection:"column", gap:"2px" },
  demoRole: { color:"#6366f1", fontSize:"11px", fontWeight:"600" },
  demoName: { color:"#94a3b8", fontSize:"12px" },
};