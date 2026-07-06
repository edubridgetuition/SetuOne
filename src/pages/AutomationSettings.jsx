import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";

const triggerColors = { "Time Based": "#6366f1", "Event Based": "#f59e0b" };

export default function AutomationSettings() {
  const {
    rulesList,
    loadNotificationRules,
    saveRule,
    recipientGroups,
    loadRecipientGroups,
    saveGroup,
    emailTemplatesList,
    loadEmailTemplates,
    saveTemplate,
    notificationChannels,
    loadChannels,
    notificationPreferences,
    loadPreferences,
    updatePreference,
    automationLogsList,
    loadAutomationLogs,
    dispatchNotification
  } = useApp();

  const [activeTab, setActiveTab] = useState("Rules");
  const [loading, setLoading] = useState(false);

  // Forms states
  const [ruleForm, setRuleForm] = useState({
    ruleName: "",
    triggerType: "Event Based",
    module: "Inventory",
    frequency: "Daily",
    eventId: "",
    recipientGroupId: "",
    templateId: "",
    conditionField: "closing_stock",
    conditionOperator: "<=",
    conditionValue: "reorder_level",
    isPaused: false,
    maintenanceMode: false
  });

  const [groupForm, setGroupForm] = useState({
    groupName: "",
    emailsText: ""
  });

  const [templateForm, setTemplateForm] = useState({
    templateName: "",
    templateKey: "",
    subject: "",
    bodyHtml: "",
    variablesText: ""
  });

  // Fetch configs
  useEffect(() => {
    loadNotificationRules();
    loadRecipientGroups();
    loadEmailTemplates();
    loadChannels();
    loadPreferences();
    loadAutomationLogs();
  }, []);

  async function handleAddRule(e) {
    e.preventDefault();
    const payload = {
      ...ruleForm,
      conditionPayload: {
        field: ruleForm.conditionField,
        operator: ruleForm.conditionOperator,
        value: ruleForm.conditionValue
      }
    };
    const res = await saveRule(payload);
    if (res && res.success) {
      alert("Automation rule configured successfully!");
      setRuleForm({
        ruleName: "",
        triggerType: "Event Based",
        module: "Inventory",
        frequency: "Daily",
        eventId: "",
        recipientGroupId: "",
        templateId: "",
        conditionField: "closing_stock",
        conditionOperator: "<=",
        conditionValue: "reorder_level",
        isPaused: false,
        maintenanceMode: false
      });
    }
  }

  async function handleAddGroup(e) {
    e.preventDefault();
    const emailArray = groupForm.emailsText.split(",").map(em => em.trim()).filter(Boolean);
    const res = await saveGroup({
      groupName: groupForm.groupName,
      emails: emailArray
    });
    if (res && res.success) {
      alert("Recipient group saved successfully!");
      setGroupForm({ groupName: "", emailsText: "" });
    }
  }

  async function handleAddTemplate(e) {
    e.preventDefault();
    const varsArray = templateForm.variablesText.split(",").map(v => v.trim()).filter(Boolean);
    const res = await saveTemplate({
      templateName: templateForm.templateName,
      templateKey: templateForm.templateKey,
      subject: templateForm.subject,
      bodyHtml: templateForm.bodyHtml,
      variables: varsArray
    });
    if (res && res.success) {
      alert("Email template created successfully!");
      setTemplateForm({ templateName: "", templateKey: "", subject: "", bodyHtml: "", variablesText: "" });
    }
  }

  async function togglePreference(channelId, currentVal) {
    await updatePreference(channelId, !currentVal);
  }

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.panel}>
          
          {/* Header & Tabs */}
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Automation & Notifications Desk</div>
              <div style={styles.panelSub}>Define compliance alerts, configure email template variables, and monitor cron scheduler dispatches.</div>
            </div>
          </div>

          <div style={styles.tabHeader}>
            {[
              { key: "Rules", label: "Automation Rules" },
              { key: "Templates", label: "Email Templates" },
              { key: "Recipient Groups", label: "Recipient Groups" },
              { key: "Preferences", label: "My Alerts Preferences" },
              { key: "Logs", label: "Automation Audit logs" }
            ].map(tab => (
              <button
                key={tab.key}
                style={{ ...styles.tabBtn, ...(activeTab === tab.key ? styles.tabBtnActive : {}) }}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: AUTOMATION RULES */}
          {activeTab === "Rules" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Add Rule Form */}
              <form onSubmit={handleAddRule} style={styles.form}>
                <div style={styles.panelTitle} style={{ fontSize: "0.85rem" }}>Configure New Rule</div>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Rule Name</label>
                    <input style={styles.input} required placeholder="Low stock alarm / AC PPM warning" value={ruleForm.ruleName} onChange={e => setRuleForm({ ...ruleForm, ruleName: e.target.value })} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Trigger type</label>
                    <select style={styles.input} value={ruleForm.triggerType} onChange={e => setRuleForm({ ...ruleForm, triggerType: e.target.value })}>
                      <option value="Event Based">Event Based</option>
                      <option value="Time Based">Time Based</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Target Module</label>
                    <select style={styles.input} value={ruleForm.module} onChange={e => setRuleForm({ ...ruleForm, module: e.target.value })}>
                      {["Inventory", "Ticket", "AMC", "PPM", "Attendance"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email Template</label>
                    <select style={styles.input} value={ruleForm.templateId} onChange={e => setRuleForm({ ...ruleForm, templateId: e.target.value })}>
                      <option value="">-- Choose Template --</option>
                      {emailTemplatesList.map(t => <option key={t.id} value={t.id}>{t.template_name}</option>)}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Recipient Group</label>
                    <select style={styles.input} value={ruleForm.recipientGroupId} onChange={e => setRuleForm({ ...ruleForm, recipientGroupId: e.target.value })}>
                      <option value="">-- Choose Group --</option>
                      {recipientGroups.map(g => <option key={g.id} value={g.id}>{g.group_name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Condition settings (Dynamic Rules builder logic) */}
                <div style={styles.descBox} style={{ marginTop: "10px" }}>
                  <div style={styles.label} style={{ marginBottom: "8px" }}>Condition Constraints (Rule Engine)</div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input style={{ ...styles.input, flex: 1 }} placeholder="Field (e.g. closing_stock)" value={ruleForm.conditionField} onChange={e => setRuleForm({ ...ruleForm, conditionField: e.target.value })} />
                    <select style={styles.input} value={ruleForm.conditionOperator} onChange={e => setRuleForm({ ...ruleForm, conditionOperator: e.target.value })}>
                      <option value="<=">&lt;=</option>
                      <option value=">=">&gt;=</option>
                      <option value="=">=</option>
                    </select>
                    <input style={{ ...styles.input, flex: 1 }} placeholder="Threshold (e.g. reorder_level)" value={ruleForm.conditionValue} onChange={e => setRuleForm({ ...ruleForm, conditionValue: e.target.value })} />
                  </div>
                </div>

                <button style={{ ...styles.primaryBtn, width: "200px", marginTop: "10px" }} type="submit">Activate Rule</button>
              </form>

              {/* Rules List */}
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["Rule Name", "Trigger", "Module", "Template", "Status"].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rulesList.map(rule => (
                      <tr key={rule.id} style={styles.tr}>
                        <td style={styles.td}><strong>{rule.rule_name}</strong></td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, background: triggerColors[rule.trigger_type] + "22", color: triggerColors[rule.trigger_type] }}>
                            {rule.trigger_type}
                          </span>
                        </td>
                        <td style={styles.td}>{rule.module}</td>
                        <td style={styles.td}>{rule.email_templates?.template_name || "Default Template"}</td>
                        <td style={styles.td}>{rule.is_active ? "🟢 Active" : "🔴 Inactive"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL TEMPLATES */}
          {activeTab === "Templates" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <form onSubmit={handleAddTemplate} style={styles.form}>
                <div style={styles.panelTitle} style={{ fontSize: "0.85rem" }}>Create Email Template</div>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Template Name</label>
                    <input style={styles.input} required placeholder="Low Stock Notification" value={templateForm.templateName} onChange={e => setTemplateForm({ ...templateForm, templateName: e.target.value })} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Unique Template Key</label>
                    <input style={styles.input} required placeholder="LOW_STOCK_TEMPLATE" value={templateForm.templateKey} onChange={e => setTemplateForm({ ...templateForm, templateKey: e.target.value })} />
                  </div>
                  <div style={styles.formGroup} style={{ gridColumn: "span 2" }}>
                    <label style={styles.label}>Email Subject</label>
                    <input style={styles.input} required placeholder="Warning: {{item_name}} stock is running low!" value={templateForm.subject} onChange={e => setTemplateForm({ ...templateForm, subject: e.target.value })} />
                  </div>
                </div>
                <div style={styles.formGroup} style={{ marginTop: "10px" }}>
                  <label style={styles.label}>HTML Template Body</label>
                  <textarea style={{ ...styles.input, height: "100px", resize: "none" }} required placeholder="Dear {{manager_name}}, please note that {{item_name}} balance is {{balance}}." value={templateForm.bodyHtml} onChange={e => setTemplateForm({ ...templateForm, bodyHtml: e.target.value })} />
                </div>
                <div style={styles.formGroup} style={{ marginTop: "10px" }}>
                  <label style={styles.label}>Dynamic Variables List (comma separated)</label>
                  <input style={styles.input} placeholder="manager_name, item_name, balance" value={templateForm.variablesText} onChange={e => setTemplateForm({ ...templateForm, variablesText: e.target.value })} />
                </div>
                <button style={{ ...styles.primaryBtn, width: "200px", marginTop: "10px" }} type="submit">Save Template</button>
              </form>

              {/* Templates List */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                {emailTemplatesList.map(temp => (
                  <div key={temp.id} style={styles.descBox}>
                    <div style={styles.panelTitle} style={{ fontSize: "0.82rem" }}>{temp.template_name}</div>
                    <div style={{ fontSize: "0.74rem", margin: "6px 0", color: "#64748b" }}>Key: <code>{temp.template_key}</code></div>
                    <div style={{ fontSize: "0.78rem" }}>Subject: <strong>{temp.subject}</strong></div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "10px" }}>Variables: {temp.variables?.join(", ") || "None"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RECIPIENT GROUPS */}
          {activeTab === "Recipient Groups" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <form onSubmit={handleAddGroup} style={styles.form}>
                <div style={styles.panelTitle} style={{ fontSize: "0.85rem" }}>Add Recipient Group</div>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Group Name</label>
                    <input style={styles.input} required placeholder="Facility Managers / Accounts Team" value={groupForm.groupName} onChange={e => setGroupForm({ ...groupForm, groupName: e.target.value })} />
                  </div>
                  <div style={styles.formGroup} style={{ gridColumn: "span 2" }}>
                    <label style={styles.label}>Emails List (comma separated)</label>
                    <input style={styles.input} required placeholder="admin@orion.com, manager@orion.com" value={groupForm.emailsText} onChange={e => setGroupForm({ ...groupForm, emailsText: e.target.value })} />
                  </div>
                </div>
                <button style={{ ...styles.primaryBtn, width: "150px", marginTop: "10px" }} type="submit">Save Group</button>
              </form>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                {recipientGroups.map(grp => (
                  <div key={grp.id} style={styles.descBox}>
                    <div style={styles.panelTitle} style={{ fontSize: "0.82rem" }}>{grp.group_name}</div>
                    <ul style={{ fontSize: "0.76rem", color: "#64748b", listStyle: "circle", marginLeft: "14px" }}>
                      {grp.emails?.map(email => <li key={email}>{email}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ALERTS PREFERENCES */}
          {activeTab === "Preferences" && (
            <div style={styles.descBox}>
              <div style={styles.panelTitle} style={{ fontSize: "0.85rem" }}>My Notification Preferences</div>
              <p style={{ fontSize: "0.78rem", color: "#64748b" }}>Choose which channels to activate for system-wide warnings.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                {notificationChannels.map(ch => {
                  // Check if enabled in preferences
                  const pref = notificationPreferences.find(p => p.channel_id === ch.id);
                  const isChecked = pref ? pref.is_enabled : ch.is_enabled;
                  return (
                    <label key={ch.id} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.85rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePreference(ch.id, isChecked)}
                      />
                      <div>
                        <strong>{ch.channel_name} Notifications</strong>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Route alerts via transactional {ch.channel_name} service.</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: AUTOMATION AUDIT LOGS */}
          {activeTab === "Logs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={styles.panelTitle} style={{ fontSize: "0.85rem" }}>Scheduler Executions Ledger</div>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["Time", "Rule Name", "Success", "Latency", "Channel", "Recipient"].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {automationLogsList.map(log => (
                      <tr key={log.id} style={styles.tr}>
                        <td style={styles.td}>{new Date(log.trigger_time).toLocaleTimeString()}</td>
                        <td style={styles.td}><strong>{log.generated_by_rule || "System Trigger"}</strong></td>
                        <td style={styles.td}>{log.success ? "🟢 Success" : "🔴 Failed"}</td>
                        <td style={styles.td}>{log.execution_time_ms} ms</td>
                        <td style={styles.td}>{log.channel}</td>
                        <td style={styles.td}>{log.recipient}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {automationLogsList.length === 0 && <div style={styles.empty}>No automation audit logs captured today.</div>}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Sidebar - Dispatch Simulator Panel */}
      <div style={styles.detailPanel}>
        <div style={styles.descBox} style={{ background: "#0f172a", color: "#38bdf8", padding: "20px" }}>
          <div style={styles.panelTitle} style={{ color: "#fff", fontSize: "0.85rem" }}>Automation Engine Cron Simulator</div>
          <p style={{ fontSize: "0.76rem", color: "#94a3b8", marginTop: "4px" }}>
            Supabase server background triggers simulation console. Execute queues priority schedules.
          </p>
          
          <button
            style={{ ...styles.primaryBtn, width: "100%", background: "#38bdf8", color: "#0f172a", marginTop: "12px", fontWeight: "bold" }}
            onClick={async () => {
              // Trigger a dummy queue check or list load
              await loadAutomationLogs();
              alert("Scheduler triggered! Dispatch queue checked.");
            }}
          >
            Trigger Scheduler Check
          </button>
        </div>
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

  form: { background: "#f8fafc", padding: "20px", borderRadius: "4px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1.5px", color: "#111625", textTransform: "uppercase" },
  input: { padding: "8px 12px", fontSize: "0.82rem", color: "#111625", border: "1px solid #e2e8f0", borderRadius: "4px", background: "#fff", outline: "none" },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, color: "#64748b", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "left", letterSpacing: "1px" },
  tr: { borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" },
  td: { padding: "12px 16px", fontSize: "0.8rem", color: "#111625" },
  badge: { fontSize: "0.68rem", fontWeight: 600, padding: "3px 8px", borderRadius: "20px", display: "inline-block" },
  empty: { color: "#94a3b8", fontSize: "0.82rem", textAlign: "center", padding: "30px" },

  detailPanel: { flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px", minWidth: "300px" },
  descBox: { background: "#f8fafc", padding: "16px", borderRadius: "4px", border: "1px solid #e2e8f0", marginBottom: "20px" },
  muted: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1px", color: "#64748b", textTransform: "uppercase" }
};
