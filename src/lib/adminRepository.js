import { supabase } from './supabase';

// 1. System Settings API
export async function fetchSystemSettings(companyId) {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Settings loaded.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

export async function updateSystemSettings(settings, companyId) {
  try {
    const payload = {
      company_name: settings.companyName,
      logo_url: settings.logoUrl || null,
      dark_logo_url: settings.darkLogoUrl || null,
      timezone: settings.timezone || 'Asia/Kolkata',
      currency: settings.currency || 'INR',
      date_format: settings.dateFormat || 'DD-MM-YYYY',
      gst_percent: settings.gstPercent || 18.00,
      automation_enabled: settings.automationEnabled ?? true,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('system_settings')
      .update(payload)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'System settings updated.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 2. Branding Settings API
export async function fetchBrandingSettings(companyId) {
  try {
    const { data, error } = await supabase
      .from('branding_settings')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Branding loaded.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

export async function updateBrandingSettings(branding, companyId) {
  try {
    const payload = {
      primary_color: branding.primaryColor,
      secondary_color: branding.secondaryColor,
      sidebar_color: branding.sidebarColor,
      login_background: branding.loginBackground || null,
      email_footer: branding.emailFooter || null,
      report_footer: branding.reportFooter || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('branding_settings')
      .update(payload)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Branding settings updated.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 3. Dynamic Masters API
export async function fetchMasterDefinitions(companyId) {
  try {
    const { data, error } = await supabase
      .from('master_definitions')
      .select(`
        *,
        master_values (id, value_code, value_label, parent_value_id, is_active)
      `)
      .eq('company_id', companyId)
      .order('master_name', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Masters definitions loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

export async function saveMasterDefinition(masterData, companyId) {
  try {
    const payload = {
      company_id: companyId,
      master_key: masterData.masterKey,
      master_name: masterData.masterName,
      parent_definition_id: masterData.parentDefinitionId || null
    };

    let query;
    if (masterData.id) {
      query = supabase
        .from('master_definitions')
        .update(payload)
        .eq('id', masterData.id);
    } else {
      query = supabase
        .from('master_definitions')
        .insert(payload);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;
    return { success: true, data, message: 'Master definition saved.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

export async function saveMasterValue(valueData) {
  try {
    const payload = {
      definition_id: valueData.definitionId,
      parent_value_id: valueData.parentValueId || null,
      value_code: valueData.valueCode,
      value_label: valueData.valueLabel,
      is_active: valueData.isActive ?? true,
      is_deleted: valueData.isDeleted ?? false
    };

    let query;
    if (valueData.id) {
      query = supabase
        .from('master_values')
        .update({
          ...payload,
          version: (valueData.version || 1) + 1,
          effective_from: new Date().toISOString()
        })
        .eq('id', valueData.id);
    } else {
      query = supabase
        .from('master_values')
        .insert(payload);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;
    return { success: true, data, message: 'Master value saved.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 4. Number Series API
export async function fetchNumberSeries(companyId) {
  try {
    const { data, error } = await supabase
      .from('number_series')
      .select('*')
      .eq('company_id', companyId)
      .order('module_key', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Number series loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

export async function saveNumberSeries(seriesData) {
  try {
    const payload = {
      prefix: seriesData.prefix,
      suffix: seriesData.suffix || '',
      start_number: seriesData.startNumber,
      digits: seriesData.digits,
      fy_reset: seriesData.fyReset ?? false,
      monthly_reset: seriesData.monthlyReset ?? false,
      branch_wise: seriesData.branchWise ?? false,
      company_wise: seriesData.companyWise ?? true
    };

    const { data, error } = await supabase
      .from('number_series')
      .update(payload)
      .eq('id', seriesData.id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Number series saved.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 5. Approval Workflows API
export async function fetchApprovalWorkflows(companyId) {
  try {
    const { data, error } = await supabase
      .from('approval_workflows')
      .select(`
        *,
        approval_levels (id, level_sequence, role_id, approver_profile_id)
      `)
      .eq('company_id', companyId)
      .order('workflow_name', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Approval workflows loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

export async function saveApprovalWorkflow(workflowData, companyId) {
  try {
    const payload = {
      company_id: companyId,
      workflow_name: workflowData.workflowName,
      module_key: workflowData.moduleKey,
      min_amount: workflowData.minAmount || 0.00,
      max_amount: workflowData.maxAmount || null,
      conditions_payload: workflowData.conditionsPayload || {},
      is_active: workflowData.isActive ?? true
    };

    let query;
    if (workflowData.id) {
      query = supabase
        .from('approval_workflows')
        .update(payload)
        .eq('id', workflowData.id);
    } else {
      query = supabase
        .from('approval_workflows')
        .insert(payload);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;
    return { success: true, data, message: 'Workflow saved.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 6. Feature Flags API
export async function fetchFeatureFlags(companyId) {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('company_id', companyId);

    if (error) throw error;
    return { success: true, data: data || [], message: 'Feature flags loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

export async function saveFeatureFlag(flagId, isEnabled) {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .update({ is_enabled: isEnabled })
      .eq('id', flagId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Feature flag toggled.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 7. Holiday Calendar API
export async function fetchHolidayCalendar(companyId) {
  try {
    const { data, error } = await supabase
      .from('holiday_calendar')
      .select('*')
      .eq('company_id', companyId)
      .order('holiday_date', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Holiday calendar loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

export async function saveHoliday(holidayData, companyId) {
  try {
    const payload = {
      company_id: companyId,
      holiday_date: holidayData.holidayDate,
      description: holidayData.description,
      is_national: holidayData.isNational ?? false
    };

    let query;
    if (holidayData.id) {
      query = supabase
        .from('holiday_calendar')
        .update(payload)
        .eq('id', holidayData.id);
    } else {
      query = supabase
        .from('holiday_calendar')
        .insert(payload);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;
    return { success: true, data, message: 'Holiday saved.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

export async function fetchWorkingDays(companyId) {
  try {
    const { data, error } = await supabase
      .from('working_days')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Working days loaded.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

export async function saveWorkingDays(daysArray, companyId) {
  try {
    const { data, error } = await supabase
      .from('working_days')
      .upsert({ company_id: companyId, days_array: daysArray })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Working days updated.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 8. Custom Fields API
export async function fetchCustomFieldDefinitions(companyId) {
  try {
    const { data, error } = await supabase
      .from('custom_field_definitions')
      .select('*')
      .eq('company_id', companyId)
      .order('module_name', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Custom fields loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

export async function saveCustomFieldDefinition(fieldData, companyId) {
  try {
    const payload = {
      company_id: companyId,
      module_name: fieldData.moduleName,
      field_name: fieldData.fieldName,
      field_label: fieldData.fieldLabel,
      field_type: fieldData.fieldType,
      dropdown_options: fieldData.dropdownOptions || [],
      is_required: fieldData.isRequired ?? false,
      is_active: fieldData.isActive ?? true,
      validation_rules: fieldData.validationRules || {},
      default_value: fieldData.defaultValue || null
    };

    let query;
    if (fieldData.id) {
      query = supabase
        .from('custom_field_definitions')
        .update(payload)
        .eq('id', fieldData.id);
    } else {
      query = supabase
        .from('custom_field_definitions')
        .insert(payload);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;
    return { success: true, data, message: 'Custom field saved.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 9. Audit Logs API
export async function fetchAuditLogs(companyId) {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('company_id', companyId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Audit logs loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

export async function writeAuditLog(logData, companyId) {
  try {
    const payload = {
      company_id: companyId,
      module: logData.module,
      table_name: logData.tableName,
      record_id: logData.recordId,
      action: logData.action,
      old_data: logData.oldData || null,
      new_data: logData.newData || null,
      changed_by: logData.changedBy || null,
      ip_address: logData.ipAddress || null,
      browser: logData.browser || null
    };

    const { data, error } = await supabase
      .from('audit_logs')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Audit log written.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 10. Notification Templates API
export async function fetchNotificationTemplates(companyId) {
  try {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('company_id', companyId)
      .order('template_key', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Notification templates loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

export async function saveNotificationTemplate(templateData, companyId) {
  try {
    const payload = {
      company_id: companyId,
      template_key: templateData.templateKey,
      channel: templateData.channel || 'EMAIL',
      subject: templateData.subject,
      body_text: templateData.bodyText,
      variables: templateData.variables || [],
      is_active: templateData.isActive ?? true
    };

    let query;
    if (templateData.id) {
      query = supabase
        .from('notification_templates')
        .update(payload)
        .eq('id', templateData.id);
    } else {
      query = supabase
        .from('notification_templates')
        .insert(payload);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;
    return { success: true, data, message: 'Notification template saved.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 11. Recurring Scheduler API
export async function fetchRecurringJobs(companyId) {
  try {
    const { data, error } = await supabase
      .from('recurring_scheduler_jobs')
      .select('*')
      .eq('company_id', companyId)
      .order('job_name', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Scheduler jobs loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

export async function saveRecurringJob(jobData, companyId) {
  try {
    const payload = {
      company_id: companyId,
      job_name: jobData.jobName,
      job_type: jobData.jobType,
      cron_expression: jobData.cronExpression,
      parameters: jobData.parameters || {},
      is_active: jobData.isActive ?? true
    };

    let query;
    if (jobData.id) {
      query = supabase
        .from('recurring_scheduler_jobs')
        .update(payload)
        .eq('id', jobData.id);
    } else {
      query = supabase
        .from('recurring_scheduler_jobs')
        .insert(payload);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;
    return { success: true, data, message: 'Recurring scheduler job saved.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 6. Dynamic RBAC Role Permissions Matrix
export async function fetchSystemRoles() {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return { success: true, data: data || [], error: null };
  } catch (error) {
    return { success: false, data: [], error };
  }
}

export async function fetchCompanyRolePermissions(companyId) {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        *,
        roles (id, name)
      `)
      .eq('company_id', companyId);
    if (error) throw error;
    return { success: true, data: data || [], message: 'Role permissions loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

export async function saveRolePermissions(companyId, roleId, permissionKeys) {
  try {
    // Delete existing permissions for this role and company
    const { error: delError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('company_id', companyId)
      .eq('role_id', roleId);
    if (delError) throw delError;

    // Insert new permissions if any
    if (permissionKeys.length > 0) {
      const payloads = permissionKeys.map(key => ({
        company_id: companyId,
        role_id: roleId,
        permission_key: key,
        is_granted: true
      }));
      const { error: insError } = await supabase
        .from('role_permissions')
        .insert(payloads);
      if (insError) throw insError;
    }
    return { success: true, message: 'Permissions saved successfully.', error: null };
  } catch (error) {
    return { success: false, message: error.message, error };
  }
}

export async function deleteMasterValue(valueId) {
  try {
    const { error } = await supabase
      .from('master_values')
      .delete()
      .eq('id', valueId);
    if (error) throw error;
    return { success: true, message: 'Master value deleted successfully.', error: null };
  } catch (error) {
    return { success: false, message: error.message, error };
  }
}
