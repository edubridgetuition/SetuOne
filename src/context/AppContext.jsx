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
  importAssets as apiImportAssets
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
      returnAsset, transferAsset, changeAssetStatus, uploadAssetDocument, importAssets
    }}>
      {children}
    </AppContext.Provider>
  );
}
