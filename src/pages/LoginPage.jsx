import { useState } from "react";
import { useApp } from "../context/appContextCore";
import { demoUsers } from "../data/appData";
import { MdVisibility, MdVisibilityOff, MdArrowBack } from "react-icons/md";

export default function LoginPage() {
  const { login, signup, sendPasswordResetOtp, verifyOtpAndResetPassword } = useApp();
  
  // Modes: 'signin', 'signup', 'forgotPassword'
  const [authMode, setAuthMode] = useState("signin");
  
  // Forgot Password Steps: 
  // 1 = Request Email / OTP
  // 2 = Manual 6-Digit OTP Code Verification
  const [forgotStep, setForgotStep] = useState(1);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");

  // OTP Fields
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Feedback States
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Switch Auth Modes
  function switchMode(newMode) {
    setAuthMode(newMode);
    setForgotStep(1);
    setError("");
    setSuccessMsg("");
    setEmail("");
    setPassword("");
    setFullName("");
    setCompanyName("");
    setOtpCode("");
    setNewPassword("");
    setConfirmPassword("");
  }

  // Handle Login & Signup
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (authMode === "signup") {
        if (!companyName || !companyName.trim()) {
          setError("Please enter a company name.");
          setLoading(false);
          return;
        }

        const res = await signup(email, password, fullName, companyName.trim(), "Admin Manager");
        if (res.success) {
          setSuccessMsg("Registration successful! You can now sign in using your credentials.");
          setAuthMode("signin");
          setEmail(email);
        } else {
          setError(res.message || "Registration failed. Please try again.");
        }
      } else if (authMode === "signin") {
        if (!companyName || !companyName.trim()) {
          setError("Please enter your company name.");
          setLoading(false);
          return;
        }
        const res = await login(email, password, companyName.trim());
        if (!res.success) setError(res.message);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 1: Send OTP to Email
  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email || !email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await sendPasswordResetOtp(email.trim());
      if (res.success) {
        sessionStorage.setItem("setuone_reset_requested", "true");
        setSuccessMsg(`Reset email sent to ${email}. Check your email inbox and click the reset link.`);
        setForgotStep(2);
      } else {
        setError(res.message || "Failed to send reset email.");
      }
    } catch (err) {
      setError("Failed to send OTP email: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify 6-Digit OTP Code & Change Password
  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!otpCode || !otpCode.trim()) {
      setError("Please enter the 6-digit OTP code received in your email.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtpAndResetPassword(email.trim(), otpCode.trim(), newPassword);
      if (res.success) {
        setSuccessMsg("Password updated successfully! Please sign in using your new password.");
        setAuthMode("signin");
        setForgotStep(1);
        setPassword("");
        setOtpCode("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(res.message || "Invalid OTP code or expired session. Please check your email code and try again.");
      }
    } catch (err) {
      setError("Verification failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Demo Login Quick Trigger
  async function demoLogin(demoEmail) {
    const demoCompany = "On2Cook Pvt Ltd";
    setLoading(true);
    const res = await login(demoEmail, "demo123", demoCompany);
    if (!res.success) setError(res.message || "Demo login failed.");
    setLoading(false);
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
          <span style={styles.formTag}>
            {authMode === "signup" ? "CREATE ADMIN ACCOUNT" : authMode === "forgotPassword" ? "SECURITY & RECOVERY" : "SIGN IN"}
          </span>
          
          <h2 style={styles.formTitle}>
            {authMode === "signup" ? "Get started." : authMode === "forgotPassword" ? "Reset Password" : "Welcome back."}
          </h2>
          
          <p style={styles.formSubtitle}>
            {authMode === "signup"
              ? "Register a new client company and administrative user."
              : authMode === "forgotPassword"
              ? forgotStep === 1
                ? "Enter your registered email address to receive a 6-digit OTP code."
                : `Enter the 6-digit OTP code sent to ${email} and your new password.`
              : "Use your work email and password to continue."}
          </p>

          {error && (
            <div style={styles.errorBanner}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ ...styles.errorBanner, background: "rgba(34,197,94,0.1)", color: "#22c55e", borderColor: "#22c55e" }}>
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {authMode === "forgotPassword" ? (
            /* Forgot Password / Pure 6-Digit OTP Flow */
            forgotStep === 1 ? (
              /* Step 1: Send OTP */
              <form onSubmit={handleSendOtp} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>REGISTERED WORK EMAIL</label>
                  <input
                    style={styles.input}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                  />
                </div>

                <button style={styles.btnLogin} type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send 6-Digit OTP to Email"} <span>→</span>
                </button>

                <div style={{ marginTop: "16px", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    style={styles.linkBtn}
                  >
                    <MdArrowBack style={{ marginRight: "4px" }} /> Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Verify 6-Digit Code & Change Password */
              <form onSubmit={handleResetPassword} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>EMAIL ADDRESS</label>
                  <input style={{ ...styles.input, background: "#f8fafc" }} type="email" value={email} readOnly />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>6-DIGIT OTP CODE</label>
                  <input
                    style={{ ...styles.input, letterSpacing: "4px", fontWeight: "bold", textAlign: "center", fontSize: "1.1rem" }}
                    type="text"
                    maxLength={8}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="Enter 6-Digit OTP"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>NEW PASSWORD</label>
                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      style={{ ...styles.input, paddingRight: "40px" }}
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </button>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>CONFIRM NEW PASSWORD</label>
                  <input
                    style={styles.input}
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                  />
                </div>

                <button style={{ ...styles.btnLogin, background: "#16a34a" }} type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP & Change Password"} <span>✓</span>
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    style={{ ...styles.linkBtn, color: "#64748b" }}
                    disabled={loading}
                  >
                    Resend OTP
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    style={styles.linkBtn}
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Sign In / Sign Up Form */
            <form onSubmit={handleSubmit} style={styles.form}>
              {authMode === "signup" && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>FULL NAME</label>
                  <input style={styles.input} type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required />
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>COMPANY NAME</label>
                <input style={styles.input} type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="ABC Ltd." required />
                {authMode === "signup" && <span style={styles.fieldNote}>(this name will be used during sign in)</span>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>EMAIL</label>
                <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" required />
              </div>

              <div style={styles.formGroup}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={styles.label}>PASSWORD</label>
                  {authMode === "signin" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgotPassword")}
                      style={{ background: "none", border: "none", color: "#0038a8", fontSize: "0.72rem", cursor: "pointer", fontWeight: 700 }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    style={{ ...styles.input, paddingRight: "40px" }}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                </div>
              </div>

              <button style={styles.btnLogin} type="submit" disabled={loading}>
                {loading ? "Processing..." : authMode === "signup" ? "Sign up" : "Sign in"} <span>→</span>
              </button>
            </form>
          )}

          {authMode !== "forgotPassword" && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => switchMode(authMode === "signup" ? "signin" : "signup")}
                style={styles.linkBtn}
              >
                {authMode === "signup" ? "Already have an account? Sign In" : "Don't have an admin account? Sign Up"}
              </button>
            </div>
          )}

          {authMode === "signin" && (
            <>
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
            </>
          )}
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
  fieldNote: { fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" },

  eyeBtn: { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  linkBtn: { background: "none", border: "none", color: "#0038a8", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600, textDecoration: "underline", display: "inline-flex", alignItems: "center" },

  btnLogin: { width: "100%", marginTop: "10px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 20px", fontSize: "0.9rem", fontWeight: 600, borderRadius: "4px", border: "none", cursor: "pointer", background: "#0038a8", color: "#fff" },

  helperInfo: { marginTop: "28px", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "1px", color: "#64748b" },
  demoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" },
  demoBtn: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "9px 10px", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: "2px" },
  demoRole: { color: "#0038a8", fontSize: "0.68rem", fontWeight: 700 },
  demoName: { color: "#64748b", fontSize: "0.72rem" }
};