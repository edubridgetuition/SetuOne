# SetuOne ERP Migration Walkthrough - Actual Site Energy Monitoring System

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
* **Seeded Meters List (On2Cook Configuration)**:
  1. **UGVCL Meter 1** (Meter Code: `UGVCL-01`)
  2. **UGVCL Meter 2** (Meter Code: `UGVCL-02`)
  3. **UGVCL Meter 3** (Meter Code: `UGVCL-03`)
  4. **DG Meter** (Meter Code: `DG-01`)

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
  - `updateEnergyReading(readingId, updates)`
  - `deleteEnergyReading(readingId)`
  - `updateEnergyMeter(meterId, updates)`

### 3. Context & Routing Integrations (`AppContext.jsx`, `App.jsx`)
* Registered state properties: `energyMeters`, `selectedMeter`, `meterReadings`, `consumptionHistory`, `energyDashboard`.
* Exposed core actions: `loadMeters()`, `loadReadings()`, `uploadMeterImage()`, `confirmReading()`, `loadConsumption()`, `updateEnergyReading()`, `deleteEnergyReading()`, `updateEnergyMeter()`.
* Automatically loads energy meters on session login.
* Mapped view switch route: `"energy" ➡️ <EnergyMonitoring />`.

### 4. Interactive Page Layout (`src/pages/EnergyMonitoring.jsx`)
* **Meter Selector Cards**: Supports dynamic meter lists (UGVCL Meter 1, UGVCL Meter 2, UGVCL Meter 3, DG Meter).
* **AI OCR scan overlay**: Displays preview photos, green laser sweep scanner lines, progress loaders, confidence metrics, and confirm/edit controls.
* **Tesseract.js Real OCR & Preprocessing Canvas [NEW]**:
  - Dynamically loads Tesseract.js via CDN directly inside the browser.
  - Implemented **`preprocessImage`**: Crops the center 40% height of the image (automatically bypassing the top white sticker `0.5 MF GANOVO` and bottom barcode serial number tags).
  - Enhances image contrast by converting the bright green LCD backlit pixels to pure white and the dark numeric characters to pure black (Binarization thresholding).
  - Feeds the clean black-and-white cropped canvas blob to Tesseract.js for high-fidelity scanning.
  - Renders the processed pre-cropped binary image in the debug logs panel so developers and managers can visually verify what the scanner processed.
* **Edit Meter Modal**:
  - Added "Edit Selected" button in sidebar.
  - Opens modal drawer to live update Name, Code, Unique Identifier, Consumer Account Number, Serial Number, Tariff Rate, and Baseline Reading in database.
* **Backdated Log Date-Time Selectors**:
  - Integrated `datetime-local` inputs inside OCR confirmation card and Manual Log form.
  - Permits entries to be logged into past datetimes.
* **Rupee Symbol Updates**:
  - Swapped out dollar icons (`$`) for styled `₹` sign inside Calculated Cost widget.

---

## 📋 Verification Checks Passed

* **Vite Production Bundler**: Local `npm run build` runs with zero syntax warnings or import compilation failures.
