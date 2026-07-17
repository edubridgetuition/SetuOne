-- SetuOne Database Schema Hired Flats & Landlord Agreements Migration (22_GuestHouseMigration.sql)
-- Target Platform: Supabase / PostgreSQL
-- Description: Creates the hired_properties table for tracking rented flats, guest houses, monthly rents, deposits, agreements, and tenant isolation policies.

-- =========================================================================
-- 1. TABLE CREATION
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.hired_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Flat', 'Guest House', 'Villa', 'Office', 'Other')),
    address TEXT NOT NULL,
    owner_name TEXT,
    owner_contact TEXT,
    monthly_rent NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    security_deposit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    agreement_start_date DATE,
    agreement_end_date DATE,
    status TEXT NOT NULL DEFAULT 'Vacant' CHECK (status IN ('Occupied', 'Vacant', 'Under Maintenance', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.hired_properties IS 'Hired flats, guest houses, and landlord rent agreements managed per company.';

-- =========================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE public.hired_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hired_properties_isolation_policy ON public.hired_properties;

CREATE POLICY hired_properties_isolation_policy ON public.hired_properties
    FOR ALL USING (
        company_id = public.get_user_company(auth.uid()) 
        OR public.get_user_role_name(auth.uid()) = 'Super Admin'
    );
