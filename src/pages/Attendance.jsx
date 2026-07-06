import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";

const statusColors = { Present: "#22c55e", Late: "#f59e0b", Absent: "#ef4444", "On Leave": "#64748b", WFH: "#6366f1", "Half Day": "#06b6d4" };
const dutyColors = { "On Duty": "#22c55e", Break: "#f59e0b", "Outside Office": "#ef4444", WFH: "#6366f1", "Checked Out": "#64748b", "Off Duty": "#94a3b8" };

export default function Attendance() {
  const {
    session,
    activeRole,
    shiftsList,
    loadShifts,
    attendanceToday,
    loadUserAttendanceStatus,
    attendanceHistory,
    loadAttendanceHistory,
    attendanceBranchSummary,
    loadBranchAttendanceSummary,
    clockIn,
    clockOut,
    updateDutyStatus,
    requestRegularization,
    approveRegularization,
    rejectRegularization
  } = useApp();

  const [activeTab, setActiveTab] = useState("My Attendance");

  // Local simulator controls
  const [gpsSim, setGpsSim] = useState("Inside"); // "Inside" or "Outside"
  const [clockMethod, setClockMethod] = useState("GPS"); // "GPS" or "Manual"
  const [manualReason, setManualReason] = useState("");
  const [selectedShift, setSelectedShift] = useState("General Shift");

  // Regularization request form
  const [regItemId, setRegItemId] = useState(null);
  const [regReason, setRegReason] = useState("");

  // Load datasets
  useEffect(() => {
    loadShifts();
    loadUserAttendanceStatus();
    loadAttendanceHistory();
    loadBranchAttendanceSummary();
  }, []);

  // Update default shift selector once shifts load
  useEffect(() => {
    if (shiftsList.length > 0 && !selectedShift) {
      setSelectedShift(shiftsList[0].name);
    }
  }, [shiftsList]);

  async function handleClockIn() {
    const coords = gpsSim === "Inside" ? "23.0225, 72.5714" : "23.0101, 72.5501";
    const isVerified = gpsSim === "Inside" && clockMethod === "GPS";

    if (clockMethod === "Manual" && !manualReason.trim()) {
      alert("Please enter a manual check-in justification reason.");
      return;
    }

    const res = await clockIn(selectedShift, coords, isVerified, clockMethod, manualReason);
    if (res && res.success) {
      alert("Duty clock-in logged successfully!");
      setManualReason("");
    }
  }

  async function handleClockOut() {
    const res = await clockOut(clockMethod, manualReason);
    if (res && res.success) {
      alert("Duty clock-out logged successfully!");
      setManualReason("");
    }
  }

  async function handleDutyStatusChange(status) {
    await updateDutyStatus(status);
  }

  async function handleRegSubmit(e) {
    e.preventDefault();
    if (!regReason.trim()) return;
    const res = await requestRegularization(regItemId, regReason);
    if (res.success) {
      alert("Regularization request submitted to your manager.");
      setRegItemId(null);
      setRegReason("");
    }
  }

  const isManager = activeRole === "Admin Manager" || activeRole === "Super Admin";

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.panel}>
          
          {/* Header & Tabs */}
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Staff Duty Roster & Attendance</div>
              <div style={styles.panelSub}>Geofenced check-in log, biometric verification triggers, and regularization workflows.</div>
            </div>
          </div>

          <div style={styles.tabHeader}>
            {[
              { key: "My Attendance", label: "My Attendance Logs" },
              { key: "Team Attendance", label: isManager ? `Team Roster (${attendanceBranchSummary.length})` : null },
              { key: "Analytics", label: "Duty Analytics" }
            ].filter(t => t.label).map(tab => (
              <button
                key={tab.key}
                style={{ ...styles.tabBtn, ...(activeTab === tab.key ? styles.tabBtnActive : {}) }}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: USER ATTENDANCE & CLOCK CARD */}
          {activeTab === "My Attendance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={styles.attendanceConsole}>
                {/* Punch Console */}
                <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={styles.panelTitle} style={{ fontSize: "0.85rem" }}>Clock Desk Console</div>
                  
                  <div style={styles.formGrid} style={{ gridTemplateColumns: "1fr 1fr", gap: "12px", display: "grid" }}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Choose Shift</label>
                      <select style={styles.input} value={selectedShift} onChange={e => setSelectedShift(e.target.value)}>
                        {shiftsList.map(s => <option key={s.id} value={s.name}>{s.name} ({s.start_time.slice(0, 5)}-{s.end_time.slice(0, 5)})</option>)}
                        {shiftsList.length === 0 && <option>General Shift (09:00 - 18:00)</option>}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Check-in Mode</label>
                      <select style={styles.input} value={clockMethod} onChange={e => setClockMethod(e.target.value)}>
                        <option value="GPS">GPS Geolocation</option>
                        <option value="Manual">Manual Entry</option>
                      </select>
                    </div>
                  </div>

                  {clockMethod === "Manual" && (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Reason for Manual Check-in</label>
                      <input style={styles.input} required placeholder="Biometric mismatch / GPS out-of-range" value={manualReason} onChange={e => setManualReason(e.target.value)} />
                    </div>
                  )}

                  {/* Punch Button Triggers */}
                  <div style={{ marginTop: "10px" }}>
                    {!attendanceToday ? (
                      <button style={{ ...styles.primaryBtn, width: "100%", background: "#22c55e", padding: "12px" }} onClick={handleClockIn}>
                        CLOCK IN (Punch Attendance)
                      </button>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          Clocked In at: <strong>{new Date(attendanceToday.in_time).toLocaleTimeString()}</strong>
                        </div>
                        {attendanceToday.duty_status !== "Checked Out" ? (
                          <button style={{ ...styles.primaryBtn, width: "100%", background: "#ef4444", padding: "12px" }} onClick={handleClockOut}>
                            CLOCK OUT (Leave Office)
                          </button>
                        ) : (
                          <div style={{ color: "#22c55e", fontWeight: 700, fontSize: "0.82rem" }}>✓ Shift Checked Out</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Geofence Radar simulator */}
                <div style={styles.radarCard}>
                  <div style={styles.label}>Geofence Radar</div>
                  
                  <div style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
                    <button style={{ ...styles.tabBtn, border: "1px solid #cbd5e1", borderRadius: "4px", padding: "4px 8px", fontSize: "0.72rem", background: gpsSim === "Inside" ? "#22c55e22" : "none" }} onClick={() => setGpsSim("Inside")}>In Office</button>
                    <button style={{ ...styles.tabBtn, border: "1px solid #cbd5e1", borderRadius: "4px", padding: "4px 8px", fontSize: "0.72rem", background: gpsSim === "Outside" ? "#ef444422" : "none" }} onClick={() => setGpsSim("Outside")}>Outside</button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "15px 0" }}>
                    <div style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: gpsSim === "Inside" ? "#22c55e22" : "#ef444422",
                      border: `2px solid ${gpsSim === "Inside" ? "#22c55e" : "#ef4444"}`,
                      display: "flex",
                      alignItems: "center",
                      justify: "center",
                      animation: "pulse 2s infinite"
                    }}>
                      <span style={{ fontSize: "1.4rem" }}>{gpsSim === "Inside" ? "🎯" : "📡"}</span>
                    </div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: gpsSim === "Inside" ? "#22c55e" : "#ef4444" }}>
                      {gpsSim === "Inside" ? "Inside Geofence Radius" : "Out of Geofence range"}
                    </div>
                  </div>
                </div>
              </div>

              {/* History list and regularization requests */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={styles.panelTitle} style={{ fontSize: "0.85rem" }}>My Attendance Logs</div>
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {["Date", "Shift", "In Time", "Out Time", "Status", "Actions"].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.map(row => (
                        <tr key={row.id} style={styles.tr}>
                          <td style={styles.td}>{new Date(row.in_time).toLocaleDateString()}</td>
                          <td style={styles.td}>{row.shift}</td>
                          <td style={styles.td}>{new Date(row.in_time).toLocaleTimeString()}</td>
                          <td style={styles.td}>{row.out_time ? new Date(row.out_time).toLocaleTimeString() : "--"}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, background: statusColors[row.status] + "22", color: statusColors[row.status] }}>
                              {row.status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {row.status === "Late" && row.regularization_status === "None" && (
                              <button style={{ ...styles.secondaryBtn, padding: "4px 8px", fontSize: "0.72rem" }} onClick={() => setRegItemId(row.id)}>
                                Regularize
                              </button>
                            )}
                            {row.regularization_status !== "None" && (
                              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Reg: {row.regularization_status}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEAM ROSTER FOR MANAGERS */}
          {activeTab === "Team Attendance" && isManager && (
            <div style={styles.tableWrap}>
              <div style={styles.panelTitle} style={{ fontSize: "0.85rem", marginBottom: "15px" }}>Team Attendance & Regularization Requests</div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Employee Name", "Shift", "In Time", "Status", "Regularization", "Actions"].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendanceBranchSummary.map(row => (
                    <tr key={row.id} style={styles.tr}>
                      <td style={styles.td}><strong>{row.profiles?.full_name}</strong></td>
                      <td style={styles.td}>{row.shift}</td>
                      <td style={styles.td}>{new Date(row.in_time).toLocaleTimeString()}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: statusColors[row.status] + "22", color: statusColors[row.status] }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {row.regularization_status === "Pending" ? (
                          <div style={{ fontSize: "0.74rem" }}>
                            <i>"{row.regularization_reason}"</i>
                          </div>
                        ) : (
                          <span>{row.regularization_status}</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {row.regularization_status === "Pending" && (
                          <div style={{ display: "flex", gap: "5px" }}>
                            <button style={{ ...styles.primaryBtn, background: "#22c55e", padding: "4px 8px", fontSize: "0.72rem" }} onClick={() => approveRegularization(row.id)}>Approve</button>
                            <button style={{ ...styles.secondaryBtn, color: "#ef4444", borderColor: "#ef4444", padding: "4px 8px", fontSize: "0.72rem" }} onClick={() => rejectRegularization(row.id)}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {attendanceBranchSummary.length === 0 && <div style={styles.empty}>No employee clock logs recorded in your branch today.</div>}
            </div>
          )}

          {/* TAB 3: DUTY ANALYTICS */}
          {activeTab === "Analytics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div style={styles.descBox}>
                  <div style={styles.muted}>Present Count</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 700, margin: "8px 0", color: "#22c55e" }}>
                    {attendanceBranchSummary.filter(t => t.status === "Present").length}
                  </div>
                </div>
                <div style={styles.descBox}>
                  <div style={styles.muted}>Late Check-ins</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 700, margin: "8px 0", color: "#f59e0b" }}>
                    {attendanceBranchSummary.filter(t => t.status === "Late").length}
                  </div>
                </div>
                <div style={styles.descBox}>
                  <div style={styles.muted}>Regularization Requests</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 700, margin: "8px 0", color: "#6366f1" }}>
                    {attendanceBranchSummary.filter(t => t.regularization_status === "Pending").length}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Sidebar Details Panel - Regularization request popup and Live Duty status */}
      <div style={styles.detailPanel}>
        {attendanceToday && attendanceToday.duty_status !== "Checked Out" ? (
          <div style={styles.descBox}>
            <div style={styles.muted} style={{ marginBottom: "10px" }}>Live Duty Status</div>
            <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
              <div style={{ fontSize: "0.8rem", marginBottom: "8px" }}>
                Current Status: <strong style={{ color: dutyColors[attendanceToday.duty_status] }}>{attendanceToday.duty_status}</strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {["On Duty", "Break", "Outside Office", "WFH"].map(status => (
                  <button
                    key={status}
                    style={{
                      ...styles.tabBtn,
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      padding: "8px",
                      fontSize: "0.78rem",
                      background: attendanceToday.duty_status === status ? dutyColors[status] + "22" : "none",
                      color: attendanceToday.duty_status === status ? dutyColors[status] : "#64748b"
                    }}
                    onClick={() => handleDutyStatusChange(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.emptyDetail} style={{ display: "none" }} />
        )}

        {regItemId ? (
          <form onSubmit={handleRegSubmit} style={styles.form}>
            <div style={styles.panelTitle} style={{ fontSize: "0.85rem" }}>Request Attendance Regularization</div>
            <div style={styles.formGroup} style={{ marginTop: "10px" }}>
              <label style={styles.label}>Reason / Justification</label>
              <textarea style={{ ...styles.input, height: "80px", resize: "none" }} required placeholder="Late due to office transport delay / Client meeting" value={regReason} onChange={e => setRegReason(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button style={styles.primaryBtn} type="submit">Submit Request</button>
              <button style={styles.secondaryBtn} type="button" onClick={() => setRegItemId(null)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div style={styles.emptyDetail}>No active regularization item selected. Click "Regularize" in history records if marked late.</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", gap: "20px", width: "100%" },
  left: { flex: 1.8, minWidth: "0" },
  panel: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" },
  panelTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem", fontWeight: 700, color: "#111625" },
  panelSub: { fontSize: "0.78rem", color: "#64748b", marginTop: "2px" },
  primaryBtn: { background: "#0038a8", color: "#fff", border: "none", borderRadius: "4px", padding: "10px 16px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },
  secondaryBtn: { background: "#fff", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 14px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },

  tabHeader: { display: "flex", gap: "10px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" },
  tabBtn: { background: "none", border: "none", color: "#64748b", fontSize: "0.85rem", fontWeight: 600, padding: "8px 16px", cursor: "pointer", outline: "none" },
  tabBtnActive: { color: "#0038a8", borderBottom: "2px solid #0038a8" },

  attendanceConsole: { display: "flex", gap: "20px", background: "#f8fafc", padding: "20px", borderRadius: "4px", border: "1px solid #e2e8f0" },
  radarCard: { flex: 0.8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" },

  form: { background: "#f8fafc", padding: "20px", borderRadius: "4px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" },
  formRow: { display: "flex", gap: "10px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1.5px", color: "#111625", textTransform: "uppercase" },
  input: { padding: "8px 12px", fontSize: "0.82rem", color: "#111625", border: "1px solid #e2e8f0", borderRadius: "4px", background: "#fff", outline: "none" },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, color: "#64748b", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "left", letterSpacing: "1px" },
  tr: { borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" },
  trActive: { background: "#f1f5f9" },
  td: { padding: "12px 16px", fontSize: "0.8rem", color: "#111625" },
  badge: { fontSize: "0.68rem", fontWeight: 600, padding: "3px 8px", borderRadius: "20px", display: "inline-block" },
  empty: { color: "#94a3b8", fontSize: "0.82rem", textAlign: "center", padding: "30px" },

  detailPanel: { flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px", minWidth: "350px", maxHeight: "100vh", overflowY: "auto" },
  emptyDetail: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "0.85rem", padding: "40px", textAlign: "center" },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "16px" },
  muted: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1px", color: "#64748b", textTransform: "uppercase" },
  detailNo: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "#111625", marginTop: "4px" },

  descBox: { background: "#f8fafc", padding: "16px", borderRadius: "4px", border: "1px solid #e2e8f0", marginBottom: "20px" },
  timelineBox: { border: "1px solid #e2e8f0", borderRadius: "4px", padding: "16px", marginBottom: "20px", background: "#fcfcfd" }
};
