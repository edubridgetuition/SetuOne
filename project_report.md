# SetuOne Integrated Facility ERP - Comprehensive Project Report
*Documenting System Architecture, Database Schema, and Analytics Chart Connections*

---

## 1. Core Architecture & RLS Security

SetuOne is built on a **React 19 + Supabase PostgreSQL** stack. It uses a **multi-tenant design** where every company is isolated by a `company_id` context. 

### Row-Level Security (RLS) Rules:
* Every SELECT, INSERT, UPDATE, and DELETE query automatically filters records by the logged-in user's `company_id`.
* Staff can only view tickets and check-in records belonging to their respective branch coordinates.

---

## 2. Modules, Tables, and Chart Connections

This section maps each frontend analytics widget and chart to its corresponding database table, columns, and query logic.

### 📊 A. Main Dashboard Analytics
1. **Ticket Backlog Doughnut Chart**
   * **Visualizes**: Counts of Open, Assigned, In-Progress, and Resolved tickets.
   * **Database Connection**: `public.tickets` table.
   * **SQL Mapping**: 
     ```sql
     SELECT status, COUNT(*) FROM public.tickets GROUP BY status;
     ```
2. **Asset Allocation & Status Bar Chart**
   * **Visualizes**: Count of assets classified by status (In Use, Available, Maintenance, In Repair, Retired).
   * **Database Connection**: `public.assets` table.
   * **SQL Mapping**:
     ```sql
     SELECT status, COUNT(*) FROM public.assets GROUP BY status;
     ```
3. **Monthly Purchase Orders Expense Line Graph**
   * **Visualizes**: Consolidated procurement value spent per month.
   * **Database Connection**: `public.purchase_orders` table.
   * **SQL Mapping**:
     ```sql
     SELECT DATE_TRUNC('month', created_at) as month, SUM(total_amount) 
     FROM public.purchase_orders 
     GROUP BY month;
     ```

---

### 📦 B. Inventory & Consumption Analytics
1. **Water Bottle Daily & Monthly Consumption Line Chart**
   * **Visualizes**: Number of 20L water jugs delivered vs empty jugs returned.
   * **Database Connection**: `public.inventory_transactions` table joined with `public.inventory_items`.
   * **SQL Mapping**:
     - *Water Bottle Deliveries*: Transaction type = `'IN'` for items where `name = '20L Water Jug'`.
     - *Water Bottle Returns (Empties)*: Transaction type = `'OUT'` or custom returned fields.
2. **Coffee Machine Monthly Material Bar Chart**
   * **Visualizes**: Usage metrics of coffee beans (kg), milk (liters), and paper cups (units).
   * **Database Connection**: `public.inventory_transactions` table.
   * **SQL Mapping**:
     ```sql
     SELECT item_id, SUM(quantity) 
     FROM public.inventory_transactions 
     WHERE type = 'OUT' 
     GROUP BY item_id;
     ```

---

### 🔧 C. Planned Maintenance (PPM) & Compliance
1. **Preventive Maintenance Compliance Gauge**
   * **Visualizes**: Percentage of successfully executed inspections vs missed checklist tasks.
   * **Database Connection**: `public.checklist_schedules` table.
   * **SQL Mapping**:
     ```sql
     SELECT status, COUNT(*) FROM public.checklist_schedules GROUP BY status;
     -- Formula: (Completed / Total Schedules) * 100
     ```
2. **AMC Warranty Alerts Grid**
   * **Visualizes**: Countdown days left for asset warranty contracts.
   * **Database Connection**: `public.assets` table.
   * **SQL Mapping**:
     ```sql
     SELECT name, amc_expiry_date, amc_expiry_date - NOW() as days_left 
     FROM public.assets 
     WHERE amc_expiry_date IS NOT NULL;
     ```

---

### 👤 D. Attendance & Security Registers
1. **Staff Shift Presence Bar Chart**
   * **Visualizes**: Employee presence breakdown (Present, Late, Absent, WFH, On Leave).
   * **Database Connection**: `public.attendance` table.
   * **SQL Mapping**:
     ```sql
     SELECT status, COUNT(*) FROM public.attendance GROUP BY status;
     ```
2. **Visitor Campus Logs Counters**
   * **Visualizes**: Live counts of guests inside the campus vs historically checked out guests.
   * **Database Connection**: `public.visitors` table.
   * **SQL Mapping**:
     ```sql
     SELECT status, COUNT(*) FROM public.visitors GROUP BY status;
     -- Binds to 'Inside' and 'Checked Out' badges
     ```
