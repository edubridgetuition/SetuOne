import { supabase } from './supabase';

// Fetch checklist templates definitions
export async function fetchChecklistTemplates() {
  try {
    const { data, error } = await supabase
      .from('checklists')
      .select('*')
      .order('area', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Checklist templates loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch templates.', error };
  }
}

// Fetch scheduled checklist inspections
export async function fetchChecklistSchedules(filters = {}) {
  try {
    let query = supabase
      .from('checklist_submissions')
      .select(`
        *,
        checklists (*)
      `);

    if (filters.frequency && filters.frequency !== 'All') {
      query = query.eq('checklists.frequency', filters.frequency);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    // Filter null joins if any
    const formatted = (data || [])
      .filter(item => item.checklists)
      .map(item => ({
        id: item.id,
        checklistId: item.checklist_id,
        area: item.checklists.area,
        item: item.checklists.item,
        frequency: item.checklists.frequency,
        status: item.status,
        remarks: item.remarks || '',
        createdAt: new Date(item.created_at).toLocaleString()
      }));

    return { success: true, data: formatted, message: 'Checklist schedules loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch schedules.', error };
  }
}

// Fetch completed checklist submissions
export async function fetchChecklistSubmissions() {
  try {
    const { data, error } = await supabase
      .from('checklist_submissions')
      .select(`
        *,
        checklists (*),
        profiles:submitted_by_profile_id (full_name)
      `)
      .eq('status', 'Completed')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Submissions loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch submissions.', error };
  }
}

// Submit/Update checklist schedule item
export async function submitChecklist(scheduleId, status, remarks, profileId) {
  try {
    const { data: schedule, error: fetchErr } = await supabase
      .from('checklist_submissions')
      .select('*, checklists(*)')
      .eq('id', scheduleId)
      .single();

    if (fetchErr) throw fetchErr;

    const { data, error } = await supabase
      .from('checklist_submissions')
      .update({
        status,
        remarks: remarks || '',
        submitted_by_profile_id: profileId,
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;

    // Auto-raise ticket if inspection failed (Escalated status)
    if (status === 'Escalated') {
      const { data: latest } = await supabase
        .from('tickets')
        .select('ticket_no')
        .order('ticket_no', { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextNo = 'TKT-1001';
      if (latest && latest.ticket_no) {
        const match = latest.ticket_no.match(/TKT-(\d+)/);
        if (match) {
          nextNo = `TKT-${parseInt(match[1], 10) + 1}`;
        }
      }

      // Find a default location ID for the area, or fallback to first location
      const { data: locs } = await supabase.from('locations').select('id').limit(1);
      const locId = locs?.[0]?.id;

      if (locId) {
        const { data: tkt } = await supabase
          .from('tickets')
          .insert({
            company_id: schedule.company_id,
            ticket_no: nextNo,
            category: schedule.checklists.area + ' Complaint',
            location_id: locId,
            priority: 'High',
            raised_by_profile_id: profileId,
            status: 'Open',
            description: `Checklist failed: ${schedule.checklists.item}. Remarks: ${remarks}`
          })
          .select()
          .single();

        if (tkt) {
          await supabase.from('ticket_timeline').insert({
            ticket_id: tkt.id,
            action: 'Ticket created',
            by_profile_id: profileId,
            remarks: 'Auto-raised from checklist failure.'
          });
        }
      }
    }

    return { success: true, data, message: 'Checklist updated successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Checklist update failed.', error };
  }
}

// Fetch PPM Schedules
export async function fetchPPMSchedules() {
  try {
    const { data, error } = await supabase
      .from('ppm_schedules')
      .select(`
        *,
        assets (*),
        vendors (*)
      `)
      .order('next_service_date', { ascending: true });

    if (error) throw error;

    const formatted = (data || []).map(p => ({
      id: p.id,
      assetName: p.assets?.name || 'Unknown Asset',
      assetCode: p.assets?.asset_code || 'N/A',
      assetId: p.asset_id,
      serviceType: p.service_type,
      vendorName: p.vendors?.name || 'In-house',
      vendorId: p.vendor_id,
      nextServiceDate: p.next_service_date,
      status: p.status
    }));

    return { success: true, data: formatted, message: 'PPM schedules loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch PPM schedules.', error };
  }
}

// Create new PPM schedule
export async function createPPMSchedule(ppmData, companyId) {
  try {
    const { data, error } = await supabase
      .from('ppm_schedules')
      .insert({
        company_id: companyId,
        asset_id: ppmData.assetId,
        service_type: ppmData.serviceType,
        vendor_id: ppmData.vendorId || null,
        next_service_date: ppmData.nextServiceDate,
        status: 'Pending'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'PPM scheduled successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to create PPM schedule.', error };
  }
}

// Update PPM Status (Started, Completed, Skip, Reschedule)
export async function updatePPMStatus(ppmId, status, updates = {}, profileId) {
  try {
    const updateObj = { status, updated_at: new Date().toISOString() };
    if (updates.nextServiceDate) updateObj.next_service_date = updates.nextServiceDate;

    const { data: ppm, error: ppmErr } = await supabase
      .from('ppm_schedules')
      .update(updateObj)
      .eq('id', ppmId)
      .select('*, assets(*)')
      .single();

    if (ppmErr) throw ppmErr;

    // Log operational details snapshot in activity logs
    await supabase.from('activity_logs').insert({
      tenant_id: ppm.company_id,
      profile_id: profileId,
      action: `PPM status changed to ${status}`,
      table_name: 'ppm_schedules',
      record_id: ppmId,
      payload: { remarks: updates.remarks || '', costs: updates.costs || {} }
    });

    // If spare parts used, log inventory deductions
    if (status === 'Completed' && updates.spares && updates.spares.length > 0) {
      // Fetch default branch ID
      const { data: prof } = await supabase.from('profiles').select('branch_id').eq('id', profileId).single();
      const branchId = prof?.branch_id;

      if (branchId) {
        for (const spare of updates.spares) {
          // Log Out transaction
          await supabase.from('inventory_transactions').insert({
            item_id: spare.itemId,
            branch_id: branchId,
            transaction_type: 'Out',
            quantity: spare.quantity,
            reference_id: ppmId
          });

          // Update stock balance
          const { data: stock } = await supabase
            .from('inventory_stock')
            .select('id, closing_stock')
            .eq('branch_id', branchId)
            .eq('item_id', spare.itemId)
            .maybeSingle();

          if (stock) {
            const nextStock = Math.max(0, Number(stock.closing_stock) - Number(spare.quantity));
            await supabase
              .from('inventory_stock')
              .update({ closing_stock: nextStock, updated_at: new Date().toISOString() })
              .eq('id', stock.id);
          }
        }
      }
    }

    // Auto-generate next recurring PPM upon verification completion
    if (status === 'Completed') {
      await generateNextPPM(ppmId);
    }

    return { success: true, data: ppm, message: `PPM transitioned to ${status} successfully.`, error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'PPM status change failed.', error };
  }
}

// Recurrence Engine - Calculates next recurring PPM date
export async function generateNextPPM(currentPPMId) {
  try {
    const { data: ppm } = await supabase
      .from('ppm_schedules')
      .select('*')
      .eq('id', currentPPMId)
      .single();

    if (!ppm) return { success: false, message: 'Current PPM not found.' };

    const current = new Date(ppm.next_service_date);
    let nextDate = new Date(current);

    // Calculate cycles: Monthly default fallback
    const freq = ppm.service_type || 'Monthly';
    if (freq.includes('Daily')) nextDate.setDate(current.getDate() + 1);
    else if (freq.includes('Weekly')) nextDate.setDate(current.getDate() + 7);
    else if (freq.includes('Quarterly')) nextDate.setMonth(current.getMonth() + 3);
    else if (freq.includes('Half-Yearly')) nextDate.setMonth(current.getMonth() + 6);
    else if (freq.includes('Yearly')) nextDate.setFullYear(current.getFullYear() + 1);
    else nextDate.setMonth(current.getMonth() + 1); // Monthly fallback

    const { data } = await supabase
      .from('ppm_schedules')
      .insert({
        company_id: ppm.company_id,
        asset_id: ppm.asset_id,
        service_type: ppm.service_type,
        vendor_id: ppm.vendor_id,
        next_service_date: nextDate.toISOString().split('T')[0],
        status: 'Pending'
      })
      .select()
      .single();

    return { success: true, data, message: 'Next recurring PPM generated.', error: null };
  } catch (error) {
    return { success: false, error };
  }
}

// Fetch AMC Expirations
export async function fetchAMCExpirations() {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('id, name, service_type, payment_due')
      .order('payment_due', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'AMC contracts loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to load AMC contracts.', error };
  }
}

// Renew AMC Contract
export async function renewAMC(vendorId, newExpiryDate, newContractValue) {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .update({
        payment_due: newExpiryDate,
        contract_value: newContractValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendorId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'AMC contract renewed successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Renewal failed.', error };
  }
}
