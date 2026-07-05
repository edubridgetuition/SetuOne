import { supabase } from './supabase';

// Fetch available locations list for dynamic dropdown Raise Form
export async function fetchLocations() {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, location_type')
      .order('name', { ascending: true });

    if (error) throw error;
    return { success: true, data, message: 'Locations fetched successfully.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch locations.', error };
  }
}

// Fetch all active profiles in the company for assignment selection
export async function fetchAssignees() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        full_name,
        roles (name)
      `)
      .order('full_name', { ascending: true });

    if (error) throw error;

    const formatted = (data || []).map(p => ({
      id: p.id,
      name: p.full_name,
      role: p.roles?.name || 'Employee'
    }));

    return { success: true, data: formatted, message: 'Assignees fetched.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch assignees.', error };
  }
}

// Fetch tickets list eager joining locations and user profiles
export async function fetchTickets() {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        locations (id, name),
        raised_by:raised_by_profile_id (id, full_name, email),
        assigned_to:assigned_to_profile_id (id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map(t => ({
      id: t.id,
      no: t.ticket_no,
      category: t.category,
      location: t.locations?.name || 'Unknown',
      locationId: t.location_id,
      priority: t.priority,
      raisedBy: t.raised_by?.full_name || 'System User',
      raisedByEmail: t.raised_by?.email || '',
      assignedTo: t.assigned_to?.full_name || 'Unassigned',
      assignedToId: t.assigned_to_profile_id,
      status: t.status,
      description: t.description,
      createdAt: new Date(t.created_at).toLocaleString(),
      updatedAt: new Date(t.updated_at).toLocaleString(),
      completion: t.status === 'Closed' ? 'Closed' : t.status === 'Completed' ? 'Awaiting approval' : 'Pending'
    }));

    return { success: true, data: formatted, message: 'Tickets fetched successfully.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch tickets.', error };
  }
}

// Create new ticket dynamically calculating next TKT sequence number
export async function createTicket(ticketData, userSession) {
  try {
    const { data: lastTicket } = await supabase
      .from('tickets')
      .select('ticket_no')
      .order('ticket_no', { ascending: false })
      .limit(1);

    let nextNo = 'TKT-1001';
    if (lastTicket && lastTicket.length > 0) {
      const lastNoStr = lastTicket[0].ticket_no;
      const num = parseInt(lastNoStr.replace('TKT-', ''), 10);
      nextNo = `TKT-${num + 1}`;
    }

    const { data: created, error } = await supabase
      .from('tickets')
      .insert({
        company_id: userSession.companyId,
        ticket_no: nextNo,
        category: ticketData.category,
        location_id: ticketData.locationId,
        priority: ticketData.priority,
        raised_by_profile_id: userSession.id,
        assigned_to_profile_id: ticketData.assignedToId || null,
        status: ticketData.assignedToId ? 'Assigned' : 'Open',
        description: ticketData.description
      })
      .select()
      .single();

    if (error) throw error;

    // Log timeline trail entry
    await addTimelineEntry(created.id, 'Ticket created', ticketData.description || 'Complaint raised.', userSession.id);

    return { success: true, data: created, message: `Ticket ${nextNo} raised successfully.`, error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to raise ticket.', error };
  }
}

// Update Ticket assignments or workflow status changes
export async function updateTicket(ticketId, updates, remarks, userProfileId) {
  try {
    const { data: updated, error } = await supabase
      .from('tickets')
      .update({
        assigned_to_profile_id: updates.assignedToId || null,
        status: updates.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    const action = updates.status 
      ? `Status changed to ${updates.status}` 
      : updates.assignedToId 
        ? 'Technician assigned' 
        : 'Ticket updated';
        
    await addTimelineEntry(ticketId, action, remarks || 'Workflow updated.', userProfileId);

    return { success: true, data: updated, message: 'Ticket updated successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to update ticket.', error };
  }
}

// Fetch ticket timeline chronologically
export async function fetchTicketTimeline(ticketId) {
  try {
    const { data, error } = await supabase
      .from('ticket_timeline')
      .select('*, profiles:by_profile_id (full_name)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const formatted = (data || []).map(entry => ({
      at: new Date(entry.created_at).toLocaleString(),
      by: entry.profiles?.full_name || 'System',
      action: entry.action,
      remarks: entry.remarks
    }));

    return { success: true, data: formatted, message: 'Timeline retrieved.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch timeline.', error };
  }
}

// Insert timeline audit log row
export async function addTimelineEntry(ticketId, action, remarks, profileId) {
  try {
    const { data, error } = await supabase
      .from('ticket_timeline')
      .insert({
        ticket_id: ticketId,
        action: action,
        remarks: remarks || 'No remarks added.',
        by_profile_id: profileId
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Timeline entry logged.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to log timeline.', error };
  }
}

// Supabase Storage file uploads
export async function uploadTicketAttachment(bucket, filePath, fileBlob) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBlob, { cacheControl: '3600', upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { success: true, data: { publicUrl, path: data.path }, message: 'File uploaded successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'File upload failed.', error };
  }
}
