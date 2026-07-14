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

function AppContent() {
  const { session, activeView } = useApp();

  if (!session) return <LoginPage />;

  const renderView = (activeView) => {
    switch (activeView) {
      case "dashboard": return <Dashboard />;
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
      default: return <GenericPage view={activeView} />;
    }
  };

  return <Layout>{renderView()}</Layout>;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

