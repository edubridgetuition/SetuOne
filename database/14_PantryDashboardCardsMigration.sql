-- 1. Create Dynamic Master Definition for Pantry Dashboard Cards
INSERT INTO public.master_definitions (company_id, master_key, master_name)
SELECT id, 'PANTRY_DASHBOARD_CARDS', 'Pantry Dashboard Cards' FROM public.companies ON CONFLICT (company_id, master_key) DO NOTHING;

-- 2. Seed Master Values for Pantry Dashboard Cards (excluding Sugar by default)
INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'WATER_BOTTLE', 'Water Bottle (20L)'
FROM public.master_definitions d WHERE d.master_key = 'PANTRY_DASHBOARD_CARDS'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'WATER_JUG', 'Water Jug'
FROM public.master_definitions d WHERE d.master_key = 'PANTRY_DASHBOARD_CARDS'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'COFFEE_BEANS', 'Coffee Beans'
FROM public.master_definitions d WHERE d.master_key = 'PANTRY_DASHBOARD_CARDS'
ON CONFLICT (definition_id, value_code) DO NOTHING;

INSERT INTO public.master_values (definition_id, value_code, value_label)
SELECT d.id, 'MILK_PACKET', 'Milk Packet'
FROM public.master_definitions d WHERE d.master_key = 'PANTRY_DASHBOARD_CARDS'
ON CONFLICT (definition_id, value_code) DO NOTHING;
