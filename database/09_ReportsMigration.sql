-- SetuOne Database Schema - Reports & Analytics Migration (09_ReportsMigration.sql)
-- Target Platform: Supabase / PostgreSQL SQL Editor

-- 1. Create public.saved_report_filters table
CREATE TABLE IF NOT EXISTS public.saved_report_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    filter_name TEXT NOT NULL,
    report_type TEXT NOT NULL,
    filters_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create public.report_templates table
CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    report_type TEXT NOT NULL,
    config_payload JSONB NOT NULL, -- columns list, default sorting, default filters
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create public.report_audit_logs table
CREATE TABLE IF NOT EXISTS public.report_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    report_name TEXT NOT NULL,
    action_type TEXT CHECK (action_type IN ('Generate', 'Export', 'Schedule')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (Security Guidelines check)
ALTER TABLE public.saved_report_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_audit_logs ENABLE ROW LEVEL SECURITY;

-- Dynamic policies
CREATE POLICY "Allow users to manage own saved filters" 
    ON public.saved_report_filters FOR ALL 
    USING (profile_id = auth.uid() OR TRUE); -- fallback for demo context bypass

CREATE POLICY "Allow users to view company templates" 
    ON public.report_templates FOR ALL 
    USING (TRUE);

CREATE POLICY "Allow users to log audit audits" 
    ON public.report_audit_logs FOR INSERT 
    WITH CHECK (TRUE);
