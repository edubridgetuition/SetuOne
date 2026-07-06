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

function AppContent() {
  const { session, activeView } = useApp();

  if (!session) return <LoginPage />;

  const renderView = () => {
    switch (activeView) {
      case "dashboard": return <Dashboard />;
      case "tickets": return <Tickets />;
      case "checklist": return <Checklist />;
      case "assets": return <AssetManagement />;
      case "purchase": return <PurchaseRequisition />;
      case "inventory": return <InventoryManagement />;
      case "ppm": return <PPMScheduler />;
      case "visitors": return <VisitorManagement />;
      case "attendance": return <Attendance />;
      case "reports": return <Reports />;
      case "automation": return <AutomationSettings />;
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

