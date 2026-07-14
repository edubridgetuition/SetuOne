import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";
import { supabase } from "../lib/supabase";

export default function PurchaseRequisition({ viewMode = "pr" }) {
  const {
    session,
    activeRole,
    setActiveView,
    purchaseRequests,
    loadPurchaseRequests,
    createPurchaseRequest,
    updatePRStatus,
    loadQuotations,
    submitQuotationComparison,
    purchaseOrders,
    loadPurchaseOrders,
    triggerInboxNotification
  } = useApp();

  const [selectedId, setSelectedId] = useState(null);
  const [selectedPOId, setSelectedPOId] = useState(null);
  const [selectedPR, setSelectedPR] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New PR Form State
  const [items, setItems] = useState([{ name: "", quantity: 1, targetPrice: 100 }]);
  const [estimatedAmount, setEstimatedAmount] = useState(100);

  // Remarks state for comparison selection
  const [comparisonRemarks, setComparisonRemarks] = useState("");

  const [vendorsList, setVendorsList] = useState([]);
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [quoteVendorId, setQuoteVendorId] = useState("");
  const [quoteUnitPrices, setQuoteUnitPrices] = useState({});

  // GRN States
  const [showAddGRN, setShowAddGRN] = useState(false);
  const [grnChallanNo, setGrnChallanNo] = useState("");
  const [grnReceivedQtys, setGrnReceivedQtys] = useState({});
  const [grnAcceptedQtys, setGrnAcceptedQtys] = useState({});
  // Return with Query States
  const [showQueryForm, setShowQueryForm] = useState(false);
  const [queryRemarks, setQueryRemarks] = useState("");
  // Requisition Form State
  const [reqRequestedBy, setReqRequestedBy] = useState("");
  const [reqCompany, setReqCompany] = useState("Orion Corporate");
  const [reqProjectName, setReqProjectName] = useState("");
  const [reqProjectPhase, setReqProjectPhase] = useState("");
  const [reqProductDescription, setReqProductDescription] = useState("");
  const [reqUrgency, setReqUrgency] = useState("Medium");
  const [reqAttachmentName, setReqAttachmentName] = useState("");
  const [reqVendorName, setReqVendorName] = useState("");
  const [reqPaymentSourceLink, setReqPaymentSourceLink] = useState("");
  const [reqAmount, setReqAmount] = useState("");
  const [reqRemarks, setReqRemarks] = useState("");

  useEffect(() => {
    if (session?.user) {
      setReqRequestedBy(session.user.user_metadata?.full_name || session.user.email || "");
    }
  }, [session]);

  async function handleRequisitionFormSubmit(e) {
    e.preventDefault();
    if (!reqAmount || parseFloat(reqAmount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const lineItems = [{
      name: reqProductDescription || "Requisition Item",
      quantity: 1,
      targetPrice: parseFloat(reqAmount)
    }];

    const prPayload = {
      requested_by: reqRequestedBy,
      company_name: reqCompany,
      project_name: reqProjectName,
      project_phase: reqProjectPhase,
      product_description: reqProductDescription,
      urgency: reqUrgency,
      attachment_name: reqAttachmentName || "N/A",
      vendor_name: reqVendorName || "N/A",
      payment_source_link: reqPaymentSourceLink || "",
      invoice_amount: parseFloat(reqAmount),
      remarks: reqRemarks
    };

    // Default company UUID or tenant UUID
    const companyId = session?.companyId || "7e85d57c-2dcd-4943-9066-6467c5bb10e4";
    const raisedByProfileId = session?.id || session?.user?.id;

    const prData = {
      estimatedAmount: parseFloat(reqAmount),
      items: lineItems,
      payload: prPayload
    };

    const res = await createPurchaseRequest(prData, companyId, raisedByProfileId);
    if (res.success) {
      alert(`Requisition raised successfully with reference ${res.data.request_no}.`);
      await triggerInboxNotification(
        "New Requisition Raised",
        `Requisition ${res.data.request_no} raised by ${reqRequestedBy} for Project "${reqProjectName}" (Phase: ${reqProjectPhase}) is pending manager approval.`
      );
      
      // Reset
      setReqProjectName("");
      setReqProjectPhase("");
      setReqProductDescription("");
      setReqUrgency("Medium");
      setReqAttachmentName("");
      setReqVendorName("");
      setReqPaymentSourceLink("");
      setReqAmount("");
      setReqRemarks("");

      await loadPurchaseRequests();
      setActiveView("purchase");
    } else {
      alert("Failed to raise requisition: " + res.message);
    }
  }

  useEffect(() => {
    async function loadVendors() {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name')
        .order('name', { ascending: true });
      if (!error && data) {
        setVendorsList(data);
      }
    }
    loadVendors();
  }, []);

  const selectedPO = purchaseOrders.find(p => p.id === selectedPOId);

  // Load Data
  useEffect(() => {
    loadPurchaseRequests();
    loadPurchaseOrders();
  }, []);
  // Auto-select first PR/PO when lists load
  useEffect(() => {
    if (viewMode === "pr" && purchaseRequests.length > 0 && !selectedId) {
      setSelectedId(purchaseRequests[0].id);
    } else if ((viewMode === "po" || viewMode === "grn") && purchaseOrders.length > 0 && !selectedPOId) {
      setSelectedPOId(purchaseOrders[0].id);
    }
  }, [purchaseRequests, purchaseOrders, viewMode]);
  // Update selected PR details and load quotations if selected
  useEffect(() => {
    if (!selectedId) {
      setSelectedPR(null);
      setQuotes([]);
      return;
    }
    const pr = purchaseRequests.find(p => p.id === selectedId);
    setSelectedPR(pr);

    if (pr && (pr.status === "Approved" || pr.status === "Pending Approval")) {
      async function getQuotes() {
        setLoadingQuotes(true);
        const res = await loadQuotations(selectedId);
        if (res.success) {
          setQuotes(res.data);
        }
        setLoadingQuotes(false);
      }
      getQuotes();
    }
  }, [selectedId, purchaseRequests]);

  // Dynamic estimated budget calculation
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.targetPrice)), 0);
    setEstimatedAmount(total);
  }, [items]);

  function handleAddItem() {
    setItems([...items, { name: "", quantity: 1, targetPrice: 100 }]);
  }

  function handleItemChange(index, field, value) {
    const next = [...items];
    next[index][field] = value;
    setItems(next);
  }

  async function handleRaisePR(e) {
    e.preventDefault();
    if (items.some(i => !i.name)) {
      alert("Please fill all item names.");
      return;
    }

    const pr = await createPurchaseRequest({
      items,
      estimatedAmount
    });

    if (pr) {
      alert("Purchase Request raised successfully.");
      await triggerInboxNotification(
        "New Requisition Raised",
        `PR ${pr.request_no || 'PR-50X'} sent for approval to manager, with copy to accounts and purchase team.`
      );
      setShowAddForm(false);
      setItems([{ name: "", quantity: 1, targetPrice: 100 }]);
    }
  }

  async function handlePRApproveReject(status) {
    if (!selectedId) return;
    if (confirm(`Are you sure you want to change PR status to ${status}?`)) {
      const res = await updatePRStatus(selectedId, status);
      if (res.success) {
        alert(`PR ${status} successfully.`);
        await triggerInboxNotification(
          `PR ${status}`,
          `Intimation sent to Purchase team and Accounts team for PR ${selectedPR?.no || 'PR-XXX'}.`
        );
        setSelectedId(null);
      }
    }
  }

  async function handleRaiseQuery(e) {
    e.preventDefault();
    if (!queryRemarks.trim()) {
      alert("Please enter query remarks.");
      return;
    }

    const updatedPayload = {
      ...(selectedPR.payload || {}),
      query_raised: true,
      query_remarks: queryRemarks
    };

    const { error } = await supabase
      .from('purchase_requests')
      .update({
        status: 'Draft',
        payload: updatedPayload,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedId);

    if (error) {
      alert("Failed to raise query: " + error.message);
    } else {
      alert("Query successfully sent back to owner.");
      await triggerInboxNotification(
        "Requisition Returned with Queries",
        `Requisition ${selectedPR.no} was returned to owner with queries: "${queryRemarks}".`
      );
      setQueryRemarks("");
      setShowQueryForm(false);
      setSelectedId(null);
      await loadPurchaseRequests();
    }
  }

  async function handleResubmitPR() {
    if (!selectedId) return;
    if (confirm("Are you sure you want to resubmit this requisition for manager approval?")) {
      const updatedPayload = {
        ...(selectedPR.payload || {}),
        query_raised: false,
        resubmitted_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('purchase_requests')
        .update({
          status: 'Pending Approval',
          payload: updatedPayload,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedId);

      if (error) {
        alert("Failed to resubmit requisition: " + error.message);
      } else {
        alert("Requisition resubmitted successfully for manager approval!");
        await triggerInboxNotification(
          "PR Resubmitted",
          `Requisition ${selectedPR.no} has been resubmitted by the owner and is pending manager approval.`
        );
        setSelectedId(null);
        await loadPurchaseRequests();
      }
    }
  }

  async function handleSelectQuotation(quoteId) {
    if (!selectedId) return;
    if (confirm("Proceed to approve this quote and generate PO?")) {
      const res = await submitQuotationComparison(selectedId, quoteId, comparisonRemarks);
      if (res.success) {
        alert("Quotation approved and Purchase Order issued!");
        await triggerInboxNotification(
          "PO Generated & Issued",
          `Purchase Order copy generated for PR ${selectedPR?.no || 'PR-XXX'}. Accounts team received a copy for the same.`
        );
        setSelectedId(null);
        setComparisonRemarks("");
        loadPurchaseOrders();
      }
    }
  }
  async function handleAddQuotationSubmit(e) {
    e.preventDefault();
    if (!quoteVendorId) {
      alert("Please select a vendor.");
      return;
    }

    let calculatedTotal = 0;
    selectedPR.items.forEach(item => {
      const up = parseFloat(quoteUnitPrices[item.id] || 0);
      calculatedTotal += up * item.quantity;
    });

    const { data: quote, error: qErr } = await supabase
      .from('quotations')
      .insert({
        request_id: selectedId,
        vendor_id: quoteVendorId,
        total_amount: calculatedTotal
      })
      .select()
      .single();

    if (qErr) {
      alert("Failed to save quotation: " + qErr.message);
      return;
    }

    const qItems = selectedPR.items.map(item => ({
      quotation_id: quote.id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: parseFloat(quoteUnitPrices[item.id] || 0)
    }));

    const { error: qiErr } = await supabase
      .from('quotation_items')
      .insert(qItems);

    if (qiErr) {
      alert("Failed to save quotation line items: " + qiErr.message);
    } else {
      alert("Quotation added successfully.");
      setShowAddQuote(false);
      setQuoteVendorId("");
      setQuoteUnitPrices({});
      
      const res = await loadQuotations(selectedId);
      if (res.success) {
        setQuotes(res.data);
      }
    }
  }

  async function handleGRNSubmit(e) {
    e.preventDefault();
    if (!grnChallanNo.trim()) {
      alert("Please enter a Challan / Invoice number.");
      return;
    }

    const { data: latest } = await supabase
      .from('grns')
      .select('grn_no')
      .order('grn_no', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextGrnNo = 'GRN-001';
    if (latest && latest.grn_no) {
      const match = latest.grn_no.match(/GRN-(\d+)/);
      if (match) {
        nextGrnNo = `GRN-${String(parseInt(match[1], 10) + 1).padStart(3, '0')}`;
      }
    }

    const { data: grn, error: grnErr } = await supabase
      .from('grns')
      .insert({
        po_id: selectedPOId,
        grn_no: nextGrnNo,
        received_by_profile_id: session.id,
        status: 'Verified'
      })
      .select()
      .single();

    if (grnErr) {
      alert("Failed to create GRN: " + grnErr.message);
      return;
    }

    const grnItems = (selectedPO.items || []).map(item => ({
      grn_id: grn.id,
      item_name: item.item_name,
      quantity_ordered: item.quantity,
      quantity_received: parseFloat(grnReceivedQtys[item.id] ?? item.quantity),
      quantity_accepted: parseFloat(grnAcceptedQtys[item.id] ?? item.quantity)
    }));

    const { error: itemsErr } = await supabase
      .from('grn_items')
      .insert(grnItems);

    if (itemsErr) {
      alert("Failed to create GRN line items: " + itemsErr.message);
      return;
    }

    const { error: poErr } = await supabase
      .from('purchase_orders')
      .update({
        status: 'Delivered',
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedPOId);

    if (poErr) {
      alert("Failed to update PO status: " + poErr.message);
      return;
    }

    alert(`GRN ${nextGrnNo} successfully registered.`);
    await triggerInboxNotification(
      "GRN Entry Received",
      `Goods Receipt Note ${nextGrnNo} registered by store team for PO ${selectedPO.no}. Notification copy sent to Accounts team.`
    );

    setShowAddGRN(false);
    setGrnChallanNo("");
    setGrnReceivedQtys({});
    setGrnAcceptedQtys({});
    
    loadPurchaseOrders();
  }

  function downloadPO_PDF(po) {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order - \${po.no}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0038a8; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 26px; font-weight: 800; color: #0038a8; letter-spacing: 0.5px; }
            .meta { text-align: right; font-size: 14px; color: #475569; }
            .details { margin-bottom: 30px; font-size: 14px; line-height: 1.5; color: #334155; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table th, .table td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; font-size: 13px; }
            .table th { background: #f8fafc; color: #475569; font-weight: bold; }
            .total { text-align: right; font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 10px; }
            .footer { margin-top: 60px; font-size: 12px; text-align: center; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">PURCHASE ORDER</div>
              <div style="font-size: 14px; margin-top: 5px; color: #64748b;">Orion Corporate Park</div>
            </div>
            <div class="meta">
              <div><strong>PO Number:</strong> \${po.no}</div>
              <div><strong>Date:</strong> \${po.createdAt}</div>
              <div><strong>Status:</strong> \${po.status}</div>
            </div>
          </div>
          
          <div class="details">
            <strong>Vendor Information:</strong><br/>
            <span style="font-size: 16px; font-weight: bold; color: #0f172a;">\${po.vendorName}</span>
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Unit</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Unit Price (INR)</th>
                <th style="text-align: right;">Total Price (INR)</th>
              </tr>
            </thead>
            <tbody>
              \${(po.items || []).map(item => \`
                <tr>
                  <td>\${item.item_name}</td>
                  <td style="text-align: center; color: #64748b;">Nos</td>
                  <td style="text-align: center;">\${item.quantity}</td>
                  <td style="text-align: right;">₹\${item.unit_price}</td>
                  <td style="text-align: right; font-weight: bold;">₹\${(item.quantity * item.unit_price).toFixed(2)}</td>
                </tr>
              \`).join("")}
            </tbody>
          </table>
          
          <div class="total">
            Total Amount: ₹\${po.amount}
          </div>
          
          <div class="footer">
            This is a computer-generated Purchase Order copy. Copy archived for Accounts Audit.
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
  const isManager = activeRole === "Admin Manager" || activeRole === "Super Admin";

  return (
    <div style={styles.page}>
      {viewMode === "purchasereq_form" ? (
        <div style={styles.left}>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <div style={styles.panelTitle}>Purchase Requisition Entry Form</div>
                <div style={styles.panelSub}>Fill details below to raise a project purchase requisition.</div>
              </div>
            </div>
            
            <form onSubmit={handleRequisitionFormSubmit} style={{ ...styles.form, background: "#fff", border: "none", padding: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#475569" }}>Requested By (Name)</label>
                  <input style={styles.input} required value={reqRequestedBy} onChange={e => setReqRequestedBy(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#475569" }}>Company</label>
                  <select style={styles.input} value={reqCompany} onChange={e => setReqCompany(e.target.value)}>
                    <option value="Orion Corporate">Orion Corporate</option>
                    <option value="Greenfield Solutions">Greenfield Solutions</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#475569" }}>Project Name</label>
                  <input style={styles.input} required placeholder="e.g. Orion Server Migration" value={reqProjectName} onChange={e => setReqProjectName(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#475569" }}>Project Phase</label>
                  <input style={styles.input} required placeholder="e.g. Phase 2 Setup" value={reqProjectPhase} onChange={e => setReqProjectPhase(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#475569" }}>Urgency</label>
                  <select style={styles.input} value={reqUrgency} onChange={e => setReqUrgency(e.target.value)}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#475569" }}>Suggested Vendor</label>
                  <select style={styles.input} value={reqVendorName} onChange={e => setReqVendorName(e.target.value)}>
                    <option value="">Select Suggested Vendor...</option>
                    {vendorsList.map(v => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#475569" }}>Payment Source Link</label>
                  <input type="url" style={styles.input} placeholder="e.g. https://invoice-payment.source" value={reqPaymentSourceLink} onChange={e => setReqPaymentSourceLink(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#475569" }}>Amt. / Invoice amt. (INR)</label>
                  <input type="number" style={styles.input} required placeholder="e.g. 8500" value={reqAmount} onChange={e => setReqAmount(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "15px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#475569" }}>Product Description</label>
                <textarea style={{ ...styles.input, minHeight: "80px", fontFamily: "inherit" }} required placeholder="Describe product / materials requested..." value={reqProductDescription} onChange={e => setReqProductDescription(e.target.value)} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "15px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#475569" }}>Attachment (Approval / Quote Doc)</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input style={{ ...styles.input, flex: 1 }} placeholder="Attached file name or drive path..." value={reqAttachmentName} onChange={e => setReqAttachmentName(e.target.value)} />
                  <button type="button" style={styles.secondaryBtn} onClick={() => setReqAttachmentName("approval_doc_signed.pdf")}>Mock Upload</button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "15px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#475569" }}>Specific Remarks / Comments</label>
                <textarea style={{ ...styles.input, minHeight: "60px", fontFamily: "inherit" }} placeholder="Any additional notes..." value={reqRemarks} onChange={e => setReqRemarks(e.target.value)} />
              </div>

              <button style={{ ...styles.primaryBtn, marginTop: "20px", width: "100%", padding: "12px" }} type="submit">
                Submit Purchase Requisition
              </button>
            </form>
          </div>
        </div>
      ) : viewMode === "pr" ? (
        <div style={styles.left}>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <div style={styles.panelTitle}>Purchase Requisitions (PR) List</div>
                <div style={styles.panelSub}>Review, compare quotes, and approve procurement workflows.</div>
              </div>
            </div>

            {/* PR Table List */}
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["PR Number", "Raised By", "Budget Amount", "Raised Date", "Status"].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchaseRequests.map(pr => (
                    <tr key={pr.id} style={{ ...styles.tr, ...(selectedId === pr.id ? styles.trActive : {}) }} onClick={() => setSelectedId(pr.id)}>
                      <td style={styles.td}><strong>{pr.no}</strong></td>
                      <td style={styles.td}>{pr.raisedBy}</td>
                      <td style={styles.td}>₹{pr.amount}</td>
                      <td style={styles.td}>{pr.createdAt}</td>
                      <td style={styles.td}>
                        {pr.status === "Draft" && pr.payload?.query_raised ? (
                          <span style={{ ...styles.badge, background: "#f59e0b22", color: "#f59e0b" }}>
                            Returned with Query
                          </span>
                        ) : (
                          <span style={{ ...styles.badge, background: pr.status === "Approved" ? "#22c55e22" : pr.status === "Pending Approval" ? "#f59e0b22" : "#cbd5e122", color: pr.status === "Approved" ? "#22c55e" : pr.status === "Pending Approval" ? "#f59e0b" : "#64748b" }}>
                            {pr.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {purchaseRequests.length === 0 && <div style={styles.empty}>No purchase requisitions raised.</div>}
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.left}>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <div style={styles.panelTitle}>
                  {viewMode === "grn" ? "Goods Received (GRN) Registry" : "Work Orders & Purchase Orders (PO) Ledger"}
                </div>
                <div style={styles.panelSub}>
                  {viewMode === "grn" 
                    ? "Receive store materials, verify quantities, and generate Goods Received Notes (GRN)." 
                    : "Historical listing of procurement orders issued to suppliers."}
                </div>
              </div>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["PO Number", "Vendor", "Total Amount", "Issued Date", "Status"].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map(po => (
                    <tr key={po.id} style={{ ...styles.tr, ...(selectedPOId === po.id ? styles.trActive : {}) }} onClick={() => setSelectedPOId(po.id)}>
                      <td style={styles.td}><strong>{po.no}</strong></td>
                      <td style={styles.td}>{po.vendorName}</td>
                      <td style={styles.td}>₹{po.amount}</td>
                      <td style={styles.td}>{po.createdAt}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: po.status === "Delivered" ? "#22c55e22" : "#6366f122", color: po.status === "Delivered" ? "#22c55e" : "#6366f1" }}>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {purchaseOrders.length === 0 && <div style={styles.empty}>No Purchase Orders issued.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Details Side Panel */}
      <div style={styles.detailPanel}>
        {viewMode === "purchasereq_form" ? (
          <div>
            <div style={styles.detailHeader}>
              <div>
                <div style={styles.muted}>Requisition Info</div>
                <div style={styles.detailNo}>Alert Workflow</div>
              </div>
            </div>
            <div style={styles.descBox}>
              <div style={styles.muted}>Procurement Notification Rules</div>
              <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "10px", lineHeight: "1.5" }}>
                <p>Raising this request will trigger the following notifications:</p>
                <ul style={{ paddingLeft: "15px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li><strong>Manager:</strong> Notified for direct review/approval.</li>
                  <li><strong>Accounts team:</strong> Receives copy of the request.</li>
                  <li><strong>Purchase team:</strong> Receives copy to begin vendor discussions.</li>
                </ul>
              </div>
            </div>
            <div style={{ ...styles.descBox, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: "0.8rem", color: "#166534" }}>
                <strong>✔ SQL Payload Integrated</strong><br/>
                All custom form parameters are automatically mapped into the Supabase database.
              </div>
            </div>
          </div>
        ) : viewMode === "pr" ? (
          !selectedPR ? (
            <div style={styles.emptyDetail}>Select a Purchase Requisition to view quotations matrix and approve POs.</div>
          ) : (
            <div>
              <div style={styles.detailHeader}>
                <div>
                  <div style={styles.muted}>Requisition details</div>
                  <div style={styles.detailNo}>{selectedPR.no}</div>
                </div>
                <div style={styles.muted}>{selectedPR.createdAt}</div>
              </div>

              {/* Returned with Query Remarks Alert */}
              {selectedPR.payload?.query_raised && (
                <div style={{ ...styles.descBox, background: "#fef3c7", border: "1px solid #f59e0b" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "0.82rem", fontWeight: "bold", color: "#d97706" }}>
                    <span>⚠️ Returned with Query Remarks</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#b45309", marginTop: "6px", lineHeight: "1.4" }}>
                    "{selectedPR.payload.query_remarks}"
                  </div>
                </div>
              )}

              {/* Custom Payload Form Metadata Details */}
              {selectedPR.payload && selectedPR.payload.project_name && (
                <div style={{ ...styles.descBox, background: "#f8fafc", border: "1px solid #cbd5e1" }}>
                  <div style={styles.muted}>Form Requisition Specifications</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", marginTop: "10px", fontSize: "0.8rem" }}>
                    <div><strong>Requested By:</strong> {selectedPR.payload.requested_by}</div>
                    <div><strong>Company:</strong> {selectedPR.payload.company_name}</div>
                    <div><strong>Project Name:</strong> {selectedPR.payload.project_name}</div>
                    <div><strong>Project Phase:</strong> {selectedPR.payload.project_phase}</div>
                    <div><strong>Urgency:</strong> <span style={{ color: selectedPR.payload.urgency === "Critical" || selectedPR.payload.urgency === "High" ? "#ef4444" : "#f59e0b", fontWeight: "bold" }}>{selectedPR.payload.urgency}</span></div>
                    {selectedPR.payload.vendor_name && <div><strong>Suggested Vendor:</strong> {selectedPR.payload.vendor_name}</div>}
                    {selectedPR.payload.payment_source_link && (
                      <div><strong>Source Link:</strong> <a href={selectedPR.payload.payment_source_link} target="_blank" rel="noreferrer" style={{ color: "#0038a8" }}>View Payment Source</a></div>
                    )}
                    {selectedPR.payload.attachment_name && <div><strong>Attachment:</strong> 📄 {selectedPR.payload.attachment_name}</div>}
                    {selectedPR.payload.remarks && <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "6px", marginTop: "4px" }}><strong>Remarks:</strong> {selectedPR.payload.remarks}</div>}
                  </div>
                </div>
              )}

              {/* Line Items List */}
              <div style={styles.descBox}>
                <div style={styles.muted}>Requested Products</div>
                <div style={{ marginTop: "10px" }}>
                  {selectedPR.items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", borderBottom: "1px dashed #f1f5f9", paddingBottom: "6px", marginBottom: "6px" }}>
                      <div>{item.item_name} (x{item.quantity})</div>
                      <div>₹{item.target_price} / unit</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin/Manager approvals */}
              {selectedPR.status === "Pending Approval" && isManager && (
                <div style={styles.descBox}>
                  <div style={styles.muted}>Awaiting Manager Approval</div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                    <button style={{ ...styles.primaryBtn, flex: 1, background: "#22c55e" }} onClick={() => handlePRApproveReject("Approved")}>Approve PR</button>
                    <button style={{ ...styles.secondaryBtn, flex: 1, color: "#ef4444", borderColor: "#ef4444" }} onClick={() => handlePRApproveReject("Rejected")}>Reject PR</button>
                    <button style={{ ...styles.secondaryBtn, flex: 1.2, color: "#f59e0b", borderColor: "#f59e0b" }} onClick={() => setShowQueryForm(!showQueryForm)}>
                      {showQueryForm ? "Cancel Query" : "❓ Raise Query"}
                    </button>
                  </div>

                  {showQueryForm && (
                    <form onSubmit={handleRaiseQuery} style={{ ...styles.form, marginTop: "12px", background: "#fff" }}>
                      <div style={styles.muted}>Send Back with Query Remarks</div>
                      <textarea
                        style={{ ...styles.input, minHeight: "60px", marginTop: "8px", width: "100%", boxSizing: "border-box" }}
                        required
                        placeholder="Enter questions or missing details remarks..."
                        value={queryRemarks}
                        onChange={e => setQueryRemarks(e.target.value)}
                      />
                      <button style={{ ...styles.primaryBtn, marginTop: "8px", background: "#f59e0b", width: "100%" }} type="submit">
                        Send back to Owner
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Owner action: Resubmit Requisition */}
              {selectedPR.status === "Draft" && selectedPR.payload?.query_raised && (
                <div style={styles.descBox}>
                  <div style={styles.muted}>Requisition Action Needed</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                    <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>
                      Please review the query remarks above. You can resubmit this request for manager approval once corrected.
                    </p>
                    <button 
                      style={{ ...styles.primaryBtn, background: "#0038a8", width: "100%" }}
                      onClick={handleResubmitPR}
                    >
                      🔄 Resubmit Requisition
                    </button>
                  </div>
                </div>
              )}

              {/* Quotations Creation Form & Comparison Matrix */}
              {selectedPR.status === "Approved" && (
                <div style={styles.descBox}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={styles.muted}>Quotation Matrix</div>
                    <button style={styles.secondaryBtn} onClick={() => setShowAddQuote(!showAddQuote)}>
                      {showAddQuote ? "Cancel" : "+ Add Vendor Quotation"}
                    </button>
                  </div>

                  {showAddQuote && (
                    <form onSubmit={handleAddQuotationSubmit} style={{ ...styles.form, marginBottom: "15px" }}>
                      <div style={styles.formRow}>
                        <select 
                          style={{ ...styles.input, flex: 1 }} 
                          required 
                          value={quoteVendorId} 
                          onChange={e => setQuoteVendorId(e.target.value)}
                        >
                          <option value="">Select Vendor...</option>
                          {vendorsList.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ marginTop: "10px" }}>
                        <div style={{ ...styles.muted, marginBottom: "8px" }}>Enter Unit Prices</div>
                        {selectedPR.items.map(item => (
                          <div key={item.id} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "0.8rem", flex: 2 }}>{item.item_name} (x{item.quantity})</span>
                            <input 
                              type="number" 
                              style={{ ...styles.input, flex: 1 }} 
                              required 
                              placeholder="Unit Price" 
                              value={quoteUnitPrices[item.id] || ""} 
                              onChange={e => setQuoteUnitPrices({ ...quoteUnitPrices, [item.id]: e.target.value })} 
                            />
                          </div>
                        ))}
                      </div>
                      <button style={{ ...styles.primaryBtn, width: "100%", marginTop: "10px" }} type="submit">
                        Save Quotation
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Quotes comparison matrix */}
              {(selectedPR.status === "Approved" || selectedPR.status === "Pending Approval") && (
                <div style={styles.timelineBox}>
                  <div style={styles.muted}>Supplier Quotations Comparison Matrix</div>
                  
                  {loadingQuotes ? (
                    <div style={{ fontSize: "0.8rem", color: "#64748b", padding: "10px 0" }}>Loading quotes...</div>
                  ) : (
                    <div style={{ marginTop: "10px" }}>
                      {quotes.map((q, idx) => (
                        <div key={idx} style={{ ...styles.descBox, background: "#fff", border: "1px solid #cbd5e1" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong>{q.vendorName}</strong>
                            <span style={{ fontSize: "0.82rem", color: "#0038a8", fontWeight: 700 }}>₹{q.totalAmount}</span>
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "5px" }}>
                            {q.items.map((qi, i) => (
                              <div key={i}>{qi.item_name}: {qi.quantity} units @ ₹{qi.unit_price}</div>
                            ))}
                          </div>
                          {selectedPR.status === "Approved" && isManager && (
                            <div style={{ marginTop: "10px" }}>
                              <input style={{ ...styles.input, marginBottom: "8px" }} placeholder="Approval comments..." value={comparisonRemarks} onChange={e => setComparisonRemarks(e.target.value)} />
                              <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={() => handleSelectQuotation(q.id)}>
                                Approve Quote & Issue PO
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {quotes.length === 0 && <div style={styles.empty}>No supplier quotes submitted for this request.</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        ) : (
          !selectedPO ? (
            <div style={styles.emptyDetail}>Select a Work Order / PO to view line items and vendor information.</div>
          ) : (
            <div>
              <div style={styles.detailHeader}>
                <div>
                  <div style={styles.muted}>Purchase Order details</div>
                  <div style={styles.detailNo}>{selectedPO.no}</div>
                </div>
                <div style={styles.muted}>{selectedPO.createdAt}</div>
              </div>

              <div style={styles.descBox}>
                <div style={styles.muted}>Vendor Details</div>
                <div style={{ fontSize: "0.85rem", color: "#111625", fontWeight: "bold", marginTop: "6px" }}>
                  {selectedPO.vendorName}
                </div>
              </div>

              <div style={styles.descBox}>
                <div style={styles.muted}>PO Line Items Table</div>
                <div style={{ overflowX: "auto", marginTop: "10px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                        <th style={{ padding: "8px", textAlign: "left", color: "#475569" }}>Description</th>
                        <th style={{ padding: "8px", textAlign: "center", color: "#475569" }}>Unit</th>
                        <th style={{ padding: "8px", textAlign: "center", color: "#475569" }}>Qty</th>
                        <th style={{ padding: "8px", textAlign: "right", color: "#475569" }}>Rate</th>
                        <th style={{ padding: "8px", textAlign: "right", color: "#475569" }}>Amt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPO.items || []).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px dashed #e2e8f0" }}>
                          <td style={{ padding: "8px", textAlign: "left" }}>{item.item_name}</td>
                          <td style={{ padding: "8px", textAlign: "center", color: "#64748b" }}>Nos</td>
                          <td style={{ padding: "8px", textAlign: "center" }}>{item.quantity}</td>
                          <td style={{ padding: "8px", textAlign: "right" }}>₹{item.unit_price}</td>
                          <td style={{ padding: "8px", textAlign: "right", fontWeight: "600" }}>₹{(item.quantity * item.unit_price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: "bold", marginTop: "12px", paddingTop: "8px", borderTop: "1px solid #e2e8f0" }}>
                    <div>Total Amount (INR)</div>
                    <div>₹{selectedPO.amount}</div>
                  </div>
                </div>
              </div>

              <div style={styles.descBox}>
                <div style={styles.muted}>Order Status & Actions</div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                  <span style={{ ...styles.badge, background: selectedPO.status === "Delivered" ? "#22c55e22" : "#6366f122", color: selectedPO.status === "Delivered" ? "#22c55e" : "#6366f1" }}>
                    {selectedPO.status}
                  </span>
                </div>
                
                {/* Print/Download PO button */}
                <button 
                  style={{ ...styles.secondaryBtn, width: "100%", marginTop: "12px", background: "#f8fafc" }}
                  onClick={() => downloadPO_PDF(selectedPO)}
                >
                  📄 Download PO Copy (PDF)
                </button>

                {/* GRN entry action */}
                {selectedPO.status === "Issued" && viewMode === "grn" && (
                  <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px dashed #cbd5e1" }}>
                    <button 
                      style={{ ...styles.primaryBtn, width: "100%", background: "#22c55e" }}
                      onClick={() => setShowAddGRN(!showAddGRN)}
                    >
                      {showAddGRN ? "Cancel GRN Entry" : "Register GRN (Material Received)"}
                    </button>

                    {showAddGRN && (
                      <form onSubmit={handleGRNSubmit} style={{ ...styles.form, marginTop: "10px" }}>
                        <div style={styles.muted}>Register Material Receipt (GRN)</div>
                        <div style={styles.formRow}>
                          <input 
                            style={{ ...styles.input, flex: 1 }} 
                            required 
                            placeholder="Challan / Invoice Number" 
                            value={grnChallanNo} 
                            onChange={e => setGrnChallanNo(e.target.value)} 
                          />
                        </div>
                        <div style={{ marginTop: "10px" }}>
                          {selectedPO.items.map(item => (
                            <div key={item.id} style={{ display: "flex", gap: "8px", flexDirection: "column", borderBottom: "1px dashed #e2e8f0", paddingBottom: "8px", marginBottom: "8px" }}>
                              <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>{item.item_name} (Ordered: {item.quantity})</span>
                              <div style={{ display: "flex", gap: "10px" }}>
                                <input 
                                  type="number" 
                                  style={{ ...styles.input, flex: 1 }} 
                                  required 
                                  placeholder="Qty Received" 
                                  value={grnReceivedQtys[item.id] ?? item.quantity} 
                                  onChange={e => setGrnReceivedQtys({ ...grnReceivedQtys, [item.id]: e.target.value })} 
                                />
                                <input 
                                  type="number" 
                                  style={{ ...styles.input, flex: 1 }} 
                                  required 
                                  placeholder="Qty Accepted" 
                                  value={grnAcceptedQtys[item.id] ?? item.quantity} 
                                  onChange={e => setGrnAcceptedQtys({ ...grnAcceptedQtys, [item.id]: e.target.value })} 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <button style={{ ...styles.primaryBtn, width: "100%", background: "#22c55e" }} type="submit">
                          Submit GRN & Receive Stock
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", gap: "20px", width: "100%" },
  left: { flex: 1.8, minWidth: "0" },
  panel: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" },
  panelTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem", fontWeight: 700, color: "#111625" },
  panelSub: { fontSize: "0.78rem", color: "#64748b", marginTop: "2px" },
  primaryBtn: { background: "#0038a8", color: "#fff", border: "none", borderRadius: "4px", padding: "10px 16px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },
  secondaryBtn: { background: "#fff", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 14px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", display: "inline-block", textAlign: "center" },

  form: { background: "#f8fafc", padding: "20px", borderRadius: "4px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" },
  formRow: { display: "flex", gap: "10px" },
  input: { padding: "8px 12px", fontSize: "0.82rem", color: "#111625", border: "1px solid #e2e8f0", borderRadius: "4px", background: "#fff", outline: "none" },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, color: "#64748b", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "left", letterSpacing: "1px" },
  tr: { borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.2s" },
  trActive: { background: "#eff6ff", borderLeft: "4px solid #0038a8" },
  td: { padding: "12px 16px", fontSize: "0.8rem", color: "#111625" },
  badge: { fontSize: "0.68rem", fontWeight: 600, padding: "3px 8px", borderRadius: "20px", display: "inline-block" },
  empty: { color: "#94a3b8", fontSize: "0.82rem", textAlign: "center", padding: "30px" },

  detailPanel: { flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px", minWidth: "350px", maxHeight: "100vh", overflowY: "auto" },
  emptyDetail: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "0.85rem", padding: "40px", textAlign: "center" },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "16px" },
  muted: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1px", color: "#64748b", textTransform: "uppercase" },
  detailNo: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "#111625", marginTop: "4px" },

  descBox: { background: "#f8fafc", padding: "16px", borderRadius: "4px", border: "1px solid #e2e8f0", marginBottom: "20px" },
  timelineBox: { border: "1px solid #e2e8f0", borderRadius: "4px", padding: "16px", marginBottom: "20px", background: "#fcfcfd" }
};
