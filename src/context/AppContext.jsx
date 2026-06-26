import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { demoUsers, defaultTickets, tenants, rolePermissions } from "../data/appData";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [activeTenant, setActiveTenant] = useState("orion");
  const [activeRole, setActiveRole] = useState("Super Admin");
  const [activeView, setActiveView] = useState("dashboard");
  const [tickets, setTickets] = useState(defaultTickets);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const user = demoUsers[session.user.email];
        if (user) {
          setSession({ email: session.user.email, name: user.name });
          setActiveTenant(user.tenant);
          setActiveRole(user.role);
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const user = demoUsers[session.user.email];
        if (user) {
          setSession({ email: session.user.email, name: user.name });
          setActiveTenant(user.tenant);
          setActiveRole(user.role);
        }
      } else {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return false;
    return true;
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setActiveView("dashboard");
  }

  function canAccess(view) {
    return (rolePermissions[activeRole] || []).includes(view);
  }

  function createTicket(ticket) {
    const newTicket = {
      no: `TKT-${1000 + tickets.length + 1}`,
      tenant: activeTenant,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
      completion: "Pending",
      beforePhoto: "Pending",
      afterPhoto: "Pending",
      timeline: [{ at: new Date().toLocaleString(), by: session?.name || activeRole, action: "Ticket created", remarks: ticket.description || "" }],
      ...ticket,
      status: "Open",
    };
    setTickets((prev) => [newTicket, ...prev]);
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center", color:"#6366f1", fontSize:"16px" }}>
      Loading SetuOne...
    </div>
  );

  return (
    <AppContext.Provider value={{ session, activeTenant, setActiveTenant, activeRole, setActiveRole, activeView, setActiveView, tickets, tenantData: tenants[activeTenant], login, logout, canAccess, createTicket }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}