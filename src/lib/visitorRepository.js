import { supabase } from './supabase';

// Fetch all visitors
export async function fetchVisitors() {
  try {
    const { data, error } = await supabase
      .from('visitors')
      .select(`
        *,
        profiles:meeting_with_profile_id (full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Visitors loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch visitors.', error };
  }
}

// Fetch single visitor details
export async function fetchVisitorDetails(id) {
  try {
    const { data, error } = await supabase
      .from('visitors')
      .select(`
        *,
        profiles:meeting_with_profile_id (full_name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Visitor details fetched.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to fetch details.', error };
  }
}

// Fetch visitors currently inside the facility
export async function fetchVisitorsInside() {
  try {
    const { data, error } = await supabase
      .from('visitors')
      .select(`
        *,
        profiles:meeting_with_profile_id (full_name)
      `)
      .eq('status', 'Inside')
      .order('in_time', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Inside visitors loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch inside visitors.', error };
  }
}

// Fetch checked out historical records
export async function fetchVisitorHistory() {
  try {
    const { data, error } = await supabase
      .from('visitors')
      .select(`
        *,
        profiles:meeting_with_profile_id (full_name)
      `)
      .eq('status', 'Checked Out')
      .order('out_time', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Visitor history loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch history.', error };
  }
}

// Check-in new visitor with auto-calculated Pass No (VIS-XXXXXX)
export async function checkInVisitor(visitorData, companyId) {
  try {
    // 1. Fetch latest pass no to generate next sequence
    const { data: latest } = await supabase
      .from('visitors')
      .select('pass_no')
      .order('pass_no', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNo = 'VIS-000101';
    if (latest && latest.pass_no) {
      const match = latest.pass_no.match(/VIS-(\d+)/);
      if (match) {
        nextNo = `VIS-${String(parseInt(match[1], 10) + 1).padStart(6, '0')}`;
      }
    }

    const { data, error } = await supabase
      .from('visitors')
      .insert({
        company_id: companyId,
        visitor_name: visitorData.name,
        meeting_with_profile_id: visitorData.hostId,
        vehicle_no: visitorData.vehicleNo || null,
        purpose: visitorData.purpose,
        id_type: visitorData.idType || null,
        id_number: visitorData.idNumber || null,
        visitor_type: visitorData.visitorType || 'Walk In',
        pass_no: nextNo,
        vehicle_type: visitorData.vehicleType || null,
        mobile: visitorData.mobile || null,
        status: 'Inside',
        in_time: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Visitor checked in successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to check in.', error };
  }
}

// Check-out visitor with checkout remarks
export async function checkOutVisitor(visitorId, checkoutRemarks) {
  try {
    const { data, error } = await supabase
      .from('visitors')
      .update({
        status: 'Checked Out',
        out_time: new Date().toISOString(),
        checkout_remarks: checkoutRemarks || 'Meeting completed.'
      })
      .eq('id', visitorId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Visitor checked out successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to check out.', error };
  }
}

// Upload/Store base64 photo
export async function uploadVisitorPhoto(visitorId, photoBase64) {
  try {
    const { data, error } = await supabase
      .from('visitors')
      .update({
        photo_url: photoBase64
      })
      .eq('id', visitorId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Photo uploaded successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Upload failed.', error };
  }
}

// Search visitors by mobile, vehicle number, or pass number (Emergency Search)
export async function searchVisitors(queryStr) {
  try {
    const { data, error } = await supabase
      .from('visitors')
      .select(`
        *,
        profiles:meeting_with_profile_id (full_name)
      `)
      .or(`mobile.ilike.%${queryStr}%,vehicle_no.ilike.%${queryStr}%,pass_no.ilike.%${queryStr}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Search completed.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Search failed.', error };
  }
}
