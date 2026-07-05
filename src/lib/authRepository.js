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