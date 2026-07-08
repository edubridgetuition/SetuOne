# SetuOne ERP Migration Walkthrough - Dynamic Dropdowns, Catalog Visibility, Inline Edits & Dashboard Widget Catalog

This walkthrough documents the updates made to connect frontend dropdown selections to the Dynamic Masters registry dynamically, ensure catalog items with zero stock display correctly, add transaction editing & deletion capabilities, and construct a database-driven dashboard widget catalog manager with dropdown selections, soft archival, and audit logs.

---

## 🚀 Accomplished Tasks

### 1. Database Seed Migrations
* **Dynamic Masters (`database/13_DynamicMastersSeedMigration.sql`)**: Seeded core dynamic master definitions (`PANTRY_ITEM_NAMES`, `TICKET_CATEGORIES`, `VISITOR_PURPOSES`, `VEHICLE_TYPES`, `VISITOR_ID_TYPES`) and defaults.
* **Double-Registry Configuration (`database/14_PantryDashboardCardsMigration.sql`)**: Registered a new dynamic master definition `PANTRY_DASHBOARD_CARDS` (Pantry Dashboard Cards) and seeded it with:
  - `Water Bottle (20L)`
  - `Water Jug`
  - `Coffee Beans`
  - `Milk Packet`
  *(Sugar is excluded from this list by default).*
* **Soft Archival Column (`database/15_DashboardWidgetArchivalMigration.sql`)**: Created the `is_archived` column in the `dashboard_widgets` table to allow soft deletes.

### 2. Connected Page Components
* **Pantry & Coffee (`InventoryManagement.jsx`)**: Dropdown and consumption cards are now dynamically populated from the database.
* **Catalog Visibility Fix (`InventoryManagement.jsx`)**: Updated the Stock Balance ledger table to map directly from all registered catalog items (`displayStockBalances`). Registered items with `0` initial stock balances show up immediately.
* **Complaint Tickets (`Tickets.jsx`)**: Categories dropdown loads dynamically from the `TICKET_CATEGORIES` definition registry.
* **Visitor Management (`VisitorManagement.jsx`)**: Purposes, vehicle types, and ID proof types dropdown selections load dynamically from their respective registries.
* **Admin Settings Console (`AdminConsoleSettings.jsx`)**: Added auto-slugifying logic for `masterKey` so new master categories created in the UI are formatted correctly (e.g. `Pantry Item Names` ➡️ `PANTRY_ITEM_NAMES`).

### 3. Super Admin Transaction Rollback & Inline Edits (`InventoryManagement.jsx`)
* Exclusively for the **Super Admin** role, added an **`Edit`** and **`Delete`** button in the Consolidated Consumption Report table.
* **Delete Action**: Deleting a pantry consumption transaction automatically adjusts (rolls back) the closing stock of the item in the database (e.g. deleting a Consumed entry adds the quantity back to stock, deleting a Refill entry subtracts it).
* **Inline Edit Mode**: Clicking `Edit` replaces row cells with editable input fields (Quantity, Action Type, Log Date) along with `Save` and `Cancel` buttons.
* **Smart Stock Correction**: When a transaction is edited, the system calculates the delta (difference) between the old configuration and the new configuration, then corrects the current stock balance automatically.

### 4. Double-Registry Dashboard Separation (`InventoryManagement.jsx`)
* **Dynamic Separation**:
  - The **Pantry Log Dropdown** list is driven by `PANTRY_ITEM_NAMES` (includes Sugar).
  - The **Dashboard Analytics Cards** are driven by `PANTRY_DASHBOARD_CARDS` (excludes Sugar).
* **Super Admin Control**: The Super Admin can add or remove items from either list directly in the **Admin Console ➡️ Dynamic Masters** panel. No code changes are required to add/remove dashboard cards or dropdown options.
* **Metric Logic**: Cards show current calendar month's total `In` transactions as the main large value, last month's total `In` transactions as the Month count, and today's total `In` transactions as the Today count.

### 5. Dashboard Widget Catalog Manager (`AdminConsoleSettings.jsx`)
* **Top Bar Controls**: Added `+ Register Widget`, `Export Catalog`, and `Refresh` buttons to the Dashboard Templates tab.
* **CRUD Panel Actions**:
  - **Edit**: Updates the widget configuration.
  - **Duplicate**: Clones configuration settings and appends a short, unique key suffix to prevent database collisions.
  - **Soft Archive**: Safely flags widgets as archived (`is_archived = true`), removing them from layout drawers while keeping active user layouts intact.
  - **Status Toggle**: Easily enables/disables widgets from the UI.
* **Widget Key Dropdown & Custom Option**: Converted the `Widget Key` input to a dropdown mapping all standard backend data sources (`OPEN_TICKETS`, `TODAYS_VISITORS`, `PENDING_PURCHASE`, etc.) to prevent spelling errors, with an optional `-- Custom Key / New Source --` fallback for typing a custom code key.
* **Component Dropdown Selection**: Converted the React component field to a dropdown listing valid system components (`TicketsWidget`, `InventoryWidget`, etc.).
* **Preview Card**: Added a preview panel inside the drawer showing how the widget card will render with selected grid dimensions.
* **Audit Trail integration**: Triggered automatic insertions into the `audit_logs` table for all widget CRUD operations (Creation, Update, Archive, Toggle status).
* **Code Bug Fixes**:
  - Fixed `undefined` context exports for `dashboardWidgetsList` and `activeDashboardLayout` that caused the Vercel site to go blank.
  - Added missing widget CRUD function destructuring inside `AdminConsoleSettings.jsx`.

---

## 📋 Verification Checks Passed

* **Vite Production Bundler**: Local `npm run build` runs with zero syntax warnings.
* **Supabase SQL Executions**: Seed SQL migrations compiled successfully in the database console.
