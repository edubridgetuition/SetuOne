-- SetuOne Database Schema - Dynamic Metadata & Enterprise Admin Console Migration (11_SettingsMetadataMigration.sql)
-- Target Platform: Supabase / PostgreSQL SQL Editor
-- Description: Idempotent script with dropped policy pre-checks to allow re-runs.

-- 1. System settings & financial controls
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    company_name TEXT NOT NULL,
    logo_url TEXT,
    dark_logo_url TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    currency TEXT NOT NULL DEFAULT 'INR',
    date_format TEXT NOT NULL DEFAULT 'DD-MM-YYYY',
    financial_year_start DATE,
    gst_percent DECIMAL(5,2) DEFAULT 18.00,
    automation_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings for Orion company
INSERT INTO public.system_settings (company_id, company_name, timezone, currency, date_format)
SELECT id, name, 'Asia/Kolkata', 'INR', 'DD-MM-YYYY'
FROM public.companies
LIMIT 1
ON CONFLICT (company_id) DO NOTHING;

-- 2. Theme & Branding settings
CREATE TABLE IF NOT EXISTS public.branding_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    primary_color TEXT DEFAULT '#0038a8',
    secondary_color TEXT DEFAULT '#1e40af',
    sidebar_color TEXT DEFAULT '#0f172a',
    login_background TEXT,
    email_footer TEXT,
    report_footer TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.branding_settings (company_id, primary_color, secondary_color, sidebar_color)
SELECT id, '#0038a8', '#1e40af', '#0f172a'
FROM public.companies
LIMIT 1
ON CONFLICT (company_id) DO NOTHING;

-- 3. Dynamic Masters registry with Hierarchical Parents mapping
CREATE TABLE IF NOT EXISTS public.master_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    master_key TEXT NOT NULL, -- DEPARTMENTS, FLOORS, ASSET_BRANDS
    master_name TEXT NOT NULL,
    parent_definition_id UUID REFERENCES public.master_definitions(id) ON DELETE SET NULL, -- for lookup dependency cascade
    UNIQUE (company_id, master_key)
);

CREATE TABLE IF NOT EXISTS public.master_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id UUID NOT NULL REFERENCES public.master_definitions(id) ON DELETE CASCADE,
    parent_value_id UUID REFERENCES public.master_values(id) ON DELETE SET NULL, -- links Floor 5 to Building A
    value_code TEXT NOT NULL,
    value_label TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE, -- soft delete for versioning safety
    version INTEGER DEFAULT 1,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (definition_id, value_code)
);

-- 4. Number Series Generator registry
CREATE TABLE IF NOT EXISTS public.number_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    module_key TEXT NOT NULL, -- TICKET, PO, ASSET, VISITOR, INVOICE
    prefix TEXT NOT NULL, -- e.g. "TKT-"
    suffix TEXT, -- e.g. "-AHM"
    start_number INTEGER NOT NULL DEFAULT 1,
    current_number INTEGER NOT NULL DEFAULT 0,
    digits INTEGER NOT NULL DEFAULT 6,
    fy_reset BOOLEAN DEFAULT FALSE,
    monthly_reset BOOLEAN DEFAULT FALSE,
    branch_wise BOOLEAN DEFAULT FALSE,
    company_wise BOOLEAN DEFAULT TRUE,
    UNIQUE (company_id, module_key)
);

-- Seed default series for tickets, POs, assets, visitors
INSERT INTO public.number_series (company_id, module_key, prefix, suffix, start_number, current_number, digits)
SELECT id, 'TICKET', 'TKT-', '', 1, 1, 6 FROM public.companies ON CONFLICT DO NOTHING;
INSERT INTO public.number_series (company_id, module_key, prefix, suffix, start_number, current_number, digits)
SELECT id, 'PO', 'PO-2026-', '', 1, 1, 6 FROM public.companies ON CONFLICT DO NOTHING;
INSERT INTO public.number_series (company_id, module_key, prefix, suffix, start_number, current_number, digits)
SELECT id, 'ASSET', 'AST-', '', 1, 1, 6 FROM public.companies ON CONFLICT DO NOTHING;
INSERT INTO public.number_series (company_id, module_key, prefix, suffix, start_number, current_number, digits)
SELECT id, 'VISITOR', 'VIS-', '', 1, 1, 6 FROM public.companies ON CONFLICT DO NOTHING;

-- 5. Approval Workflow Engine with Condition matching
CREATE TABLE IF NOT EXISTS public.approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    workflow_name TEXT NOT NULL,
    module_key TEXT NOT NULL, -- PURCHASE, TICKET
    min_amount DECIMAL(12,2) DEFAULT 0.00,
    max_amount DECIMAL(12,2),
    conditions_payload JSONB DEFAULT '{}'::jsonb, -- e.g. {"department":"IT","asset_type":"Laptop"}
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.approval_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
    level_sequence INTEGER NOT NULL, -- 1, 2, 3
    role_id UUID REFERENCES public.roles(id) ON DELETE RESTRICT,
    approver_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    UNIQUE (workflow_id, level_sequence)
);

-- 6. Feature toggles
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL, -- ATTENDANCE, VISITORS, PPM, INVENTORY
    is_enabled BOOLEAN DEFAULT TRUE,
    UNIQUE (company_id, feature_key)
);

INSERT INTO public.feature_flags (company_id, feature_key, is_enabled)
SELECT id, 'ATTENDANCE', true FROM public.companies ON CONFLICT DO NOTHING;
INSERT INTO public.feature_flags (company_id, feature_key, is_enabled)
SELECT id, 'VISITORS', true FROM public.companies ON CONFLICT DO NOTHING;
INSERT INTO public.feature_flags (company_id, feature_key, is_enabled)
SELECT id, 'PPM', true FROM public.companies ON CONFLICT DO NOTHING;
INSERT INTO public.feature_flags (company_id, feature_key, is_enabled)
SELECT id, 'INVENTORY', true FROM public.companies ON CONFLICT DO NOTHING;

-- 7. Calendars & Holiday mappings
CREATE TABLE IF NOT EXISTS public.holiday_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    description TEXT NOT NULL,
    is_national BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.working_days (
    company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
    days_array INTEGER[] DEFAULT '{1,2,3,4,5}'::integer[]
);

INSERT INTO public.working_days (company_id, days_array)
SELECT id, '{1,2,3,4,5}'::integer[] FROM public.companies ON CONFLICT DO NOTHING;

-- 8. Dynamic Custom Fields definition with Constraints
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL CHECK (module_name IN ('Ticket', 'Asset', 'Inventory', 'Visitor')),
    field_name TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('Text', 'Number', 'Date', 'Dropdown', 'Boolean')),
    dropdown_options JSONB DEFAULT '[]'::jsonb,
    is_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    validation_rules JSONB DEFAULT '{}'::jsonb, -- e.g. {"min_length":5,"max_length":20}
    default_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, module_name, field_name)
);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    table_name TEXT NOT NULL, -- dynamic table reference e.g. "public.assets"
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    browser TEXT
);

-- 10. Dynamic Notification Templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    template_key TEXT UNIQUE NOT NULL, -- TICKET_CREATED, PO_APPROVED, VISITOR_CHECKIN
    channel TEXT NOT NULL DEFAULT 'EMAIL' CHECK (channel IN ('EMAIL', 'SMS', 'WHATSAPP', 'PUSH')),
    subject TEXT NOT NULL,
    body_text TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Recurring Automation Scheduler Jobs
CREATE TABLE IF NOT EXISTS public.recurring_scheduler_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    job_name TEXT NOT NULL,
    job_type TEXT NOT NULL CHECK (job_type IN ('Report Delivery', 'PPM Reminder', 'AMC Reminder', 'Warranty Reminder', 'PO Approval Escalation')),
    cron_expression TEXT NOT NULL, -- e.g. "0 0 * * 1" for every Monday
    parameters JSONB DEFAULT '{}'::jsonb, -- dynamic parameters
    is_active BOOLEAN DEFAULT TRUE,
    next_run_at TIMESTAMPTZ,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Add metadata payload column to core tables if not already present
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS metadata_payload JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS metadata_payload JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS metadata_payload JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS metadata_payload JSONB DEFAULT '{}'::jsonb;

-- Enable RLS on newly created tables
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holiday_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_scheduler_jobs ENABLE ROW LEVEL SECURITY;

-- Clean existing policies to prevent collision conflicts on re-runs
DROP POLICY IF EXISTS "Allow public select system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow public select branding_settings" ON public.branding_settings;
DROP POLICY IF EXISTS "Allow public select master_definitions" ON public.master_definitions;
DROP POLICY IF EXISTS "Allow public select master_values" ON public.master_values;
DROP POLICY IF EXISTS "Allow public select number_series" ON public.number_series;
DROP POLICY IF EXISTS "Allow public select approval_workflows" ON public.approval_workflows;
DROP POLICY IF EXISTS "Allow public select approval_levels" ON public.approval_levels;
DROP POLICY IF EXISTS "Allow public select feature_flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Allow public select holiday_calendar" ON public.holiday_calendar;
DROP POLICY IF EXISTS "Allow public select working_days" ON public.working_days;
DROP POLICY IF EXISTS "Allow public select custom_field_definitions" ON public.custom_field_definitions;
DROP POLICY IF EXISTS "Allow public select notification_templates" ON public.notification_templates;
DROP POLICY IF EXISTS "Allow public select recurring_scheduler_jobs" ON public.recurring_scheduler_jobs;

DROP POLICY IF EXISTS "Allow write access for all admin actions system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow write access for all admin actions branding_settings" ON public.branding_settings;
DROP POLICY IF EXISTS "Allow write access for all admin actions master_definitions" ON public.master_definitions;
DROP POLICY IF EXISTS "Allow write access for all admin actions master_values" ON public.master_values;
DROP POLICY IF EXISTS "Allow write access for all admin actions number_series" ON public.number_series;
DROP POLICY IF EXISTS "Allow write access for all admin actions approval_workflows" ON public.approval_workflows;
DROP POLICY IF EXISTS "Allow write access for all admin actions approval_levels" ON public.approval_levels;
DROP POLICY IF EXISTS "Allow write access for all admin actions feature_flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Allow write access for all admin actions holiday_calendar" ON public.holiday_calendar;
DROP POLICY IF EXISTS "Allow write access for all admin actions working_days" ON public.working_days;
DROP POLICY IF EXISTS "Allow write access for all admin actions custom_field_definitions" ON public.custom_field_definitions;
DROP POLICY IF EXISTS "Allow write access for all admin actions audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow write access for all admin actions notification_templates" ON public.notification_templates;
DROP POLICY IF EXISTS "Allow write access for all admin actions recurring_scheduler_jobs" ON public.recurring_scheduler_jobs;

-- Allow all users to read settings and configurations
CREATE POLICY "Allow public select system_settings" ON public.system_settings FOR SELECT USING (TRUE);
CREATE POLICY "Allow public select branding_settings" ON public.branding_settings FOR SELECT USING (TRUE);
CREATE POLICY "Allow public select master_definitions" ON public.master_definitions FOR SELECT USING (TRUE);
CREATE POLICY "Allow public select master_values" ON public.master_values FOR SELECT USING (TRUE);
CREATE POLICY "Allow public select number_series" ON public.number_series FOR SELECT USING (TRUE);
CREATE POLICY "Allow public select approval_workflows" ON public.approval_workflows FOR SELECT USING (TRUE);
CREATE POLICY "Allow public select approval_levels" ON public.approval_levels FOR SELECT USING (TRUE);
CREATE POLICY "Allow public select feature_flags" ON public.feature_flags FOR SELECT USING (TRUE);
CREATE POLICY "Allow public select holiday_calendar" ON public.holiday_calendar FOR SELECT USING (TRUE);
CREATE POLICY "Allow public select working_days" ON public.working_days FOR SELECT USING (TRUE);
CREATE POLICY "Allow public select custom_field_definitions" ON public.custom_field_definitions FOR SELECT USING (TRUE);
CREATE POLICY "Allow public select notification_templates" ON public.notification_templates FOR SELECT USING (TRUE);
CREATE POLICY "Allow public select recurring_scheduler_jobs" ON public.recurring_scheduler_jobs FOR SELECT USING (TRUE);

-- Allow all user management actions for Admins (bypassing strict RLS details for demo organization context simplicity)
CREATE POLICY "Allow write access for all admin actions system_settings" ON public.system_settings FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow write access for all admin actions branding_settings" ON public.branding_settings FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow write access for all admin actions master_definitions" ON public.master_definitions FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow write access for all admin actions master_values" ON public.master_values FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow write access for all admin actions number_series" ON public.number_series FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow write access for all admin actions approval_workflows" ON public.approval_workflows FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow write access for all admin actions approval_levels" ON public.approval_levels FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow write access for all admin actions feature_flags" ON public.feature_flags FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow write access for all admin actions holiday_calendar" ON public.holiday_calendar FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow write access for all admin actions working_days" ON public.working_days FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow write access for all admin actions custom_field_definitions" ON public.custom_field_definitions FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow write access for all admin actions audit_logs" ON public.audit_logs FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow write access for all admin actions notification_templates" ON public.notification_templates FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow write access for all admin actions recurring_scheduler_jobs" ON public.recurring_scheduler_jobs FOR ALL USING (TRUE) WITH CHECK (TRUE);
