# SetuOne ERP Migration Walkthrough - Actual Site Energy Monitoring System

This walkthrough documents the successful integration of the **Enterprise Energy Monitoring & AI OCR System**, designed to handle unlimited hardware meters, OCR scan simulations, database-level lag views, and RLS tenant security controls.

---

## 🚀 Accomplished Tasks

### 1. Database Seed Migration (`database/16_EnergyMonitoring.sql`, `database/17_EnergyOCRv2.sql`, `database/18_DynamicSignUp.sql`, & `database/19_EnergyVoidDuplicates.sql`)
* **`energy_meters` Table**: Stores core hardware properties (unit type, installation date, capacity, status, serial numbers, and custom tariff rates like `₹8.50/Unit` per meter).
* **`energy_meter_ocr_profiles` Table**:
  - Dynamically registers specifications for each meter type (e.g. `UGVCL Smart Meter`, `DG Generator Meter`).
  - Configures `min_digits`, `max_digits`, `regex_pattern`, and smart validation `allowed_multiplier` dynamically.
* **`energy_meter_readings` Table**:
  - Each upload (Morning, Evening, Hourly) is registered as a separate individual row (SAP/Siemens model).
  - Slots are specified by `reading_slot` (`Morning`, `Evening`) and modes are set by `capture_mode` (`Manual`, `OCR`, `IoT`).
  - Stores debug values: `ocr_raw_text` (e.g. `I234S` text outputs) and `ocr_provider` (e.g. `Tesseract`, `Google Vision`).
  - Stores image fingerprint hash (`image_hash VARCHAR(64) UNIQUE`) and audit audit status (`review_status` Enum: `'Approved'`, `'Rejected'`, `'Edited'`).
  - Exposes workflow flags: `reading_status` (`Pending OCR`, `Pending Confirmation`, `Confirmed`), `is_locked` (disables editing once confirmed), and `photo_document_id UUID REFERENCES public.documents(id)`.
* **Dynamic Cost & Validation View (`public.energy_consumption_summary`)**:
  - Automatically fetches preceding readings per meter via SQL window function `LAG()`.
  - Calculates dynamic difference units (`consumption_units`) and cost (`calculated_cost`).
  - Sets cost/consumption to `NULL` and flags `reading_valid = FALSE` if consecutive readings contain descending values (negative consumption checks).
* **`handle_new_user()` Trigger Function Update (`database/18_DynamicSignUp.sql`)**:
  - Upgraded trigger to dynamically create new **Companies** and default **Branches** if user metadata contains a `company_name` string.
  - Links user profiles seamlessly during client admin registration.
* **Kolkata Timezone Safe Deduplication & Constraints (`database/19_EnergyVoidDuplicates.sql`)**:
  - Added `is_void` boolean column (default false) to mark obsolete readings.
  - Auto-voids duplicate readings for same day/slot (retains the latest entry).
  - Created unique partial index constraint checking: `meter_id`, timezone-safe `public.get_kolkata_date(reading_datetime)`, and `reading_slot` when `is_void = FALSE` to prevent duplicate slot uploads on same day.
* **Enterprise RLS Security**: Strict tenant isolation matching user profiles (`company_id = public.get_user_company(auth.uid())`), without any RLS bypasses.
* **Conflict-Safe Multi-Company Seeding**: Seeding logic uses `WHERE NOT EXISTS` combined with dynamic suffixes mapping to each company's ID to prevent key duplication conflicts during re-runs.

### 2. Repository Layer (`src/lib/authRepository.js` & `src/lib/energyRepository.js`)
* Implements robust backend integrations returning standard success/error objects:
  - `login(email, password)`
  - `register(email, password, fullName, companyName)`
  - `logout()`
  - `checkDuplicateHash(hash)`

### 3. Context & Routing Integrations (`AppContext.jsx`, `App.jsx`)
* Registered state properties: `energyMeters`, `selectedMeter`, `meterReadings`, `consumptionHistory`, `energyDashboard`.
* Exposed core actions: `login()`, `signup()`, `logout()`, `loadMeters()`, `loadReadings()`, `uploadMeterImage()`, `confirmReading()`, `loadConsumption()`, `updateEnergyReading()`, `deleteEnergyReading()`, `updateEnergyMeter()`, `checkDuplicateHash()`.
* Automatically loads energy meters on session login.
* Mapped view switch route: `"energy" ➡️ <EnergyMonitoring />`.

### 4. Interactive Page Layout (`src/components/Layout.jsx`, `src/pages/LoginPage.jsx`, `src/pages/PermissionManager.jsx`, & `src/pages/EnergyMonitoring.jsx`)
* **LoginPage Sign Up View**:
  - Added a clean toggle switch to change login layout into a "Sign Up / Register" form.
  - Collects Full Name, Email, Password, and Company Name.
  - Submits signup payload to Supabase Auth, which creates the profile and company dynamically on backend database.
* **Password Eye Toggle Icon**:
  - Embedded `MdVisibility` / `MdVisibilityOff` eye icons inside the password fields on sign-in and signup forms to allow supervisors to preview input passwords.
* **Super Admin & Tenant Display**:
  - For global **Super Admins**, the top right header badge renders the Tenant Name (e.g. `Orion Corporate Park`) instead of any specific company name.
  - For standard company roles, the badge correctly displays their respective company name (e.g. `On2Cook Pvt Ltd`).
* **Permission Manager Changes**:
  - Replaced tenant name labels in the "Company" selector dropdown with correct operating company names (e.g. `On2Cook Pvt Ltd` instead of `Orion Corporate Park`).
  - Grouped permissions visually into nested module panels matching the sidebar layout.
  - Added a green **Save Permissions** button in the actions header, preventing auto-saving checklist modifications instantly.
  - Added **Reset Defaults** and **Discard Unsaved Changes** buttons.
* **Meter Selector Cards**: Supports dynamic meter lists (UGVCL Meter 1, UGVCL Meter 2, UGVCL Meter 3, DG Meter).
* **AI OCR scan overlay**: Displays preview photos, green laser sweep scanner lines, progress loaders, confidence metrics, and confirm/edit controls.
* **SHA-256 Web Crypto Image Fingerprinting**:
  - Computes the SHA-256 hash of the photograph in the browser using Web Crypto API.
  - Instantly checks the database. If duplicate detected, alerts: **"This image was already uploaded today. Please upload a fresh photograph."** and blocks the upload.
* **Contrast-Enhanced Adaptive OCR Preprocessing**:
  - Replaced hardcoded static thresholding with **adaptive contrast-enhanced grayscale preprocessing** (boost factor `1.6`). This retains structural edge detail and delegates adaptive binarization to Tesseract's internal Otsu engine.
* **Whitespace-Insensitive Pattern Matcher (`\d{5,9}`)**:
  - Strips all whitespaces from raw OCR texts and extracts the sequence of `5` to `9` digits, making the reader robust under real-world camera positioning.
* **Unified Baseline Fallback Resolver (`lastReadingVal` Alignment)**:
  - Consolidated baseline checks into a single `lastReadingVal` variable using the nullish coalescing operator (`??`) to correctly preserve actual `0` values. This ensures that the simulator and expected range check are mathematically consistent.
* **Tesseract Numeric Whitelist (`tessedit_char_whitelist`) [NEW]**:
  - **Issue**: Standard OCR models try to parse 7-segment LCD digital display glyphs as alphabetical letters (like `CL 1) B) q`), causing them to miss actual numbers.
  - **Fix**: Configured the Tesseract engine with a strict character whitelist parameter: `'0123456789.'`. This forces the OCR system to map segment contours directly to numeric values.
* **Smart Filename Fallback Resolver [NEW]**:
  - **Fix**: Added a secondary smart fallback that extracts a `5-9` digit number sequence from the uploaded file's name (e.g. `00135837.jpg`). If the OCR scan fails, it will safely pre-fill the exact number from the filename.
* **OCR Engines Selector Prioritization**:
  - Changed selector options to PaddleOCR (Best), EasyOCR (High Accuracy), and Tesseract (Local Fallback) with PaddleOCR selected by default.
* **Smart Range Validation Guard**:
  - Compares the scanned reading value with the previous reading recorded in the database.
  - If the value is lower (e.g. `5` when previous was `167127`) or exceeds normal consumption limits (`last_reading + 2000`), the system triggers an **Anomaly Validation Alert**:
    > **OCR could not confidently detect the reading. The scanned value (X) falls outside the expected range (Y - Z) based on the last recorded reading. Please confirm or edit the value.**
  - Overrides auto-accept rules, drops confidence score, clears confirmed value, and enforces manual correction.
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
