import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { demoUsers, defaultTickets, tenants, rolePermissions } from "../data/appData";
import { fetchTickets, normalizeTicket, persistTicket, saveTicketsToLocal } from "../lib/ticketsRepository";
import { AppContext } from "./appContextCore";


export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [activeTenant, setActiveTenant] = useState("orion");
  const [activeRole, setActiveRole] = useState("Super Admin");
  const [activeView, setActiveView] = useState("dashboard");
  const [tickets, setTickets] = useState(defaultTickets.map((ticket) => normalizeTicket(ticket, "orion")));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) applyUserSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        applyUserSession(session);
      } else {
        setSession(null);
        setActiveView("dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    const fallback = defaultTickets.filter((ticket) => ticket.tenant === activeTenant);
    fetchTickets(activeTenant, fallback).then(setTickets);
  }, [session, activeTenant]);

  function applyUserSession(authSession) {
    const user = demoUsers[authSession.user.email];
    if (!user) return;

    setSession({ email: authSession.user.email, name: user.name });
    setActiveTenant(user.tenant);
    setActiveRole(user.role);
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setActiveView("dashboard");
  }

  function canAccess(view) {
    return (rolePermissions[activeRole] || []).includes(view);
  }

  function syncTickets(nextTickets) {
    setTickets(nextTickets);
    saveTicketsToLocal(activeTenant, nextTickets);
  }

  function createTicket(ticket) {
    const now = new Date().toLocaleString();
    const newTicket = normalizeTicket({
      no: `TKT-${1000 + tickets.length + 1}`,
      tenant: activeTenant,
      createdAt: now,
      updatedAt: now,
      completion: "Pending",
      beforePhoto: ticket.beforePhoto || "Pending",
      afterPhoto: "Pending",
      timeline: [{
        at: now,
        by: session?.name || activeRole,
        action: "Ticket created",
        remarks: ticket.description || "Complaint raised.",
      }],
      ...ticket,
      raisedBy: ticket.raisedBy || session?.name || activeRole,
      status: ticket.assignedTo && ticket.assignedTo !== "Unassigned" ? "Assigned" : "Open",
    }, activeTenant);

    const nextTickets = [newTicket, ...tickets];
    syncTickets(nextTickets);
    persistTicket(newTicket);
    return newTicket;
  }

  function updateTicket(ticketNo, updates, remarks = "") {
    const now = new Date().toLocaleString();
    let updatedTicket = null;

    const nextTickets = tickets.map((ticket) => {
      if (ticket.no !== ticketNo) return ticket;

      const action = updates.status && updates.status !== ticket.status
        ? `Status changed to ${updates.status}`
        : updates.assignedTo && updates.assignedTo !== ticket.assignedTo
          ? `Assigned to ${updates.assignedTo}`
          : "Ticket updated";

      updatedTicket = normalizeTicket({
        ...ticket,
        ...updates,
        updatedAt: now,
        completion: updates.status === "Closed" ? "Closed" : updates.status === "Completed" ? "Awaiting approval" : ticket.completion,
        timeline: [
          ...(ticket.timeline || []),
          { at: now, by: session?.name || activeRole, action, remarks: remarks || "No remarks added." },
        ],
      }, activeTenant);

      return updatedTicket;
    });

    syncTickets(nextTickets);
    if (updatedTicket) persistTicket(updatedTicket);
    return updatedTicket;
  }

  const tenantData = useMemo(() => tenants[activeTenant], [activeTenant]);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center", color:"#6366f1", fontSize:"16px" }}>
      Loading SetuOne...
    </div>
  );

  return (
    <AppContext.Provider value={{ session, activeTenant, setActiveTenant, activeRole, setActiveRole, activeView, setActiveView, tickets, tenantData, login, logout, canAccess, createTicket, updateTicket }}>
      {children}
    </AppContext.Provider>
  );
}




