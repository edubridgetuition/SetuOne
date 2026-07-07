-- SetuOne Database Schema - Dynamic Dashboard Builder Migration (12_DashboardBuilderMigration.sql)
-- Target Platform: Supabase / PostgreSQL SQL Editor
-- Description: Drop tables first to ensure fresh columns match schema definition.

-- Drop existing tables to prevent mismatched column structures
DROP TABLE IF EXISTS public.dashboard_layouts CASCADE;
DROP TABLE IF EXISTS public.dashboard_widgets CASCADE;

-- 1. Catalog of available widgets in the system
CREATE TABLE public.dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_key TEXT UNIQUE NOT NULL, -- e.g. "OPEN_TICKETS", "TODAYS_VISITORS", "ENERGY_CONSUMPTION"
    widget_name TEXT NOT NULL,
    widget_category TEXT NOT NULL CHECK (widget_category IN ('Operations', 'Inventory', 'Assets', 'HR', 'Finance', 'Visitors', 'Energy', 'Analytics')),
    description TEXT,
    default_w INTEGER NOT NULL DEFAULT 4, -- default grid width units
    default_h INTEGER NOT NULL DEFAULT 3, -- default grid height units
    min_w INTEGER NOT NULL DEFAULT 2,
    min_h INTEGER NOT NULL DEFAULT 2,
    component_name TEXT NOT NULL, -- matching React UI component mapping
    visible_roles JSONB DEFAULT '[]'::jsonb, -- roles allowed to view
    visible_modules JSONB DEFAULT '[]'::jsonb, -- required modules feature flags
    required_permission TEXT, -- RBAC check
    refresh_interval_seconds INTEGER DEFAULT 60, -- reload interval frequency
    default_config JSONB DEFAULT '{}'::jsonb, -- e.g. {"limit":5,"time_range":"7d"}
    version INTEGER DEFAULT 1,
    is_required BOOLEAN DEFAULT FALSE, -- locking flag
    is_active BOOLEAN DEFAULT TRUE
);

-- Seed default system widgets catalog
INSERT INTO public.dashboard_widgets (widget_key, widget_name, widget_category, description, default_w, default_h, component_name, refresh_interval_seconds, default_config, is_required) VALUES
('OPEN_TICKETS', 'Open Tickets count', 'Operations', 'Shows pending complaint tickets count with trend indicators.', 3, 2, 'TicketsWidget', 30, '{"limit":10}', true),
('TODAYS_VISITORS', 'Today''s Visitors Pass', 'Visitors', 'Tracks visitors count currently inside premises.', 3, 2, 'VisitorsWidget', 30, '{}', false),
('PENDING_PURCHASE', 'Pending Procurement Approvals', 'Finance', 'List of requisitions waiting for approval action.', 6, 3, 'PurchaseWidget', 60, '{"limit":5}', false),
('STOCK_LEVELS', 'Inventory Alert levels', 'Inventory', 'Items currently below minimum safety stock levels.', 4, 3, 'InventoryWidget', 600, '{"low_stock_only":true}', false),
('ATTENDANCE_SUMMARY', 'Attendance Headcount', 'HR', 'Live checked-in staff count with percentage indicators.', 4, 2, 'AttendanceWidget', 30, '{}', false),
('ENERGY_MONITOR', 'Energy & Power monitor', 'Energy', 'KWh consumption load analytics.', 6, 3, 'EnergyWidget', 900, '{"time_range":"7d"}', false),
('TOP_VENDORS', 'Top Active Vendors', 'Finance', 'Contract rankings by value and deliverables.', 4, 3, 'VendorsWidget', 3600, '{}', false);

-- 2. Layout configuration mapping table
CREATE TABLE public.dashboard_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role_name TEXT REFERENCES public.roles(name) ON DELETE CASCADE, -- layout per role
    department_id UUID REFERENCES public.master_values(id) ON DELETE SET NULL, -- layout per department
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- layout overrides per user
    desktop_layout JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of { widget_key, x, y, w, h }
    tablet_layout JSONB NOT NULL DEFAULT '[]'::jsonb,
    mobile_layout JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_default BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (company_id, role_name, department_id, user_id)
);

-- Seed default layout configurations for Super Admin and Admin Manager profiles
INSERT INTO public.dashboard_layouts (company_id, role_name, desktop_layout, tablet_layout, mobile_layout, is_default)
SELECT 
    c.id, 
    'Super Admin', 
    '[{"widget_key":"OPEN_TICKETS","x":0,"y":0,"w":3,"h":2},{"widget_key":"TODAYS_VISITORS","x":3,"y":0,"w":3,"h":2},{"widget_key":"ATTENDANCE_SUMMARY","x":6,"y":0,"w":6,"h":2},{"widget_key":"PENDING_PURCHASE","x":0,"y":2,"w":6,"h":3},{"widget_key":"ENERGY_MONITOR","x":6,"y":2,"w":6,"h":3}]'::jsonb,
    '[{"widget_key":"OPEN_TICKETS","x":0,"y":0,"w":4,"h":2},{"widget_key":"TODAYS_VISITORS","x":4,"y":0,"w":4,"h":2},{"widget_key":"ATTENDANCE_SUMMARY","x":0,"y":2,"w":8,"h":2}]'::jsonb,
    '[{"widget_key":"OPEN_TICKETS","x":0,"y":0,"w":12,"h":2},{"widget_key":"TODAYS_VISITORS","x":0,"y":2,"w":12,"h":2}]'::jsonb,
    true
FROM public.companies c;

INSERT INTO public.dashboard_layouts (company_id, role_name, desktop_layout, tablet_layout, mobile_layout, is_default)
SELECT 
    c.id, 
    'Admin Manager', 
    '[{"widget_key":"OPEN_TICKETS","x":0,"y":0,"w":3,"h":2},{"widget_key":"TODAYS_VISITORS","x":3,"y":0,"w":3,"h":2},{"widget_key":"STOCK_LEVELS","x":6,"y":0,"w":6,"h":3},{"widget_key":"PENDING_PURCHASE","x":0,"y":2,"w":6,"h":3}]'::jsonb,
    '[{"widget_key":"OPEN_TICKETS","x":0,"y":0,"w":4,"h":2},{"widget_key":"TODAYS_VISITORS","x":4,"y":0,"w":4,"h":2}]'::jsonb,
    '[{"widget_key":"OPEN_TICKETS","x":0,"y":0,"w":12,"h":2}]'::jsonb,
    true
FROM public.companies c;

-- Enable Row Level Security
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Clean existing policies to prevent collision conflicts on re-runs
DROP POLICY IF EXISTS "Allow public select dashboard_widgets" ON public.dashboard_widgets;
DROP POLICY IF EXISTS "Allow public select dashboard_layouts" ON public.dashboard_layouts;
DROP POLICY IF EXISTS "Allow write access for all admin actions dashboard_widgets" ON public.dashboard_widgets;
DROP POLICY IF EXISTS "Allow write access for all admin actions dashboard_layouts" ON public.dashboard_layouts;

-- Allow all users to read widgets and layouts config
CREATE POLICY "Allow public select dashboard_widgets" ON public.dashboard_widgets FOR SELECT USING (TRUE);
CREATE POLICY "Allow public select dashboard_layouts" ON public.dashboard_layouts FOR SELECT USING (TRUE);

-- Allow admins write operations
CREATE POLICY "Allow write access for all admin actions dashboard_widgets" ON public.dashboard_widgets FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow write access for all admin actions dashboard_layouts" ON public.dashboard_layouts FOR ALL USING (TRUE) WITH CHECK (TRUE);
