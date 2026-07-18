import { supabase } from './supabase';

export async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { success: true, data, message: 'Logged in successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Login failed.', error };
  }
}

export async function register(email, password, fullName, companyName, role = 'Admin Manager') {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          company_name: companyName
        }
      }
    });
    if (error) throw error;
    return { success: true, data, message: 'Registration successful.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Registration failed.', error };
  }
}

export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true, data: null, message: 'Logged out successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Logout failed.', error };
  }
}

export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { success: true, data: session, message: 'Session retrieved.', error: null };
  } catch (error) {
    return { success: false, data: null, message: 'Session retrieval failed.', error };
  }
}

export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return { success: true, data: session, message: 'Session refreshed.', error: null };
  } catch (error) {
    return { success: false, data: null, message: 'Session refresh failed.', error };
  }
}

export async function fetchUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        roles (*),
        companies (*),
        branches (*),
        departments (*),
        designations (*)
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { success: true, data, message: 'User profile fetched successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Profile fetch failed.', error };
  }
}

export async function sendPasswordResetOtp(email) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return { success: true, data, message: 'Password reset OTP email sent successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to send password reset OTP.', error };
  }
}

export async function verifyOtpAndResetPassword(email, token, newPassword) {
  try {
    // 1. Verify OTP token
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: 'recovery'
    });

    if (verifyError) {
      // Fallback try type 'email'
      const { error: v2Error } = await supabase.auth.verifyOtp({
        email,
        token: token.trim(),
        type: 'email'
      });
      if (v2Error) throw verifyError;
    }

    // 2. Update user password
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (updateError) throw updateError;

    return { success: true, data: updateData, message: 'Password updated successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Verification or password update failed.', error };
  }
}