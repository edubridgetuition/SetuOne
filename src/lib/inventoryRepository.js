import { supabase } from './supabase';

// Fetch inventory item master catalog
export async function fetchInventoryItems(companyId) {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Inventory items loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch inventory items.', error };
  }
}

// Create new inventory item master
export async function createInventoryItem(itemData, companyId) {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        company_id: companyId,
        name: itemData.name,
        unit: itemData.unit || 'pcs',
        reorder_level: itemData.reorderLevel || 0
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Inventory item created.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Item creation failed.', error };
  }
}

// Update inventory item properties
export async function updateInventoryItem(itemId, updates) {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        name: updates.name,
        unit: updates.unit,
        reorder_level: updates.reorderLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Inventory item updated.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to update item.', error };
  }
}

// Fetch stock ledger balances per branch
export async function fetchStockBalances(branchId) {
  try {
    const { data, error } = await supabase
      .from('inventory_stock')
      .select(`
        *,
        inventory_items (*)
      `)
      .eq('branch_id', branchId);

    if (error) throw error;

    const formatted = (data || []).map(st => ({
      id: st.id,
      itemId: st.item_id,
      name: st.inventory_items?.name || 'Unknown Item',
      unit: st.inventory_items?.unit || 'pcs',
      reorderLevel: st.inventory_items?.reorder_level || 0,
      closingStock: st.closing_stock
    }));

    return { success: true, data: formatted, message: 'Stock ledger fetched.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch stock.', error };
  }
}

// Log stock transaction and update closing balances inside stock ledger table
export async function logInventoryTransaction(itemId, branchId, type, quantity, referenceId = null, customDate = null) {
  try {
    const payload = {
      item_id: itemId,
      branch_id: branchId,
      transaction_type: type,
      quantity,
      reference_id: referenceId
    };
    if (customDate) {
      payload.created_at = new Date(customDate).toISOString();
    }

    // 1. Log transaction movement
    const { error: txErr } = await supabase
      .from('inventory_transactions')
      .insert(payload);

    if (txErr) throw txErr;

    // 2. Fetch current stock balance
    const { data: current } = await supabase
      .from('inventory_stock')
      .select('id, closing_stock')
      .eq('branch_id', branchId)
      .eq('item_id', itemId)
      .maybeSingle();

    const change = type === 'In' ? Number(quantity) : -Number(quantity);
    const newStock = current ? Number(current.closing_stock) + change : Math.max(0, change);

    if (current) {
      await supabase
        .from('inventory_stock')
        .update({ closing_stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', current.id);
    } else {
      await supabase
        .from('inventory_stock')
        .insert({ branch_id: branchId, item_id: itemId, closing_stock: newStock });
    }

    return { success: true, data: newStock, message: 'Stock ledger updated.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Transaction failed.', error };
  }
}

// Adjust physical audit discrepancy
export async function stockAdjustment(itemId, branchId, quantity, reason, approvedBy) {
  try {
    // Audit discrepancy log via direct transaction
    const { data: current } = await supabase
      .from('inventory_stock')
      .select('id, closing_stock')
      .eq('branch_id', branchId)
      .eq('item_id', itemId)
      .maybeSingle();

    const currentStock = current ? Number(current.closing_stock) : 0;
    const diff = Number(quantity) - currentStock;
    const type = diff >= 0 ? 'In' : 'Out';
    const absQty = Math.abs(diff);

    if (absQty > 0) {
      await logInventoryTransaction(itemId, branchId, type, absQty);
    }

    return { success: true, data: quantity, message: `Physical stock adjusted to ${quantity} due to: ${reason}. Approved by ${approvedBy}`, error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Adjustment failed.', error };
  }
}

// Fetch GRNs lists
export async function fetchGRNs() {
  try {
    const { data, error } = await supabase
      .from('grns')
      .select(`
        *,
        grn_items (*),
        profiles:received_by_profile_id (full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'GRNs loaded successfully.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to fetch GRNs.', error };
  }
}

// Create new GRN draft from PO
export async function createGRN(poId, receivedByProfileId, items) {
  try {
    const { data: latest } = await supabase
      .from('grns')
      .select('grn_no')
      .order('grn_no', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNo = 'GRN-101';
    if (latest && latest.grn_no) {
      const match = latest.grn_no.match(/GRN-(\d+)/);
      if (match) {
        nextNo = `GRN-${parseInt(match[1], 10) + 1}`;
      }
    }

    const { data: grn, error: grnErr } = await supabase
      .from('grns')
      .insert({
        po_id: poId,
        grn_no: nextNo,
        received_by_profile_id: receivedByProfileId,
        status: 'Pending Verification'
      })
      .select()
      .single();

    if (grnErr) throw grnErr;

    const grnItems = items.map(item => ({
      grn_id: grn.id,
      item_name: item.name,
      quantity_ordered: item.quantityOrdered,
      quantity_received: item.quantityReceived,
      quantity_accepted: item.quantityAccepted
    }));

    if (grnItems.length > 0) {
      await supabase.from('grn_items').insert(grnItems);
    }

    return { success: true, data: grn, message: 'GRN draft created.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to create GRN.', error };
  }
}

// Verify/Approve GRN - Increases stock ledger
export async function approveGRN(grnId, branchId) {
  try {
    // 1. Set GRN status to Verified
    const { data: grn, error: grnErr } = await supabase
      .from('grns')
      .update({ status: 'Verified', updated_at: new Date().toISOString() })
      .eq('id', grnId)
      .select()
      .single();

    if (grnErr) throw grnErr;

    // 2. Load accepted items
    const { data: items } = await supabase
      .from('grn_items')
      .select('*')
      .eq('grn_id', grnId);

    // 3. Loop through items, find item master match, and update stock ledger
    for (const item of (items || [])) {
      // Find item match inside inventory items
      const { data: invItem } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('name', item.item_name)
        .maybeSingle();

      if (invItem) {
        await logInventoryTransaction(invItem.id, branchId, 'In', item.quantity_accepted, grnId);
      }
    }

    return { success: true, data: grn, message: 'GRN approved and stock ledger balance adjusted.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'GRN approval failed.', error };
  }
}

// Fetch invoices list
export async function fetchInvoices() {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Invoices loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to load invoices.', error };
  }
}

// Create Invoice
export async function createInvoice(poId, invoiceNo, amount, dueDate, items) {
  try {
    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .insert({
        po_id: poId,
        invoice_no: invoiceNo,
        amount,
        due_date: dueDate,
        status: 'Unpaid'
      })
      .select()
      .single();

    if (invErr) throw invErr;

    const invoiceItems = items.map(item => ({
      invoice_id: inv.id,
      item_name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice
    }));

    if (invoiceItems.length > 0) {
      await supabase.from('invoice_items').insert(invoiceItems);
    }

    return { success: true, data: inv, message: 'Invoice matching complete.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Invoice registration failed.', error };
  }
}

// Fetch payments ledger list
export async function fetchPayments() {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('paid_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Payments loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message || 'Failed to load payments ledger.', error };
  }
}

// Record invoice payment transaction
export async function recordPayment(invoiceId, amountPaid, reference, mode) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        invoice_id: invoiceId,
        amount_paid: amountPaid,
        payment_reference: reference,
        payment_mode: mode
      })
      .select()
      .single();

    if (error) throw error;

    // Check if invoice is fully paid
    const { data: inv } = await supabase
      .from('invoices')
      .select('amount')
      .eq('id', invoiceId)
      .single();

    if (inv) {
      const { data: payList } = await supabase
        .from('payments')
        .select('amount_paid')
        .eq('invoice_id', invoiceId);

      const totalPaid = (payList || []).reduce((sum, p) => sum + Number(p.amount_paid), 0);
      const status = totalPaid >= Number(inv.amount) ? 'Paid' : 'Partially Paid';

      await supabase
        .from('invoices')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', invoiceId);
    }

    return { success: true, data, message: 'Payment recorded successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to record payment.', error };
  }
}

export async function fetchInventoryTransactions(branchId) {
  try {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select(`
        *,
        inventory_items (*)
      `)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Transactions fetched.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

export async function deleteInventoryTransaction(txId) {
  try {
    // 1. Fetch transaction detail to understand the stock rollback amount
    const { data: tx, error: txError } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('id', txId)
      .single();

    if (txError) throw txError;

    // 2. Fetch current stock balance
    const { data: current } = await supabase
      .from('inventory_stock')
      .select('id, closing_stock')
      .eq('branch_id', tx.branch_id)
      .eq('item_id', tx.item_id)
      .maybeSingle();

    // Rollback formula
    const rollback = tx.transaction_type === 'In' ? -Number(tx.quantity) : Number(tx.quantity);
    const newStock = current ? Number(current.closing_stock) + rollback : 0;

    // 3. Update stock balance
    if (current) {
      const { error: stockError } = await supabase
        .from('inventory_stock')
        .update({ closing_stock: Math.max(0, newStock), updated_at: new Date().toISOString() })
        .eq('id', current.id);
      if (stockError) throw stockError;
    }

    // 4. Delete the transaction record
    const { error: delError } = await supabase
      .from('inventory_transactions')
      .delete()
      .eq('id', txId);

    if (delError) throw delError;

    return { success: true, message: 'Transaction deleted and stock adjusted.', error: null };
  } catch (error) {
    return { success: false, message: error.message || 'Failed to delete transaction.', error };
  }
}
