# SetuOne ERP Migration Walkthrough - Enterprise Energy Monitoring System

This walkthrough documents the successful integration of the **Enterprise Energy Monitoring & AI OCR System**, designed to handle unlimited hardware meters, OCR scan simulations, database-level lag views, and RLS tenant security controls.

---

## 🚀 Accomplished Tasks

### 1. Database Seed Migration (`database/16_EnergyMonitoring.sql`)
* **`energy_meters` Table**: Stores core hardware properties (unit type, installation date, capacity, status, serial numbers, and custom tariff rates like `₹8.50/Unit` per meter).
* **Foreign Keys**:
  - `branch_id UUID REFERENCES public.branches(id)`
  - `building_id UUID REFERENCES public.buildings(id)`
  - `location_id UUID REFERENCES public.locations(id)`
* **`energy_meter_readings` Table**:
  - Each upload (Morning, Evening, Hourly) is registered as a separate individual row (SAP/Siemens model).
  - Slots are specified by `reading_slot` (`Morning`, `Evening`) and modes are set by `capture_mode` (`Manual`, `OCR`, `IoT`).
  - Stores debug values: `ocr_raw_text` (e.g. `I234S` text outputs) and `ocr_provider` (e.g. `Tesseract`, `Google Vision`).
  - Exposes workflow flags: `reading_status` (`Pending OCR`, `Pending Confirmation`, `Confirmed`), `is_locked` (disables editing once confirmed), and `photo_document_id UUID REFERENCES public.documents(id)`.
* **Dynamic Cost & Validation View (`public.energy_consumption_summary`)**:
  - Automatically fetches preceding readings per meter via SQL window function `LAG()`.
  - Calculates dynamic difference units (`consumption_units`) and cost (`calculated_cost`).
  - Sets cost/consumption to `NULL` and flags `reading_valid = FALSE` if consecutive readings contain descending values (negative consumption checks).
* **Enterprise RLS Security**: Strict tenant isolation matching user profiles (`company_id = public.get_user_company(auth.uid())`), without any RLS bypasses.
* **Conflict-Safe Multi-Company Seeding**: Seeding logic uses `WHERE NOT EXISTS` combined with dynamic suffixes mapping to each company's ID to prevent key duplication conflicts during re-runs.

### 2. Repository Layer (`src/lib/energyRepository.js`)
* Implements robust backend integrations returning standard success/error objects:
  - `fetchMeters(companyId)`
  - `fetchMeterDetails(meterId)`
  - `fetchReadings(meterId)`
  - `uploadMeterImage(file)`
  - `processOCR(imagePath)`
  - `confirmReading(readingData)`
  - `calculateConsumption(meterId, start, end)`
  - `fetchConsumptionHistory(meterId, companyId)`

### 3. Context & Routing Integrations (`AppContext.jsx`, `App.jsx`)
* Registered state properties: `energyMeters`, `selectedMeter`, `meterReadings`, `consumptionHistory`, `energyDashboard`.
* Exposed core actions: `loadMeters()`, `loadReadings()`, `uploadMeterImage()`, `confirmReading()`, `loadConsumption()`.
* Automatically loads energy meters on session login.
* Mapped view switch route: `"energy" ➡️ <EnergyMonitoring />`.

### 4. Interactive Page Layout (`src/pages/EnergyMonitoring.jsx`)
* **Meter Selector Cards**: Supports dynamic meter lists (Grid, Generator, HVAC, etc.).
* **AI OCR scan overlay**: Displays preview photos, green laser sweep scanner lines, progress loaders, confidence metrics, and confirm/edit controls.
* **Cost Summary Cards**: Shows Morning, Evening, Consumption Units, and dynamic Tariff Billing Cost (₹).
* **Ledger Table**: Renders consumption rows, photo document links, manual log forms, lock icons, and downloard exports (CSV/Excel).
* **SVG Graphs**: Interactive weekly/monthly consumption analysis.

---

## 📋 Verification Checks Passed

* **Vite Production Bundler**: Local `npm run build` runs with zero syntax warnings or import compilation failures.
