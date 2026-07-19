import { Component } from "react";
import PermissionManager from "./pages/PermissionManager";
import { AppProvider } from "./context/AppContext";
import { useApp } from "./context/appContextCore";
import AssetManagement from "./pages/AssetManagement";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import Checklist from "./pages/Checklist";
import GenericPage from "./pages/GenericPage";
import PurchaseRequisition from "./pages/PurchaseRequisition";
import InventoryManagement from "./pages/InventoryManagement";
import PPMScheduler from "./pages/PPMScheduler";
import VisitorManagement from "./pages/VisitorManagement";
import Attendance from "./pages/Attendance";
import Reports from "./pages/Reports";
import AutomationSettings from "./pages/AutomationSettings";
import AdminConsoleSettings from "./pages/AdminConsoleSettings";
import EnergyMonitoring from "./pages/EnergyMonitoring";
import VendorManagement from "./pages/VendorManagement";
import GuestHouseManagement from "./pages/GuestHouseManagement";
import AssetDashboard from "./pages/AssetDashboard";
import MaintenanceDashboard from "./pages/MaintenanceDashboard";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "sans-serif" }}>
          <h2 style={{ margin: "0 0 10px 0" }}>SetuOne Application Alert</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "20px" }}>
            {this.state.error?.message || "A temporary error occurred while rendering the view."}
          </p>
          <button 
            onClick={() => { 
              if (window.history && window.history.replaceState) {
                window.history.replaceState(null, "", window.location.pathname);
              }
              window.location.href = window.location.origin; 
            }} 
            style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
          >
            Return to Login / Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { session, activeView } = useApp();

  if (!session) return <LoginPage />;

  const renderView = () => {
    switch (activeView) {
      case "dashboard": return <Dashboard />;
      case "maintenance_dashboard": return <MaintenanceDashboard />;
      case "asset_dashboard": return <AssetDashboard />;
      case "checklist": return <Checklist />;
      case "tickets": return <Tickets />;
      
      // IT Assets Hierarchical Views
      case "it_assets": return <AssetManagement defaultDivision="IT Assets" />;
      case "laptop": return <AssetManagement defaultDivision="IT Assets" defaultCategory="Laptop" />;
      case "desktop": return <AssetManagement defaultDivision="IT Assets" defaultCategory="Desktop" />;
      case "monitor": return <AssetManagement defaultDivision="IT Assets" defaultCategory="Monitor" />;
      case "printer": return <AssetManagement defaultDivision="IT Assets" defaultCategory="Printer" />;
      case "networking": return <AssetManagement defaultDivision="IT Assets" defaultCategory="Networking" />;
      case "cctv": return <AssetManagement defaultDivision="IT Assets" defaultCategory="CCTV" />;
      
      // Facility Assets Hierarchical Views
      case "facility_assets": return <AssetManagement defaultDivision="Facility Assets" />;
      case "hvac": return <AssetManagement defaultDivision="Facility Assets" defaultCategory="HVAC" />;
      case "electrical": return <AssetManagement defaultDivision="Facility Assets" defaultCategory="Electrical" />;
      case "machinery": return <AssetManagement defaultDivision="Facility Assets" defaultCategory="Machinery" />;
      case "furniture": return <AssetManagement defaultDivision="Facility Assets" defaultCategory="Furniture" />;
      case "vehicles": return <AssetManagement defaultDivision="Facility Assets" defaultCategory="Vehicles" />;
      case "safety": return <AssetManagement defaultDivision="Facility Assets" defaultCategory="Safety Equipment" />;
      case "others": return <AssetManagement defaultDivision="Facility Assets" defaultCategory="Others" />;

      case "purchasereq_form": return <PurchaseRequisition viewMode="purchasereq_form" />;
      case "purchase": return <PurchaseRequisition viewMode="pr" />;
      case "workorders": return <PurchaseRequisition viewMode="po" />;
      case "grn": return <PurchaseRequisition viewMode="grn" />;
      case "vendors": return <VendorManagement />;
      case "inventory": return <InventoryManagement />;
      case "ppm": return <PPMScheduler />;
      case "visitors": return <VisitorManagement />;
      case "attendance": return <Attendance />;
      case "reports": return <Reports />;
      case "automation": return <AutomationSettings />;
      case "admin_console": return <AdminConsoleSettings />;
      case "energy": return <EnergyMonitoring />;
      case "property_dashboard": return <GuestHouseManagement defaultFilter="Dashboard" />;
      case "properties_all": return <GuestHouseManagement defaultFilter="All" />;
      case "properties_active": return <GuestHouseManagement defaultFilter="Active" />;
      case "properties_inactive": return <GuestHouseManagement defaultFilter="Inactive" />;
      case "landlord_agreements": return <GuestHouseManagement defaultFilter="Agreements" />;
      case "permission_manager": return <PermissionManager />;
      case "admin_roles": return <GenericPage view="roles" />;
      default: return <GenericPage view={activeView} />;
    }
  };

  return <Layout>{renderView()}</Layout>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

