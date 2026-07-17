-- SetuOne Database Schema Property Tenants Migration (23_PropertyTenantsMigration.sql)
-- Target Platform: Supabase / PostgreSQL
-- Description: Creates the property_tenants table, configures RLS isolation, and seeds mock occupant data.

-- =========================================================================
-- 1. TABLE CREATION
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.property_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.hired_properties(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    room_no TEXT,
    phone TEXT,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rent_status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (rent_status IN ('Paid', 'Unpaid', 'Pending')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.property_tenants IS 'Tenants or occupants staying in hired flats/guest houses.';

-- =========================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE public.property_tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS property_tenants_isolation_policy ON public.property_tenants;

CREATE POLICY property_tenants_isolation_policy ON public.property_tenants
    FOR ALL USING (
        company_id = public.get_user_company(auth.uid()) 
        OR public.get_user_role_name(auth.uid()) = 'Super Admin'
    );

-- =========================================================================
-- 3. SEED INITIAL MOCK DATA
-- =========================================================================
DO $$
DECLARE
    target_company_id UUID;
    target_property_id UUID;
BEGIN
    -- Resolve company
    SELECT id INTO target_company_id FROM public.companies WHERE name = 'On2Cook Pvt Ltd' LIMIT 1;
    IF target_company_id IS NULL THEN
        SELECT id INTO target_company_id FROM public.companies LIMIT 1;
    END IF;

    IF target_company_id IS NOT NULL THEN
        -- Insert a sample hired property if none exists
        INSERT INTO public.hired_properties (company_id, name, type, address, owner_name, monthly_rent, status)
        VALUES (target_company_id, 'Orion Residency', 'Flat', 'Orion Complex, Phase 1', 'Suresh Kumar', 28000.00, 'Occupied')
        ON CONFLICT DO NOTHING;

        SELECT id INTO target_property_id FROM public.hired_properties WHERE company_id = target_company_id LIMIT 1;

        -- Insert target sample occupant (Jesvita Fernandes)
        INSERT INTO public.property_tenants (company_id, property_id, full_name, room_no, phone, joining_date, rent_status, status)
        VALUES (target_company_id, target_property_id, 'Jesvita Fernandes', '31', '+91 99887 76655', '2024-02-05', 'Paid', 'Active')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
