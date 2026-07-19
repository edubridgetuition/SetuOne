import { useEffect, useMemo, useState } from "react";
import { AppContext } from "./appContextCore";
import { demoUsers, tenants, rolePermissions } from "../data/appData";
import { 
  getCurrentSession, 
  fetchUserProfile, 
  login as authLogin, 
  logout as authLogout,
  register as authRegister,
  sendPasswordResetOtp as authSendResetOtp,
  verifyOtpAndResetPassword as authVerifyOtpResetPassword,
  fetchTickets,
  fetchLocations,
  fetchAssignees,
  createTicket as apiCreateTicket,
  updateTicket as apiUpdateTicket,
  fetchAssets as apiFetchAssets,
  fetchAssetDetails as apiFetchAssetDetails,
  fetchAssetMetadata as apiFetchAssetMetadata,
  createAsset as apiCreateAsset,
  updateAsset as apiUpdateAsset,
  archiveAsset as apiArchiveAsset,
  assignAsset as apiAssignAsset,
  returnAsset as apiReturnAsset,
  transferAsset as apiTransferAsset,
  changeAssetStatus as apiChangeAssetStatus,
  uploadAssetDocument as apiUploadAssetDocument,
  importAssets as apiImportAssets,
  logAssetTransfer as apiLogAssetTransfer,
  
  // Purchase imports
  fetchPurchaseRequests as apiFetchPurchaseRequests,
  createPurchaseRequest as apiCreatePurchaseRequest,
  updatePRStatus as apiUpdatePRStatus,
  fetchQuotations as apiFetchQuotations,
  submitQuotationComparison as apiSubmitQuotationComparison,
  fetchPurchaseOrders as apiFetchPurchaseOrders,
  
  // Inventory imports
  fetchInventoryItems as apiFetchInventoryItems,
  createInventoryItem as apiCreateInventoryItem,
  updateInventoryItem as apiUpdateInventoryItem,
  fetchStockBalances as apiFetchStockBalances,
  logInventoryTransaction as apiLogInventoryTransaction,
  stockAdjustment as apiStockAdjustment,
  fetchGRNs as apiFetchGRNs,
  createGRN as apiCreateGRN,
  approveGRN as apiApproveGRN,
  fetchInvoices as apiFetchInvoices,
  createInvoice as apiCreateInvoice,
  fetchPayments as apiFetchPayments,
  recordPayment as apiRecordPayment,
  fetchInventoryTransactions as apiFetchInventoryTransactions,
  deleteInventoryTransaction as apiDeleteInventoryTransaction,
  updateInventoryTransaction as apiUpdateInventoryTransaction,

  // Maintenance imports
  fetchChecklistTemplates as apiFetchChecklistTemplates,
  fetchChecklistSchedules as apiFetchChecklistSchedules,
  submitChecklist as apiSubmitChecklist,
  fetchPPMSchedules as apiFetchPPMSchedules,
  createPPMSchedule as apiCreatePPMSchedule,
  updatePPMStatus as apiUpdatePPMStatus,
  fetchAMCExpirations as apiFetchAMCExpirations,
  renewAMC as apiRenewAMC,

  // Visitor imports
  fetchVisitors as apiFetchVisitors,
  checkInVisitor as apiCheckInVisitor,
  checkOutVisitor as apiCheckOutVisitor,
  uploadVisitorPhoto as apiUploadVisitorPhoto,
  searchVisitors as apiSearchVisitors,

  // Attendance imports
  fetchShifts as apiFetchShifts,
  fetchUserAttendance as apiFetchUserAttendance,
  fetchAttendanceHistory as apiFetchAttendanceHistory,
  fetchBranchAttendanceSummary as apiFetchBranchAttendanceSummary,
  clockIn as apiClockIn,
  clockOut as apiClockOut,
  updateDutyStatus as apiUpdateDutyStatus,
  requestRegularization as apiRequestRegularization,
  approveRegularization as apiApproveRegularization,
  rejectRegularization as apiRejectRegularization,

  // Report imports
  fetchDashboardKPIs as apiFetchDashboardKPIs,
  fetchAttendanceReport as apiFetchAttendanceReport,
  fetchTicketReport as apiFetchTicketReport,
  fetchInventoryReport as apiFetchInventoryReport,
  fetchAssetReport as apiFetchAssetReport,
  fetchVisitorReport as apiFetchVisitorReport,
  fetchPurchaseReport as apiFetchPurchaseReport,
  fetchPPMReport as apiFetchPPMReport,
  fetchSavedFilters as apiFetchSavedFilters,
  saveReportFilter as apiSaveReportFilter,
  generateReportTemplate as apiGenerateReportTemplate,
  scheduleReport as apiScheduleReport,
  exportReport as apiExportReport,

  // Notification imports
  fetchNotifications as apiFetchNotifications,
  markNotificationAsRead as apiMarkNotificationAsRead,
  fetchNotificationRules as apiFetchNotificationRules,
  saveNotificationRule as apiSaveNotificationRule,
  fetchRecipientGroups as apiFetchRecipientGroups,
  saveRecipientGroup as apiSaveRecipientGroup,
  fetchEmailTemplates as apiFetchEmailTemplates,
  saveEmailTemplate as apiSaveEmailTemplate,
  fetchNotificationChannels as apiFetchNotificationChannels,
  fetchNotificationPreferences as apiFetchNotificationPreferences,
  saveNotificationPreference as apiSaveNotificationPreference,
  fetchAutomationLogs as apiFetchAutomationLogs,
  dispatchNotification as apiDispatchNotification,

  // Admin settings imports
  fetchSystemSettings as apiFetchSystemSettings,
  updateSystemSettings as apiUpdateSystemSettings,
  fetchBrandingSettings as apiFetchBrandingSettings,
  updateBrandingSettings as apiUpdateBrandingSettings,
  fetchMasterDefinitions as apiFetchMasterDefinitions,
  saveMasterDefinition as apiSaveMasterDefinition,
  saveMasterValue as apiSaveMasterValue,
  deleteMasterValue as apiDeleteMasterValue,
  fetchNumberSeries as apiFetchNumberSeries,
  saveNumberSeries as apiSaveNumberSeries,
  fetchApprovalWorkflows as apiFetchApprovalWorkflows,
  saveApprovalWorkflow as apiSaveApprovalWorkflow,
  fetchFeatureFlags as apiFetchFeatureFlags,
  saveFeatureFlag as apiSaveFeatureFlag,
  fetchHolidayCalendar as apiFetchHolidayCalendar,
  saveHoliday as apiSaveHoliday,
  fetchWorkingDays as apiFetchWorkingDays,
  saveWorkingDays as apiSaveWorkingDays,
  fetchCustomFieldDefinitions as apiFetchCustomFieldDefinitions,
  saveCustomFieldDefinition as apiSaveCustomFieldDefinition,
  fetchAuditLogs as apiFetchAuditLogs,
  writeAuditLog as apiWriteAuditLog,
  fetchNotificationTemplates as apiFetchNotificationTemplates,
  saveNotificationTemplate as apiSaveNotificationTemplate,
  fetchRecurringJobs as apiFetchRecurringJobs,
  saveRecurringJob as apiSaveRecurringJob,
  fetchSystemRoles as apiFetchSystemRoles,
  fetchCompanyRolePermissions as apiFetchCompanyRolePermissions,
  saveRolePermissions as apiSaveRolePermissions,

  // Dashboard Builder imports
fetchAvailableWidgets as apiFetchAvailableWidgets,
fetchUserDashboardLayout as apiFetchUserDashboardLayout,
saveDashboardLayout as apiSaveDashboardLayout,
resetDashboardLayout as apiResetDashboardLayout,
duplicateDashboard as apiDuplicateDashboard,
fetchWidgetData as apiFetchWidgetData,
createDashboardWidget as apiCreateDashboardWidget,
updateDashboardWidget as apiUpdateDashboardWidget,
archiveDashboardWidget as apiArchiveDashboardWidget,

// Energy imports
fetchMeters as apiFetchMeters,
fetchMeterDetails as apiFetchMeterDetails,
fetchReadings as apiFetchReadings,
uploadMeterImage as apiUploadMeterImage,
processOCR as apiProcessOCR,
confirmReading as apiConfirmReading,
calculateConsumption as apiCalculateConsumption,
fetchConsumptionHistory as apiFetchConsumptionHistory,
updateEnergyReading as apiUpdateEnergyReading,
deleteEnergyReading as apiDeleteEnergyReading,
updateEnergyMeter as apiUpdateEnergyMeter,
checkDuplicateHash as apiCheckDuplicateHash
} from "../lib";

import { supabase } from "../lib/supabase";

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [activeTenant, setActiveTenant] = useState("orion");
  const [activeRole, setActiveRole] = useState("Employee");
  const [activeView, setActiveView] = useState("dashboard");
  const [tickets, setTickets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [assignees, setAssignees] = useState([]);
  
  // Asset Management States
  const [assets, setAssets] = useState([]);
  const [totalAssetsCount, setTotalAssetsCount] = useState(0);
  const [assetMetadata, setAssetMetadata] = useState(null);
  
  // Purchase & Inventory States
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [stockBalances, setStockBalances] = useState([]);
  const [grns, setGrns] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [inventoryTransactions, setInventoryTransactions] = useState([]);

  // Maintenance States
  const [checklistTemplates, setChecklistTemplates] = useState([]);
  const [checklistSchedules, setChecklistSchedules] = useState([]);
  const [ppmSchedules, setPpmSchedules] = useState([]);
  const [amcContracts, setAmcContracts] = useState([]);

  // Visitor States
  const [visitors, setVisitors] = useState([]);

  // Attendance States
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [attendanceBranchSummary, setAttendanceBranchSummary] = useState([]);
  const [shiftsList, setShiftsList] = useState([]);

  // Report States
  const [dashboardKPIs, setDashboardKPIs] = useState(null);
  const [savedFilters, setSavedFilters] = useState([]);

  // Notification States
  const [inboxNotifications, setInboxNotifications] = useState([]);
  const [rulesList, setRulesList] = useState([]);
  const [recipientGroups, setRecipientGroups] = useState([]);
  const [emailTemplatesList, setEmailTemplatesList] = useState([]);
  const [notificationChannels, setNotificationChannels] = useState([]);
  const [notificationPreferences, setNotificationPreferences] = useState([]);
  const [automationLogsList, setAutomationLogsList] = useState([]);

  // Admin Settings States
  const [systemSettings, setSystemSettings] = useState(null);
  const [brandingSettings, setBrandingSettings] = useState(null);
  const [masterDefinitionsList, setMasterDefinitionsList] = useState([]);
  const [numberSeriesList, setNumberSeriesList] = useState([]);
  const [approvalWorkflowsList, setApprovalWorkflowsList] = useState([]);
  const [featureFlagsList, setFeatureFlagsList] = useState([]);
  const [holidayCalendarList, setHolidayCalendarList] = useState([]);
  const [workingDaysData, setWorkingDaysData] = useState(null);
  const [customFieldDefinitionsList, setCustomFieldDefinitionsList] = useState([]);
  const [auditLogsList, setAuditLogsList] = useState([]);
  const [notificationTemplatesList, setNotificationTemplatesList] = useState([]);
  const [recurringSchedulerJobsList, setRecurringSchedulerJobsList] = useState([]);
  const [systemRolesList, setSystemRolesList] = useState([]);
  const [dynamicRolePermissionsList, setDynamicRolePermissionsList] = useState([]);

  // Dashboard Builder States
  const [dashboardWidgetsList, setDashboardWidgetsList] = useState([]);
  const [activeDashboardLayout, setActiveDashboardLayout] = useState(null);

  // Energy States
  const [energyMeters, setEnergyMeters] = useState([]);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [meterReadings, setMeterReadings] = useState([]);
  const [consumptionHistory, setConsumptionHistory] = useState([]);
  const [energyDashboard, setEnergyDashboard] = useState(null);
  
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize Session on Page Load & Detect Reset Password Tokens
  useEffect(() => {
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    const resetRequested = sessionStorage.getItem("setuone_reset_requested") === "true";

    if (resetRequested || hash.includes("access_token") || hash.includes("type=recovery") || hash.includes("type=magiclink") || search.includes("type=recovery") || search.includes("code=")) {
      setShowResetPasswordModal(true);
      sessionStorage.removeItem("setuone_reset_requested");
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setShowResetPasswordModal(true);
      }
    });

    async function initSession() {
      try {
        const sessionRes = await getCurrentSession();
        if (sessionRes.success && sessionRes.data && sessionRes.data.user) {
          await applyUserSession(sessionRes.data);
        }
      } catch (err) {
        console.error("Init session error:", err);
      } finally {
        setLoading(false);
      }
    }
    initSession();

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Fetch live ticket items, locations list, and staff members dynamically on login session success
  useEffect(() => {
    if (!session) return;
    
    async function loadTicketsData() {
      try {
        const res = await fetchTickets();
        if (res && res.success) setTickets(res.data);
      } catch (e) { console.warn("fetchTickets error:", e); }

      try {
        const res = await fetchLocations();
        if (res && res.success) setLocations(res.data);
      } catch (e) { console.warn("fetchLocations error:", e); }

      try {
        const res = await fetchAssignees();
        if (res && res.success) setAssignees(res.data);
      } catch (e) { console.warn("fetchAssignees error:", e); }

      try { if (typeof loadMasterDefinitions === "function") await loadMasterDefinitions(); } catch (e) {}
      try { if (typeof loadCustomFieldDefinitions === "function") await loadCustomFieldDefinitions(); } catch (e) {}
      try { if (typeof loadMeters === "function") await loadMeters(); } catch (e) {}
    }

    loadTicketsData();
  }, [session]);

  async function applyUserSession(authSession) {
    if (!authSession || !authSession.user) return;

    try {
      const profileRes = await fetchUserProfile(authSession.user.id);
      
      if (profileRes.success && profileRes.data) {
        const profile = profileRes.data;
        setSession({ 
          id: profile.id,
          email: authSession.user.email, 
          name: profile.full_name,
          companyId: profile.company_id,
          companyName: profile.companies?.name || "Orion Corporate Park",
          branchId: profile.branch_id,
          departmentId: profile.department_id,
          tenantId: profile.companies?.tenant_id
        });
        setActiveRole(profile.roles?.name || "Employee");
        setActiveTenant(profile.companies?.tenant_id ? "orion" : "orion");
      } else {
        const user = demoUsers[authSession.user?.email];
        if (user) {
          setSession({ 
            email: authSession.user.email, 
            name: user.name,
            companyName: "Orion Corporate Park"
          });
          setActiveTenant(user.tenant);
          setActiveRole(user.role);
        } else {
        // Dynamic fallback using Supabase Auth raw user metadata
        let resolvedCompanyId = authSession.user.user_metadata?.company_id || null;
        let resolvedCompanyName = authSession.user.user_metadata?.company_name || "Orion Corporate Park";
        
        // Fetch live company fallback
        try {
          // 1. Try to get it from purchase_requests
          const { data: prs } = await supabase.from('purchase_requests').select('company_id').limit(1);
          if (prs && prs.length > 0 && prs[0].company_id) {
            resolvedCompanyId = prs[0].company_id;
          }
          
          // 2. Try to get it from vendors
          if (!resolvedCompanyId) {
            const { data: vends } = await supabase.from('vendors').select('company_id').limit(1);
            if (vends && vends.length > 0 && vends[0].company_id) {
              resolvedCompanyId = vends[0].company_id;
            }
          }
          
          // 3. Try to get it from companies table
          if (!resolvedCompanyId) {
            const { data: cos } = await supabase.from('companies').select('id, name').limit(1);
            if (cos && cos.length > 0) {
              resolvedCompanyId = cos[0].id;
              resolvedCompanyName = cos[0].name;
            }
          }
        } catch (e) {
          console.warn("Error resolving fallback company:", e);
        }

        if (!resolvedCompanyId) {
          resolvedCompanyId = "7e85d57c-2dcd-4943-9066-6467c5bb10e4";
          resolvedCompanyName = "On2Cook Pvt Ltd";
        }

        let resolvedBranchId = null;
        try {
          const { data: brs } = await supabase.from('branches').select('id').eq('company_id', resolvedCompanyId).limit(1);
          if (brs && brs.length > 0) {
            resolvedBranchId = brs[0].id;
          } else {
            resolvedBranchId = "fea717ef-95da-443f-a0ac-cab8be2995f5";
          }
        } catch (e) {
          resolvedBranchId = "fea717ef-95da-443f-a0ac-cab8be2995f5";
        }

        const fallbackRoleName = authSession.user.user_metadata?.role || "Admin Manager";
        
        // Try creating/insuring the profile in public.profiles to satisfy foreign keys
        try {
          const { data: rData } = await supabase.from('roles').select('id').eq('name', fallbackRoleName).maybeSingle();
          const roleId = rData?.id || "d41d8ba7-4d70-4651-9a76-429319eed00a"; // Super Admin default
          
          const { error: insErr } = await supabase.from('profiles').insert({
            id: authSession.user.id,
            email: authSession.user.email,
            full_name: authSession.user.user_metadata?.full_name || authSession.user.email.split('@')[0],
            role_id: roleId,
            company_id: resolvedCompanyId,
            branch_id: resolvedBranchId
          });
          if (insErr) {
            console.error("Profile insert failed:", insErr);
            alert("Self-healing profile setup error: " + insErr.message);
          }
        } catch (err) {
          console.warn("Profile setup exception:", err);
          alert("Self-healing profile exception: " + err.message);
        }

        setSession({
          id: authSession.user.id,
          email: authSession.user.email,
          name: authSession.user.user_metadata?.full_name || authSession.user.email.split('@')[0],
          companyId: resolvedCompanyId,
          companyName: resolvedCompanyName,
          branchId: null,
          departmentId: null,
          tenantId: "orion"
        });
        setActiveRole(fallbackRoleName);
        setActiveTenant("orion");
      }
    }
  } catch (err) {
    console.error("applyUserSession error:", err);
  }
}

  async function login(email, password, enteredCompanyName) {
    const loginRes = await authLogin(email, password);
    if (loginRes.success) {
      // Validate company if provided
      if (enteredCompanyName) {
        const profileRes = await fetchUserProfile(loginRes.data.session.user.id);
        if (profileRes.success && profileRes.data) {
          const userCompany = profileRes.data.companies?.name || "";
          if (userCompany.toLowerCase().trim() !== enteredCompanyName.toLowerCase().trim()) {
            await authLogout();
            return { success: false, message: `Access Denied: Your account is not registered under '${enteredCompanyName}'.` };
          }
        }
      }
      await applyUserSession(loginRes.data.session);
      return { success: true };
    }
    return { success: false, message: loginRes.message || "Invalid email or password. Please try again." };
  }

  async function signup(email, password, fullName, companyName, role) {
    return await authRegister(email, password, fullName, companyName, role);
  }

  async function logout() {
    await authLogout();
    setSession(null);
    setActiveView("dashboard");
  }

  async function sendPasswordResetOtp(email) {
    return await authSendResetOtp(email);
  }

  async function verifyOtpAndResetPassword(email, token, newPassword) {
    return await authVerifyOtpResetPassword(email, token, newPassword);
  }

  function canAccessRaw(view) {
    if (["Super Admin", "Admin Manager"].includes(activeRole) && [
      "property_management", 
      "property_dashboard",
      "asset_dashboard",
      "maintenance_dashboard",
      "properties_all", 
      "properties_active", 
      "properties_inactive", 
      "landlord_agreements",
      "admin_setup",
      "permission_manager",
      "admin_roles"
    ].includes(view)) {
      return true;
    }

    const saved = localStorage.getItem("setuone_company_permissions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const companyKey = activeTenant === "orion" ? "orion" : "greenfield";
        const rolePerms = parsed?.[companyKey]?.[activeRole];
        if (rolePerms) {
          return rolePerms.includes(view);
        }
      } catch (e) {
        console.error("Permission check error:", e);
      }
    }
    return (rolePermissions[activeRole] || []).includes(view);
  }

  function canAccess(view) {
    const itKeys = ["it_assets", "assets_it", "mobile", "sim", "laptop", "desktop", "monitor", "printer", "networking", "cctv"];
    const facilityKeys = ["facility_assets", "assets_facility", "hvac", "electrical", "machinery", "furniture", "vehicles", "safety", "others"];
    if (itKeys.includes(view)) {
      return canAccessRaw("assets") || canAccessRaw("itasset");
    }
    if (facilityKeys.includes(view)) {
      return canAccessRaw("assets") || canAccessRaw("hvac");
    }
    if (view === "grn" || view === "purchasereq_form") {
      return canAccessRaw("purchase") || canAccessRaw("workorders") || canAccessRaw("grn") || canAccessRaw("purchasereq_form");
    }
    return canAccessRaw(view);
  }

  // API wrappers to raise a ticket
  async function createTicket(ticketData) {
    if (!session) {
      console.error("createTicket failed: No session available");
      alert("No active session found. Please sign in again.");
      return null;
    }
    const userSession = {
      id: session.id,
      companyId: session.companyId
    };
    
    console.log("Attempting to create ticket with payload:", ticketData, "User Session:", userSession);
    const res = await apiCreateTicket(ticketData, userSession);
    
    if (res.success) {
      const ticketsRes = await fetchTickets();
      if (ticketsRes.success) setTickets(ticketsRes.data);
      return res.data;
    }
    
    console.error("apiCreateTicket failed:", res.message, res.error);
    alert("Database Error raising ticket: " + res.message);
    return null;
  }

  // API wrappers to transition workflows
  async function updateTicket(ticketId, updates, remarks = "") {
    if (!session) {
      console.error("updateTicket failed: No session available");
      alert("No active session found.");
      return null;
    }
    
    console.log("Attempting to update ticket:", ticketId, "Updates:", updates, "Remarks:", remarks);
    const res = await apiUpdateTicket(ticketId, updates, remarks, session.id);
    
    if (res.success) {
      const ticketsRes = await fetchTickets();
      if (ticketsRes.success) setTickets(ticketsRes.data);
      return res.data;
    }
    
    console.error("apiUpdateTicket failed:", res.message, res.error);
    alert("Database Error updating ticket: " + res.message);
    return null;
  }

  // ASSETS ACTIONS & STATES PIPELINE
  async function loadAssets(filters = {}, page = 1, pageSize = 10) {
    if (!session) return;
    const res = await apiFetchAssets(filters, page, pageSize);
    if (res.success) {
      setAssets(res.data.assets);
      setTotalAssetsCount(res.data.totalCount);
    }
    return res;
  }

  async function loadAssetDetails(assetId) {
    return await apiFetchAssetDetails(assetId);
  }

  async function loadAssetMetadata() {
    if (!session) return;
    const res = await apiFetchAssetMetadata();
    if (res.success) {
      setAssetMetadata(res.data);
    }
    return res;
  }

  async function createAsset(assetData) {
    if (!session) return null;
    const res = await apiCreateAsset(assetData, session.tenantId);
    if (res.success) {
      await loadAssets({}, 1, 10);
      return res.data;
    } else {
      alert("Error registering asset: " + res.message);
    }
    return null;
  }

  async function updateAsset(assetId, updates) {
    const res = await apiUpdateAsset(assetId, updates);
    if (res.success) {
      await loadAssets({}, 1, 10);
      return res.data;
    } else {
      alert("Error updating asset: " + res.message);
    }
    return null;
  }

  async function archiveAsset(assetId) {
    const res = await apiArchiveAsset(assetId);
    if (res.success) {
      await loadAssets({}, 1, 10);
      return res.data;
    } else {
      alert("Error archiving asset: " + res.message);
    }
    return null;
  }

  async function assignAsset(assetId, profileId, remarks = "") {
    const res = await apiAssignAsset(assetId, profileId, remarks);
    if (res.success) {
      await loadAssets({}, 1, 10);
      return res.data;
    } else {
      alert("Error assigning asset: " + res.message);
    }
    return null;
  }

  async function returnAsset(assetId, remarks = "") {
    const res = await apiReturnAsset(assetId, remarks);
    if (res.success) {
      await loadAssets({}, 1, 10);
      return res.data;
    } else {
      alert("Error returning asset: " + res.message);
    }
    return null;
  }

  async function transferAsset(assetId, targetProfileId, remarks = "") {
    const res = await apiTransferAsset(assetId, targetProfileId, remarks);
    if (res.success) {
      await loadAssets({}, 1, 10);
      return res.data;
    } else {
      alert("Error transferring asset: " + res.message);
    }
    return null;
  }

  async function logAssetTransfer(transferData) {
    const res = await apiLogAssetTransfer(transferData);
    if (res.success) {
      await loadAssets({}, 1, 10);
      return res.data;
    } else {
      alert("Error logging asset transfer: " + res.message);
    }
    return null;
  }

  async function changeAssetStatus(assetId, status) {
    const res = await apiChangeAssetStatus(assetId, status);
    if (res.success) {
      await loadAssets({}, 1, 10);
      return res.data;
    } else {
      alert("Error changing status: " + res.message);
    }
    return null;
  }

  async function uploadAssetDocument(assetId, category, fileName, fileBlob) {
    if (!session) return null;
    const tenantId = session.companyId; // Using company_id as tenant boundary context
    const res = await apiUploadAssetDocument(assetId, category, fileName, fileBlob, tenantId);
    return res;
  }

  async function importAssets(assetsArray) {
    if (!session) return null;
    const res = await apiImportAssets(assetsArray, session.tenantId);
    if (res.success) {
      await loadAssets({}, 1, 10);
    }
    return res;
  }

  // PURCHASE REQUISITIONS PIPELINE
  async function loadPurchaseRequests() {
    if (!session) return;
    const res = await apiFetchPurchaseRequests();
    if (res.success) {
      setPurchaseRequests(res.data);
    }
    return res;
  }

  async function createPurchaseRequest(prData) {
    if (!session) return { success: false, message: "No active session." };
    const res = await apiCreatePurchaseRequest(prData, session.companyId, session.id);
    if (res.success) {
      await loadPurchaseRequests();
      return {
        ...res.data,
        success: true,
        data: res.data,
        message: res.message || "PR created successfully."
      };
    } else {
      alert("Error creating PR: " + res.message);
      return {
        success: false,
        message: res.message
      };
    }
  }

  async function updatePRStatus(prId, status) {
    const res = await apiUpdatePRStatus(prId, status);
    if (res.success) {
      await loadPurchaseRequests();
    } else {
      alert("Error updating PR status: " + res.message);
    }
    return res;
  }

  async function loadQuotations(requestId) {
    return await apiFetchQuotations(requestId);
  }

  async function submitQuotationComparison(requestId, selectedQuoteId, remarks = "") {
    const res = await apiSubmitQuotationComparison(requestId, selectedQuoteId, remarks);
    if (res.success) {
      await loadPurchaseRequests();
      await loadPurchaseOrders();
    } else {
      alert("Comparison failed: " + res.message);
    }
    return res;
  }

  async function loadPurchaseOrders() {
    if (!session) return;
    const res = await apiFetchPurchaseOrders();
    if (res.success) {
      setPurchaseOrders(res.data);
    }
    return res;
  }

  // INVENTORY PIPELINE
  async function loadInventoryItems() {
    if (!session) return;
    const res = await apiFetchInventoryItems(session.companyId);
    if (res.success) {
      setInventoryItems(res.data);
    }
    return res;
  }

  async function createInventoryItem(itemData) {
    if (!session) return null;
    const res = await apiCreateInventoryItem(itemData, session.companyId);
    if (res.success) {
      await loadInventoryItems();
      return res.data;
    } else {
      alert("Item registration failed: " + res.message);
    }
    return null;
  }

  async function updateInventoryItem(itemId, updates) {
    const res = await apiUpdateInventoryItem(itemId, updates);
    if (res.success) {
      await loadInventoryItems();
    } else {
      alert("Update failed: " + res.message);
    }
    return res;
  }

  async function loadStockBalances(branchId) {
    if (!session) return;
    const res = await apiFetchStockBalances(branchId || session.branchId);
    if (res.success) {
      setStockBalances(res.data);
    }
    return res;
  }

  async function loadInventoryTransactions(branchId) {
    if (!session) return;
    const res = await apiFetchInventoryTransactions(branchId || session.branchId);
    if (res.success) {
      setInventoryTransactions(res.data);
    }
    return res;
  }

  async function logStockTransaction(itemId, branchId, type, quantity, referenceId = null, customDate = null) {
    const targetBranch = branchId || session.branchId;
    const res = await apiLogInventoryTransaction(itemId, targetBranch, type, quantity, referenceId, customDate);
    if (res.success) {
      await loadStockBalances(targetBranch);
      await loadInventoryTransactions(targetBranch);
    }
    return res;
  }

  async function deleteInventoryTransaction(txId, branchId) {
    const targetBranch = branchId || session.branchId;
    const res = await apiDeleteInventoryTransaction(txId);
    if (res.success) {
      await loadStockBalances(targetBranch);
      await loadInventoryTransactions(targetBranch);
    }
    return res;
  }

  async function updateInventoryTransaction(txId, updates, branchId) {
    const targetBranch = branchId || session.branchId;
    const res = await apiUpdateInventoryTransaction(txId, updates);
    if (res.success) {
      await loadStockBalances(targetBranch);
      await loadInventoryTransactions(targetBranch);
    }
    return res;
  }

  async function stockAdjustment(itemId, branchId, quantity, reason, approvedBy) {
    const targetBranch = branchId || session.branchId;
    const res = await apiStockAdjustment(itemId, targetBranch, quantity, reason, approvedBy);
    if (res.success) {
      await loadStockBalances(targetBranch);
      await loadInventoryTransactions(targetBranch);
    } else {
      alert("Adjustment failed: " + res.message);
    }
    return res;
  }

  async function loadGRNs() {
    if (!session) return;
    const res = await apiFetchGRNs();
    if (res.success) {
      setGrns(res.data);
    }
    return res;
  }

  async function createGRN(poId, items) {
    if (!session) return null;
    const res = await apiCreateGRN(poId, session.id, items);
    if (res.success) {
      await loadGRNs();
      return res.data;
    } else {
      alert("GRN creation failed: " + res.message);
    }
    return null;
  }

  async function approveGRN(grnId, branchId) {
    const targetBranch = branchId || session.branchId;
    const res = await apiApproveGRN(grnId, targetBranch);
    if (res.success) {
      await loadGRNs();
      await loadStockBalances(targetBranch);
      await loadInventoryTransactions(targetBranch);
    } else {
      alert("GRN verification failed: " + res.message);
    }
    return res;
  }

  async function loadInvoices() {
    if (!session) return;
    const res = await apiFetchInvoices();
    if (res.success) {
      setInvoices(res.data);
    }
    return res;
  }

  async function createInvoice(poId, invoiceNo, amount, dueDate, items) {
    const res = await apiCreateInvoice(poId, invoiceNo, amount, dueDate, items);
    if (res.success) {
      await loadInvoices();
      return res.data;
    } else {
      alert("Invoice creation failed: " + res.message);
    }
    return null;
  }

  async function loadPayments() {
    if (!session) return;
    const res = await apiFetchPayments();
    if (res.success) {
      setPayments(res.data);
    }
    return res;
  }

  async function recordPayment(invoiceId, amountPaid, reference, mode) {
    const res = await apiRecordPayment(invoiceId, amountPaid, reference, mode);
    if (res.success) {
      await loadPayments();
      await loadInvoices();
      return res.data;
    } else {
      alert("Payment recording failed: " + res.message);
    }
    return res;
  }

  // MAINTENANCE ACTIONS & STATES PIPELINE
  async function loadChecklistTemplates() {
    if (!session) return;
    const res = await apiFetchChecklistTemplates();
    if (res.success) {
      setChecklistTemplates(res.data);
    }
    return res;
  }

  async function loadChecklistSchedules(filters = {}) {
    if (!session) return;
    const res = await apiFetchChecklistSchedules(filters);
    if (res.success) {
      setChecklistSchedules(res.data);
    }
    return res;
  }

  async function submitChecklist(scheduleId, status, remarks) {
    if (!session) return null;
    const res = await apiSubmitChecklist(scheduleId, status, remarks, session.id);
    if (res.success) {
      await loadChecklistSchedules();
    } else {
      alert("Checklist update failed: " + res.message);
    }
    return res;
  }

  async function loadPPMSchedules() {
    if (!session) return;
    const res = await apiFetchPPMSchedules();
    if (res.success) {
      setPpmSchedules(res.data);
    }
    return res;
  }

  async function createPPMSchedule(ppmData) {
    if (!session) return null;
    const res = await apiCreatePPMSchedule(ppmData, session.companyId);
    if (res.success) {
      await loadPPMSchedules();
      return res.data;
    } else {
      alert("PPM creation failed: " + res.message);
    }
    return null;
  }

  async function updatePPMStatus(ppmId, status, updates = {}) {
    if (!session) return null;
    const res = await apiUpdatePPMStatus(ppmId, status, updates, session.id);
    if (res.success) {
      await loadPPMSchedules();
      await loadStockBalances(session.branchId); // targeted refresh of spares stock levels
      await loadInventoryTransactions(session.branchId);
    } else {
      alert("PPM status update failed: " + res.message);
    }
    return res;
  }

  async function loadAMCContracts() {
    if (!session) return;
    const res = await apiFetchAMCExpirations();
    if (res.success) {
      setAmcContracts(res.data);
    }
    return res;
  }

  async function renewAMC(vendorId, newExpiryDate, newContractValue) {
    const res = await apiRenewAMC(vendorId, newExpiryDate, newContractValue);
    if (res.success) {
      await loadAMCContracts();
    } else {
      alert("AMC renewal failed: " + res.message);
    }
    return res;
  }

  // VISITORS ACTIONS & STATES PIPELINE
  async function loadVisitors() {
    if (!session) return;
    const res = await apiFetchVisitors();
    if (res.success) {
      setVisitors(res.data);
    }
    return res;
  }

  async function checkInVisitor(visitorData) {
    if (!session) return null;
    const res = await apiCheckInVisitor(visitorData, session.companyId);
    if (res.success) {
      await loadVisitors();
      return res.data;
    } else {
      alert("Check-in failed: " + res.message);
    }
    return null;
  }

  async function checkOutVisitor(visitorId, remarks = "") {
    const res = await apiCheckOutVisitor(visitorId, remarks);
    if (res.success) {
      await loadVisitors();
      return res.data;
    } else {
      alert("Check-out failed: " + res.message);
    }
    return null;
  }

  async function uploadVisitorPhoto(visitorId, photoBase64) {
    const res = await apiUploadVisitorPhoto(visitorId, photoBase64);
    if (res.success) {
      await loadVisitors();
    }
    return res;
  }

  async function searchVisitors(queryStr) {
    const res = await apiSearchVisitors(queryStr);
    if (res.success) {
      setVisitors(res.data);
    }
    return res;
  }

  // ATTENDANCE ACTIONS & STATES PIPELINE
  async function loadShifts() {
    const res = await apiFetchShifts();
    if (res.success) {
      setShiftsList(res.data);
    }
    return res;
  }

  async function loadUserAttendanceStatus() {
    if (!session) return;
    const res = await apiFetchUserAttendance(session.id);
    if (res.success) {
      setAttendanceToday(res.data);
    }
    return res;
  }

  async function loadAttendanceHistory() {
    if (!session) return;
    const res = await apiFetchAttendanceHistory(session.id);
    if (res.success) {
      setAttendanceHistory(res.data);
    }
    return res;
  }

  async function loadBranchAttendanceSummary() {
    if (!session) return;
    const res = await apiFetchBranchAttendanceSummary(session.branchId);
    if (res.success) {
      setAttendanceBranchSummary(res.data);
    }
    return res;
  }

  async function clockIn(shiftName, coords, isVerified, method = 'GPS', manualReason = null) {
    if (!session) return null;
    const res = await apiClockIn(session.id, shiftName, coords, isVerified, method, manualReason);
    if (res.success) {
      await loadUserAttendanceStatus();
      await loadAttendanceHistory();
    } else {
      alert("Clock-in failed: " + res.message);
    }
    return res;
  }

  async function clockOut(method = 'GPS', manualReason = null) {
    if (!attendanceToday) return null;
    const res = await apiClockOut(attendanceToday.id, method, manualReason);
    if (res.success) {
      await loadUserAttendanceStatus();
      await loadAttendanceHistory();
    } else {
      alert("Clock-out failed: " + res.message);
    }
    return res;
  }

  async function updateDutyStatus(status) {
    if (!attendanceToday) return null;
    const res = await apiUpdateDutyStatus(attendanceToday.id, status);
    if (res.success) {
      await loadUserAttendanceStatus();
    }
    return res;
  }

  async function requestRegularization(attendanceId, reason) {
    const res = await apiRequestRegularization(attendanceId, reason);
    if (res.success) {
      await loadAttendanceHistory();
    } else {
      alert("Regularization request failed: " + res.message);
    }
    return res;
  }

  async function approveRegularization(attendanceId) {
    if (!session) return null;
    const res = await apiApproveRegularization(attendanceId, session.id);
    if (res.success) {
      await loadBranchAttendanceSummary();
    } else {
      alert("Approval failed: " + res.message);
    }
    return res;
  }

  async function rejectRegularization(attendanceId) {
    if (!session) return null;
    const res = await apiRejectRegularization(attendanceId, session.id);
    if (res.success) {
      await loadBranchAttendanceSummary();
    } else {
      alert("Rejection failed: " + res.message);
    }
    return res;
  }

  // REPORT ACTIONS & STATES PIPELINE
  async function loadDashboardKPIs() {
    if (!session) return;
    const res = await apiFetchDashboardKPIs(session.id, session.branchId);
    if (res.success) {
      setDashboardKPIs(res.data);
    }
    return res;
  }

  async function loadSavedFilters() {
    if (!session) return;
    const res = await apiFetchSavedFilters(session.id);
    if (res.success) {
      setSavedFilters(res.data);
    }
    return res;
  }

  async function saveFilter(filterName, reportType, payload) {
    if (!session) return null;
    const res = await apiSaveReportFilter(session.id, filterName, reportType, payload);
    if (res.success) {
      await loadSavedFilters();
    }
    return res;
  }

  async function createTemplate(templateName, reportType, configPayload) {
    if (!session) return null;
    return await apiGenerateReportTemplate(session.companyId, templateName, reportType, configPayload);
  }

  // NOTIFICATION ACTIONS & STATES PIPELINE
  async function loadInboxNotifications() {
    if (!session) return;
    const res = await apiFetchNotifications(session.id);
    if (res.success) {
      setInboxNotifications(res.data);
    }
    return res;
  }

  async function markRead(id) {
    const res = await apiMarkNotificationAsRead(id);
    if (res.success) {
      await loadInboxNotifications();
    }
    return res;
  }

  async function triggerInboxNotification(title, message) {
    if (!session) return;
    const { error } = await supabase
      .from('notifications')
      .insert({
        profile_id: session.id,
        title,
        message,
        is_read: false
      });
    if (!error) {
      await loadInboxNotifications();
    }
  }

  async function loadNotificationRules() {
    if (!session) return;
    const res = await apiFetchNotificationRules(session.companyId);
    if (res.success) {
      setRulesList(res.data);
    }
    return res;
  }

  async function saveRule(ruleData) {
    if (!session) return null;
    const res = await apiSaveNotificationRule(ruleData, session.companyId);
    if (res.success) {
      await loadNotificationRules();
    }
    return res;
  }

  async function loadRecipientGroups() {
    if (!session) return;
    const res = await apiFetchRecipientGroups(session.companyId);
    if (res.success) {
      setRecipientGroups(res.data);
    }
    return res;
  }

  async function saveGroup(groupData) {
    if (!session) return null;
    const res = await apiSaveRecipientGroup(groupData, session.companyId);
    if (res.success) {
      await loadRecipientGroups();
    }
    return res;
  }

  async function loadEmailTemplates() {
    if (!session) return;
    const res = await apiFetchEmailTemplates(session.companyId);
    if (res.success) {
      setEmailTemplatesList(res.data);
    }
    return res;
  }

  async function saveTemplate(templateData) {
    if (!session) return null;
    const res = await apiSaveEmailTemplate(templateData, session.companyId);
    if (res.success) {
      await loadEmailTemplates();
    }
    return res;
  }

  async function loadChannels() {
    const res = await apiFetchNotificationChannels();
    if (res.success) {
      setNotificationChannels(res.data);
    }
    return res;
  }

  async function loadPreferences() {
    if (!session) return;
    const res = await apiFetchNotificationPreferences(session.id);
    if (res.success) {
      setNotificationPreferences(res.data);
    }
    return res;
  }

  async function updatePreference(channelId, isEnabled) {
    if (!session) return null;
    const res = await apiSaveNotificationPreference(session.id, channelId, isEnabled);
    if (res.success) {
      await loadPreferences();
    }
    return res;
  }

  async function loadAutomationLogs() {
    if (!session) return;
    const res = await apiFetchAutomationLogs(session.companyId);
    if (res.success) {
      setAutomationLogsList(res.data);
    }
    return res;
  }

  // ADMIN CONSOLE ACTIONS & STATES PIPELINE
  async function loadSystemSettings() {
    if (!session) return;
    const res = await apiFetchSystemSettings(session.companyId);
    if (res.success) {
      setSystemSettings(res.data);
    }
    return res;
  }

  async function saveSystemSettings(settings) {
    if (!session) return null;
    const res = await apiUpdateSystemSettings(settings, session.companyId);
    if (res.success) {
      await loadSystemSettings();
      await apiWriteAuditLog({
        module: 'System Settings',
        tableName: 'public.system_settings',
        recordId: res.data.id,
        action: 'UPDATE',
        newData: res.data,
        changedBy: session.id
      }, session.companyId);
    }
    return res;
  }

  async function loadBrandingSettings() {
    if (!session) return;
    const res = await apiFetchBrandingSettings(session.companyId);
    if (res.success) {
      setBrandingSettings(res.data);
    }
    return res;
  }

  async function saveBrandingSettings(branding) {
    if (!session) return null;
    const res = await apiUpdateBrandingSettings(branding, session.companyId);
    if (res.success) {
      await loadBrandingSettings();
      await apiWriteAuditLog({
        module: 'Branding Settings',
        tableName: 'public.branding_settings',
        recordId: res.data.id,
        action: 'UPDATE',
        newData: res.data,
        changedBy: session.id
      }, session.companyId);
    }
    return res;
  }

  async function loadMasterDefinitions() {
    if (!session) return;
    const res = await apiFetchMasterDefinitions(session.companyId);
    if (res.success) {
      setMasterDefinitionsList(res.data);
    }
    return res;
  }

  async function createMasterDefinition(masterData) {
    if (!session) return null;
    const res = await apiSaveMasterDefinition(masterData, session.companyId);
    if (res.success) {
      await loadMasterDefinitions();
    }
    return res;
  }

  async function createMasterValue(valueData) {
    const res = await apiSaveMasterValue(valueData);
    if (res.success) {
      await loadMasterDefinitions();
    }
    return res;
  }

  async function loadNumberSeries() {
    if (!session) return;
    const res = await apiFetchNumberSeries(session.companyId);
    if (res.success) {
      setNumberSeriesList(res.data);
    }
    return res;
  }

  async function saveNumberSeries(seriesData) {
    const res = await apiSaveNumberSeries(seriesData);
    if (res.success) {
      await loadNumberSeries();
    }
    return res;
  }

  async function loadApprovalWorkflows() {
    if (!session) return;
    const res = await apiFetchApprovalWorkflows(session.companyId);
    if (res.success) {
      setApprovalWorkflowsList(res.data);
    }
    return res;
  }

  async function saveApprovalWorkflow(workflowData) {
    if (!session) return null;
    const res = await apiSaveApprovalWorkflow(workflowData, session.companyId);
    if (res.success) {
      await loadApprovalWorkflows();
    }
    return res;
  }

  async function loadFeatureFlags() {
    if (!session) return;
    const res = await apiFetchFeatureFlags(session.companyId);
    if (res.success) {
      setFeatureFlagsList(res.data);
    }
    return res;
  }

  async function toggleFeatureFlag(flagId, isEnabled) {
    const res = await apiSaveFeatureFlag(flagId, isEnabled);
    if (res.success) {
      await loadFeatureFlags();
    }
    return res;
  }

  async function loadHolidayCalendar() {
    if (!session) return;
    const res = await apiFetchHolidayCalendar(session.companyId);
    if (res.success) {
      setHolidayCalendarList(res.data);
    }
    return res;
  }

  async function createHoliday(holidayData) {
    if (!session) return null;
    const res = await apiSaveHoliday(holidayData, session.companyId);
    if (res.success) {
      await loadHolidayCalendar();
    }
    return res;
  }

  async function loadWorkingDays() {
    if (!session) return;
    const res = await apiFetchWorkingDays(session.companyId);
    if (res.success) {
      setWorkingDaysData(res.data);
    }
    return res;
  }

  async function saveWorkingDays(daysArray) {
    if (!session) return null;
    const res = await apiSaveWorkingDays(daysArray, session.companyId);
    if (res.success) {
      await loadWorkingDays();
    }
    return res;
  }

  async function loadCustomFieldDefinitions() {
    if (!session) return;
    const res = await apiFetchCustomFieldDefinitions(session.companyId);
    if (res.success) {
      setCustomFieldDefinitionsList(res.data);
    }
    return res;
  }

  async function saveCustomField(fieldData) {
    if (!session) return null;
    const res = await apiSaveCustomFieldDefinition(fieldData, session.companyId);
    if (res.success) {
      await loadCustomFieldDefinitions();
    }
    return res;
  }

  async function loadAuditLogs() {
    if (!session) return;
    const res = await apiFetchAuditLogs(session.companyId);
    if (res.success) {
      setAuditLogsList(res.data);
    }
    return res;
  }

  async function loadNotificationTemplates() {
    if (!session) return;
    const res = await apiFetchNotificationTemplates(session.companyId);
    if (res.success) {
      setNotificationTemplatesList(res.data);
    }
    return res;
  }

  async function saveNotificationTemplate(templateData) {
    if (!session) return null;
    const res = await apiSaveNotificationTemplate(templateData, session.companyId);
    if (res.success) {
      await loadNotificationTemplates();
    }
    return res;
  }

  async function loadRecurringSchedulerJobs() {
    if (!session) return;
    const res = await apiFetchRecurringJobs(session.companyId);
    if (res.success) {
      setRecurringSchedulerJobsList(res.data);
    }
    return res;
  }

  async function saveRecurringSchedulerJob(jobData) {
    if (!session) return null;
    const res = await apiSaveRecurringJob(jobData, session.companyId);
    if (res.success) {
      await loadRecurringSchedulerJobs();
    }
    return res;
  }

  // DASHBOARD BUILDER API PIPELINE
  async function loadDashboardWidgets() {
    const res = await apiFetchAvailableWidgets();
    if (res.success) {
      setDashboardWidgetsList(res.data);
    }
    return res;
  }
  async function createDashboardWidget(widgetData) {
    const res = await apiCreateDashboardWidget(widgetData);
    if (res.success && session) {
      await loadDashboardWidgets();
      await apiWriteAuditLog({
        module: 'Dashboard Catalog',
        tableName: 'public.dashboard_widgets',
        recordId: res.data.id,
        action: 'INSERT',
        newData: res.data,
        changedBy: session.id
      }, session.companyId);
    }
    return res;
  }

  async function updateDashboardWidget(widgetId, updates) {
    const res = await apiUpdateDashboardWidget(widgetId, updates);
    if (res.success && session) {
      await loadDashboardWidgets();
      await apiWriteAuditLog({
        module: 'Dashboard Catalog',
        tableName: 'public.dashboard_widgets',
        recordId: res.data.id,
        action: 'UPDATE',
        newData: res.data,
        changedBy: session.id
      }, session.companyId);
    }
    return res;
  }

  async function archiveDashboardWidget(widgetId) {
    const res = await apiArchiveDashboardWidget(widgetId);
    if (res.success && session) {
      await loadDashboardWidgets();
      await apiWriteAuditLog({
        module: 'Dashboard Catalog',
        tableName: 'public.dashboard_widgets',
        recordId: res.data.id,
        action: 'SOFT_DELETE_ARCHIVE',
        newData: res.data,
        changedBy: session.id
      }, session.companyId);
    }
    return res;
  }
  
  async function loadUserDashboardLayout() {
    if (!session) return null;
    const res = await apiFetchUserDashboardLayout(
      session.companyId, 
      activeRole, 
      session.departmentId, 
      session.id
    );
    if (res.success) {
      setActiveDashboardLayout(res.data);
    }
    return res;
  }

  async function saveUserDashboardLayout(layouts) {
    if (!session) return null;
    const res = await apiSaveDashboardLayout(
      session.companyId, 
      activeRole, 
      session.departmentId, 
      session.id, 
      layouts
    );
    if (res.success) {
      await loadUserDashboardLayout();
      await apiWriteAuditLog({
        module: 'Dashboard Builder',
        tableName: 'public.dashboard_layouts',
        recordId: res.data.id,
        action: 'UPDATE',
        newData: res.data,
        changedBy: session.id
      }, session.companyId);
    }
    return res;
  }

  async function resetUserDashboardLayout() {
    if (!activeDashboardLayout) return null;
    const res = await apiResetDashboardLayout(activeDashboardLayout.id);
    if (res.success) {
      await loadUserDashboardLayout();
    }
    return res;
  }

  async function duplicateDashboardLayout(targetRoleName) {
    if (!activeDashboardLayout || !session) return null;
    return await apiDuplicateDashboard(activeDashboardLayout.id, targetRoleName, session.companyId);
  }

  async function fetchWidgetDataPayload(widgetKey) {
    if (!session) return null;
    return await apiFetchWidgetData(widgetKey, session.companyId);
  }

  // Energy Actions
  async function loadMeters() {
    if (!session) return;
    const res = await apiFetchMeters(session.companyId);
    if (res.success) {
      setEnergyMeters(res.data || []);
      if (res.data && res.data.length > 0 && !selectedMeter) {
        setSelectedMeter(res.data[0]);
      }
    }
  }

  async function loadReadings(meterId) {
    const res = await apiFetchReadings(meterId);
    if (res.success) {
      setMeterReadings(res.data || []);
    }
  }

  async function uploadMeterImage(file) {
    return await apiUploadMeterImage(file);
  }

  async function confirmReading(readingData) {
    if (!session) return { success: false, message: "No active session." };
    const payload = {
      ...readingData,
      uploaded_by: session.id
    };
    const res = await apiConfirmReading(payload);
    if (res.success) {
      await loadReadings(readingData.meter_id);
      await loadConsumption(readingData.meter_id);
      await apiWriteAuditLog({
        module: 'Energy Monitoring',
        tableName: 'public.energy_meter_readings',
        recordId: res.data.id,
        action: 'INSERT',
        newData: res.data,
        changedBy: session.id
      }, session.companyId);
    }
    return res;
  }

  async function loadConsumption(meterId = null) {
    if (!session) return;
    const res = await apiFetchConsumptionHistory(session.companyId, meterId);
    if (res.success) {
      setConsumptionHistory(res.data || []);
    }
  }

  async function updateEnergyReading(readingId, updates) {
    if (!session) return { success: false, message: "No active session." };
    const payload = {
      ...updates,
      edited_by: session.id,
      edited_at: new Date().toISOString()
    };
    const res = await apiUpdateEnergyReading(readingId, payload);
    if (res.success && selectedMeter) {
      await loadReadings(selectedMeter.id);
      await loadConsumption(selectedMeter.id);
      await apiWriteAuditLog({
        module: 'Energy Monitoring',
        tableName: 'public.energy_meter_readings',
        recordId: res.data.id,
        action: 'UPDATE',
        newData: res.data,
        changedBy: session.id
      }, session.companyId);
    }
    return res;
  }

  async function deleteEnergyReading(readingId) {
    if (!session) return { success: false, message: "No active session." };
    const res = await apiDeleteEnergyReading(readingId);
    if (res.success && selectedMeter) {
      await loadReadings(selectedMeter.id);
      await loadConsumption(selectedMeter.id);
      await apiWriteAuditLog({
        module: 'Energy Monitoring',
        tableName: 'public.energy_meter_readings',
        recordId: readingId,
        action: 'DELETE',
        changedBy: session.id
      }, session.companyId);
    }
    return res;
  }

  async function updateEnergyMeter(meterId, updates) {
    if (!session) return { success: false, message: "No active session." };
    const res = await apiUpdateEnergyMeter(meterId, updates);
    if (res.success) {
      await loadMeters();
      if (selectedMeter && selectedMeter.id === meterId) {
        setSelectedMeter(res.data);
      }
      await apiWriteAuditLog({
        module: 'Energy Monitoring',
        tableName: 'public.energy_meters',
        recordId: meterId,
        action: 'UPDATE',
        newData: res.data,
        changedBy: session.id
      }, session.companyId);
    }
    return res;
  }

  async function checkDuplicateHash(hash) {
    if (!session) return { success: false, message: "No active session." };
    return await apiCheckDuplicateHash(hash);
  }

  const tenantData = useMemo(() => tenants[activeTenant], [activeTenant]);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center", color:"#6366f1", fontSize:"16px" }}>
      Loading SetuOne...
    </div>
  );

  return (
    <AppContext.Provider value={{ 
      session, activeTenant, setActiveTenant, activeRole, setActiveRole, 
      activeView, setActiveView, tickets, locations, assignees, tenantData, 
      login, signup, logout, sendPasswordResetOtp, verifyOtpAndResetPassword, showResetPasswordModal, setShowResetPasswordModal, canAccess, createTicket, updateTicket,
      
      // Asset values
      assets, totalAssetsCount, assetMetadata, loadAssets, loadAssetDetails,
      loadAssetMetadata, createAsset, updateAsset, archiveAsset, assignAsset,
      returnAsset, transferAsset, logAssetTransfer, changeAssetStatus, uploadAssetDocument, importAssets,
      
      // Purchase & Inventory values
      purchaseRequests, purchaseOrders, inventoryItems, stockBalances, grns, invoices, payments, inventoryTransactions,
      loadPurchaseRequests, createPurchaseRequest, updatePRStatus, loadQuotations, submitQuotationComparison,
      loadPurchaseOrders, loadInventoryItems, createInventoryItem, updateInventoryItem, loadStockBalances, loadInventoryTransactions,
      logStockTransaction, deleteInventoryTransaction, updateInventoryTransaction, stockAdjustment, loadGRNs, createGRN, approveGRN, loadInvoices, createInvoice,
      loadPayments, recordPayment,

      // Maintenance values
      checklistTemplates, checklistSchedules, ppmSchedules, amcContracts,
      loadChecklistTemplates, loadChecklistSchedules, submitChecklist, loadPPMSchedules,
      createPPMSchedule, updatePPMStatus, loadAMCContracts, renewAMC,

      // Visitor values
      visitors, loadVisitors, checkInVisitor, checkOutVisitor, uploadVisitorPhoto, searchVisitors,

      // Attendance values
      attendanceToday, attendanceHistory, attendanceBranchSummary, shiftsList,
      loadShifts, loadUserAttendanceStatus, loadAttendanceHistory, loadBranchAttendanceSummary,
      clockIn, clockOut, updateDutyStatus, requestRegularization, approveRegularization, rejectRegularization,

      // Report values
      dashboardKPIs, savedFilters,
      loadDashboardKPIs, loadSavedFilters, saveFilter, createTemplate,
      fetchAttendanceReport: apiFetchAttendanceReport,
      fetchTicketReport: apiFetchTicketReport,
      fetchInventoryReport: apiFetchInventoryReport,
      fetchAssetReport: apiFetchAssetReport,
      fetchVisitorReport: apiFetchVisitorReport,
      fetchPurchaseReport: apiFetchPurchaseReport,
      fetchPPMReport: apiFetchPPMReport,
      exportReport: apiExportReport,
      scheduleReport: apiScheduleReport,

      // Notification values
      inboxNotifications, rulesList, recipientGroups, emailTemplatesList, notificationChannels, notificationPreferences, automationLogsList,
      loadInboxNotifications, markRead, triggerInboxNotification, loadNotificationRules, saveRule, loadRecipientGroups, saveGroup,
      loadEmailTemplates, saveTemplate, loadChannels, loadPreferences, updatePreference, loadAutomationLogs,
      dispatchNotification: apiDispatchNotification,

      // Admin Settings values
      systemSettings, brandingSettings, masterDefinitionsList, numberSeriesList, approvalWorkflowsList, featureFlagsList, holidayCalendarList, workingDaysData, customFieldDefinitionsList, auditLogsList, notificationTemplatesList, recurringSchedulerJobsList,
      loadSystemSettings, saveSystemSettings, loadBrandingSettings, saveBrandingSettings, loadMasterDefinitions, createMasterDefinition, createMasterValue, loadNumberSeries, saveNumberSeries, loadApprovalWorkflows, saveApprovalWorkflow, loadFeatureFlags, toggleFeatureFlag, loadHolidayCalendar, createHoliday, loadWorkingDays, saveWorkingDays, loadCustomFieldDefinitions, saveCustomField, loadAuditLogs, loadNotificationTemplates, saveNotificationTemplate, loadRecurringSchedulerJobs, saveRecurringSchedulerJob,

       // Dashboard Builder values
      dashboardWidgetsList, activeDashboardLayout,
      loadDashboardWidgets, loadUserDashboardLayout, saveUserDashboardLayout, resetUserDashboardLayout, duplicateDashboardLayout, fetchWidgetDataPayload,
      createDashboardWidget, updateDashboardWidget, archiveDashboardWidget,

      // Energy values
      energyMeters, selectedMeter, setSelectedMeter, meterReadings, consumptionHistory, energyDashboard,
      loadMeters, loadReadings, uploadMeterImage, confirmReading, loadConsumption, updateEnergyReading, deleteEnergyReading, updateEnergyMeter, checkDuplicateHash
    }}>
      {children}
    </AppContext.Provider>
  );
}
