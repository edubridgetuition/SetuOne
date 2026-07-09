import { supabase } from './supabase';

// Helper to return standardized repository response
const response = (success, data, error, message) => ({
  success,
  data,
  error,
  message: message || (error ? error.message : '')
});

// 1. Fetch active energy meters for the company
export async function fetchMeters(companyId) {
  try {
    const { data, error } = await supabase
      .from('energy_meters')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('meter_name', { ascending: true });

    if (error) throw error;
    return response(true, data, null, 'Meters loaded successfully.');
  } catch (err) {
    return response(false, null, err);
  }
}

// 2. Fetch specific meter specifications
export async function fetchMeterDetails(meterId) {
  try {
    const { data, error } = await supabase
      .from('energy_meters')
      .select('*')
      .eq('id', meterId)
      .single();

    if (error) throw error;
    return response(true, data, null, 'Meter details loaded.');
  } catch (err) {
    return response(false, null, err);
  }
}

// 3. Fetch readings history for a specific meter
export async function fetchReadings(meterId) {
  try {
    const { data, error } = await supabase
      .from('energy_meter_readings')
      .select('*')
      .eq('meter_id', meterId)
      .order('reading_datetime', { ascending: false });

    if (error) throw error;
    return response(true, data, null, 'Readings loaded.');
  } catch (err) {
    return response(false, null, err);
  }
}

// 4. Upload photo to document storage
export async function uploadMeterImage(file) {
  try {
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `meters/${fileName}`;

    // Upload to Supabase Storage bucket 'documents'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Register inside 'public.documents' table
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        file_name: file.name,
        file_path: filePath,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size
      })
      .select()
      .single();

    if (docError) throw docError;

    return response(true, docData, null, 'Image uploaded successfully.');
  } catch (err) {
    return response(false, null, err);
  }
}

// 5. Pluggable OCR recognition process
export async function processOCR(photoUrl, provider = 'Mock') {
  try {
    // Simulated scan loader time (2.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500));

    let detectedValue = 0;
    let confidence = 0.95;
    let rawText = '';

    if (provider === 'Mock') {
      // Generate a realistic meter reading (e.g. between 12000 and 15000)
      detectedValue = Math.floor(12000 + Math.random() * 3000);
      confidence = Number((0.92 + Math.random() * 0.07).toFixed(2));
      rawText = `KWH METER DISPLAY READ: [${detectedValue}] - CONFIDENCE: ${Math.round(confidence * 100)}%`;
    } else {
      // Fallback/Placeholders for other engines (Tesseract, OpenAI Vision, Google Cloud Vision, Azure)
      throw new Error(`OCR Provider '${provider}' credentials or keys not configured.`);
    }

    return response(true, {
      detectedValue,
      confidence,
      rawText,
      provider
    }, null, 'OCR parsing completed.');
  } catch (err) {
    return response(false, null, err);
  }
}

// 6. Confirm and save meter reading row
export async function confirmReading(readingData) {
  try {
    const { data, error } = await supabase
      .from('energy_meter_readings')
      .insert(readingData)
      .select()
      .single();

    if (error) throw error;
    return response(true, data, null, 'Reading logged and confirmed successfully.');
  } catch (err) {
    return response(false, null, err);
  }
}

// 7. Calculate consumption metrics for charts
export async function calculateConsumption(meterId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('energy_consumption_summary')
      .select('*')
      .eq('meter_id', meterId)
      .gte('reading_date', startDate)
      .lte('reading_date', endDate)
      .order('reading_datetime', { ascending: true });

    if (error) throw error;
    return response(true, data || [], null, 'Consumption data calculated.');
  } catch (err) {
    return response(false, null, err);
  }
}

// 8. Fetch complete consumption ledger history from View
export async function fetchConsumptionHistory(companyId, meterId = null) {
  try {
    let query = supabase
      .from('energy_consumption_summary')
      .select('*')
      .eq('company_id', companyId);

    if (meterId) {
      query = query.eq('meter_id', meterId);
    }

    const { data, error } = await query.order('reading_datetime', { ascending: false });

    if (error) throw error;
    return response(true, data || [], null, 'Ledger history loaded.');
  } catch (err) {
    return response(false, null, err);
  }
}

// 9. Update existing energy reading
export async function updateEnergyReading(readingId, updates) {
  try {
    const { data, error } = await supabase
      .from('energy_meter_readings')
      .update(updates)
      .eq('id', readingId)
      .select()
      .single();

    if (error) throw error;
    return response(true, data, null, 'Reading updated successfully.');
  } catch (err) {
    return response(false, null, err);
  }
}

// 10. Delete energy reading
export async function deleteEnergyReading(readingId) {
  try {
    const { data, error } = await supabase
      .from('energy_meter_readings')
      .delete()
      .eq('id', readingId);

    if (error) throw error;
    return response(true, data, null, 'Reading deleted successfully.');
  } catch (err) {
    return response(false, null, err);
  }
}

// 11. Update energy meter configuration
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

// 12. Check if image hash already exists to prevent duplicate uploads
export async function checkDuplicateHash(hash) {
  try {
    const { data, error } = await supabase
      .from('energy_meter_readings')
      .select('id, reading_datetime')
      .eq('image_hash', hash)
      .maybeSingle();

    if (error) throw error;
    return response(true, data, null, 'Duplicate hash check completed.');
  } catch (err) {
    return response(false, null, err);
  }
}
