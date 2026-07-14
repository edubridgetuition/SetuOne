-- SetuOne Database Schema - Purchase Requisition Payload Migration (21_RequisitionPayload.sql)
ALTER TABLE public.purchase_requests ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;
