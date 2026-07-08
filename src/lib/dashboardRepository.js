import { supabase } from './supabase';

// 1. Fetch available widgets catalog
export async function fetchAvailableWidgets() {
  try {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('is_archived', false)
      .order('widget_category', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Widgets loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// 2. Fetch layout with Company -> Role -> Department -> User overrides chain
export async function fetchUserDashboardLayout(companyId, roleName, departmentId, userId) {
  try {
    // Attempt 1: Fetch precise user override layout
    if (userId) {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .maybeSingle();

      if (data) return { success: true, data, message: 'User override layout loaded.', error: null };
    }

    // Attempt 2: Fetch department override layout
    if (departmentId) {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('company_id', companyId)
        .eq('department_id', departmentId)
        .maybeSingle();

      if (data) return { success: true, data, message: 'Department layout loaded.', error: null };
    }

    // Attempt 3: Fetch role level default layout
    if (roleName) {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('company_id', companyId)
        .eq('role_name', roleName)
        .maybeSingle();

      if (data) return { success: true, data, message: 'Role default layout loaded.', error: null };
    }

    // Attempt 4: Fallback to Company level default layout
    const { data, error } = await supabase
      .from('dashboard_layouts')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_default', true)
      .maybeSingle();

    return { success: true, data: data || null, message: 'Default fallback layout loaded.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 3. Save dashboard layout state
export async function saveDashboardLayout(companyId, roleName, departmentId, userId, layouts) {
  try {
    const payload = {
      company_id: companyId,
      role_name: roleName || null,
      department_id: departmentId || null,
      user_id: userId || null,
      desktop_layout: layouts.desktop || [],
      tablet_layout: layouts.tablet || [],
      mobile_layout: layouts.mobile || [],
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('dashboard_layouts')
      .upsert(payload, { onConflict: 'company_id,role_name,department_id,user_id' })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Dashboard layout saved successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 4. Revert user layout overrides to role defaults
export async function resetDashboardLayout(layoutId) {
  try {
    const { error } = await supabase
      .from('dashboard_layouts')
      .delete()
      .eq('id', layoutId);

    if (error) throw error;
    return { success: true, message: 'Dashboard layout reset completed.', error: null };
  } catch (error) {
    return { success: false, message: error.message, error };
  }
}

// 5. Clone/Duplicate configuration layouts
export async function duplicateDashboard(sourceLayoutId, targetRoleName, companyId) {
  try {
    const { data: source, error: fetchErr } = await supabase
      .from('dashboard_layouts')
      .select('*')
      .eq('id', sourceLayoutId)
      .single();

    if (fetchErr) throw fetchErr;

    const payload = {
      company_id: companyId,
      role_name: targetRoleName,
      desktop_layout: source.desktop_layout,
      tablet_layout: source.tablet_layout,
      mobile_layout: source.mobile_layout,
      is_default: false,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('dashboard_layouts')
      .upsert(payload, { onConflict: 'company_id,role_name,department_id,user_id' })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Dashboard duplicated successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 6. Fetch stats for widgets
export async function fetchWidgetData(widgetKey, companyId) {
  try {
    let summary = {};
    if (widgetKey === 'OPEN_TICKETS') {
      const { count, error } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'Closed');
      summary = { count: count || 0 };
    } else if (widgetKey === 'TODAYS_VISITORS') {
      const todayStr = new Date().toISOString().slice(0, 10);
      const { count, error } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .gte('checkin_time', todayStr);
      summary = { count: count || 0 };
    } else if (widgetKey === 'PENDING_PURCHASE') {
      const { count, error } = await supabase
        .from('purchase_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');
      summary = { count: count || 0 };
    } else if (widgetKey === 'STOCK_LEVELS') {
      // Return mock list or fetch actual threshold balances
      summary = { alertItems: 3 };
    } else if (widgetKey === 'ATTENDANCE_SUMMARY') {
      const todayStr = new Date().toISOString().slice(0, 10);
      const { count, error } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .gte('date', todayStr);
      summary = { activeCount: count || 0 };
    } else {
      summary = { value: 120 };
    }
    return { success: true, data: summary, error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}
export async function createDashboardWidget(widgetData) {
  try {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .insert(widgetData)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Widget registered successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

export async function updateDashboardWidget(widgetId, updates) {
  try {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .update(updates)
      .eq('id', widgetId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Widget updated successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

export async function archiveDashboardWidget(widgetId) {
  try {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .update({ is_archived: true, is_active: false })
      .eq('id', widgetId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Widget archived successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}