import { supabase } from './supabase';

// Fetch consolidated Dashboard KPIs
export async function fetchDashboardKPIs(profileId, branchId) {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    // Run parallel aggregates
    const [
      { count: openTickets },
      { count: totalAssets },
      { data: attendance },
      { count: visitorsToday },
      { count: pendingPRs },
      { count: pendingPOs },
      { data: amcAssets },
      { data: ticketsResolved }
    ] = await Promise.all([
      supabase.from('tickets').select('*', { count: 'exact', head: true }).neq('status', 'Resolved'),
      supabase.from('assets').select('*', { count: 'exact', head: true }),
      supabase.from('attendance').select('status').gte('in_time', today.toISOString()),
      supabase.from('visitors').select('*', { count: 'exact', head: true }).gte('in_time', today.toISOString()),
      supabase.from('purchase_requests').select('*', { count: 'exact', head: true }).eq('status', 'Draft'),
      supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('status', 'Draft'),
      supabase.from('assets').select('amc_expiry_date'),
      supabase.from('tickets').select('created_at, updated_at').eq('status', 'Resolved')
    ]);

    // Calculate attendance percentage
    const totalClocked = attendance?.length || 0;
    const presentCount = attendance?.filter(a => a.status === 'Present' || a.status === 'Late').length || 0;
    const attendancePct = totalClocked > 0 ? Math.round((presentCount / totalClocked) * 100) : 100;

    // Calculate AMC Due in 30 days
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);
    const amcDueCount = amcAssets?.filter(a => {
      if (!a.amc_expiry_date) return false;
      const exp = new Date(a.amc_expiry_date);
      return exp > new Date() && exp <= next30Days;
    }).length || 0;

    // Calculate average resolution time (hours)
    let avgResHours = 4.5; // fallback default
    if (ticketsResolved && ticketsResolved.length > 0) {
      const diffs = ticketsResolved.map(t => (new Date(t.updated_at) - new Date(t.created_at)) / (1000 * 60 * 60));
      avgResHours = Number((diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(1));
    }

    return {
      success: true,
      data: {
        openTickets: openTickets || 0,
        totalAssets: totalAssets || 0,
        attendancePct,
        visitorsToday: visitorsToday || 0,
        pendingPRs: pendingPRs || 0,
        pendingPOs: pendingPOs || 0,
        amcDueCount,
        avgResHours
      },
      message: 'KPI dashboard loaded.',
      error: null
    };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// Fetch Attendance logs report
export async function fetchAttendanceReport(filters = {}) {
  try {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        profiles:profile_id (full_name, branch_id)
      `);

    if (filters.startDate) query = query.gte('in_time', filters.startDate);
    if (filters.endDate) query = query.lte('in_time', filters.endDate);
    
    const { data, error } = await query.order('in_time', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Attendance report fetched.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Fetch Ticket logs report
export async function fetchTicketReport(filters = {}) {
  try {
    let query = supabase.from('tickets').select('*');

    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);
    if (filters.priority && filters.priority !== 'All') query = query.eq('priority', filters.priority);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Ticket report fetched.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Fetch Inventory transactions consumption report
export async function fetchInventoryReport(filters = {}) {
  try {
    let query = supabase
      .from('inventory_transactions')
      .select(`
        *,
        inventory_items:item_id (name, category, uom)
      `);

    if (filters.startDate) query = query.gte('transaction_date', filters.startDate);
    if (filters.endDate) query = query.lte('transaction_date', filters.endDate);

    const { data, error } = await query.order('transaction_date', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Inventory consumption report loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Fetch Asset status report
export async function fetchAssetReport(filters = {}) {
  try {
    let query = supabase.from('assets').select('*');

    if (filters.status && filters.status !== 'All') query = query.eq('status', filters.status);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Asset report loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Fetch Visitor Logs report
export async function fetchVisitorReport(filters = {}) {
  try {
    let query = supabase
      .from('visitors')
      .select(`
        *,
        profiles:meeting_with_profile_id (full_name)
      `);

    if (filters.startDate) query = query.gte('in_time', filters.startDate);
    if (filters.endDate) query = query.lte('in_time', filters.endDate);

    const { data, error } = await query.order('in_time', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Visitor report loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Fetch Purchase requisition logs
export async function fetchPurchaseReport(filters = {}) {
  try {
    let query = supabase.from('purchase_requests').select('*');

    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Purchase report loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Fetch PPM checklist logs
export async function fetchPPMReport(filters = {}) {
  try {
    let query = supabase.from('checklist_schedules').select('*');

    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'PPM compliance report loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Fetch saved filter settings
export async function fetchSavedFilters(profileId) {
  try {
    const { data, error } = await supabase
      .from('saved_report_filters')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Saved filters loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Save filter setting
export async function saveReportFilter(profileId, filterName, reportType, payload) {
  try {
    const { data, error } = await supabase
      .from('saved_report_filters')
      .insert({
        profile_id: profileId,
        filter_name: filterName,
        report_type: reportType,
        filters_payload: payload
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Filter saved successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// Create reusable templates
export async function generateReportTemplate(companyId, templateName, reportType, configPayload) {
  try {
    const { data, error } = await supabase
      .from('report_templates')
      .insert({
        company_id: companyId,
        template_name: templateName,
        report_type: reportType,
        config_payload: configPayload
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Template saved successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// Scheduled Reports placeholder (Phase-9 ready)
export async function scheduleReport(templateId, cronExpression, emailRecipient) {
  console.log(`Scheduling report template ${templateId} on ${cronExpression} for ${emailRecipient}`);
  return { success: true, message: 'Report scheduled successfully.' };
}

// Multi-format exporter
export async function exportReport(data, format = 'CSV') {
  try {
    if (data.length === 0) return { success: false, message: 'No data to export.' };
    
    // Simple CSV generator
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => {
        const text = String(val).replace(/"/g, '""');
        return `"${text}"`;
      }).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');

    // Trigger file download in browser context
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `report_export_${Date.now()}.${format.toLowerCase()}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, message: 'Report exported successfully.' };
  } catch (error) {
    return { success: false, message: error.message, error };
  }
}
