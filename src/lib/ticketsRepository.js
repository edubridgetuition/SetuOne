import { supabase } from "./supabase";

const STORAGE_PREFIX = "setuone:tickets:";

function storageKey(tenant) {
  return STORAGE_PREFIX + tenant;
}

export function normalizeTicket(ticket, fallbackTenant = "orion") {
  const createdAt = ticket.createdAt || ticket.created_at || new Date().toLocaleString();
  const timeline = Array.isArray(ticket.timeline) && ticket.timeline.length > 0
    ? ticket.timeline
    : [{ at: createdAt, by: ticket.raisedBy || "System", action: "Ticket created", remarks: ticket.description || "Complaint raised." }];

  return {
    tenant: ticket.tenant || fallbackTenant,
    no: ticket.no,
    category: ticket.category || "General Complaint",
    location: ticket.location || "Not provided",
    priority: ticket.priority || "Medium",
    raisedBy: ticket.raisedBy || "Unknown",
    assignedTo: ticket.assignedTo || "Unassigned",
    status: ticket.status || "Open",
    completion: ticket.completion || "Pending",
    description: ticket.description || "No description added.",
    beforePhoto: ticket.beforePhoto || "Pending",
    afterPhoto: ticket.afterPhoto || "Pending",
    createdAt,
    updatedAt: ticket.updatedAt || ticket.updated_at || createdAt,
    timeline,
  };
}

export function loadTicketsFromLocal(tenant, fallbackTickets = []) {
  try {
    const saved = localStorage.getItem(storageKey(tenant));
    const parsed = saved ? JSON.parse(saved) : fallbackTickets;
    return parsed.map((ticket) => normalizeTicket(ticket, tenant));
  } catch {
    return fallbackTickets.map((ticket) => normalizeTicket(ticket, tenant));
  }
}

export function saveTicketsToLocal(tenant, tickets) {
  localStorage.setItem(storageKey(tenant), JSON.stringify(tickets));
}

export async function fetchTickets(tenant, fallbackTickets = []) {
  const localTickets = loadTicketsFromLocal(tenant, fallbackTickets);

  try {
    const { data, error } = await supabase
      .from("tickets")
      .select("payload")
      .eq("tenant", tenant)
      .order("updated_at", { ascending: false });

    if (error || !Array.isArray(data) || data.length === 0) return localTickets;

    const tickets = data.map((row) => normalizeTicket(row.payload, tenant));
    saveTicketsToLocal(tenant, tickets);
    return tickets;
  } catch {
    return localTickets;
  }
}

export async function persistTicket(ticket) {
  const normalized = normalizeTicket(ticket, ticket.tenant);
  try {
    await supabase.from("tickets").upsert({
      id: normalized.no,
      tenant: normalized.tenant,
      payload: normalized,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Local mode: Supabase table may not exist yet during prototype testing.
  }
}

