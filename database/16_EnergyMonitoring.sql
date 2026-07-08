-- Table 1: energy_meters
CREATE TABLE IF NOT EXISTS public.energy_meters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    meter_name VARCHAR(100) NOT NULL,
    meter_code VARCHAR(100) UNIQUE NOT NULL,
    meter_identifier VARCHAR(100) UNIQUE NOT NULL, -- Physical ID number
    consumer_account_number VARCHAR(100), -- Electricity Board Number
    serial_number VARCHAR(100),
    meter_type VARCHAR(50), -- e.g., 'UGVCL', 'Generator', 'Solar', 'Water', 'Gas', 'Custom'
    manufacturer VARCHAR(100),
    capacity NUMERIC,
    unit VARCHAR(10) DEFAULT 'KWh',
    tariff_rate NUMERIC NOT NULL DEFAULT 8.50, -- Tariff in ₹ / Unit
    initial_reading NUMERIC NOT NULL DEFAULT 0,
    installation_date DATE,
    last_calibration DATE,
    next_calibration DATE,
    status VARCHAR(50) DEFAULT 'Active',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: energy_meter_readings
CREATE TABLE IF NOT EXISTS public.energy_meter_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES public.energy_meters(id) ON DELETE CASCADE,
    reading_datetime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reading_slot VARCHAR(50) NOT NULL CHECK (reading_slot IN ('Morning', 'Evening')),
    capture_mode VARCHAR(50) NOT NULL CHECK (capture_mode IN ('Manual', 'OCR', 'IoT')),
    reading_source VARCHAR(50) NOT NULL CHECK (reading_source IN ('Camera', 'Gallery', 'API', 'IoT', 'Manual')),
    reading_value NUMERIC NOT NULL,
    ocr_value NUMERIC,
    ocr_raw_text TEXT, -- Stores raw unparsed text output for future debugging
    ocr_provider VARCHAR(50), -- e.g., 'Mock OCR', 'Tesseract', 'Google Vision', 'OpenAI Vision', 'Azure Vision'
    confirmed_value NUMERIC NOT NULL,
    ocr_confidence NUMERIC,
    reading_status VARCHAR(50) DEFAULT 'Pending Confirmation' CHECK (reading_status IN ('Pending OCR', 'Pending Confirmation', 'Confirmed', 'Rejected')),
    photo_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    edited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: energy_consumption_summary (VIEW)
CREATE OR REPLACE VIEW public.energy_consumption_summary AS
WITH ordered_readings AS (
    SELECT 
        r.*,
        LAG(r.confirmed_value) OVER (PARTITION BY r.meter_id ORDER BY r.reading_datetime) AS prev_value,
        LAG(r.reading_datetime) OVER (PARTITION BY r.meter_id ORDER BY r.reading_datetime) AS prev_datetime
    FROM public.energy_meter_readings r
)
SELECT 
    o.id AS reading_id,
    o.meter_id,
    m.meter_name,
    m.meter_code,
    m.meter_identifier,
    m.consumer_account_number,
    m.company_id,
    m.branch_id,
    m.building_id,
    o.reading_datetime,
    o.reading_slot,
    o.capture_mode,
    o.reading_source,
    o.confirmed_value AS current_reading,
    COALESCE(o.prev_value, m.initial_reading, 0) AS previous_reading,
    CASE 
        WHEN o.confirmed_value >= COALESCE(o.prev_value, m.initial_reading, 0) 
        THEN (o.confirmed_value - COALESCE(o.prev_value, m.initial_reading, 0))
        ELSE NULL 
    END AS consumption_units,
    m.tariff_rate,
    CASE 
        WHEN o.confirmed_value >= COALESCE(o.prev_value, m.initial_reading, 0) 
        THEN ((o.confirmed_value - COALESCE(o.prev_value, m.initial_reading, 0)) * m.tariff_rate)
        ELSE NULL 
    END AS calculated_cost,
    CASE 
        WHEN o.confirmed_value >= COALESCE(o.prev_value, m.initial_reading, 0) THEN TRUE 
        ELSE FALSE 
    END AS reading_valid,
    o.reading_status,
    o.ocr_raw_text,
    o.ocr_provider,
    o.photo_document_id,
    o.uploaded_by,
    o.is_locked,
    o.remarks,
    o.created_at
FROM ordered_readings o
JOIN public.energy_meters m ON o.meter_id = m.id;

-- Enable Row Level Security
ALTER TABLE public.energy_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_meter_readings ENABLE ROW LEVEL SECURITY;

-- Drop previous policies to prevent duplicates on migration re-run
DROP POLICY IF EXISTS "Allow select energy_meters based on company_id" ON public.energy_meters;
DROP POLICY IF EXISTS "Allow write energy_meters based on company_id" ON public.energy_meters;
DROP POLICY IF EXISTS "Allow select energy_readings based on company_id" ON public.energy_meter_readings;
DROP POLICY IF EXISTS "Allow write energy_readings based on company_id" ON public.energy_meter_readings;

-- Dynamic Tenant RLS Policies using public.get_user_company helper (No OR TRUE bypasses)
CREATE POLICY "Allow select energy_meters based on company_id" ON public.energy_meters FOR SELECT 
USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Allow write energy_meters based on company_id" ON public.energy_meters FOR ALL 
USING (company_id = public.get_user_company(auth.uid()))
WITH CHECK (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Allow select energy_readings based on company_id" ON public.energy_meter_readings FOR SELECT 
USING (meter_id IN (
    SELECT id FROM public.energy_meters 
    WHERE company_id = public.get_user_company(auth.uid())
));

CREATE POLICY "Allow write energy_readings based on company_id" ON public.energy_meter_readings FOR ALL 
USING (meter_id IN (
    SELECT id FROM public.energy_meters 
    WHERE company_id = public.get_user_company(auth.uid())
))
WITH CHECK (meter_id IN (
    SELECT id FROM public.energy_meters 
    WHERE company_id = public.get_user_company(auth.uid())
));

-- Seed default On2Cook meters dynamically FOR EACH COMPANY (Conflict Safe)
INSERT INTO public.energy_meters (company_id, meter_name, meter_code, meter_identifier, meter_type, serial_number, is_active)
SELECT c.id, 'UGVCL Meter 1', 'UGVCL-01', 'MTR-ID-UGVCL1-' || substring(c.id::text, 1, 4), 'UGVCL', 'SN-GRID-8812-' || substring(c.id::text, 1, 4), true 
FROM public.companies c
WHERE NOT EXISTS (
    SELECT 1 FROM public.energy_meters WHERE meter_code = 'UGVCL-01' AND company_id = c.id
);

INSERT INTO public.energy_meters (company_id, meter_name, meter_code, meter_identifier, meter_type, serial_number, is_active)
SELECT c.id, 'UGVCL Meter 2', 'UGVCL-02', 'MTR-ID-UGVCL2-' || substring(c.id::text, 1, 4), 'UGVCL', 'SN-GRID-5541-' || substring(c.id::text, 1, 4), true 
FROM public.companies c
WHERE NOT EXISTS (
    SELECT 1 FROM public.energy_meters WHERE meter_code = 'UGVCL-02' AND company_id = c.id
);

INSERT INTO public.energy_meters (company_id, meter_name, meter_code, meter_identifier, meter_type, serial_number, is_active)
SELECT c.id, 'UGVCL Meter 3', 'UGVCL-03', 'MTR-ID-UGVCL3-' || substring(c.id::text, 1, 4), 'UGVCL', 'SN-GRID-9921-' || substring(c.id::text, 1, 4), true 
FROM public.companies c
WHERE NOT EXISTS (
    SELECT 1 FROM public.energy_meters WHERE meter_code = 'UGVCL-03' AND company_id = c.id
);

INSERT INTO public.energy_meters (company_id, meter_name, meter_code, meter_identifier, meter_type, serial_number, is_active)
SELECT c.id, 'DG Meter', 'DG-01', 'MTR-ID-DG1-' || substring(c.id::text, 1, 4), 'Generator', 'SN-DG-2284-' || substring(c.id::text, 1, 4), true 
FROM public.companies c
WHERE NOT EXISTS (
    SELECT 1 FROM public.energy_meters WHERE meter_code = 'DG-01' AND company_id = c.id
);
