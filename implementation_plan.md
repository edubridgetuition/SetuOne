# Implementation Plan - OCR Engine v2 & Meter Image Fingerprinting

This plan specifies the architecture to migrate all computer vision (CV) cropping, image quality assessment (IQA), and multi-engine OCR fallback logic to a backend OCR service, supported by dynamic database profiles, validation controls, and Web Crypto SHA-256 image fingerprinting to block duplicate uploads.

---

## User Review Required

> [!IMPORTANT]
> - **Web Crypto SHA-256 Image Fingerprinting**:
>   Before uploading any file to Supabase Storage, the browser will compute the SHA-256 hash of the image file locally using the native **Web Crypto API** (`crypto.subtle.digest`).
>   If a reading with the matching hash already exists in the database, the system will immediately block the submission and alert the user: **"This image was already uploaded today. Please upload a fresh photograph."**
> - **Stateless React Frontend**:
>   All client-side canvas RGB scans, crops, and local Tesseract.js dependencies will be **removed**. The frontend will only upload the raw photo to Supabase Storage, call the backend OCR endpoint with the image path, and render the resulting JSON payload.
>   - **Adaptive Thresholding, Sharpening, and Auto-crop** are handled entirely by the backend CV engine.
> - **Extensible Database Schema (Meter OCR Profiles)**:
>   We will create a new table `public.energy_meter_ocr_profiles` to store digit counts, display coordinates, and custom validation ranges for different meter brands (UGVCL, DG) dynamically.
> - **Auditing & Cropped Image Store**:
>   We will update `public.energy_meter_readings` to log the cropped LCD image (`cropped_photo_document_id`), the engine used, the initial OCR value, the final confirmed value, the SHA-256 hash (`image_hash`), and an audit status (`Approved`, `Rejected`, `Edited`).
> - **Smart Validation Controls**:
>   The validation multiplier will be made configurable via a settings parameter (default = 3) instead of being hardcoded in code.
> - **Multi-Image Upload Retry Prompt**:
>   If the backend returns a poor quality warning or low confidence result, the UI will prompt the supervisor to **"Upload another image / retake photo"** instead of defaulting to manual entry.
> - **No Code Changes Yet**: We will save this plan and wait for your explicit approval before modifying any files.

---

## Proposed Changes

### 1. Database Schema Migrations (`database/17_EnergyOCRv2.sql`) [NEW]
We will create a new migration script containing:

```sql
-- Table: energy_meter_ocr_profiles
CREATE TABLE IF NOT EXISTS public.energy_meter_ocr_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'UGVCL Smart Meter', 'DG Generator'
    min_digits INTEGER NOT NULL DEFAULT 5,
    max_digits INTEGER NOT NULL DEFAULT 9,
    regex_pattern VARCHAR(100) NOT NULL DEFAULT '\d{5,9}',
    display_position JSONB, -- display bounding box settings for the backend
    threshold_type VARCHAR(50) DEFAULT 'adaptive',
    allowed_multiplier NUMERIC NOT NULL DEFAULT 3.0, -- Configurable smart validation multiplier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Link energy_meters to OCR profiles
ALTER TABLE public.energy_meters 
ADD COLUMN IF NOT EXISTS ocr_profile_id UUID REFERENCES public.energy_meter_ocr_profiles(id) ON DELETE SET NULL;

-- Update energy_meter_readings with audit, duplicate hash, and cropped image columns
ALTER TABLE public.energy_meter_readings
ADD COLUMN IF NOT EXISTS cropped_photo_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ocr_engine VARCHAR(100),
ADD COLUMN IF NOT EXISTS image_hash VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) CHECK (review_status IN ('Approved', 'Rejected', 'Edited')) DEFAULT 'Approved';

-- Add index on image_hash for instant duplicates lookup
CREATE INDEX IF NOT EXISTS idx_energy_readings_image_hash ON public.energy_meter_readings(image_hash);
```

---

### 2. Repository Layer (`src/lib/energyRepository.js`)
We will rewrite `processOCR` to delegate strictly to the backend OCR endpoint and check for duplicate image hashes:

```javascript
// Check if an image hash has already been registered in the database
export async function checkDuplicateHash(hash) {
  try {
    const { data, error } = await supabase
      .from('energy_meter_readings')
      .select('id, reading_datetime')
      .eq('image_hash', hash)
      .maybeSingle();

    if (error) throw error;
    return response(true, data, null, 'Duplicate check completed.');
  } catch (err) {
    return response(false, null, err);
  }
}

// Delegate OCR processing completely to the backend service
export async function processOCR(photoUrl, ocrProfile) {
  try {
    const { data, error } = await supabase.functions.invoke('process-meter-ocr', {
      body: { 
        photo_url: photoUrl,
        ocr_profile: ocrProfile 
      }
    });

    if (error) throw error;
    return response(true, data, null, 'OCR processed successfully.');
  } catch (err) {
    return response(false, null, err);
  }
}
```

---

### 3. UI Page Component (`src/pages/EnergyMonitoring.jsx`)
* **SHA-256 Hash Computation**:
  - Add client-side Web Crypto helper `calculateSHA256` to hash files before storage upload.
  - Query `checkDuplicateHash(hash)`. If it returns a match, block scan start and display: **"This image was already uploaded today. Please upload a fresh photograph."**
* **Remove Client-Side Canvas crop/binarization logic**: Banish local Tesseract CDN script loading.
* **Audit Logs Integration**:
  - Save `image_hash` in the confirmed reading data row.
  - Set `review_status = 'Edited'` if adjusted, or `Approved` if saved unchanged.
* **Simplify display to show**:
  - **Detected Reading** (KWh)
  - **Confidence** (%)
  - **Previous Reading** (KWh)
  - **Calculated Consumption** (Units)
  - **Save/Confirm** or **Retake / Upload another image** buttons.

---

## Verification Plan

### Automated Tests
* Run `npm run build` to confirm compiler state.

### Manual Verification
* Upload a photograph, confirm it logs successfully.
* Upload the exact same photograph file again, and verify that the UI blocks the upload and alerts **"This image was already uploaded today."**
