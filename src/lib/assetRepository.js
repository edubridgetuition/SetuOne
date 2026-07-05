import { supabase } from './supabase';

// Fetch assets with pagination, search, and dynamic status filters
export async function fetchAssets(filters = {}, page = 1, pageSize = 10) {
  try {
    let query = supabase
      .from('assets')
      .select(`
        *,
        asset_categories (id, name, schema_definition),
        brands (id, name),
        models (id, name),
        locations (id, name),
        asset_assignments (id, status, profiles (id, full_name))
      `, { count: 'exact' });

    // Search query matches code or asset name
    if (filters.search) {
      query = query.or(`asset_code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
    }

    // Category / Brand / Status / Location filters
    if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters.brandId) query = query.eq('brand_id', filters.brandId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.locationId) query = query.eq('location_id', filters.locationId);

    // Pagination calculations
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, count, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map(asset => {
      const activeAssign = (asset.asset_assignments || []).find(a => a.status === 'Active');
      return {
        id: asset.id,
        code: asset.asset_code,
        name: asset.name,
        category: asset.asset_categories?.name || 'Unknown',
        categoryId: asset.category_id,
        brand: asset.brands?.name || 'Unknown',
        brandId: asset.brand_id,
        model: asset.models?.name || 'Unknown',
        modelId: asset.model_id,
        location: asset.locations?.name || 'Unknown',
        locationId: asset.location_id,
        status: asset.status,
        attributes: asset.attributes,
        serialNo: asset.attributes?.serialNo || 'N/A',
        purchaseDate: asset.purchase_date,
        warrantyExpiry: asset.warranty_expiry,
        assignedTo: activeAssign?.profiles?.full_name || 'Unassigned',
        assignedToId: activeAssign?.profiles?.id || null,
        assignmentId: activeAssign?.id || null
      };
    });

    return { 
      success: true, 
      data: { assets: formatted, totalCount: count || 0 }, 
      message: 'Assets fetched successfully.', 
      error: null 
    };
  } catch (error) {
    return { success: false, data: { assets: [], totalCount: 0 }, message: error.message || 'Failed to fetch assets.', error };
  }
}

// Fetch unified details payload for a selected asset (Basic details, History, Docs, PPM, and AMC)
export async function fetchAssetDetails(assetId) {
  try {
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select(`
        *,
        asset_categories (id, name, schema_definition),
        brands (id, name),
        models (id, name),
        locations (id, name)
      `)
      .eq('id', assetId)
      .single();

    if (assetError) throw assetError;

    // Load related tables in parallel
    const [
      assignmentsRes,
      maintenanceRes,
      ppmRes,
      documentsRes
    ] = await Promise.all([
      supabase.from('asset_assignments').select('*, profiles (id, full_name, email)').eq('asset_id', assetId).order('assigned_at', { ascending: false }),
      supabase.from('asset_maintenance_history').select('*').eq('asset_id', assetId).order('start_date', { ascending: false }),
      supabase.from('ppm_schedules').select('*, vendors (id, name)').eq('asset_id', assetId).order('next_service_date', { ascending: true }),
      supabase.from('documents').select('*').eq('linked_entity_id', assetId).eq('linked_entity_type', 'Asset')
    ]);

    const activeAssignment = (assignmentsRes.data || []).find(a => a.status === 'Active');
    const assignmentHistory = (assignmentsRes.data || []).filter(a => a.status === 'Returned');

    const formattedDetails = {
      basic: {
        id: asset.id,
        code: asset.asset_code,
        name: asset.name,
        category: asset.asset_categories?.name || 'Unknown',
        categoryId: asset.category_id,
        brand: asset.brands?.name || 'Unknown',
        model: asset.models?.name || 'Unknown',
        location: asset.locations?.name || 'Unknown',
        status: asset.status,
        attributes: asset.attributes,
        purchaseDate: asset.purchase_date,
        warrantyExpiry: asset.warranty_expiry
      },
      currentAssignment: activeAssignment ? {
        id: activeAssignment.id,
        assignedTo: activeAssignment.profiles?.full_name,
        assignedToId: activeAssignment.profiles?.id,
        assignedAt: new Date(activeAssignment.assigned_at).toLocaleString(),
        remarks: activeAssignment.remarks
      } : null,
      assignmentHistory: assignmentHistory.map(h => ({
        id: h.id,
        assignedTo: h.profiles?.full_name,
        assignedAt: new Date(h.assigned_at).toLocaleString(),
        returnedAt: h.returned_at ? new Date(h.returned_at).toLocaleString() : 'N/A',
        remarks: h.remarks
      })),
      maintenanceHistory: (maintenanceRes.data || []).map(m => ({
        id: m.id,
        type: m.maintenance_type,
        description: m.description,
        cost: m.cost,
        performedBy: m.performed_by,
        startDate: new Date(m.start_date).toLocaleString(),
        endDate: m.end_date ? new Date(m.end_date).toLocaleString() : 'Pending'
      })),
      upcomingPPM: (ppmRes.data || []).map(p => ({
        id: p.id,
        serviceType: p.service_type,
        vendor: p.vendors?.name || 'In-house',
        nextServiceDate: p.next_service_date,
        status: p.status
      })),
      documents: (documentsRes.data || []).map(d => ({
        id: d.id,
        name: d.name,
        category: d.category,
        fileUrl: d.file_url,
        expiryDate: d.expiry_date
      }))
    };

    return { 
      success: true, 
      data: formattedDetails, 
      message: 'Asset details loaded successfully.', 
      error: null 
    };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to load asset details.', error };
  }
}

// Fetch categories, brands, models, locations, and profiles for form options lists
export async function fetchAssetMetadata() {
  try {
    const [cats, brands, models, locs, profiles] = await Promise.all([
      supabase.from('asset_categories').select('id, name, schema_definition'),
      supabase.from('brands').select('id, name'),
      supabase.from('models').select('id, name, brand_id'),
      supabase.from('locations').select('id, name, location_type'),
      supabase.from('profiles').select('id, full_name')
    ]);

    return {
      success: true,
      data: {
        categories: cats.data || [],
        brands: brands.data || [],
        models: models.data || [],
        locations: locs.data || [],
        employees: profiles.data || []
      },
      message: 'Asset metadata fetched successfully.',
      error: null
    };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Metadata loading failed.', error };
  }
}

// Create new asset dynamically checking schema attributes validation
export async function createAsset(assetData, tenantId) {
  try {
    const { data, error } = await supabase
      .from('assets')
      .insert({
        tenant_id: tenantId,
        category_id: assetData.categoryId,
        brand_id: assetData.brandId || null,
        model_id: assetData.modelId || null,
        location_id: assetData.locationId,
        asset_code: assetData.code,
        name: assetData.name,
        attributes: assetData.attributes || {},
        status: assetData.status || 'Active',
        purchase_date: assetData.purchaseDate || null,
        warranty_expiry: assetData.warrantyExpiry || null
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Asset registered successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to create asset.', error };
  }
}

// Update asset properties
export async function updateAsset(assetId, updates) {
  try {
    const { data, error } = await supabase
      .from('assets')
      .update({
        category_id: updates.categoryId,
        brand_id: updates.brandId || null,
        model_id: updates.modelId || null,
        location_id: updates.locationId,
        asset_code: updates.code,
        name: updates.name,
        attributes: updates.attributes || {},
        status: updates.status,
        purchase_date: updates.purchaseDate || null,
        warranty_expiry: updates.warrantyExpiry || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', assetId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Asset updated successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to update asset.', error };
  }
}

// Soft delete asset setting status to Inactive (archiveAsset)
export async function archiveAsset(assetId) {
  try {
    const { data, error } = await supabase
      .from('assets')
      .update({ status: 'Inactive', updated_at: new Date().toISOString() })
      .eq('id', assetId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Asset archived successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to archive asset.', error };
  }
}

// Assign custody to user profile
export async function assignAsset(assetId, profileId, remarks) {
  try {
    // Check if there is an active assignment already
    const { data: active } = await supabase
      .from('asset_assignments')
      .select('id')
      .eq('asset_id', assetId)
      .eq('status', 'Active')
      .maybeSingle();

    if (active) throw new Error('Asset is already checked out to another custodian.');

    const { data, error } = await supabase
      .from('asset_assignments')
      .insert({
        asset_id: assetId,
        profile_id: profileId,
        remarks: remarks || 'No checkout comments.',
        status: 'Active'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Asset checked out successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Assignment failed.', error };
  }
}

// Return asset custody to store
export async function returnAsset(assetId, remarks) {
  try {
    const { data: active, error: activeErr } = await supabase
      .from('asset_assignments')
      .select('id')
      .eq('asset_id', assetId)
      .eq('status', 'Active')
      .maybeSingle();

    if (activeErr) throw activeErr;
    if (!active) throw new Error('No active assignment found for this asset.');

    const { data, error } = await supabase
      .from('asset_assignments')
      .update({
        status: 'Returned',
        returned_at: new Date().toISOString(),
        remarks: remarks || 'Returned to warehouse.'
      })
      .eq('id', active.id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Asset returned successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Return failed.', error };
  }
}

// Transfer custody between profile users
export async function transferAsset(assetId, targetProfileId, remarks) {
  try {
    // 1. Close current assignment
    const { data: active } = await supabase
      .from('asset_assignments')
      .select('id')
      .eq('asset_id', assetId)
      .eq('status', 'Active')
      .maybeSingle();

    if (active) {
      await supabase
        .from('asset_assignments')
        .update({
          status: 'Returned',
          returned_at: new Date().toISOString(),
          remarks: `Transferred. ${remarks}`
        })
        .eq('id', active.id);
    }

    // 2. Open new assignment
    const { data, error } = await supabase
      .from('asset_assignments')
      .insert({
        asset_id: assetId,
        profile_id: targetProfileId,
        remarks: remarks || 'Transferred assignment.',
        status: 'Active'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Asset custody transferred.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Transfer failed.', error };
  }
}

// Change asset status state
export async function changeAssetStatus(assetId, status) {
  try {
    const { data, error } = await supabase
      .from('assets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', assetId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: `Status updated to ${status}.`, error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to change status.', error };
  }
}

// Upload dynamic document (warranty/manuals/invoice/AMC)
export async function uploadAssetDocument(assetId, category, fileName, fileBlob, tenantId) {
  try {
    const filePath = `assets/${assetId}/${Date.now()}_${fileName}`;
    
    // Upload storage blob
    const { data: store, error: storeErr } = await supabase.storage
      .from('documents')
      .upload(filePath, fileBlob, { cacheControl: '3600', upsert: true });

    if (storeErr) throw storeErr;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Save metadata row to database
    const { data, error } = await supabase
      .from('documents')
      .insert({
        tenant_id: tenantId,
        name: fileName,
        category: category,
        linked_entity_type: 'Asset',
        linked_entity_id: assetId,
        file_url: publicUrl,
        bucket_name: 'documents',
        file_path: filePath
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Document registered successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Document upload failed.', error };
  }
}

// Bulk assets CSV import
export async function importAssets(assetsArray, tenantId) {
  try {
    const inserts = assetsArray.map(asset => ({
      tenant_id: tenantId,
      category_id: asset.categoryId,
      brand_id: asset.brandId || null,
      model_id: asset.modelId || null,
      location_id: asset.locationId,
      asset_code: asset.code,
      name: asset.name,
      attributes: asset.attributes || {},
      status: asset.status || 'Active',
      purchase_date: asset.purchaseDate || null,
      warranty_expiry: asset.warrantyExpiry || null
    }));

    const { data, error } = await supabase
      .from('assets')
      .insert(inserts)
      .select();

    if (error) throw error;
    return { success: true, data, message: `${inserts.length} assets imported successfully.`, error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to import assets.', error };
  }
}
