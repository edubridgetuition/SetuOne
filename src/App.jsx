import { AppProvider } from "./context/AppContext";
import { useApp } from "./context/AppContext";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import Checklist from "./pages/Checklist";
import GenericPage from "./pages/GenericPage";

function AppContent() {
  const { session, activeView } = useApp();

  if (!session) return <LoginPage />;

  const renderView = () => {
    switch (activeView) {
      case "dashboard": return <Dashboard />;
      case "tickets": return <Tickets />;
      case "checklist": return <Checklist />;
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