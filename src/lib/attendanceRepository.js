import { supabase } from './supabase';

// Fetch shifts configurations
export async function fetchShifts() {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Shifts loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Fetch today's attendance record for a user
export async function fetchUserAttendance(profileId) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('profile_id', profileId)
      .gte('in_time', todayStart.toISOString())
      .maybeSingle();

    if (error) throw error;
    return { success: true, data, message: 'User today attendance status loaded.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// Fetch user attendance history logs
export async function fetchAttendanceHistory(profileId) {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('profile_id', profileId)
      .order('in_time', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Attendance history loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Fetch today's branch summary for managers
export async function fetchBranchAttendanceSummary(branchId) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        profiles!inner (
          full_name,
          branch_id
        )
      `)
      .eq('profiles.branch_id', branchId)
      .gte('in_time', todayStart.toISOString());

    if (error) throw error;
    return { success: true, data: data || [], message: 'Branch summary fetched.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Fetch branch coordinates geofence rules
export async function fetchBranchGeofence(branchId) {
  try {
    const { data, error } = await supabase
      .from('branch_geofences')
      .select('*')
      .eq('branch_id', branchId)
      .maybeSingle();

    if (error) throw error;
    
    // Fallback default coordinates if not set in DB
    const fallback = {
      center_latitude: 23.0225, // Ahmedabad center
      center_longitude: 72.5714,
      radius_meters: 150.00
    };

    return { success: true, data: data || fallback, message: 'Geofence config loaded.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// Clock-in entry registration
export async function clockIn(profileId, shiftName, coords, isVerified, method = 'GPS', manualReason = null) {
  try {
    // Calculate late minutes (mock General shift starts at 09:00:00)
    const now = new Date();
    const shiftStart = new Date();
    shiftStart.setHours(9, 0, 0, 0); // 09:00 AM

    let lateMinutes = 0;
    if (now > shiftStart) {
      lateMinutes = Math.floor((now - shiftStart) / (1000 * 60));
    }

    const status = lateMinutes > 15 ? 'Late' : 'Present';

    const { data, error } = await supabase
      .from('attendance')
      .insert({
        profile_id: profileId,
        shift: shiftName,
        in_time: now.toISOString(),
        gps_coordinates: coords,
        gps_verified: isVerified,
        late_minutes: lateMinutes,
        check_in_method: method,
        manual_reason: manualReason,
        status,
        duty_status: 'On Duty'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Clocked in successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// Clock-out departure registration
export async function clockOut(attendanceId, method = 'GPS', manualReason = null) {
  try {
    const now = new Date();

    // Fetch check-in stamp to compute working hours
    const { data: record } = await supabase
      .from('attendance')
      .select('in_time')
      .eq('id', attendanceId)
      .single();

    let overtimeHours = 0.00;
    if (record) {
      const durationHours = (now - new Date(record.in_time)) / (1000 * 60 * 60);
      if (durationHours > 8.00) {
        overtimeHours = Number((durationHours - 8.00).toFixed(2));
      }
    }

    const { data, error } = await supabase
      .from('attendance')
      .update({
        out_time: now.toISOString(),
        overtime_hours: overtimeHours,
        duty_status: 'Checked Out'
      })
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Clocked out successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// Update duty status dynamically (On Duty, Break, WFH, etc.)
export async function updateDutyStatus(attendanceId, status) {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .update({
        duty_status: status
      })
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Duty status updated.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// Request Regularization
export async function requestRegularization(attendanceId, reason) {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .update({
        regularization_status: 'Pending',
        regularization_reason: reason
      })
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Regularization requested.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// Approve Regularization
export async function approveRegularization(attendanceId, managerProfileId) {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .update({
        regularization_status: 'Approved',
        status: 'Present', // status fixed to Present upon approval
        approved_by_profile_id: managerProfileId
      })
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Regularization approved.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// Reject Regularization
export async function rejectRegularization(attendanceId, managerProfileId) {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .update({
        regularization_status: 'Rejected',
        approved_by_profile_id: managerProfileId
      })
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Regularization rejected.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// QR Scanner attendance mock placeholder (Future Ready)
export async function scanAttendanceQR(qrPayload) {
  console.log('Syncing QR Attendance:', qrPayload);
  return { success: true, message: 'QR Code verified successfully.' };
}

// Biometric sync mock placeholder (Future Ready)
export async function syncBiometricAttendance() {
  console.log('Triggering biometric clock records integration sync...');
  return { success: true, message: 'Biometric terminals synchronized successfully.' };
}
