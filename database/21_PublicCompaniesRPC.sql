-- Create security definer function to return all company names
-- This function runs with Super Admin privileges, bypassing RLS to let visitors select their company during signup.
CREATE OR REPLACE FUNCTION public.get_public_companies()
RETURNS TABLE (id UUID, name TEXT) AS $$
BEGIN
    RETURN QUERY SELECT c.id, c.name FROM public.companies c ORDER BY c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_public_companies() TO anon, authenticated;
