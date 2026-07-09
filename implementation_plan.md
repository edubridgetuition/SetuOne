# Implementation Plan - Energy Monitoring System Enhancements

This plan outlines the enhancements to provide custom meter unique identifier configurations, editable tariff rates, backdated reading support, local client-side OCR parsing via Tesseract.js, and Indian Rupee (₹) styling corrections.

---

## User Review Required

> [!IMPORTANT]
> - **Editable Tariff & Meter Identifier**: We will add an **"Edit Meter"** button on the selected meter specifications panel. This will open a modal drawer allowing Admins to update the unique physical meter identifier, consumer account number, serial number, and custom tariff rate (₹/Unit).
> - **Backdated Log Support**: We will add a `Reading Date & Time` input selector to both the OCR Confirmation and Manual Log Override forms (defaulting to the current local time), allowing logs to be backdated.
> - **Local OCR Parsing (Tesseract.js)**: To solve image reading issues, we will integrate client-side **Tesseract.js** (loaded dynamically via a secure CDN link). When "Tesseract" is selected as the OCR engine, it will perform optical character recognition directly on the uploaded image inside the browser, extracting actual digits.
> - **Currency Sign Update**: We will replace the dollar icon (`$`) with the Indian Rupee symbol (`₹`) on all dashboard widget cards.
> - **No Code Changes Yet**: We will save this plan and wait for your explicit approval before modifying any code files.

---

## Proposed Changes

### 1. Database Repository Layer (`src/lib/energyRepository.js`)
We will add `updateEnergyMeter` to edit meter configurations.

#### [MODIFY] [energyRepository.js](file:///d:/SetuOne/src/lib/energyRepository.js)
```javascript
// Update existing meter specifications (e.g. tariff_rate, meter_identifier)
export async function updateEnergyMeter(meterId, updates) {
  try {
    const { data, error } = await supabase
      .from('energy_meters')
      .update(updates)
      .eq('id', meterId)
      .select()
      .single();

    if (error) throw error;
    return response(true, data, null, 'Meter updated successfully.');
  } catch (err) {
    return response(false, null, err);
  }
}
```

---

### 2. Context Integration (`AppContext.jsx`)
Expose the new meter update action.

#### [MODIFY] [AppContext.jsx](file:///d:/SetuOne/src/context/AppContext.jsx)
* Expose `updateEnergyMeter(meterId, updates)` which calls the repository method, writes an audit log, and refreshes the meters list.

---

### 3. UI Page Component (`src/pages/EnergyMonitoring.jsx`)
Implement the enhancements in the React page:

* **Tesseract.js OCR Integration**:
  - Dynamically mount `<script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>` on component load.
  - When "Tesseract" is selected and an image is uploaded, feed the image file to `Tesseract.recognize()`.
  - Extract the raw recognized text (stored in `ocr_raw_text`), filter out non-numeric digits, and set the confirmed value.
* **Edit Meter Modal**:
  - Add a form drawer to edit Name, Code, Identifier, Consumer Account Number, Serial Number, and Tariff Rate of the selected meter.
* **Backdated Date/Time Input**:
  - Add a `datetime-local` input field to the forms.
  - Send the selected datetime as the `reading_datetime` payload.
* **Indian Rupee (₹) Corrections**:
  - Swap the cost widget icon from `MdAttachMoney` to `MdFlashOn` (or a custom `₹` layout).

---

## Verification Plan

### Automated Tests
* Production build compile: `npm run build`

### Manual Verification
* Access "Energy Monitoring" panel. Select "UGVCL Meter 1", edit its tariff rate to `9.20`, and verify it updates in the sidebar.
* Upload a backdated photo (e.g., select yesterday's timestamp), confirm OCR results, and check that the ledger sorts it correctly.
