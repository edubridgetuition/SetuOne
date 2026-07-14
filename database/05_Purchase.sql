-- SetuOne Database Schema Purchase & Inventory Module Configuration (05_Purchase.sql)
-- Target Platform: Supabase / PostgreSQL
-- Description: Step 4 of SetuOne ERP. Initializes dynamic Purchase workflow (PR -> Quotes -> PO -> GRN -> Invoice -> Payment) and 3-table Inventory management.
-- Note: Decoupled from core schema structures (01_Master.sql) and static system configurations (02_SeedData.sql).
-- Note: All seed elements dynamically resolve FKs from existing tables.

-- =========================================================================
-- 0. LEGACY PROTOTYPE CLEANUP
-- =========================================================================

DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.invoice_items CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.grn_items CASCADE;
DROP TABLE IF EXISTS public.grns CASCADE;
DROP TABLE IF EXISTS public.purchase_order_items CASCADE;
DROP TABLE IF EXISTS public.purchase_orders CASCADE;
DROP TABLE IF EXISTS public.quotation_comparisons CASCADE;
DROP TABLE IF EXISTS public.quotation_items CASCADE;
DROP TABLE IF EXISTS public.quotations CASCADE;
DROP TABLE IF EXISTS public.purchase_request_items CASCADE;
DROP TABLE IF EXISTS public.purchase_requests CASCADE;

DROP TABLE IF EXISTS public.inventory_transactions CASCADE;
DROP TABLE IF EXISTS public.inventory_stock CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;

-- =========================================================================
-- 1. PROCUREMENT WORKFLOW TABLES
-- =========================================================================

-- 1.1. PURCHASE REQUESTS
CREATE TABLE public.purchase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    request_no TEXT NOT NULL UNIQUE,
    raised_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    estimated_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending Approval', 'Approved', 'Rejected', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2. PURCHASE REQUEST ITEMS (Line Items)
CREATE TABLE public.purchase_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    target_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00
);

-- 1.3. VENDOR QUOTATIONS
CREATE TABLE public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4. QUOTATION ITEMS (Line Items)
CREATE TABLE public.quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- 1.5. QUOTATION COMPARISONS & SELECTION
CREATE TABLE public.quotation_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
    selected_quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    comparison_matrix JSONB NOT NULL DEFAULT '{}'::jsonb,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.6. PURCHASE ORDERS
CREATE TABLE public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE RESTRICT,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
    po_no TEXT NOT NULL UNIQUE,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Issued' CHECK (status IN ('Issued', 'Delivered', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.7. PURCHASE ORDER ITEMS (Line Items)
CREATE TABLE public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- 1.8. GOODS RECEIVED NOTES (GRN)
CREATE TABLE public.grns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE RESTRICT,
    grn_no TEXT NOT NULL UNIQUE,
    received_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    received_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'Pending Verification' CHECK (status IN ('Pending Verification', 'Verified', 'Rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.9. GOODS RECEIVED LINE ITEMS
CREATE TABLE public.grn_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID NOT NULL REFERENCES public.grns(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity_ordered NUMERIC(10, 2) NOT NULL,
    quantity_received NUMERIC(10, 2) NOT NULL,
    quantity_accepted NUMERIC(10, 2) NOT NULL
);

-- 1.10. VENDOR INVOICES
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE RESTRICT,
    invoice_no TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Partially Paid', 'Paid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.11. INVOICE ITEMS (Line Items)
CREATE TABLE public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- 1.12. PAYMENTS LEDGER
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
    amount_paid NUMERIC(15, 2) NOT NULL,
    payment_reference TEXT,
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Bank Transfer', 'Cheque', 'UPI', 'Cash')),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 2. WAREHOUSE INVENTORY TABLES (3-Table Ledger System)
-- =========================================================================

-- 2.1. INVENTORY ITEMS (Master catalog of items)
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit TEXT NOT NULL, -- e.g. L, rolls, pcs
    reorder_level NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, name)
);

-- 2.2. INVENTORY STOCK (Ledger balances per branch office)
CREATE TABLE public.inventory_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    closing_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (branch_id, item_id)
);

-- 2.3. INVENTORY TRANSACTIONS (Audit ledger of Stock movements)
CREATE TABLE public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('In', 'Out')),
    quantity NUMERIC(10, 2) NOT NULL,
    reference_id UUID, -- links to GRN ID or Issue document ID
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 3. PERFORMANCE INDEXES
-- =========================================================================

CREATE INDEX idx_pr_company ON public.purchase_requests(company_id);
CREATE INDEX idx_pr_items_request ON public.purchase_request_items(request_id);

CREATE INDEX idx_quotes_request ON public.quotations(request_id);
CREATE INDEX idx_quotes_vendor ON public.quotations(vendor_id);
CREATE INDEX idx_quote_items ON public.quotation_items(quotation_id);

CREATE INDEX idx_po_request ON public.purchase_orders(request_id);
CREATE INDEX idx_po_vendor ON public.purchase_orders(vendor_id);
CREATE INDEX idx_po_items ON public.purchase_order_items(po_id);

CREATE INDEX idx_grn_po ON public.grns(po_id);
CREATE INDEX idx_grn_items ON public.grn_items(grn_id);

CREATE INDEX idx_invoices_po ON public.invoices(po_id);
CREATE INDEX idx_invoice_items ON public.invoice_items(invoice_id);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);

CREATE INDEX idx_inv_items_company ON public.inventory_items(company_id);
CREATE INDEX idx_inv_stock_branch ON public.inventory_stock(branch_id);
CREATE INDEX idx_inv_stock_item ON public.inventory_stock(item_id);
CREATE INDEX idx_inv_trans_item_date ON public.inventory_transactions(item_id, created_at DESC);

-- =========================================================================
-- 4. TRIGGERS ASSIGNMENT
-- =========================================================================

CREATE TRIGGER update_purchase_requests_modtime BEFORE UPDATE ON public.purchase_requests FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_modtime BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_grns_modtime BEFORE UPDATE ON public.grns FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_invoices_modtime BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_inventory_items_modtime BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_inventory_stock_modtime BEFORE UPDATE ON public.inventory_stock FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- =========================================================================
-- 5. SEED DATA GENERATION (Dynamic Subquery Lookups)
-- =========================================================================

-- 5.1. Seed Inventory Items
INSERT INTO public.inventory_items (company_id, name, unit, reorder_level)
SELECT id, 'Cleaning Chemicals', 'L', 30.00 FROM public.companies WHERE name = 'On2Cook Pvt Ltd' UNION ALL
SELECT id, 'Tissue Paper Rolls', 'rolls', 100.00 FROM public.companies WHERE name = 'On2Cook Pvt Ltd' UNION ALL
SELECT id, 'Garbage Bags', 'pcs', 600.00 FROM public.companies WHERE name = 'On2Cook Pvt Ltd'
ON CONFLICT (company_id, name) DO NOTHING;

-- 5.2. Seed Inventory Stock ledger balances
INSERT INTO public.inventory_stock (branch_id, item_id, closing_stock)
SELECT 
    b.id as branch_id,
    i.id as item_id,
    47.00 as closing_stock
FROM public.branches b
CROSS JOIN public.inventory_items i
WHERE b.name = 'Ahmedabad Branch' AND i.name = 'Cleaning Chemicals'
  AND NOT EXISTS (SELECT 1 FROM public.inventory_stock WHERE branch_id = b.id AND item_id = i.id);

INSERT INTO public.inventory_stock (branch_id, item_id, closing_stock)
SELECT 
    b.id as branch_id,
    i.id as item_id,
    234.00 as closing_stock
FROM public.branches b
CROSS JOIN public.inventory_items i
WHERE b.name = 'Ahmedabad Branch' AND i.name = 'Tissue Paper Rolls'
  AND NOT EXISTS (SELECT 1 FROM public.inventory_stock WHERE branch_id = b.id AND item_id = i.id);

-- 5.3. Seed Inventory Transaction Logs
INSERT INTO public.inventory_transactions (item_id, branch_id, transaction_type, quantity)
SELECT 
    i.id as item_id,
    b.id as branch_id,
    'In' as transaction_type,
    47.00 as quantity
FROM public.inventory_items i
CROSS JOIN public.branches b
WHERE i.name = 'Cleaning Chemicals' AND b.name = 'Ahmedabad Branch'
  AND NOT EXISTS (SELECT 1 FROM public.inventory_transactions WHERE item_id = i.id AND branch_id = b.id);

-- 5.4. Seed Purchase Request (PR-501)
INSERT INTO public.purchase_requests (company_id, request_no, raised_by_profile_id, estimated_amount, status)
SELECT 
    c.id as company_id,
    'PR-501' as request_no,
    p.id as raised_by_profile_id,
    8500.00 as estimated_amount,
    'Approved' as status
FROM public.companies c
CROSS JOIN public.profiles p
WHERE c.name = 'On2Cook Pvt Ltd' AND p.email = 'manager@orion.test'
  AND NOT EXISTS (SELECT 1 FROM public.purchase_requests WHERE request_no = 'PR-501');

-- 5.5. Seed PR Items
INSERT INTO public.purchase_request_items (request_id, item_name, quantity, target_price)
SELECT 
    r.id as request_id,
    'Tissue Paper Rolls' as item_name,
    100.00 as quantity,
    85.00 as target_price
FROM public.purchase_requests r
WHERE r.request_no = 'PR-501'
  AND NOT EXISTS (SELECT 1 FROM public.purchase_request_items WHERE request_id = r.id AND item_name = 'Tissue Paper Rolls');

-- 5.6. Seed Vendor Quotation
INSERT INTO public.quotations (request_id, vendor_id, total_amount)
SELECT 
    r.id as request_id,
    v.id as vendor_id,
    8500.00 as total_amount
FROM public.purchase_requests r
CROSS JOIN public.vendors v
WHERE r.request_no = 'PR-501' AND v.name = 'CleanPro Services'
  AND NOT EXISTS (SELECT 1 FROM public.quotations WHERE request_id = r.id AND vendor_id = v.id);

-- 5.7. Seed Quotation Items
INSERT INTO public.quotation_items (quotation_id, item_name, quantity, unit_price)
SELECT 
    q.id as quotation_id,
    'Tissue Paper Rolls' as item_name,
    100.00 as quantity,
    85.00 as unit_price
FROM public.quotations q
JOIN public.purchase_requests r ON q.request_id = r.id
WHERE r.request_no = 'PR-501'
  AND NOT EXISTS (SELECT 1 FROM public.quotation_items WHERE quotation_id = q.id);

-- 5.8. Seed Quotation Comparison
INSERT INTO public.quotation_comparisons (request_id, selected_quotation_id, remarks)
SELECT 
    r.id as request_id,
    q.id as selected_quotation_id,
    'Lowest bidder matching specs.' as remarks
FROM public.purchase_requests r
JOIN public.quotations q ON q.request_id = r.id
WHERE r.request_no = 'PR-501'
  AND NOT EXISTS (SELECT 1 FROM public.quotation_comparisons WHERE request_id = r.id);

-- 5.9. Seed Purchase Order (PO)
INSERT INTO public.purchase_orders (request_id, vendor_id, po_no, total_amount, status)
SELECT 
    r.id as request_id,
    v.id as vendor_id,
    'PO-2026-001' as po_no,
    8500.00 as total_amount,
    'Issued' as status
FROM public.purchase_requests r
CROSS JOIN public.vendors v
WHERE r.request_no = 'PR-501' AND v.name = 'CleanPro Services'
  AND NOT EXISTS (SELECT 1 FROM public.purchase_orders WHERE po_no = 'PO-2026-001');

-- 5.10. Seed PO Items
INSERT INTO public.purchase_order_items (po_id, item_name, quantity, unit_price)
SELECT 
    po.id as po_id,
    'Tissue Paper Rolls' as item_name,
    100.00 as quantity,
    85.00 as unit_price
FROM public.purchase_orders po
WHERE po.po_no = 'PO-2026-001'
  AND NOT EXISTS (SELECT 1 FROM public.purchase_order_items WHERE po_id = po.id);

-- 5.11. Seed Goods Received Note (GRN)
INSERT INTO public.grns (po_id, grn_no, received_by_profile_id, status)
SELECT 
    po.id as po_id,
    'GRN-2026-101' as grn_no,
    p.id as received_by_profile_id,
    'Verified' as status
FROM public.purchase_orders po
CROSS JOIN public.profiles p
WHERE po.po_no = 'PO-2026-001' AND p.email = 'manager@orion.test'
  AND NOT EXISTS (SELECT 1 FROM public.grns WHERE grn_no = 'GRN-2026-101');

-- 5.12. Seed GRN Items
INSERT INTO public.grn_items (grn_id, item_name, quantity_ordered, quantity_received, quantity_accepted)
SELECT 
    grn.id as grn_id,
    'Tissue Paper Rolls' as item_name,
    100.00 as quantity_ordered,
    100.00 as quantity_received,
    100.00 as quantity_accepted
FROM public.grns grn
WHERE grn.grn_no = 'GRN-2026-101'
  AND NOT EXISTS (SELECT 1 FROM public.grn_items WHERE grn_id = grn.id);

-- 5.13. Seed Invoice
INSERT INTO public.invoices (po_id, invoice_no, amount, due_date, status)
SELECT 
    po.id as po_id,
    'INV-CLEAN-9921' as invoice_no,
    8500.00 as amount,
    '2026-07-30'::date as due_date,
    'Paid' as status
FROM public.purchase_orders po
WHERE po.po_no = 'PO-2026-001'
  AND NOT EXISTS (SELECT 1 FROM public.invoices WHERE invoice_no = 'INV-CLEAN-9921');

-- 5.14. Seed Invoice Items
INSERT INTO public.invoice_items (invoice_id, item_name, quantity, unit_price)
SELECT 
    inv.id as invoice_id,
    'Tissue Paper Rolls' as item_name,
    100.00 as quantity,
    85.00 as unit_price
FROM public.invoices inv
WHERE inv.invoice_no = 'INV-CLEAN-9921'
  AND NOT EXISTS (SELECT 1 FROM public.invoice_items WHERE invoice_id = inv.id);

-- 5.15. Seed Payment entry
INSERT INTO public.payments (invoice_id, amount_paid, payment_reference, payment_mode)
SELECT 
    inv.id as invoice_id,
    8500.00 as amount_paid,
    'TXN-94021588' as payment_reference,
    'Bank Transfer' as payment_mode
FROM public.invoices inv
WHERE inv.invoice_no = 'INV-CLEAN-9921'
  AND NOT EXISTS (SELECT 1 FROM public.payments WHERE invoice_id = inv.id);
