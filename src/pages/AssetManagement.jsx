import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";
import { ASSET_STATUS } from "../constants";

export default function AssetManagement() {
  const {
    assets,
    totalAssetsCount,
    assetMetadata,
    loadAssets,
    loadAssetDetails,
    loadAssetMetadata,
    createAsset,
    updateAsset,
    archiveAsset,
    assignAsset,
    returnAsset,
    transferAsset,
    changeAssetStatus,
    uploadAssetDocument,
    importAssets
  } = useApp();

  const [selectedId, setSelectedId] = useState(null);
  const [assetDetails, setAssetDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Filters and Pagination
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Forms states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [addForm, setAddForm] = useState({
    code: "",
    name: "",
    categoryId: "",
    brandId: "",
    modelId: "",
    locationId: "",
    purchaseDate: "",
    warrantyExpiry: "",
    serialNo: "",
    customSpecs: {} // Category specific specifications
  });

  const [assignForm, setAssignForm] = useState({ employeeId: "", remarks: "" });
  const [transferForm, setTransferForm] = useState({ targetEmployeeId: "", remarks: "" });
  
  const [uploadForm, setUploadForm] = useState({ category: "Warranty", fileName: "", fileBlob: null });
  const [csvFile, setCsvFile] = useState(null);

  // Load Metadata & Assets registers
  useEffect(() => {
    loadAssetMetadata();
  }, []);

  useEffect(() => {
    loadAssets(
      {
        search,
        categoryId: catFilter,
        brandId: brandFilter,
        status: statusFilter
      },
      page,
      pageSize
    );
  }, [search, catFilter, brandFilter, statusFilter, page]);

  // Load Dynamic Unified Asset Details once selectedId changes
  useEffect(() => {
    if (!selectedId) {
      setAssetDetails(null);
      return;
    }
    async function getDetails() {
      setLoadingDetails(true);
      const res = await loadAssetDetails(selectedId);
      if (res.success) {
        setAssetDetails(res.data);
      }
      setLoadingDetails(false);
    }
    getDetails();
  }, [selectedId]);

  // Set default dropdown selectors once metadata loads
  useEffect(() => {
    if (assetMetadata && !addForm.categoryId) {
      setAddForm(prev => ({
        ...prev,
        categoryId: assetMetadata.categories[0]?.id || "",
        brandId: assetMetadata.brands[0]?.id || "",
        modelId: assetMetadata.models[0]?.id || "",
        locationId: assetMetadata.locations[0]?.id || ""
      }));
    }
  }, [assetMetadata]);

  // Dynamic Specs rendering parameters based on category
  const selectedCategoryName = assetMetadata?.categories.find(c => c.id === addForm.categoryId)?.name || "";

  async function handleAddSubmit(e) {
    e.preventDefault();
    const specs = {
      serialNo: addForm.serialNo,
      ...addForm.customSpecs
    };

    const created = await createAsset({
      code: addForm.code,
      name: addForm.name,
      categoryId: addForm.categoryId,
      brandId: addForm.brandId,
      modelId: addForm.modelId,
      locationId: addForm.locationId,
      purchaseDate: addForm.purchaseDate,
      warrantyExpiry: addForm.warrantyExpiry,
      attributes: specs
    });

    if (created) {
      alert("Asset registered successfully.");
      setShowAddForm(false);
      setAddForm(prev => ({ ...prev, code: "", name: "", serialNo: "", customSpecs: {} }));
    }
  }

  async function handleAssignSubmit(e) {
    e.preventDefault();
    if (!selectedId) return;
    const res = await assignAsset(selectedId, assignForm.employeeId, assignForm.remarks);
    if (res) {
      setSelectedId(null);
      setSelectedId(selectedId); // Trigger refresh
      setShowAssignForm(false);
      setAssignForm({ employeeId: "", remarks: "" });
    }
  }

  async function handleReturnSubmit() {
    if (!selectedId) return;
    if (confirm("Are you sure you want to return this asset?")) {
      const res = await returnAsset(selectedId, "Custody returned.");
      if (res) {
        setSelectedId(null);
        setSelectedId(selectedId);
      }
    }
  }

  async function handleTransferSubmit(e) {
    e.preventDefault();
    if (!selectedId) return;
    const res = await transferAsset(selectedId, transferForm.targetEmployeeId, transferForm.remarks);
    if (res) {
      setSelectedId(null);
      setSelectedId(selectedId);
      setShowTransferForm(false);
      setTransferForm({ targetEmployeeId: "", remarks: "" });
    }
  }

  async function handleArchiveSubmit() {
    if (!selectedId) return;
    if (confirm("Are you sure you want to soft delete (archive) this asset?")) {
      const res = await archiveAsset(selectedId);
      if (res) {
        setSelectedId(null);
        loadAssets({}, 1, 10);
      }
    }
  }

  async function handleUploadSubmit(e) {
    e.preventDefault();
    if (!selectedId || !uploadForm.fileBlob) return;
    const res = await uploadAssetDocument(
      selectedId,
      uploadForm.category,
      uploadForm.fileName,
      uploadForm.fileBlob
    );
    if (res.success) {
      alert("Document uploaded successfully.");
      setSelectedId(null);
      setSelectedId(selectedId);
      setShowUploadForm(false);
    }
  }

  // Handle Mock CSV Upload
  function handleCsvImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Simulate reading CSV rows and importing
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      alert("Simulated CSV File loaded. Columns detected. Importing rows...");
      // Mock importing 2 rows mapped to categories
      const mockImport = [
        {
          code: "IMP-LAP-098",
          name: "MacBook Air M2",
          categoryId: assetMetadata.categories[0]?.id,
          brandId: assetMetadata.brands[0]?.id,
          modelId: assetMetadata.models[0]?.id,
          locationId: assetMetadata.locations[0]?.id,
          status: "Active",
          attributes: { serialNo: "CSV-MOCK-001", ram: "16GB", storage: "512GB SSD" }
        }
      ];
      const res = await importAssets(mockImport);
      if (res.success) {
        alert("Imported successfully: " + res.message);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Asset Registry Dashboard</div>
              <div style={styles.panelSub}>Track corporate assets, lifecycle assignments, and maintenance.</div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <label style={styles.secondaryBtn}>
                Import CSV
                <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleCsvImport} />
              </label>
              <button style={styles.primaryBtn} onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? "Cancel" : "+ New Asset"}
              </button>
            </div>
          </div>

          {/* New Asset Registration Form */}
          {showAddForm && (
            <form onSubmit={handleAddSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Asset Code</label>
                  <input style={styles.input} required value={addForm.code} onChange={e => setAddForm({ ...addForm, code: e.target.value })} placeholder="APL-MBP-1422" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Asset Name</label>
                  <input style={styles.input} required value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} placeholder="Nisha MacBook Pro" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category</label>
                  <select style={styles.input} value={addForm.categoryId} onChange={e => setAddForm({ ...addForm, categoryId: e.target.value })}>
                    {assetMetadata?.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Brand</label>
                  <select style={styles.input} value={addForm.brandId} onChange={e => setAddForm({ ...addForm, brandId: e.target.value })}>
                    {assetMetadata?.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Model</label>
                  <select style={styles.input} value={addForm.modelId} onChange={e => setAddForm({ ...addForm, modelId: e.target.value })}>
                    {assetMetadata?.models.filter(m => m.brand_id === addForm.brandId).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Location</label>
                  <select style={styles.input} value={addForm.locationId} onChange={e => setAddForm({ ...addForm, locationId: e.target.value })}>
                    {assetMetadata?.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Serial Number</label>
                  <input style={styles.input} required value={addForm.serialNo} onChange={e => setAddForm({ ...addForm, serialNo: e.target.value })} placeholder="C02GG345Q05D" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Purchase Date</label>
                  <input style={styles.input} type="date" value={addForm.purchaseDate} onChange={e => setAddForm({ ...addForm, purchaseDate: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Warranty Expiry</label>
                  <input style={styles.input} type="date" value={addForm.warrantyExpiry} onChange={e => setAddForm({ ...addForm, warrantyExpiry: e.target.value })} />
                </div>
              </div>

              {/* Dynamic Categories-Specific specs renderer */}
              <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "15px" }}>
                <div style={styles.panelTitle} style={{ fontSize: "0.8rem", marginBottom: "10px" }}>
                  Specification Mapping ({selectedCategoryName || "IT Asset"})
                </div>
                <div style={styles.formGrid}>
                  {(selectedCategoryName === "IT Asset" || selectedCategoryName === "Laptop") ? (
                    <>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>RAM Spec</label>
                        <input style={styles.input} placeholder="16GB" onChange={e => setAddForm({ ...addForm, customSpecs: { ...addForm.customSpecs, RAM: e.target.value } })} />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Storage</label>
                        <input style={styles.input} placeholder="512GB SSD" onChange={e => setAddForm({ ...addForm, customSpecs: { ...addForm.customSpecs, Storage: e.target.value } })} />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Processor</label>
                        <input style={styles.input} placeholder="Intel i7" onChange={e => setAddForm({ ...addForm, customSpecs: { ...addForm.customSpecs, Processor: e.target.value } })} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Tonnage</label>
                        <input style={styles.input} placeholder="1.5 Ton" onChange={e => setAddForm({ ...addForm, customSpecs: { ...addForm.customSpecs, Tonnage: e.target.value } })} />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Gas Type</label>
                        <input style={styles.input} placeholder="R32" onChange={e => setAddForm({ ...addForm, customSpecs: { ...addForm.customSpecs, GasType: e.target.value } })} />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Clean Cycle Days</label>
                        <input style={styles.input} type="number" placeholder="90" onChange={e => setAddForm({ ...addForm, customSpecs: { ...addForm.customSpecs, FilterCleanCycleDays: parseInt(e.target.value, 10) } })} />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button style={styles.primaryBtn} type="submit">Create Asset</button>
            </form>
          )}

          {/* Search, filters, and paginations row controls */}
          <div style={styles.toolbar}>
            <input style={styles.filterSelect} placeholder="Search code, serial, name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            <select style={styles.filterSelect} value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {assetMetadata?.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select style={styles.filterSelect} value={brandFilter} onChange={e => { setBrandFilter(e.target.value); setPage(1); }}>
              <option value="">All Brands</option>
              {assetMetadata?.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select style={styles.filterSelect} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              {["Active", "Repair", "Scrapped", "Inactive"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Asset Code", "Name", "Category", "Brand", "Serial No", "Custodian", "Status"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset.id} style={{ ...styles.tr, ...(selectedId === asset.id ? styles.trActive : {}) }} onClick={() => setSelectedId(asset.id)}>
                    <td style={styles.td}><strong>{asset.code}</strong></td>
                    <td style={styles.td}>{asset.name}</td>
                    <td style={styles.td}>{asset.category}</td>
                    <td style={styles.td}>{asset.brand}</td>
                    <td style={styles.td}>{asset.serialNo}</td>
                    <td style={styles.td}>{asset.assignedTo}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: asset.status === "Active" ? "#22c55e22" : "#f59e0b22", color: asset.status === "Active" ? "#22c55e" : "#f59e0b" }}>
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {assets.length === 0 && <div style={styles.empty}>No assets registered.</div>}
          </div>

          {/* Pagination Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Total Assets: <strong>{totalAssetsCount}</strong>
            </span>
            <div style={{ display: "flex", gap: "10px" }}>
              <button disabled={page === 1} onClick={() => setPage(page - 1)} style={styles.secondaryBtn}>Previous</button>
              <button disabled={page * pageSize >= totalAssetsCount} onClick={() => setPage(page + 1)} style={styles.secondaryBtn}>Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Unified Details Sidebar Panel */}
      <div style={styles.detailPanel}>
        {!selectedId || loadingDetails ? (
          <div style={styles.emptyDetail}>{loadingDetails ? "Loading asset details..." : "Select an asset to view lifecycle specs."}</div>
        ) : (
          assetDetails && (
            <div>
              <div style={styles.detailHeader}>
                <div>
                  <div style={styles.muted}>Lifecycle details</div>
                  <div style={styles.detailNo}>{assetDetails.basic.code}</div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button style={{ ...styles.secondaryBtn, borderColor: "#ef4444", color: "#ef4444" }} onClick={handleArchiveSubmit}>Archive</button>
                </div>
              </div>

              {/* Dynamic specs specs display */}
              <div style={styles.descBox}>
                <div style={styles.muted}>Specifications (JSONB Mapping)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "5px" }}>
                  {Object.entries(assetDetails.basic.attributes).map(([key, val]) => (
                    <div key={key} style={{ fontSize: "0.78rem" }}>
                      <strong>{key.toUpperCase()}:</strong> {String(val)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Custody Assignment detail */}
              <div style={styles.descBox}>
                <div style={styles.muted}>Current Assignment Status</div>
                {assetDetails.currentAssignment ? (
                  <div style={{ fontSize: "0.8rem", marginTop: "5px" }}>
                    <div>Custodian: <strong>{assetDetails.currentAssignment.assignedTo}</strong></div>
                    <div>Assigned At: {assetDetails.currentAssignment.assignedAt}</div>
                    <div style={{ fontStyle: "italic", marginTop: "4px" }}>"{assetDetails.currentAssignment.remarks}"</div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <button style={styles.secondaryBtn} onClick={() => setShowTransferForm(!showTransferForm)}>Transfer Custody</button>
                      <button style={{ ...styles.secondaryBtn, color: "#ef4444" }} onClick={handleReturnAssetSubmit => handleReturnSubmit()}>Return Asset</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.8rem", marginTop: "5px", color: "#94a3b8" }}>
                    Asset is currently unassigned in warehouse store.
                    <button style={{ ...styles.primaryBtn, width: "100%", marginTop: "10px" }} onClick={() => setShowAssignForm(!showAssignForm)}>Assign Asset</button>
                  </div>
                )}
              </div>

              {/* Assignment Checkout Forms */}
              {showAssignForm && (
                <form onSubmit={handleAssignSubmit} style={{ ...styles.form, marginTop: "10px" }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Select Custodian</label>
                    <select style={styles.input} required value={assignForm.employeeId} onChange={e => setAssignForm({ ...assignForm, employeeId: e.target.value })}>
                      <option value="">Choose Employee</option>
                      {assetMetadata?.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Remarks</label>
                    <input style={styles.input} placeholder="Laptop issued for remote work." value={assignForm.remarks} onChange={e => setAssignForm({ ...assignForm, remarks: e.target.value })} />
                  </div>
                  <button style={styles.primaryBtn} type="submit">Complete Checkout</button>
                </form>
              )}

              {/* Transfer Custody Form */}
              {showTransferForm && (
                <form onSubmit={handleTransferSubmit} style={{ ...styles.form, marginTop: "10px" }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Transfer To</label>
                    <select style={styles.input} required value={transferForm.targetEmployeeId} onChange={e => setTransferForm({ ...transferForm, targetEmployeeId: e.target.value })}>
                      <option value="">Choose Target Employee</option>
                      {assetMetadata?.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Transfer Comments</label>
                    <input style={styles.input} placeholder="Re-allocated from manager to supervisor." value={transferForm.remarks} onChange={e => setTransferForm({ ...transferForm, remarks: e.target.value })} />
                  </div>
                  <button style={styles.primaryBtn} type="submit">Complete Transfer</button>
                </form>
              )}

              {/* Custody Assignment Audit Logs Timeline */}
              <div style={styles.timelineBox}>
                <div style={styles.muted}>Custody History Audit Trail</div>
                <div style={styles.timelineList}>
                  {assetDetails.assignmentHistory.map((item, index) => (
                    <div key={index} style={styles.timelineItem}>
                      <div style={styles.timelineHeader}>
                        <strong>Returned</strong>
                        <span style={styles.muted}>{item.returnedAt}</span>
                      </div>
                      <div style={styles.timelineBody}>Held by {item.assignedTo} (Assigned: {item.assignedAt}) — <em>"{item.remarks}"</em></div>
                    </div>
                  ))}
                  {assetDetails.assignmentHistory.length === 0 && <div style={styles.empty}>No past assignment records.</div>}
                </div>
              </div>

              {/* Maintenance & Servicing History logs */}
              <div style={styles.timelineBox}>
                <div style={styles.muted}>Maintenance Logs</div>
                <div style={styles.timelineList}>
                  {assetDetails.maintenanceHistory.map((item, index) => (
                    <div key={index} style={styles.timelineItem}>
                      <div style={styles.timelineHeader}>
                        <strong>{item.type} Servicing</strong>
                        <span style={styles.muted}>{item.startDate}</span>
                      </div>
                      <div style={styles.timelineBody}>{item.description} (Cost: ₹{item.cost}) by {item.performedBy}</div>
                    </div>
                  ))}
                  {assetDetails.maintenanceHistory.length === 0 && <div style={styles.empty}>No technical maintenance logs.</div>}
                </div>
              </div>

              {/* Documents & File Attachments categories list */}
              <div style={styles.timelineBox}>
                <div style={styles.detailHeader} style={{ marginBottom: "10px", paddingBottom: "5px" }}>
                  <div style={styles.muted}>Uploaded Documents</div>
                  <button style={styles.secondaryBtn} onClick={() => setShowUploadForm(!showUploadForm)}>+ Upload Doc</button>
                </div>

                {showUploadForm && (
                  <form onSubmit={handleUploadSubmit} style={{ ...styles.form, marginBottom: "10px" }}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Doc Category</label>
                      <select style={styles.input} value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}>
                        {["Warranty", "Invoice", "Agreement", "Photo", "Insurance", "Manual", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select File</label>
                      <input type="file" required style={styles.input} onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setUploadForm({ ...uploadForm, fileName: file.name, fileBlob: file });
                      }} />
                    </div>
                    <button style={styles.primaryBtn} type="submit">Upload File</button>
                  </form>
                )}

                <div style={styles.timelineList}>
                  {assetDetails.documents.map((doc, index) => (
                    <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", borderBottom: "1px dashed #f1f5f9", paddingBottom: "8px" }}>
                      <div>
                        <strong>[{doc.category}]</strong> {doc.name}
                      </div>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ color: "#0038a8", textDecoration: "none", fontWeight: 600 }}>Download</a>
                    </div>
                  ))}
                  {assetDetails.documents.length === 0 && <div style={styles.empty}>No warranty or manuals uploaded.</div>}
                </div>
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

  form: { background: "#f8fafc", padding: "20px", borderRadius: "4px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "16px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" },
  formGroup: { display: "flex", flexDirection:"column", gap: "6px" },
  label: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1.5px", color: "#111625", textTransform: "uppercase" },
  input: { width: "100%", padding: "10px 12px", fontSize: "0.82rem", color: "#111625", border: "1px solid #e2e8f0", borderRadius: "4px", background: "#fff", outline: "none" },

  toolbar: { display: "flex", gap: "12px" },
  filterSelect: { padding: "8px 12px", fontSize: "0.8rem", color: "#111625", border: "1px solid #e2e8f0", borderRadius: "4px", outline: "none", minWidth: "150px" },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, color: "#64748b", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "left", letterSpacing: "1px" },
  tr: { borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.2s" },
  trActive: { background: "#f1f5f9" },
  td: { padding: "12px 16px", fontSize: "0.8rem", color: "#111625" },
  badge: { fontSize: "0.68rem", fontWeight: 600, padding: "3px 8px", borderRadius: "20px", display: "inline-block" },
  empty: { color: "#94a3b8", fontSize: "0.82rem", textAlign: "center", padding: "30px" },

  detailPanel: { flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px", minWidth: "350px", maxHeight: "100vh", overflowY: "auto" },
  emptyDetail: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "0.85rem", padding: "40px", textAlign: "center" },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "16px" },
  muted: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1px", color: "#64748b", textTransform: "uppercase" },
  detailNo: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "#111625", marginTop: "4px" },

  descBox: { background: "#f8fafc", padding: "16px", borderRadius: "4px", border: "1px solid #e2e8f0", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "6px" },

  timelineBox: { border: "1px solid #e2e8f0", borderRadius: "4px", padding: "16px", marginBottom: "20px", background: "#fcfcfd" },
  timelineList: { display: "flex", flexDirection: "column", gap: "14px", maxHeight: "150px", overflowY: "auto", marginTop: "10px" },
  timelineItem: { display: "flex", flexDirection: "column", gap: "4px", borderLeft: "2px solid #e2e8f0", paddingLeft: "12px" },
  timelineHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" },
  timelineBody: { fontSize: "0.78rem", color: "#475569" }
};
