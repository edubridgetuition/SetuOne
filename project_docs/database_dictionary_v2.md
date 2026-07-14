# SetuOne Database Dictionary v2.0 (Updated)

This document maps the physical schemas of SetuOne ERP, organized according to your 5-step database migration plan.

---

## Step 1: `01_Master.sql` (System Foundation)

### 1. Table: `public.tenants`
* **Purpose**: Subscriber accounts.
* **Columns**:
  | Column Name | Data Type | Nullable? | Default | Key | Constraints / References |
  |---|---|---|---|---|---|
  | `id` | UUID | No | `gen_random_uuid()` | PK | |
  | `slug` | TEXT | No | | | UNIQUE |
  | `name` | TEXT | No | | | |
  | `created_at` | TIMESTAMPTZ | No | `NOW()` | | |
  | `updated_at` | TIMESTAMPTZ | No | `NOW()` | | |

### 2. Table: `public.companies`
* **Purpose**: Corporate entities under a Tenant (e.g. On2Cook).
* **Columns**:
  | Column Name | Data Type | Nullable? | Default | Key | Constraints / References |
  |---|---|---|---|---|---|
  | `id` | UUID | No | `gen_random_uuid()` | PK | |
  | `tenant_id` | UUID | No | | FK | REFERENCES `public.tenants(id)` ON DELETE CASCADE |
  | `name` | TEXT | No | | | |
  | `legal_name` | TEXT | Yes | | | |
  | `tax_identifier`| TEXT | Yes | | | |
  | `created_at` | TIMESTAMPTZ | No | `NOW()` | | |
  | `updated_at` | TIMESTAMPTZ | No | `NOW()` | | |

### 3. Table: `public.branches`
* **Purpose**: Branch operations offices.
* **Columns**:
  | Column Name | Data Type | Nullable? | Default | Key | Constraints / References |
  |---|---|---|---|---|---|
  | `id` | UUID | No | `gen_random_uuid()` | PK | |
  | `company_id` | UUID | No | | FK | REFERENCES `public.companies(id)` ON DELETE CASCADE |
  | `name` | TEXT | No | | | |
  | `city` | TEXT | Yes | | | |
  | `created_at` | TIMESTAMPTZ | No | `NOW()` | | |
  | `updated_at` | TIMESTAMPTZ | No | `NOW()` | | |

### 4. Table: `public.buildings`
* **Purpose**: Buildings inside a branch.
* **Columns**:
  | Column Name | Data Type | Nullable? | Default | Key | Constraints / References |
  |---|---|---|---|---|---|
  | `id` | UUID | No | `gen_random_uuid()` | PK | |
  | `branch_id` | UUID | No | | FK | REFERENCES `public.branches(id)` ON DELETE CASCADE |
  | `name` | TEXT | No | | | |
  | `created_at` | TIMESTAMPTZ | No | `NOW()` | | |
  | `updated_at` | TIMESTAMPTZ | No | `NOW()` | | |

### 5. Table: `public.locations`
* **Purpose**: Sub-location rooms/cabins (Self-referencing tree).
* **Columns**:
  | Column Name | Data Type | Nullable? | Default | Key | Constraints / References |
  |---|---|---|---|---|---|
  | `id` | UUID | No | `gen_random_uuid()` | PK | |
  | `building_id`| UUID | No | | FK | REFERENCES `public.buildings(id)` ON DELETE CASCADE |
  | `name` | TEXT | No | | | |
  | `parent_id` | UUID | Yes | | FK | REFERENCES `public.locations(id)` ON DELETE CASCADE |
  | `location_type`| TEXT | No | | | CHECK (`location_type` IN ('Floor', 'Room', 'Zone', 'Cabin')) |
  | `created_at` | TIMESTAMPTZ | No | `NOW()` | | |
  | `updated_at` | TIMESTAMPTZ | No | `NOW()` | | |

### 6. Table: `public.departments`
* **Purpose**: Department registrations.
* **Columns**:
  | Column Name | Data Type | Nullable? | Default | Key | Constraints / References |
  |---|---|---|---|---|---|
  | `id` | UUID | No | `gen_random_uuid()` | PK | |
  | `company_id` | UUID | No | | FK | REFERENCES `public.companies(id)` ON DELETE CASCADE |
  | `name` | TEXT | No | | | |
  | `created_at` | TIMESTAMPTZ | No | `NOW()` | | |
  | `updated_at` | TIMESTAMPTZ | No | `NOW()` | | |

### 7. Table: `public.designations`
* **Purpose**: Designations structure.
* **Columns**:
  | Column Name | Data Type | Nullable? | Default | Key | Constraints / References |
  |---|---|---|---|---|---|
  | `id` | UUID | No | `gen_random_uuid()` | PK | |
  | `company_id` | UUID | No | | FK | REFERENCES `public.companies(id)` ON DELETE CASCADE |
  | `title` | TEXT | No | | | |
  | `created_at` | TIMESTAMPTZ | No | `NOW()` | | |
  | `updated_at` | TIMESTAMPTZ | No | `NOW()` | | |

### 8. Table: `public.roles`
* **Purpose**: RBAC Role profiles.
* **Columns**:
  | Column Name | Data Type | Nullable? | Default | Key | Constraints / References |
  |---|---|---|---|---|---|
  | `id` | UUID | No | `gen_random_uuid()` | PK | |
  | `tenant_id` | UUID | Yes | | FK | REFERENCES `public.tenants(id)` (NULL = Global) |
  | `name` | TEXT | No | | | UNIQUE (`tenant_id`, `name`) |
  | `description`| TEXT | Yes | | | |
  | `created_at` | TIMESTAMPTZ | No | `NOW()` | | |
  | `updated_at` | TIMESTAMPTZ | No | `NOW()` | | |

### 9. Table: `public.modules`
* **Purpose**: Dynamic application modules.
* **Columns**:
  | Column Name | Data Type | Nullable? | Default | Key | Constraints / References |
  |---|---|---|---|---|---|
  | `id` | UUID | No | `gen_random_uuid()` | PK | |
  | `key` | TEXT | No | | | UNIQUE |
  | `label` | TEXT | No | | | |
  | `created_at` | TIMESTAMPTZ | No | `NOW()` | | |
  | `updated_at` | TIMESTAMPTZ | No | `NOW()` | | |

### 10. Table: `public.role_permissions`
* **Purpose**: Role permissions matrix maps.
* **Columns**:
  | Column Name | Data Type | Nullable? | Default | Key | Constraints / References |
  |---|---|---|---|---|---|
  | `id` | UUID | No | `gen_random_uuid()` | PK | |
  | `role_id` | UUID | No | | FK | REFERENCES `public.roles(id)` ON DELETE CASCADE |
  | `module_id` | UUID | No | | FK | REFERENCES `public.modules(id)` ON DELETE CASCADE |
  | `can_read` | BOOLEAN | No | `TRUE` | | |
  | `can_write` | BOOLEAN | No | `FALSE` | | |
  | `created_at` | TIMESTAMPTZ | No | `NOW()` | | |
  | `updated_at` | TIMESTAMPTZ | No | `NOW()` | | |

### 11. Table: `public.profiles`
* **Purpose**: Synced profiles ledger.
* **Columns**:
  | Column Name | Data Type | Nullable? | Default | Key | Constraints / References |
  |---|---|---|---|---|---|
  | `id` | UUID | No | | PK | REFERENCES `auth.users(id)` ON DELETE CASCADE |
  | `company_id` | UUID | No | | FK | REFERENCES `public.companies(id)` |
  | `branch_id` | UUID | No | | FK | REFERENCES `public.branches(id)` |
  | `email` | TEXT | No | | | UNIQUE |
  | `full_name` | TEXT | No | | | |
  | `role_id` | UUID | Yes | | FK | REFERENCES `public.roles(id)` |
  | `department_id`| UUID| Yes | | FK | REFERENCES `public.departments(id)` |
  | `designation_id`|UUID| Yes | | FK | REFERENCES `public.designations(id)` |
  | `created_at` | TIMESTAMPTZ | No | `NOW()` | | |
  | `updated_at` | TIMESTAMPTZ | No | `NOW()` | | |

### 12. Table: `public.organization_settings`
* **Purpose**: General key-value tenant configs.
* **Columns**:
  | Column Name | Data Type | Nullable? | Default | Key | Constraints / References |
  |---|---|---|---|---|---|
  | `id` | UUID | No | `gen_random_uuid()` | PK | |
  | `tenant_id` | UUID | No | | FK | REFERENCES `public.tenants(id)` ON DELETE CASCADE |
  | `settings_key` | TEXT | No | | | UNIQUE (`tenant_id`, `settings_key`) |
  | `settings_value`|JSONB | No | | | |
  | `created_at` | TIMESTAMPTZ | No | `NOW()` | | |
  | `updated_at` | TIMESTAMPTZ | No | `NOW()` | | |

### 13. Table: `public.dashboard_widgets`
* **Purpose**: Role dashboard configuration options.
* **Columns**:
  | Column Name | Data Type | Nullable? | Default | Key | Constraints / References |
  |---|---|---|---|---|---|
  | `id` | UUID | No | `gen_random_uuid()` | PK | |
  | `tenant_id` | UUID | No | | FK | REFERENCES `public.tenants(id)` |
  | `role_id` | UUID | No | | FK | REFERENCES `public.roles(id)` ON DELETE CASCADE |
  | `widgets_config`|JSONB | No | | | |
  | `created_at` | TIMESTAMPTZ | No | `NOW()` | | |
  | `updated_at` | TIMESTAMPTZ | No | `NOW()` | | |

---

## Step 2: `02_Assets.sql` (Assets Module)

*(Tables: `brands`, `models`, `asset_categories`, `assets` (including `qr_code`, `barcode`, and `attributes` JSONB), `asset_assignments`, `asset_maintenance_history`, and polymorphic `documents` containing `bucket_name`, `file_path`, `mime_type`, `file_size` mapping).*

---

## Step 3: `03_Operations.sql` (Daily Workflows)

*(Tables: `vendors`, `tickets`, `ticket_timeline`, `checklists`, `checklist_submissions`, `ppm_schedules`, `visitors`, `attendance`, `notifications`, `activity_logs`).*

---

## Step 4: `04_Purchase.sql` (Procurement & Inventory)

*(Contains standard line-item normalized ERP tables:)*

### 1. Purchase Request Tables
* **`purchase_requests`**: `id`, `company_id`, `request_no`, `raised_by_profile_id`, `status`, `estimated_amount`.
* **`purchase_request_items`**: `id`, `request_id` (FK), `item_name`, `quantity`, `target_price`.

### 2. Quotation Tables
* **`quotations`**: `id`, `request_id` (FK), `vendor_id` (FK), `total_amount`.
* **`quotation_items`**: `id`, `quotation_id` (FK), `item_name`, `quantity`, `unit_price`, `total_price`.
* **`quotation_comparisons`**: `id`, `request_id` (FK), `selected_quotation_id` (FK), `comparison_matrix`.

### 3. Purchase Order Tables
* **`purchase_orders`**: `id`, `request_id` (FK), `vendor_id` (FK), `po_no`, `total_amount`, `status`.
* **`purchase_order_items`**: `id`, `po_id` (FK), `item_name`, `quantity`, `unit_price`, `total_price`.

### 4. Goods Received Note (GRN) Tables
* **`grns`**: `id`, `po_id` (FK), `grn_no`, `received_by_profile_id`, `received_date`, `status`.
* **`grn_items`**: `id`, `grn_id` (FK), `item_name`, `quantity_ordered`, `quantity_received`, `quantity_accepted`.

### 5. Invoice & Payment Tables
* **`invoices`**: `id`, `po_id` (FK), `invoice_no`, `amount`, `due_date`, `status`.
* **`invoice_items`**: `id`, `invoice_id` (FK), `item_name`, `quantity`, `unit_price`.
* **`payments`**: `id`, `invoice_id` (FK), `amount_paid`, `payment_reference`, `payment_mode`, `paid_at`.

### 6. Inventory Normalization (3 Tables)
* **`inventory_items`**: Master item codes list (`id`, `name`, `unit`, `reorder_level`).
* **`inventory_stock`**: Current stock ledger balances (`id`, `branch_id`, `item_id` (FK), `closing_stock`).
* **`inventory_transactions`**: Real-time audit transactions logging stock receipts & issues (`id`, `item_id` (FK), `branch_id`, `transaction_type` ('In'/'Out'), `quantity`, `reference_id` (e.g. GRN ID), `timestamp`).

---

## Step 5: `05_Security_RLS.sql` (Security & Policies)

*(Contains all RLS activations, dynamic security policies, and user query authorization profiles).*
