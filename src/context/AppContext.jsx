import { useEffect, useMemo, useState } from "react";
import { AppContext } from "./appContextCore";
import { demoUsers, tenants, rolePermissions } from "../data/appData";
import { 
  getCurrentSession, 
  fetchUserProfile, 
  login as authLogin, 
  logout as authLogout,
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
  dispatchNotification as apiDispatchNotification
} from "../lib";

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
  
  const [loading, setLoading] = useState(true);

  // Initialize Session on Page Load
  useEffect(() => {
    async function initSession() {
      const sessionRes = await getCurrentSession();
      if (sessionRes.success && sessionRes.data) {
        await applyUserSession(sessionRes.data);
      }
      setLoading(false);
    }
    initSession();
  }, []);

  // Fetch live ticket items, locations list, and staff members dynamically on login session success
  useEffect(() => {
    if (!session) return;
    
    async function loadTicketsData() {
      const [ticketsRes, locationsRes, assigneesRes] = await Promise.all([
        fetchTickets(),
        fetchLocations(),
        fetchAssignees()
      ]);

      if (ticketsRes.success) setTickets(ticketsRes.data);
      if (locationsRes.success) setLocations(locationsRes.data);
      if (assigneesRes.success) setAssignees(assigneesRes.data);
    }

    loadTicketsData();
  }, [session]);

  async function applyUserSession(authSession) {
    const profileRes = await fetchUserProfile(authSession.user.id);
    
    if (profileRes.success && profileRes.data) {
      const profile = profileRes.data;
      setSession({ 
        id: profile.id,
        email: authSession.user.email, 
        name: profile.full_name,
        companyId: profile.company_id,
        branchId: profile.branch_id,
        tenantId: profile.companies?.tenant_id
      });
      setActiveRole(profile.roles?.name || "Employee");
      setActiveTenant(profile.companies?.tenant_id ? "orion" : "orion");
    } else {
      const user = demoUsers[authSession.user.email];
      if (user) {
        setSession({ email: authSession.user.email, name: user.name });
        setActiveTenant(user.tenant);
        setActiveRole(user.role);
      }
    }
  }

  async function login(email, password) {
    const loginRes = await authLogin(email, password);
    if (loginRes.success) {
      await applyUserSession(loginRes.data.session);
      return true;
    }
    return false;
  }

  async function logout() {
    await authLogout();
    setSession(null);
    setActiveView("dashboard");
  }

  function canAccess(view) {
    return (rolePermissions[activeRole] || []).includes(view);
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
    if (!session) return null;
    const res = await apiCreatePurchaseRequest(prData, session.companyId, session.id);
    if (res.success) {
      await loadPurchaseRequests();
      return res.data;
    } else {
      alert("Error creating PR: " + res.message);
    }
    return null;
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
      login, logout, canAccess, createTicket, updateTicket,
      
      // Asset values
      assets, totalAssetsCount, assetMetadata, loadAssets, loadAssetDetails,
      loadAssetMetadata, createAsset, updateAsset, archiveAsset, assignAsset,
      returnAsset, transferAsset, changeAssetStatus, uploadAssetDocument, importAssets,
      
      // Purchase & Inventory values
      purchaseRequests, purchaseOrders, inventoryItems, stockBalances, grns, invoices, payments, inventoryTransactions,
      loadPurchaseRequests, createPurchaseRequest, updatePRStatus, loadQuotations, submitQuotationComparison,
      loadPurchaseOrders, loadInventoryItems, createInventoryItem, updateInventoryItem, loadStockBalances, loadInventoryTransactions,
      logStockTransaction, stockAdjustment, loadGRNs, createGRN, approveGRN, loadInvoices, createInvoice,
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
      loadInboxNotifications, markRead, loadNotificationRules, saveRule, loadRecipientGroups, saveGroup,
      loadEmailTemplates, saveTemplate, loadChannels, loadPreferences, updatePreference, loadAutomationLogs,
      dispatchNotification: apiDispatchNotification
    }}>
      {children}
    </AppContext.Provider>
  );
}
