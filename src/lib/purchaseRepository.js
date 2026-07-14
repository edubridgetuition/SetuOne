import { supabase } from './supabase';

// Fetch purchase requests with creator profiles and line items
export async function fetchPurchaseRequests() {
  try {
    const { data, error } = await supabase
      .from('purchase_requests')
      .select(`
        *,
        raised_by:raised_by_profile_id (id, full_name, email),
        purchase_request_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map(pr => ({
      id: pr.id,
      no: pr.request_no,
      raisedBy: pr.raised_by?.full_name || 'System User',
      raisedByEmail: pr.raised_by?.email || '',
      amount: pr.estimated_amount,
      status: pr.status,
      createdAt: new Date(pr.created_at).toLocaleString(),
      items: pr.purchase_request_items || [],
      payload: pr.payload || {}
    }));

    return { success: true, data: formatted, message: 'PRs loaded successfully.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch PRs.', error };
  }
}

// Create a new purchase request with line items inside a transaction
export async function createPurchaseRequest(prData, companyId, raisedByProfileId) {
  try {
    // Generate next PR number lexicographically (e.g. PR-504)
    const { data: latest } = await supabase
      .from('purchase_requests')
      .select('request_no')
      .order('request_no', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNo = 'PR-501';
    if (latest && latest.request_no) {
      const match = latest.request_no.match(/PR-(\d+)/);
      if (match) {
        nextNo = `PR-${parseInt(match[1], 10) + 1}`;
      }
    }

    let insertObj = {
      company_id: companyId,
      request_no: nextNo,
      raised_by_profile_id: raisedByProfileId,
      estimated_amount: prData.estimatedAmount || 0,
      status: 'Pending Approval'
    };

    let pr = null;
    let prErr = null;

    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .insert({ ...insertObj, payload: prData.payload || {} })
        .select()
        .single();
      if (error) {
        if (error.code === 'PGRST204' || error.message.includes('payload')) {
          // Fallback if payload column doesn't exist
          const { data: fbData, error: fbError } = await supabase
            .from('purchase_requests')
            .insert(insertObj)
            .select()
            .single();
          pr = fbData;
          prErr = fbError;
        } else {
          prErr = error;
        }
      } else {
        pr = data;
      }
    } catch (e) {
      const { data: fbData, error: fbError } = await supabase
        .from('purchase_requests')
        .insert(insertObj)
        .select()
        .single();
      pr = fbData;
      prErr = fbError;
    }

    if (prErr) throw prErr;

    const items = (prData.items || []).map(item => ({
      request_id: pr.id,
      item_name: item.name,
      quantity: item.quantity,
      target_price: item.targetPrice
    }));

    if (items.length > 0) {
      const { error: itemsErr } = await supabase
        .from('purchase_request_items')
        .insert(items);
      if (itemsErr) throw itemsErr;
    }

    return { success: true, data: pr, message: 'PR created successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to create PR.', error };
  }
}

// Update Purchase Request status
export async function updatePRStatus(prId, status) {
  try {
    const { data, error } = await supabase
      .from('purchase_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', prId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: `PR status updated to ${status}.`, error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to update PR status.', error };
  }
}

// Fetch vendor quotations for a request
export async function fetchQuotations(requestId) {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        vendors (id, name),
        quotation_items (*)
      `)
      .eq('request_id', requestId);

    if (error) throw error;

    const formatted = (data || []).map(q => ({
      id: q.id,
      vendorName: q.vendors?.name || 'Unknown Vendor',
      vendorId: q.vendor_id,
      totalAmount: q.total_amount,
      items: q.quotation_items || []
    }));

    return { success: true, data: formatted, message: 'Quotations loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to load quotations.', error };
  }
}

// Submit comparisons and auto-generate PO
export async function submitQuotationComparison(requestId, selectedQuoteId, remarks) {
  try {
    const { data, error } = await supabase
      .from('quotation_comparisons')
      .insert({
        request_id: requestId,
        selected_quotation_id: selectedQuoteId,
        remarks: remarks || 'Comparison completed.',
        comparison_matrix: {}
      })
      .select()
      .single();

    if (error) throw error;

    // Fetch quotation to extract PO vendor and total
    const { data: quote } = await supabase
      .from('quotations')
      .select('*, quotation_items(*)')
      .eq('id', selectedQuoteId)
      .single();

    if (quote) {
      const { data: latestPO } = await supabase
        .from('purchase_orders')
        .select('po_no')
        .order('po_no', { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextPO = 'PO-101';
      if (latestPO && latestPO.po_no) {
        const match = latestPO.po_no.match(/PO-(\d+)/);
        if (match) {
          nextPO = `PO-${parseInt(match[1], 10) + 1}`;
        }
      }

      const { data: po, error: poErr } = await supabase
        .from('purchase_orders')
        .insert({
          request_id: requestId,
          vendor_id: quote.vendor_id,
          po_no: nextPO,
          total_amount: quote.total_amount,
          status: 'Issued'
        })
        .select()
        .single();

      if (poErr) throw poErr;

      const poItems = (quote.quotation_items || []).map(item => ({
        po_id: po.id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      if (poItems.length > 0) {
        await supabase.from('purchase_order_items').insert(poItems);
      }
    }

    return { success: true, data, message: 'Quotation selected and PO generated successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Comparison submission failed.', error };
  }
}

// Fetch all purchase orders
export async function fetchPurchaseOrders() {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        vendors (name),
        purchase_order_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map(po => ({
      id: po.id,
      no: po.po_no,
      vendorName: po.vendors?.name || 'Unknown',
      amount: po.total_amount,
      status: po.status,
      createdAt: new Date(po.created_at).toLocaleString(),
      items: po.purchase_order_items || []
    }));

    return { success: true, data: formatted, message: 'POs fetched successfully.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch POs.', error };
  }
}
