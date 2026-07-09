# Implementation Plan - LCD Screen Bounding Crop & Smart Anomaly Validation

This plan implements a green-backlight LCD color-segmentation crop, PaddleOCR/EasyOCR priority configurations, regex number extracts, and expected-range database validation guards to reject outlier readings (like `5` or negative differences) automatically.

---

## User Review Required

> [!IMPORTANT]
> - **Green LCD Detection & Crop (Canvas Segmentation)**:
>   Instead of static cropping, we will implement an automatic green backlight bounding box detection in JavaScript. It scans the uploaded image pixels, finds the rectangle coordinates matching the glowing green LCD screen, and crops the image to that exact bounding box before running OCR.
> - **OCR Engine Priorities**:
>   We will support PaddleOCR (Primary), EasyOCR (Secondary), and Tesseract (Local Fallback) in the selector. For client-side demos, if PaddleOCR/EasyOCR endpoints are not configured, we will simulate their high-precision values, and execute Tesseract locally.
>   We will apply a strict regex pattern `/\b\d{5,8}\b/` to extract only the 5-8 digit readings.
> - **Smart Anomaly Range Validation**:
>   Before saving, the system will compare the detected value with the last recorded database reading.
>   - **Expected Range**: `[Last Reading, Last Reading + 2000]`
>   - If the OCR result is outside this range (e.g., `5` when the last reading was `166500`), the system will flag the reading as **Invalid**, show an alert banner: **"OCR could not confidently detect the reading. The scanned value (X) falls outside the expected range (Y - Z) based on the last recorded reading. Please confirm or edit the value."**, disable auto-accept, and force manual confirmation.
> - **No Code Changes Yet**: We will wait for your review and approval before proceeding.

---

## Proposed Changes

### 1. Color Segmentation & Pre-processing (`src/pages/EnergyMonitoring.jsx`)
We will replace `preprocessImage` with an intelligent green-backlight color bounding box detector:

```javascript
const preprocessImage = (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      const width = img.width;
      const height = img.height;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Find bounding box coordinates of bright green pixels (LCD backlight)
      let minX = width, maxX = 0, minY = height, maxY = 0;
      let count = 0;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Bright green/cyan backlit screen range check
          // High Green compared to Red and Blue, and overall brightness
          const isLuminousGreen = (g > 110 && g > r * 1.2 && g > b * 1.1) || (g > 180 && r < 160 && b < 160);

          if (isLuminousGreen) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            count++;
          }
        }
      }

      // Fallback to center crop if green backlight is not detected or too small
      if (count < 500) {
        minX = width * 0.15;
        maxX = width * 0.85;
        minY = height * 0.35;
        maxY = height * 0.75;
      } else {
        // Add 5% padding around the detected bounding box for safety
        const padX = Math.round((maxX - minX) * 0.05);
        const padY = Math.round((maxY - minY) * 0.05);
        minX = Math.max(0, minX - padX);
        maxX = Math.min(width, maxX + padX);
        minY = Math.max(0, minY - padY);
        maxY = Math.min(height, maxY + padY);
      }

      const croppedWidth = maxX - minX;
      const croppedHeight = maxY - minY;

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = croppedWidth;
      cropCanvas.height = croppedHeight;
      const cropCtx = cropCanvas.getContext("2d");

      // Draw cropped area
      cropCtx.drawImage(canvas, minX, minY, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);

      // Enhance contrast, grayscale, and threshold on cropped screen
      const cropData = cropCtx.getImageData(0, 0, croppedWidth, croppedHeight);
      const cPixels = cropData.data;

      for (let i = 0; i < cPixels.length; i += 4) {
        const r = cPixels[i];
        const g = cPixels[i + 1];
        const b = cPixels[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Binarize LCD display: backlit background goes white (255), dark numbers go black (0)
        const threshold = 120;
        const val = gray > threshold ? 255 : 0;

        cPixels[i] = val;
        cPixels[i + 1] = val;
        cPixels[i + 2] = val;
      }

      cropCtx.putImageData(cropData, 0, 0);

      cropCanvas.toBlob((blob) => {
        resolve({
          blob,
          preview: cropCanvas.toDataURL()
        });
      }, "image/png");
    };
  });
};
```

---

### 2. Smart Expected-Range Validation Logic (`src/pages/EnergyMonitoring.jsx`)
When the OCR finishes processing, we validate the reading:

```javascript
// Smart range checks
const lastReadingVal = meterReadings.length > 0 ? Number(meterReadings[0].confirmed_value) : Number(selectedMeter?.initial_reading || 160000);
const minExpected = lastReadingVal;
const maxExpected = lastReadingVal + 2000; // Limit daily/weekly shift threshold

const numericValue = Number(parsedValue);
const isValid = numericValue >= minExpected && numericValue <= maxExpected;

if (!isValid) {
  setOcrConfidence(0.50); // Enforce manual correction
  setConfirmedValue("");
  setOcrRangeWarning(`OCR could not confidently detect the reading. The scanned value (${parsedValue}) falls outside the expected range (${minExpected} - ${maxExpected}) based on the last recorded reading. Please confirm or edit the value.`);
} else {
  setOcrRangeWarning(null);
}
```

---

## Verification Plan

### Automated Tests
* Run `npm run build` to verify no bundling issues.

### Manual Verification
* Upload a photo for UGVCL Meter 1 (last reading `167127`).
* Confirm that if the OCR reads `5` or `136215` (which is outside the `[167127, 169127]` range), the validation banner fires, auto-accept is bypassed, and user must edit the value manually.
