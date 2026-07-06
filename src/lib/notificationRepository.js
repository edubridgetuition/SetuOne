import { supabase } from './supabase';

// Fetch User Inbox Notifications
export async function fetchNotifications(profileId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Notifications loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Mark Notification as read
export async function markNotificationAsRead(id) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Notification marked read.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// Fetch Active Automation Rules
export async function fetchNotificationRules(companyId) {
  try {
    const { data, error } = await supabase
      .from('notification_rules')
      .select(`
        *,
        notification_events (event_key, description),
        email_templates (template_name, template_key)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Rules loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Save Notification Rule (Insert/Update)
export async function saveNotificationRule(ruleData, companyId) {
  try {
    const payload = {
      company_id: companyId,
      rule_name: ruleData.ruleName,
      trigger_type: ruleData.triggerType,
      module: ruleData.module,
      frequency: ruleData.frequency || null,
      event_id: ruleData.eventId || null,
      recipient_group_id: ruleData.recipientGroupId || null,
      template_id: ruleData.templateId || null,
      condition_payload: ruleData.conditionPayload || null,
      is_active: ruleData.isActive ?? true,
      is_paused: ruleData.isPaused ?? false,
      maintenance_mode: ruleData.maintenanceMode ?? false,
      start_date: ruleData.startDate || null,
      end_date: ruleData.endDate || null
    };

    let query;
    if (ruleData.id) {
      query = supabase
        .from('notification_rules')
        .update({ ...payload, version: (ruleData.version || 1) + 1, updated_at: new Date().toISOString() })
        .eq('id', ruleData.id);
    } else {
      query = supabase
        .from('notification_rules')
        .insert(payload);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;
    return { success: true, data, message: 'Rule saved successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// Fetch Recipient Groups
export async function fetchRecipientGroups(companyId) {
  try {
    const { data, error } = await supabase
      .from('notification_recipient_groups')
      .select('*')
      .eq('company_id', companyId)
      .order('group_name', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Recipient groups loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Save Recipient Group
export async function saveRecipientGroup(groupData, companyId) {
  try {
    const payload = {
      company_id: companyId,
      group_name: groupData.groupName,
      emails: groupData.emails // JSONB array format
    };

    let query;
    if (groupData.id) {
      query = supabase
        .from('notification_recipient_groups')
        .update(payload)
        .eq('id', groupData.id);
    } else {
      query = supabase
        .from('notification_recipient_groups')
        .insert(payload);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;
    return { success: true, data, message: 'Recipient group saved.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// Fetch Email Templates
export async function fetchEmailTemplates(companyId) {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('company_id', companyId)
      .order('template_name', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Email templates loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Save Email Template
export async function saveEmailTemplate(templateData, companyId) {
  try {
    const payload = {
      company_id: companyId,
      template_name: templateData.templateName,
      template_key: templateData.templateKey,
      subject: templateData.subject,
      body_html: templateData.bodyHtml,
      variables: templateData.variables || []
    };

    let query;
    if (templateData.id) {
      query = supabase
        .from('email_templates')
        .update(payload)
        .eq('id', templateData.id);
    } else {
      query = supabase
        .from('email_templates')
        .insert(payload);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;
    return { success: true, data, message: 'Template saved.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// Fetch Channels list
export async function fetchNotificationChannels() {
  try {
    const { data, error } = await supabase
      .from('notification_channels')
      .select('*')
      .order('channel_name', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Channels loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Fetch user notification preferences
export async function fetchNotificationPreferences(profileId) {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('profile_id', profileId);

    if (error) throw error;
    return { success: true, data: data || [], message: 'Preferences loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Save preference setting
export async function saveNotificationPreference(profileId, channelId, isEnabled) {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        profile_id: profileId,
        channel_id: channelId,
        is_enabled: isEnabled
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Preference updated.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// Fetch execution logs for audit trail
export async function fetchAutomationLogs(companyId) {
  try {
    const { data, error } = await supabase
      .from('automation_logs')
      .select('*')
      .order('trigger_time', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Automation logs loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// Dispatch notification simulator helper
export async function dispatchNotification(queueId) {
  try {
    const startTime = Date.now();
    
    // Fetch queue item
    const { data: queueItem, error: fetchErr } = await supabase
      .from('notification_queue')
      .select(`
        *,
        notification_rules (rule_name, template_id)
      `)
      .eq('id', queueId)
      .single();

    if (fetchErr) throw fetchErr;

    // Simulate sending time delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const duration = Date.now() - startTime;

    // Update status to Sent
    const { error: updErr } = await supabase
      .from('notification_queue')
      .update({ status: 'Sent' })
      .eq('id', queueId);

    if (updErr) throw updErr;

    // Audit logs entry
    await supabase.from('automation_logs').insert({
      rule_id: queueItem.rule_id,
      success: true,
      execution_time_ms: duration,
      channel: queueItem.channel_id ? 'Email' : 'In App', // simulated resolve
      recipient: queueItem.recipient,
      template_used: queueItem.notification_rules?.template_id || 'Default',
      generated_by_rule: queueItem.notification_rules?.rule_name || 'System'
    });

    // Rule execution entry
    await supabase.from('rule_execution_history').insert({
      rule_id: queueItem.rule_id,
      status: 'Success',
      duration_ms: duration,
      summary: `Dispatched to: ${queueItem.recipient}`
    });

    return { success: true, message: 'Notification dispatched.' };
  } catch (error) {
    return { success: false, message: error.message, error };
  }
}
