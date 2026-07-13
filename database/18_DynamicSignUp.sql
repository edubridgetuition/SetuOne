-- Migration: Dynamic Signup Company Creation Trigger (18_DynamicSignUp.sql)
-- Run this in your Supabase SQL Editor to support onboarding of new tenant companies.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_role_id UUID;
    target_company_id UUID;
    target_branch_id UUID;
    metadata_company_name TEXT;
    default_tenant_id UUID;
BEGIN
    -- 1. Read company_name from metadata if provided
    metadata_company_name := NEW.raw_user_meta_data->>'company_name';
    
    IF metadata_company_name IS NOT NULL AND metadata_company_name <> '' THEN
        -- Check if company already exists
        SELECT id INTO target_company_id FROM public.companies WHERE name = metadata_company_name LIMIT 1;
        
        -- If it does not exist, create it dynamically
        IF target_company_id IS NULL THEN
            -- Fetch default tenant (e.g. first available)
            SELECT id INTO default_tenant_id FROM public.tenants LIMIT 1;
            
            -- Insert new Company
            INSERT INTO public.companies (tenant_id, name)
            VALUES (default_tenant_id, metadata_company_name)
            RETURNING id INTO target_company_id;
            
            -- Insert default Branch for this new company
            INSERT INTO public.branches (company_id, name, city)
            VALUES (target_company_id, 'Headquarters', 'Default City')
            RETURNING id INTO target_branch_id;
        ELSE
            -- Resolve first branch of existing company
            SELECT id INTO target_branch_id FROM public.branches WHERE company_id = target_company_id LIMIT 1;
        END IF;
    END IF;

    -- 2. Fallbacks if target_company_id is still null
    IF target_company_id IS NULL THEN
        target_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;
        IF target_company_id IS NULL THEN
            SELECT id INTO target_company_id FROM public.companies LIMIT 1;
        END IF;
    END IF;

    -- 3. Fallbacks if target_branch_id is still null
    IF target_branch_id IS NULL THEN
        target_branch_id := (NEW.raw_user_meta_data->>'branch_id')::UUID;
        IF target_branch_id IS NULL THEN
            SELECT id INTO target_branch_id FROM public.branches WHERE company_id = target_company_id LIMIT 1;
        END IF;
    END IF;

    -- 4. Resolve role_id matching user's metadata role or assign 'Employee'
    SELECT id INTO target_role_id 
    FROM public.roles 
    WHERE name = COALESCE(NEW.raw_user_meta_data->>'role', 'Employee')
    LIMIT 1;

    -- If role_id is not found, fallback to any default role
    IF target_role_id IS NULL THEN
        SELECT id INTO target_role_id FROM public.roles LIMIT 1;
    END IF;

    INSERT INTO public.profiles (id, company_id, branch_id, email, full_name, role_id)
    VALUES (
        NEW.id,
        target_company_id,
        target_branch_id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'System User'),
        target_role_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
