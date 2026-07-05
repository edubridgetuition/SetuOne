import { supabase } from './supabase';

export async function fetchDashboardSummary() {
  try {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];

    // Execute queries in parallel using Promise.all
    const [
      ticketsRes,
      tasksRes,
      ppmRes,
      invoicesRes,
      visitorsRes,
      assetsRes
    ] = await Promise.all([
      supabase.from('tickets').select('*', { count: 'exact', head: true }).in('status', ['Open', 'Assigned', 'In Progress', 'Escalated']),
      supabase.from('checklist_submissions').select('*', { count: 'exact', head: true }).in('status', ['Pending', 'In Progress']),
      supabase.from('ppm_schedules').select('*', { count: 'exact', head: true }).gte('next_service_date', firstDay).lt('next_service_date', lastDay),
      supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'Unpaid'),
      supabase.from('visitors').select('*', { count: 'exact', head: true }).gte('created_at', todayStart).lte('created_at', todayEnd),
      supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'Active')
    ]);

    // Handle any potential error inside query threads
    if (ticketsRes.error) throw ticketsRes.error;
    if (tasksRes.error) throw tasksRes.error;
    if (ppmRes.error) throw ppmRes.error;
    if (invoicesRes.error) throw invoicesRes.error;
    if (visitorsRes.error) throw visitorsRes.error;
    if (assetsRes.error) throw assetsRes.error;

    return {
      success: true,
      data: {
        openComplaints: ticketsRes.count || 0,
        todayTasks: tasksRes.count || 0,
        amcDue: ppmRes.count || 0,
        vendorPayments: invoicesRes.count || 0,
        electricity: 74, // Default placeholders for hardware energy sensors
        water: 59,
        visitors: visitorsRes.count || 0,
        assets: assetsRes.count || 0
      },
      message: 'Dashboard summary loaded successfully.',
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to load dashboard summary.',
      error
    };
  }
}

export async function fetchPriorityTickets() {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, locations (name), profiles:assigned_to_profile_id (full_name)')
      .in('priority', ['High', 'Critical'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    const formattedTickets = (data || []).map(t => ({
      no: t.ticket_no,
      category: t.category,
      location: t.locations?.name || 'Unknown',
      assignedTo: t.profiles?.full_name || 'Unassigned',
      priority: t.priority
    }));

    return {
      success: true,
      data: formattedTickets,
      message: 'Priority tickets loaded successfully.',
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: error.message || 'Failed to fetch priority tickets.',
      error
    };
  }
}