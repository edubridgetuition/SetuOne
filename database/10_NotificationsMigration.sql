-- SetuOne Database Schema - Notifications & Automation Engine Migration (10_NotificationsMigration.sql)
-- Target Platform: Supabase / PostgreSQL SQL Editor
-- Description: Idempotent script with correct table creation order.

-- 1. Notification channels
CREATE TABLE IF NOT EXISTS public.notification_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_name TEXT UNIQUE NOT NULL, -- Email, SMS, Push, In App, WhatsApp, Slack, Teams
    is_enabled BOOLEAN DEFAULT TRUE,
    config_payload JSONB DEFAULT '{}'::jsonb -- provider settings
);

-- Seed default channels
INSERT INTO public.notification_channels (channel_name, is_enabled) VALUES
  ('Email', true), ('SMS', false), ('Push', true), ('In App', true), ('WhatsApp', false), ('Slack', false)
ON CONFLICT (channel_name) DO NOTHING;

-- 2. Notification Preferences per user profile
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.notification_channels(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (profile_id, channel_id)
);

-- 3. Notification Events Catalog
CREATE TABLE IF NOT EXISTS public.notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_key TEXT UNIQUE NOT NULL, -- LOW_STOCK, PPM_DUE, AMC_EXPIRY, etc.
    description TEXT
);

-- Seed initial event types
INSERT INTO public.notification_events (event_key, description) VALUES
  ('LOW_STOCK', 'Inventory drops below reorder level'),
  ('PPM_DUE', 'Planned Preventive Maintenance inspection due tomorrow'),
  ('AMC_EXPIRY', 'Asset warranty/AMC contract expiring in 30 days'),
  ('VISITOR_CHECKIN', 'Guest has checked in at the gate pass portal'),
  ('TICKET_ESCALATED', 'Helpdesk ticket resolution timeframe exceeded'),
  ('ATTENDANCE_MISSING', 'Staff member missing attendance check-in'),
  ('PO_APPROVED', 'Procurement Purchase Order approved by Manager'),
  ('INVOICE_PENDING', 'Vendor invoice awaiting payment clearance')
ON CONFLICT (event_key) DO NOTHING;

-- 4. Recipient Groups
CREATE TABLE IF NOT EXISTS public.notification_recipient_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL, -- Facility Managers, Accounts, HR, Purchase, Admin
    emails JSONB NOT NULL DEFAULT '[]'::jsonb -- Array of emails
);

-- 5. Email Templates registry
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    template_key TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb, -- dynamic placeholders
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Report scheduler configurations (Created BEFORE notification_rules)
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL, -- Attendance, Tickets, Inventory, etc.
    frequency TEXT NOT NULL CHECK (frequency IN ('Daily', 'Weekly', 'Monthly')),
    day TEXT, -- e.g. "1st", "Monday"
    time TIME NOT NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    emails JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of emails
    format TEXT NOT NULL CHECK (format IN ('PDF', 'Excel', 'CSV')),
    subject TEXT,
    message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Automation rules
CREATE TABLE IF NOT EXISTS public.notification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('Time Based', 'Event Based')),
    module TEXT NOT NULL, -- Inventory, Ticket, AMC, PPM, Attendance
    frequency TEXT, -- Daily, Weekly, Monthly
    event_id UUID REFERENCES public.notification_events(id) ON DELETE RESTRICT,
    recipient_group_id UUID REFERENCES public.notification_recipient_groups(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
    report_template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL, -- integration mapping link with Phase 8
    schedule_id UUID REFERENCES public.scheduled_reports(id) ON DELETE SET NULL, -- explicit connection to schedules
    condition_payload JSONB, -- dynamic rule engine conditions
    is_active BOOLEAN DEFAULT TRUE,
    is_paused BOOLEAN DEFAULT FALSE,
    maintenance_mode BOOLEAN DEFAULT FALSE, -- single-click pause switch
    version INTEGER DEFAULT 1,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Queue tables for delivery reliability
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES public.notification_rules(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES public.notification_channels(id) ON DELETE CASCADE,
    recipient TEXT NOT NULL,
    subject TEXT,
    body_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed', 'Retry')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Rule execution history
CREATE TABLE IF NOT EXISTS public.rule_execution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES public.notification_rules(id) ON DELETE CASCADE,
    execution_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('Success', 'Failed')),
    duration_ms INTEGER,
    summary TEXT, -- e.g. "Emails Sent: 5"
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Automation audit logs
CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES public.notification_rules(id) ON DELETE SET NULL,
    trigger_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL,
    execution_time_ms INTEGER,
    channel TEXT,
    recipient TEXT,
    template_used TEXT,
    generated_by_rule TEXT,
    error_message TEXT,
    retry_attempts INTEGER DEFAULT 0
);
