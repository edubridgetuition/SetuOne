-- Migration: Asset Barcode & Depreciation Lifecycle Module (20_AssetLifecycle.sql)
-- Target Platform: Supabase / PostgreSQL

-- 1. ADD EXTENDED COLUMNS TO public.assets
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS purchase_cost NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS purchase_qty INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS invoice_no TEXT,
ADD COLUMN IF NOT EXISTS invoice_date DATE,
ADD COLUMN IF NOT EXISTS invoice_company TEXT,
ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS cgst_rate NUMERIC(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS sgst_rate NUMERIC(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS igst_rate NUMERIC(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS igst_amount NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS gst_type TEXT CHECK (gst_type IN ('CGST_SGST', 'IGST')),
ADD COLUMN IF NOT EXISTS depreciation_rate NUMERIC(5, 2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS depreciation_method TEXT DEFAULT 'SLM' CHECK (depreciation_method IN ('SLM', 'WDV')),
ADD COLUMN IF NOT EXISTS short_life_years INTEGER,
ADD COLUMN IF NOT EXISTS dispose_date DATE,
ADD COLUMN IF NOT EXISTS dispose_reason TEXT,
ADD COLUMN IF NOT EXISTS is_stolen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS make_brand TEXT,
ADD COLUMN IF NOT EXISTS room_number TEXT,
ADD COLUMN IF NOT EXISTS floor_number TEXT;

-- 2. UPDATE STATUS CHECK CONSTRAINT ON public.assets
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_status_check;
ALTER TABLE public.assets ADD CONSTRAINT assets_status_check CHECK (status IN ('Active', 'Repair', 'Scrapped', 'Inactive', 'Disposed', 'Stolen'));

-- 3. CREATE ASSET TRANSFERS LOG TABLE
CREATE TABLE IF NOT EXISTS public.asset_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    transfer_type TEXT NOT NULL CHECK (transfer_type IN ('Internal', 'External')),
    sister_company TEXT,
    destination_branch TEXT,
    shipped_state TEXT,
    old_location TEXT,
    new_location TEXT,
    notes TEXT,
    transfer_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ENABLE RLS FOR public.asset_transfers
ALTER TABLE public.asset_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users" 
ON public.asset_transfers 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert access for authenticated users" 
ON public.asset_transfers 
FOR INSERT 
TO authenticated 
WITH CHECK (true);
