-- SetuOne Database Schema - Dynamic Masters Seed Migration (13_DynamicMastersSeedMigration.sql)
-- Target Platform: Supabase / PostgreSQL SQL Editor
-- Description: Seed dynamic master definitions and values to link to operational frontend dropdowns.

-- 1. Create Dynamic Master Definitions
INSERT INTO public.master_definitions (company_id, master_key, master_name)
SELECT id, 'PANTRY_ITEM_NAMES', 'Pantry Item Names' FROM public.companies ON CONFLICT (company_id, master_key) DO NOTHING;

INSERT INTO public.master_definitions (company_id, master_key, master_name)
SELECT id, 'TICKET_CATEGORIES', 'Ticket Categories' FROM public.companies ON CONFLICT (company_id, master_key) DO NOTHING;

INSERT INTO public.master_definitions (company_id, master_key, master_name)
SELECT id, 'VISITOR_PURPOSES', 'Visitor Purposes' FROM public.companies ON CONFLICT (company_id, master_key) DO NOTHING;

INSERT INTO public.master_definitions (company_id, master_key, master_name)
SELECT id, 'VEHICLE_TYPES', 'Vehicle Types' FROM public.companies ON CONFLICT (company_id, master_key) DO NOTHING;

INSERT INTO public.master_definitions (company_id, master_key, master_name)
SELECT id, 'VISITOR_ID_TYPES', 'Visitor ID Types' FROM public.companies ON CONFLICT (company_id, master_key) DO NOTHING;


-- 2. Seed Master Values for Pantry Item Names
INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'WATER_BOTTLE', 'Water Bottle (20L)'
FROM public.master_definitions d WHERE d.master_key = 'PANTRY_ITEM_NAMES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'WATER_JUG', 'Water Jug'
FROM public.master_definitions d WHERE d.master_key = 'PANTRY_ITEM_NAMES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'COFFEE_BEANS', 'Coffee Beans'
FROM public.master_definitions d WHERE d.master_key = 'PANTRY_ITEM_NAMES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'MILK_PACKET', 'Milk Packet'
FROM public.master_definitions d WHERE d.master_key = 'PANTRY_ITEM_NAMES'
ON CONFLICT (definition_id, value_code) DO NOTHING;


-- 3. Seed Master Values for Ticket Categories
INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'ELECTRICAL', 'Electrical Complaint'
FROM public.master_definitions d WHERE d.master_key = 'TICKET_CATEGORIES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'PLUMBING', 'Plumbing Complaint'
FROM public.master_definitions d WHERE d.master_key = 'TICKET_CATEGORIES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'HVAC', 'HVAC Complaint'
FROM public.master_definitions d WHERE d.master_key = 'TICKET_CATEGORIES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'CIVIL', 'Civil Complaint'
FROM public.master_definitions d WHERE d.master_key = 'TICKET_CATEGORIES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'HOUSEKEEPING', 'Housekeeping Complaint'
FROM public.master_definitions d WHERE d.master_key = 'TICKET_CATEGORIES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'IT', 'IT Complaint'
FROM public.master_definitions d WHERE d.master_key = 'TICKET_CATEGORIES'
ON CONFLICT (definition_id, value_code) DO NOTHING;


-- 4. Seed Master Values for Visitor Purposes
INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'MEETING', 'Meeting'
FROM public.master_definitions d WHERE d.master_key = 'VISITOR_PURPOSES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'INTERVIEW', 'Interview'
FROM public.master_definitions d WHERE d.master_key = 'VISITOR_PURPOSES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'VENDOR', 'Vendor Service'
FROM public.master_definitions d WHERE d.master_key = 'VISITOR_PURPOSES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'DELIVERY', 'Delivery'
FROM public.master_definitions d WHERE d.master_key = 'VISITOR_PURPOSES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'MAINTENANCE', 'Maintenance'
FROM public.master_definitions d WHERE d.master_key = 'VISITOR_PURPOSES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'GUEST', 'Guest'
FROM public.master_definitions d WHERE d.master_key = 'VISITOR_PURPOSES'
ON CONFLICT (definition_id, value_code) DO NOTHING;


-- 5. Seed Master Values for Vehicle Types
INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'NONE', 'None'
FROM public.master_definitions d WHERE d.master_key = 'VEHICLE_TYPES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'CAR', 'Car'
FROM public.master_definitions d WHERE d.master_key = 'VEHICLE_TYPES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'BIKE', 'Bike'
FROM public.master_definitions d WHERE d.master_key = 'VEHICLE_TYPES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'TRUCK', 'Truck'
FROM public.master_definitions d WHERE d.master_key = 'VEHICLE_TYPES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'CAB', 'Cab'
FROM public.master_definitions d WHERE d.master_key = 'VEHICLE_TYPES'
ON CONFLICT (definition_id, value_code) DO NOTHING;


-- 6. Seed Master Values for Visitor ID Types
INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'AADHAAR', 'Aadhaar'
FROM public.master_definitions d WHERE d.master_key = 'VISITOR_ID_TYPES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'DL', 'Driving License'
FROM public.master_definitions d WHERE d.master_key = 'VISITOR_ID_TYPES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'PASSPORT', 'Passport'
FROM public.master_definitions d WHERE d.master_key = 'VISITOR_ID_TYPES'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'PAN', 'PAN'
FROM public.master_definitions d WHERE d.master_key = 'VISITOR_ID_TYPES'
ON CONFLICT (definition_id, value_code) DO NOTHING;
