-- Migration: OCR Engine v2 Schema Enhancement
-- Create OCR Profiles Table
CREATE TABLE IF NOT EXISTS public.energy_meter_ocr_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'UGVCL Smart Meter', 'DG Generator'
    min_digits INTEGER NOT NULL DEFAULT 5,
    max_digits INTEGER NOT NULL DEFAULT 9,
    regex_pattern VARCHAR(100) NOT NULL DEFAULT '\d{5,9}',
    display_position JSONB, -- display bounding box settings for backend crop
    threshold_type VARCHAR(50) DEFAULT 'adaptive',
    allowed_multiplier NUMERIC NOT NULL DEFAULT 3.0, -- Configurable smart validation multiplier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on OCR Profiles
ALTER TABLE public.energy_meter_ocr_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read energy_ocr_profiles for everyone authenticated" ON public.energy_meter_ocr_profiles 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow write energy_ocr_profiles for Super Admin" ON public.energy_meter_ocr_profiles 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('Super Admin', 'Admin Manager')
    )
);

-- Link energy_meters to OCR profiles
ALTER TABLE public.energy_meters 
ADD COLUMN IF NOT EXISTS ocr_profile_id UUID REFERENCES public.energy_meter_ocr_profiles(id) ON DELETE SET NULL;

-- Update energy_meter_readings with audit, duplicate hash, and cropped image columns
ALTER TABLE public.energy_meter_readings
ADD COLUMN IF NOT EXISTS cropped_photo_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ocr_engine VARCHAR(100),
ADD COLUMN IF NOT EXISTS image_hash VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) CHECK (review_status IN ('Approved', 'Rejected', 'Edited')) DEFAULT 'Approved';

-- Add index on image_hash for instant duplicates lookup
CREATE INDEX IF NOT EXISTS idx_energy_readings_image_hash ON public.energy_meter_readings(image_hash);

-- Seed default OCR profiles
INSERT INTO public.energy_meter_ocr_profiles (profile_name, min_digits, max_digits, regex_pattern, allowed_multiplier)
VALUES 
('UGVCL Smart Meter', 6, 8, '\d{6,8}', 3.0),
('DG Generator Meter', 5, 8, '\d{5,8}', 5.0)
ON CONFLICT (profile_name) DO NOTHING;

-- Link seeded meters to profiles dynamically
UPDATE public.energy_meters 
SET ocr_profile_id = (SELECT id FROM public.energy_meter_ocr_profiles WHERE profile_name = 'UGVCL Smart Meter' LIMIT 1)
WHERE meter_type = 'UGVCL';

UPDATE public.energy_meters 
SET ocr_profile_id = (SELECT id FROM public.energy_meter_ocr_profiles WHERE profile_name = 'DG Generator Meter' LIMIT 1)
WHERE meter_type = 'Generator';
