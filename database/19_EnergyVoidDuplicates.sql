-- Migration: 19_EnergyVoidDuplicates.sql
-- Description: Adds is_void column, auto-voids duplicate readings for same day/slot,
-- creates a unique partial index for one slot per day, and updates the energy consumption summary view.

BEGIN;

-- 1. Add is_void column to handle voided duplicates
ALTER TABLE public.energy_meter_readings
ADD COLUMN IF NOT EXISTS is_void BOOLEAN NOT NULL DEFAULT false;

-- 2. Deduplicate existing records by setting oldest to void and keeping the newest (order by created_at desc)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY meter_id, (reading_datetime AT TIME ZONE 'Asia/Kolkata')::date, reading_slot
      ORDER BY created_at DESC, reading_datetime DESC, id DESC
    ) AS rn
  FROM public.energy_meter_readings
  WHERE is_void = false
)
UPDATE public.energy_meter_readings
SET is_void = true,
    remarks = COALESCE(remarks, '') || ' | Auto-voided duplicate slot reading'
FROM ranked
WHERE public.energy_meter_readings.id = ranked.id
  AND ranked.rn > 1;

-- 3. Create helper function for timezone-safe date extraction (needed to satisfy PostgreSQL IMMUTABLE requirements for index expressions)
CREATE OR REPLACE FUNCTION public.get_kolkata_date(dt TIMESTAMPTZ)
RETURNS DATE AS $$
  SELECT (dt AT TIME ZONE 'Asia/Kolkata')::date;
$$ LANGUAGE sql IMMUTABLE;

-- 4. Create unique constraint index so that database blocks duplicate slot inserts on same day
CREATE UNIQUE INDEX IF NOT EXISTS idx_energy_readings_one_slot_per_day
ON public.energy_meter_readings (
  meter_id,
  public.get_kolkata_date(reading_datetime),
  reading_slot
)
WHERE is_void = false;

-- 5. Re-create the consumption summary view to filter out voided readings and use the correct Kolkata timezone
CREATE OR REPLACE VIEW public.energy_consumption_summary AS
WITH ordered_readings AS (
  SELECT
    r.*,
    (r.reading_datetime AT TIME ZONE 'Asia/Kolkata')::date AS reading_date,
    LAG(r.confirmed_value) OVER (
      PARTITION BY r.meter_id
      ORDER BY r.reading_datetime, r.created_at, r.id
    ) AS prev_value
  FROM public.energy_meter_readings r
  WHERE r.is_void = false
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
  CASE WHEN o.confirmed_value >= COALESCE(o.prev_value, m.initial_reading, 0)
    THEN o.confirmed_value - COALESCE(o.prev_value, m.initial_reading, 0)
    ELSE NULL
  END AS consumption_units,
  m.tariff_rate,
  CASE WHEN o.confirmed_value >= COALESCE(o.prev_value, m.initial_reading, 0)
    THEN (o.confirmed_value - COALESCE(o.prev_value, m.initial_reading, 0)) * m.tariff_rate
    ELSE NULL
  END AS calculated_cost,
  o.confirmed_value >= COALESCE(o.prev_value, m.initial_reading, 0) AS reading_valid,
  o.reading_status,
  o.ocr_raw_text,
  o.ocr_provider,
  o.photo_document_id,
  o.uploaded_by,
  o.is_locked,
  o.remarks,
  o.created_at,
  o.reading_date
FROM ordered_readings o
JOIN public.energy_meters m ON o.meter_id = m.id;

COMMIT;
