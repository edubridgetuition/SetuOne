import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";
import { supabase } from "../lib/supabase";

const CODE39_MAP = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100'
};

// Beautiful SVG Barcode Generator Component (Standard Code 39)
function BarcodeRenderer({ value }) {
  if (!value) return null;

  const cleanVal = value.toUpperCase().replace(/[^A-Z0-9\-\.\s]/g, "-");
  const fullString = `*${cleanVal}*`;
  
  const narrowWidth = 1.6;
  const wideWidth = 4.0;
  const height = 45;
  
  const bars = [];
  let x = 12;
  
  for (let i = 0; i < fullString.length; i++) {
    const char = fullString[i];
    const pattern = CODE39_MAP[char] || CODE39_MAP['-'];
    
    for (let j = 0; j < 9; j++) {
      const isBar = (j % 2 === 0);
      const isWide = (pattern[j] === '1');
      const width = isWide ? wideWidth : narrowWidth;
      
      if (isBar) {
        bars.push(<rect key={`bar-${i}-${j}`} x={x} y={10} width={width} height={height} fill="#0f172a" />);
      }
      x += width;
    }
    x += narrowWidth;
  }

  return (
    <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "14px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
      <svg width="100%" height="65" viewBox={`0 0 ${x + 12} 65`} preserveAspectRatio="xMidYMid meet">
        {bars}
      </svg>
      <div style={{ fontSize: "0.72rem", fontFamily: "monospace", letterSpacing: "1.2px", color: "#475569", textAlign: "center", wordBreak: "break-all" }}>
        {value}
      </div>
    </div>
  );
}

export default function AssetManagement({ defaultDivision = "", defaultCategory = "" }) {
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
    logAssetTransfer,
    changeAssetStatus,
    uploadAssetDocument,
    importAssets
  } = useApp();

  const [selectedId, setSelectedId] = useState(null);
  const [assetDetails, setAssetDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Filters and Pagination
  const [search, setSearch] = useState("");
  const [divFilter, setDivFilter] = useState(defaultDivision);
  const [catFilter, setCatFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Form toggles
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showDisposeForm, setShowDisposeForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);


  // Hierarchical category lists and sub-type mappings
  const categoryAssetTypes = {
    // IT Assets
    "Mobile": [{ name: "Mobile Phone", prefix: "MBL" }],
    "SIM": [{ name: "SIM Card", prefix: "SIM" }],
    "Laptop": [{ name: "Laptop", prefix: "LAP" }],
    "Desktop": [{ name: "Desktop CPU/Workstation", prefix: "DSK" }],
    "Monitor": [{ name: "LCD/LED Monitor", prefix: "MON" }],
    "Printer": [{ name: "Printer/Scanner", prefix: "PRN" }],
    "Networking": [{ name: "Network Switch/Router", prefix: "NET" }],
    "CCTV": [{ name: "CCTV Camera/NVR", prefix: "CTV" }],
    
    // Facility Assets
    "HVAC": [
      { name: "Split AC", prefix: "SAC" },
      { name: "Cassette AC", prefix: "CAC" },
      { name: "Ductable AC", prefix: "DAC" },
      { name: "VRV", prefix: "VRV" },
      { name: "VRF", prefix: "VRF" },
      { name: "AHU", prefix: "AHU" },
      { name: "FCU", prefix: "FCU" },
      { name: "Exhaust Fan", prefix: "EXH" },
      { name: "Air Curtain", prefix: "ACU" },
      { name: "Ventilation", prefix: "VNT" },
      { name: "Compressor", prefix: "CMP" }
    ],
    "Electrical": [
      { name: "UPS", prefix: "UPS" },
      { name: "Inverter", prefix: "INV" },
      { name: "Battery", prefix: "BAT" },
      { name: "Stabilizer", prefix: "STB" },
      { name: "Distribution Board", prefix: "DTB" },
      { name: "Transformer", prefix: "TRF" },
      { name: "LT Panel", prefix: "LTP" },
      { name: "MCB", prefix: "MCB" },
      { name: "ELCB", prefix: "ELC" },
      { name: "Energy Meter", prefix: "ENM" },
      { name: "DG Meter", prefix: "DGM" },
      { name: "UGVCL Meter", prefix: "UGM" },
      { name: "Others", prefix: "OTH" }
    ],
    "Machinery": [
      { name: "Packing Machine", prefix: "PKM" },
      { name: "Conveyor", prefix: "CVR" },
      { name: "Compressor", prefix: "MAC" },
      { name: "Pump", prefix: "PMP" },
      { name: "Boiler", prefix: "BLR" },
      { name: "Mixer", prefix: "MXR" },
      { name: "RO Plant", prefix: "ROP" },
      { name: "Generator", prefix: "GEN" },
      { name: "Air Compressor", prefix: "ACP" },
      { name: "Custom", prefix: "CST" }
    ],
    "Furniture": [
      { name: "Office Chair", prefix: "OFC" },
      { name: "Table", prefix: "TBL" },
      { name: "Workstation", prefix: "WKS" },
      { name: "Sofa", prefix: "SOF" },
      { name: "Cupboard", prefix: "CPB" },
      { name: "Locker", prefix: "LKR" },
      { name: "Cabinet", prefix: "CAB" },
      { name: "Rack", prefix: "RCK" },
      { name: "Conference Table", prefix: "CFT" },
      { name: "Others", prefix: "FUR" }
    ],
    "Vehicles": [{ name: "Vehicles", prefix: "VEH" }],
    "Safety Equipment": [{ name: "Safety Equipment", prefix: "SFE" }],
    "Others": [{ name: "Others", prefix: "OTH" }]
  };

  const indianStates = [
    "Gujarat", "Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", 
    "Uttar Pradesh", "Telangana", "Rajasthan", "Madhya Pradesh", "West Bengal"
  ];

  // Forms states
  const [addForm, setAddForm] = useState({
    division: "IT Assets",
    name: "",
    categoryId: "",
    assetType: "",
    customPrefix: "LAP",
    brandId: "",
    modelId: "",
    locationId: "",
    floorNumber: "",
    roomNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    purchaseCost: "5000",
    purchaseQty: "1",
    invoiceNo: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    invoiceCompany: "",
    warrantyMonths: "12",
    
    // GST Fields
    gstRate: "18",
    cgstRate: "9",
    sgstRate: "9",
    igstRate: "0",
    cgstAmount: "450",
    sgstAmount: "450",
    igstAmount: "0",
    gstType: "CGST_SGST",
    manualTaxMode: false,
    branchState: "Gujarat",
    vendorState: "Gujarat",

    // Depreciation
    depreciationRate: "10.0",
    depreciationMethod: "SLM",
    shortLifeYears: "",

    // Extra specs
    starRating: "5",
    makeBrand: "",
    serialNo: ""
  });

  const [editForm, setEditForm] = useState({
    name: "",
    categoryId: "",
    assetType: "",
    code: "",
    brandId: "",
    modelId: "",
    locationId: "",
    floorNumber: "",
    roomNumber: "",
    purchaseDate: "",
    purchaseCost: "",
    purchaseQty: "1",
    invoiceNo: "",
    invoiceDate: "",
    invoiceCompany: "",
    warrantyMonths: "",
    gstRate: "",
    cgstRate: "",
    sgstRate: "",
    igstRate: "",
    cgstAmount: "",
    sgstAmount: "",
    igstAmount: "",
    gstType: "CGST_SGST",
    manualTaxMode: false,
    branchState: "Gujarat",
    vendorState: "Gujarat",
    depreciationRate: "",
    depreciationMethod: "SLM",
    shortLifeYears: "",
    starRating: "",
    makeBrand: "",
    serialNo: "",
    status: ""
  });

  const [transferForm, setTransferForm] = useState({
    type: "Internal",
    newLocationId: "",
    newFloorNumber: "",
    newRoomNumber: "",
    sisterCompany: "",
    destinationBranch: "",
    shippedState: "Maharashtra",
    notes: ""
  });

  const [disposeForm, setDisposeForm] = useState({
    status: "Disposed",
    disposeDate: new Date().toISOString().split("T")[0],
    disposeReason: ""
  });

  const [assignForm, setAssignForm] = useState({ employeeId: "", remarks: "" });
  const [uploadForm, setUploadForm] = useState({ category: "Warranty", fileName: "", fileBlob: null });

  useEffect(() => {
    loadAssetMetadata();
  }, []);

  // Sync props filters when defaultDivision or defaultCategory changes
  useEffect(() => {
    if (defaultDivision) {
      setDivFilter(defaultDivision);
    } else {
      setDivFilter("");
    }
    if (defaultCategory && assetMetadata?.categories) {
      const match = assetMetadata.categories.find(c => c.name.toLowerCase() === defaultCategory.toLowerCase());
      if (match) {
        setCatFilter(match.id);
        // Also pre-fill addForm
        setAddForm(prev => ({
          ...prev,
          division: defaultDivision || prev.division,
          categoryId: match.id,
          assetType: defaultCategory
        }));
      }
    } else {
      setCatFilter("");
    }
  }, [defaultDivision, defaultCategory, assetMetadata]);

  // Filter Categories dropdown based on Division Selection
  const filteredCategories = assetMetadata?.categories.filter(c => {
    if (c.division) {
      return c.division === addForm.division;
    }
    const itCats = ["Mobile", "SIM", "Laptop", "Desktop", "Monitor", "Printer", "Networking", "CCTV"];
    if (addForm.division === "IT Assets") {
      return itCats.includes(c.name);
    } else {
      return !itCats.includes(c.name);
    }
  }) || [];

  const filteredEditCategories = assetMetadata?.categories.filter(c => {
    // For edit mode, we check category of edited item
    const selectedCat = assetMetadata?.categories.find(cat => cat.id === editForm.categoryId);
    const div = selectedCat?.division || "Facility Assets";
    if (c.division) {
      return c.division === div;
    }
    const itCats = ["Mobile", "SIM", "Laptop", "Desktop", "Monitor", "Printer", "Networking", "CCTV"];
    if (div === "IT Assets") {
      return itCats.includes(c.name);
    } else {
      return !itCats.includes(c.name);
    }
  }) || [];

  useEffect(() => {
    // When division changes, auto-select first category in that division
    if (filteredCategories.length > 0) {
      setAddForm(prev => ({
        ...prev,
        categoryId: filteredCategories[0].id
      }));
    }
  }, [addForm.division, assetMetadata]);

  // Load list on filters update
  useEffect(() => {
    loadAssets(
      {
        search,
        division: divFilter,
        categoryId: catFilter,
        brandId: brandFilter,
        status: statusFilter
      },
      page,
      pageSize
    );
  }, [search, divFilter, catFilter, brandFilter, statusFilter, page]);

  // Load Details once selectedId changes
  useEffect(() => {
    if (!selectedId) {
      setAssetDetails(null);
      setIsEditing(false);
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

  // Sync default options when metadata loads
  useEffect(() => {
    if (assetMetadata && !addForm.categoryId) {
      const firstCat = filteredCategories[0] || assetMetadata.categories[0];
      const defaultTypes = firstCat ? (categoryAssetTypes[firstCat.name] || []) : [];
      setAddForm(prev => ({
        ...prev,
        categoryId: firstCat?.id || "",
        brandId: assetMetadata.brands[0]?.id || "",
        modelId: assetMetadata.models[0]?.id || "",
        locationId: "",
        assetType: defaultTypes[0]?.name || "Other",
        customPrefix: defaultTypes[0]?.prefix || "AST"
      }));
    }
  }, [assetMetadata]);

  // Dynamically update prefix based on category / asset type selection
  useEffect(() => {
    if (!assetMetadata) return;
    const cat = assetMetadata.categories.find(c => c.id === addForm.categoryId);
    if (!cat) return;

    const types = categoryAssetTypes[cat.name] || [];
    // Default assetType to first if not set or not matching
    let currentType = addForm.assetType;
    if (types.length > 0 && !types.find(t => t.name === currentType)) {
      currentType = types[0].name;
    }

    const match = types.find(t => t.name === currentType);
    let prefix = "AST";
    if (match) {
      prefix = match.prefix;
    } else {
      prefix = cat.name.slice(0, 3).toUpperCase();
    }
    
    setAddForm(prev => ({
      ...prev,
      assetType: currentType || "Other",
      customPrefix: prefix
    }));
  }, [addForm.categoryId, addForm.assetType, assetMetadata]);

  // Dynamic GST tax calculation logic
  useEffect(() => {
    if (addForm.manualTaxMode) return;

    const cost = Number(addForm.purchaseCost || 0);
    const qty = Number(addForm.purchaseQty || 1);
    const totalCost = cost * qty;
    const rate = Number(addForm.gstRate || 0);

    const taxAmount = (totalCost * rate) / 100;

    if (addForm.branchState === addForm.vendorState) {
      const halfRate = rate / 2;
      const halfAmount = taxAmount / 2;
      setAddForm(prev => ({
        ...prev,
        gstType: "CGST_SGST",
        cgstRate: halfRate.toString(),
        sgstRate: halfRate.toString(),
        igstRate: "0",
        cgstAmount: halfAmount.toFixed(2),
        sgstAmount: halfAmount.toFixed(2),
        igstAmount: "0"
      }));
    } else {
      setAddForm(prev => ({
        ...prev,
        gstType: "IGST",
        cgstRate: "0",
        sgstRate: "0",
        igstRate: rate.toString(),
        cgstAmount: "0",
        sgstAmount: "0",
        igstAmount: taxAmount.toFixed(2)
      }));
    }
  }, [addForm.manualTaxMode, addForm.purchaseCost, addForm.purchaseQty, addForm.gstRate, addForm.branchState, addForm.vendorState]);

  // Dynamic Edit Form GST calculations
  useEffect(() => {
    if (editForm.manualTaxMode || !isEditing) return;

    const cost = Number(editForm.purchaseCost || 0);
    const qty = Number(editForm.purchaseQty || 1);
    const totalCost = cost * qty;
    const rate = Number(editForm.gstRate || 0);

    const taxAmount = (totalCost * rate) / 100;

    if (editForm.branchState === editForm.vendorState) {
      const halfRate = rate / 2;
      const halfAmount = taxAmount / 2;
      setEditForm(prev => ({
        ...prev,
        gstType: "CGST_SGST",
        cgstRate: halfRate.toString(),
        sgstRate: halfRate.toString(),
        igstRate: "0",
        cgstAmount: halfAmount.toFixed(2),
        sgstAmount: halfAmount.toFixed(2),
        igstAmount: "0"
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        gstType: "IGST",
        cgstRate: "0",
        sgstRate: "0",
        igstRate: rate.toString(),
        cgstAmount: "0",
        sgstAmount: "0",
        igstAmount: taxAmount.toFixed(2)
      }));
    }
  }, [editForm.manualTaxMode, editForm.purchaseCost, editForm.purchaseQty, editForm.gstRate, editForm.branchState, editForm.vendorState, isEditing]);



  // Edit details triggers
  function startEditing() {
    if (!assetDetails) return;
    const b = assetDetails.basic;
    setEditForm({
      name: b.name || "",
      categoryId: b.categoryId || "",
      assetType: b.assetType || "",
      code: b.code || "",
      brandId: b.brandId || "",
      modelId: b.modelId || "",
      locationId: b.locationId || "",
      floorNumber: b.floorNumber || "",
      roomNumber: b.roomNumber || "",
      purchaseDate: b.purchaseDate || "",
      purchaseCost: b.purchaseCost || "0",
      purchaseQty: b.purchaseQty || "1",
      invoiceNo: b.invoiceNo || "",
      invoiceDate: b.invoiceDate || "",
      invoiceCompany: b.invoiceCompany || "",
      warrantyMonths: b.warrantyMonths || "0",
      gstRate: b.gstRate || "0",
      cgstRate: b.cgstRate || "0",
      sgstRate: b.sgstRate || "0",
      igstRate: b.igstRate || "0",
      cgstAmount: b.cgstAmount || "0",
      sgstAmount: b.sgstAmount || "0",
      igstAmount: b.igstAmount || "0",
      gstType: b.gstType || "CGST_SGST",
      manualTaxMode: false,
      branchState: "Gujarat",
      vendorState: "Gujarat",
      depreciationRate: b.depreciationRate || "10.0",
      depreciationMethod: b.depreciationMethod || "SLM",
      shortLifeYears: b.shortLifeYears || "",
      starRating: b.starRating || "",
      makeBrand: b.makeBrand || "",
      serialNo: b.attributes?.serialNo || "",
      status: b.status || "Active"
    });
    setIsEditing(true);
  }

  // Save updates submitted from details sidebar form
  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!selectedId) return;

    const res = await updateAsset(selectedId, {
      ...editForm,
      locationId: editForm.locationId || null,
      floorNumber: editForm.floorNumber || null,
      roomNumber: editForm.roomNumber || null,
      shortLifeYears: editForm.shortLifeYears ? Number(editForm.shortLifeYears) : null,
      starRating: editForm.starRating ? Number(editForm.starRating) : null,
      purchaseCost: Number(editForm.purchaseCost || 0),
      purchaseQty: Number(editForm.purchaseQty || 1),
      gstRate: Number(editForm.gstRate || 0),
      cgstRate: Number(editForm.cgstRate || 0),
      sgstRate: Number(editForm.sgstRate || 0),
      igstRate: Number(editForm.igstRate || 0),
      cgstAmount: Number(editForm.cgstAmount || 0),
      sgstAmount: Number(editForm.sgstAmount || 0),
      igstAmount: Number(editForm.igstAmount || 0),
      depreciationRate: Number(editForm.depreciationRate || 10.0),
      warrantyMonths: Number(editForm.warrantyMonths || 0),
      attributes: {
        serialNo: editForm.serialNo,
        subType: editForm.assetType
      }
    });

    if (res.success) {
      alert("Asset specifications updated successfully.");
      setIsEditing(false);
      setSelectedId(null);
      setSelectedId(selectedId);
    } else {
      alert("Failed to update specifications: " + res.message);
    }
  }

  // Submit Handler for New Asset Creation (Supports Qty batch insertion)
  async function handleAddSubmit(e) {
    e.preventDefault();
    
    const prefix = addForm.customPrefix || "AST";
    let baseNum = 0;
    assets.forEach(a => {
      if (a.code && a.code.startsWith(prefix + "-")) {
        const parts = a.code.split("-");
        const suffix = parseInt(parts[1], 10);
        if (!isNaN(suffix) && suffix > baseNum) {
          baseNum = suffix;
        }
      }
    });

    const qty = Number(addForm.purchaseQty || 1);
    const locationName = assetMetadata?.locations.find(l => l.id === addForm.locationId)?.name || "Warehouse/Pending Allocation";

    let successCount = 0;

    for (let q = 1; q <= qty; q++) {
      const sequenceNum = baseNum + q;
      const generatedCode = `${prefix}-${String(sequenceNum).padStart(4, "0")}`;
      
      const barcodeValue = `${generatedCode} | ${locationName} (Floor ${addForm.floorNumber || "N/A"}, Room ${addForm.roomNumber || "N/A"}) | ${addForm.purchaseDate || "N/A"}`;

      const res = await createAsset({
        code: generatedCode,
        name: addForm.name + (qty > 1 ? ` (Item ${q})` : ""),
        categoryId: addForm.categoryId,
        brandId: addForm.brandId || null,
        modelId: addForm.modelId || null,
        locationId: addForm.locationId || null,
        purchaseDate: addForm.purchaseDate || null,
        warrantyExpiry: addForm.purchaseDate ? new Date(new Date(addForm.purchaseDate).setMonth(new Date(addForm.purchaseDate).getMonth() + Number(addForm.warrantyMonths))).toISOString().split("T")[0] : null,
        purchaseCost: Number(addForm.purchaseCost || 0),
        purchaseQty: 1,
        invoiceNo: addForm.invoiceNo || null,
        invoiceDate: addForm.invoiceDate || null,
        invoiceCompany: addForm.invoiceCompany || null,
        warrantyMonths: Number(addForm.warrantyMonths || 0),
        gstRate: Number(addForm.gstRate || 0),
        cgstRate: Number(addForm.cgstRate || 0),
        sgstRate: Number(addForm.sgstRate || 0),
        igstRate: Number(addForm.igstRate || 0),
        cgstAmount: Number(addForm.cgstAmount || 0),
        sgstAmount: Number(addForm.sgstAmount || 0),
        igstAmount: Number(addForm.igstAmount || 0),
        gstType: addForm.gstType,
        depreciationRate: Number(addForm.depreciationRate || 10.0),
        depreciationMethod: addForm.depreciationMethod,
        shortLifeYears: addForm.shortLifeYears ? Number(addForm.shortLifeYears) : null,
        starRating: addForm.starRating ? Number(addForm.starRating) : null,
        makeBrand: addForm.makeBrand || null,
        roomNumber: addForm.roomNumber || null,
        floorNumber: addForm.floorNumber || null,
        assetType: addForm.assetType,
        barcode: barcodeValue,
        attributes: {
          serialNo: addForm.serialNo || `SN-${generatedCode}`,
          subType: addForm.assetType
        }
      });

      if (res) {
        successCount++;
      }
    }

    if (successCount > 0) {
      alert(`Successfully registered ${successCount} assets sequentially under prefix "${prefix}".`);
      setShowAddForm(false);
      setAddForm(prev => ({
        ...prev,
        name: "",
        invoiceNo: "",
        invoiceCompany: "",
        serialNo: ""
      }));
    }
  }

  // Custody checkout assignment submit
  async function handleAssignSubmit(e) {
    e.preventDefault();
    if (!selectedId) return;
    const res = await assignAsset(selectedId, assignForm.employeeId, assignForm.remarks);
    if (res) {
      setSelectedId(null);
      setSelectedId(selectedId);
      setShowAssignForm(false);
      setAssignForm({ employeeId: "", remarks: "" });
    }
  }

  // Return asset to store custody
  async function handleReturnSubmit() {
    if (!selectedId) return;
    if (confirm("Are you sure you want to return this asset to store?")) {
      const res = await returnAsset(selectedId, "Returned to inventory store.");
      if (res) {
        setSelectedId(null);
        setSelectedId(selectedId);
      }
    }
  }

  // Soft delete / Archive asset handler
  async function handleArchiveSubmit() {
    if (!selectedId) return;
    if (confirm("Are you sure you want to archive/inactive this asset?")) {
      const res = await archiveAsset(selectedId);
      if (res.success) {
        alert("Asset archived successfully.");
        setSelectedId(null);
        loadAssets({}, 1, 10);
      }
    }
  }

  // Submit asset transfer (Internal location changes or External sister concern)
  async function handleTransferSubmit(e) {
    e.preventDefault();
    if (!selectedId || !assetDetails) return;

    const oldLoc = `${assetDetails.basic.location} (Floor ${assetDetails.basic.floorNumber || "N/A"}, Room ${assetDetails.basic.roomNumber || "N/A"})`;
    let newLoc = "";
    
    if (transferForm.type === "Internal") {
      const locName = assetMetadata?.locations.find(l => l.id === transferForm.newLocationId)?.name || "New Location";
      newLoc = `${locName} (Floor ${transferForm.newFloorNumber || "N/A"}, Room ${transferForm.newRoomNumber || "N/A"})`;
    } else {
      newLoc = `${transferForm.sisterCompany} - ${transferForm.destinationBranch} (${transferForm.shippedState})`;
    }

    const payload = {
      assetId: selectedId,
      type: transferForm.type,
      sisterCompany: transferForm.sisterCompany,
      destinationBranch: transferForm.destinationBranch,
      shippedState: transferForm.shippedState,
      oldLocation: oldLoc,
      newLocation: newLoc,
      notes: transferForm.notes,
      newLocationId: transferForm.type === "Internal" ? transferForm.newLocationId : null,
      newFloorNumber: transferForm.type === "Internal" ? transferForm.newFloorNumber : null,
      newRoomNumber: transferForm.type === "Internal" ? transferForm.newRoomNumber : null
    };

    const res = await logAssetTransfer(payload);
    if (res) {
      alert("Asset transfer logged and location updated successfully.");
      setSelectedId(null);
      setSelectedId(selectedId);
      setShowTransferForm(false);
      setTransferForm({
        type: "Internal",
        newLocationId: "",
        newFloorNumber: "",
        newRoomNumber: "",
        sisterCompany: "",
        destinationBranch: "",
        shippedState: "Maharashtra",
        notes: ""
      });
    }
  }

  // Submit Disposal/Stolen state log
  async function handleDisposeSubmit(e) {
    e.preventDefault();
    if (!selectedId || !assetDetails) return;

    const updates = {
      ...assetDetails.basic,
      code: assetDetails.basic.code,
      status: disposeForm.status,
      disposeDate: disposeForm.disposeDate,
      disposeReason: disposeForm.disposeReason,
      isStolen: disposeForm.status === "Stolen",
      categoryId: assetDetails.basic.categoryId,
      locationId: assetDetails.basic.locationId
    };

    const res = await updateAsset(selectedId, updates);
    if (res.success) {
      alert(`Asset reported as ${disposeForm.status} successfully.`);
      setSelectedId(null);
      setSelectedId(selectedId);
      setShowDisposeForm(false);
      setDisposeForm(prev => ({ ...prev, disposeReason: "" }));
    }
  }

  // Upload warranty/manual documents
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

  // Generate and download a standard CSV template for Excel imports
  function downloadCsvTemplate() {
    const headers = [
      "Asset Name", "Category (Furniture/IT Asset/HVAC)", "Sub-type (Chair/Table etc)", 
      "Prefix Code", "Make Brand", "Model", "Serial No", "Star Rating (1-5)", 
      "Purchase Date (YYYY-MM-DD)", "Purchase Cost", "Quantity", "Location Name", 
      "Floor Number", "Room Number", "GST Rate (%)", "Depreciation Rate (%)", "Warranty Months"
    ].join(",");

    const row = [
      "Office Executive Chair", "Furniture", "Office Chair", "OFC", "Godrej", "Ergonomic V2", "GD-OFC-987", "N/A",
      "2026-07-14", "4500", "5", "Main Office", "2nd Floor", "Room 205", "18", "15", "24"
    ].join(",");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + row;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "setuone_assets_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Parse CSV file for bulk import
  function handleCsvImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result || "";
      const lines = text.split("\n").filter(l => l.trim() !== "");
      if (lines.length <= 1) {
        alert("Empty CSV template file uploaded.");
        return;
      }

      const importedRows = [];
      const defaultCatId = assetMetadata?.categories[0]?.id;

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim().replace(/"/g, ""));
        if (cols.length < 5) continue;

        const name = cols[0] || "Imported Asset";
        const catName = cols[1] || "Furniture";
        const subType = cols[2] || "Office Chair";
        const prefix = cols[3] || "OFC";
        const makeBrand = cols[4] || "";
        const model = cols[5] || "";
        const serialNo = cols[6] || "";
        const starRating = cols[7] !== "N/A" && cols[7] ? parseInt(cols[7], 10) : null;
        const purchaseDate = cols[8] || null;
        const cost = Number(cols[9] || 0);
        const qty = parseInt(cols[10] || 1, 10);
        const locName = cols[11] || "";
        const floor = cols[12] || "";
        const room = cols[13] || "";
        const gstRate = Number(cols[14] || 18);
        const depRate = Number(cols[15] || 10);
        const warranty = parseInt(cols[16] || 12, 10);

        const categoryId = assetMetadata?.categories.find(c => c.name.toLowerCase() === catName.toLowerCase())?.id || defaultCatId;
        const locationId = assetMetadata?.locations.find(l => l.name.toLowerCase() === locName.toLowerCase())?.id || null;

        for (let q = 1; q <= qty; q++) {
          importedRows.push({
            name,
            categoryId,
            locationId,
            code: `${prefix}-IMP-${Date.now().toString().slice(-4)}-${q}`,
            purchaseDate,
            purchaseCost: cost,
            purchaseQty: 1,
            warrantyMonths: warranty,
            gstRate,
            depreciationRate: depRate,
            makeBrand,
            starRating,
            floorNumber: floor || null,
            roomNumber: room || null,
            assetType: subType,
            attributes: { serialNo, subType }
          });
        }
      }

      const res = await importAssets(importedRows);
      if (res.success) {
        alert(`Successfully imported and sequentialized ${importedRows.length} assets.`);
        loadAssets({}, 1, 10);
      } else {
        alert("Failed to import: " + res.message);
      }
    };
    reader.readAsText(file);
  }

  // Calculate year-by-year depreciation schedules
  const depreciationSchedule = assetDetails
    ? (() => {
        const cost = Number(assetDetails.basic.purchaseCost || 0);
        const rate = Number(assetDetails.basic.depreciationRate || 10.0);
        const method = assetDetails.basic.depreciationMethod || "SLM";
        const buyDate = assetDetails.basic.purchaseDate;
        
        if (!cost || !buyDate) return [];

        const startYear = new Date(buyDate).getFullYear();
        const currentYear = new Date().getFullYear();
        const yearsDiff = Math.max(1, currentYear - startYear + 1);

        const schedule = [];
        let bookValue = cost;
        const annualRate = rate / 100;

        for (let i = 0; i < yearsDiff; i++) {
          const year = startYear + i;
          let depAmt = 0;

          if (method === "SLM") {
            depAmt = cost * annualRate;
          } else {
            depAmt = bookValue * annualRate;
          }

          depAmt = Math.min(depAmt, bookValue);
          const opening = bookValue;
          bookValue -= depAmt;

          schedule.push({
            year,
            opening: opening.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            deduction: depAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            closing: bookValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          });
        }
        return schedule;
      })()
    : [];

  // Check if asset requires a short-life disposal warning
  const isShortLifeExpired = assetDetails?.basic.shortLifeYears && assetDetails?.basic.purchaseDate
    ? (() => {
        const limitYears = Number(assetDetails.basic.shortLifeYears);
        const buyYear = new Date(assetDetails.basic.purchaseDate).getFullYear();
        const currentYear = new Date().getFullYear();
        return (currentYear - buyYear) >= limitYears;
      })()
    : false;

  // Resolve Asset Types option list based on category
  const activeCategoryName = assetMetadata?.categories.find(c => c.id === addForm.categoryId)?.name || "";
  const activeAssetTypes = categoryAssetTypes[activeCategoryName] || [];

  const activeCategoryEditName = assetMetadata?.categories.find(c => c.id === editForm.categoryId)?.name || "";
  const activeAssetEditTypes = categoryAssetTypes[activeCategoryEditName] || [];

  const isReadOnlyView = !!defaultCategory;
  const showAddFormEffective = showAddForm && !isReadOnlyView;

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Corporate Asset Lifecycle Registry</div>
              <div style={styles.panelSub}>Track barcodes, internal floor transfers, tax inputs, and depreciation sheets.</div>
            </div>
            {!isReadOnlyView && (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button style={styles.secondaryBtn} onClick={downloadCsvTemplate}>Download CSV Template</button>
                <label style={styles.secondaryBtn}>
                  Import CSV
                  <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleCsvImport} />
                </label>
                <button style={styles.primaryBtn} onClick={() => setShowAddForm(!showAddForm)}>
                  {showAddForm ? "Cancel" : "+ New Asset"}
                </button>
              </div>
            )}
          </div>

          {/* Extended Asset Registration Form */}
          {showAddFormEffective && (
            <form onSubmit={handleAddSubmit} style={styles.form}>
              <div style={{ ...styles.panelTitle, fontSize: "0.85rem", borderBottom: "1px dashed #e2e8f0", paddingBottom: "8px" }}>
                Basic Specifications
              </div>
              
              {/* Asset Division (IT vs Facility) */}
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Asset Division</label>
                  <select style={styles.input} value={addForm.division} onChange={e => setAddForm({ ...addForm, division: e.target.value })}>
                    <option value="IT Assets">IT Assets</option>
                    <option value="Facility Assets">Facility Assets</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Asset Category</label>
                  <select style={styles.input} value={addForm.categoryId} onChange={e => setAddForm({ ...addForm, categoryId: e.target.value })}>
                    {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Sub-type / Asset Type dropdown populated dynamically */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Asset Type</label>
                  {activeAssetTypes.length > 0 ? (
                    <select style={styles.input} value={addForm.assetType} onChange={e => setAddForm({ ...addForm, assetType: e.target.value })}>
                      {activeAssetTypes.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                  ) : (
                    <input style={styles.input} required value={addForm.assetType} onChange={e => setAddForm({ ...addForm, assetType: e.target.value })} placeholder="e.g. Compressor, Generator" />
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Custom Prefix Code</label>
                  <input style={styles.input} required value={addForm.customPrefix} onChange={e => setAddForm({ ...addForm, customPrefix: e.target.value.toUpperCase() })} placeholder="e.g. LAP, SIM, CHR" />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Asset Name</label>
                  <input style={styles.input} required value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} placeholder="Executive Office Laptop" />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Manufacturer Make/Brand</label>
                  <input style={styles.input} required value={addForm.makeBrand} onChange={e => setAddForm({ ...addForm, makeBrand: e.target.value })} placeholder="e.g. Godrej, Dell, Voltas" />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Serial Number / Tag</label>
                  <input style={styles.input} required value={addForm.serialNo} onChange={e => setAddForm({ ...addForm, serialNo: e.target.value })} placeholder="e.g. G-9876543-F" />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Star Efficiency Rating</label>
                  <select style={styles.input} value={addForm.starRating} onChange={e => setAddForm({ ...addForm, starRating: e.target.value })}>
                    {["1 Star", "2 Star", "3 Star", "4 Star", "5 Star", "N/A"].map(s => <option key={s} value={s.replace(" Star", "")}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ ...styles.panelTitle, fontSize: "0.85rem", borderBottom: "1px dashed #e2e8f0", paddingBottom: "8px", marginTop: "10px" }}>
                Purchase Invoice & Location Mappings (Optional)
              </div>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Purchase Qty (Batch)</label>
                  <input style={styles.input} type="number" min="1" required value={addForm.purchaseQty} onChange={e => setAddForm({ ...addForm, purchaseQty: e.target.value })} />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Per Unit Cost (₹)</label>
                  <input style={styles.input} type="number" required value={addForm.purchaseCost} onChange={e => setAddForm({ ...addForm, purchaseCost: e.target.value })} />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Invoice Number</label>
                  <input style={styles.input} value={addForm.invoiceNo} onChange={e => setAddForm({ ...addForm, invoiceNo: e.target.value })} placeholder="INV-2026-987" />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Invoice Date</label>
                  <input style={styles.input} type="date" value={addForm.invoiceDate} onChange={e => setAddForm({ ...addForm, invoiceDate: e.target.value })} />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Invoice Vendor Company</label>
                  <input style={styles.input} value={addForm.invoiceCompany} onChange={e => setAddForm({ ...addForm, invoiceCompany: e.target.value })} placeholder="Godrej Office Furniture" />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Branch Location</label>
                  <select style={styles.input} value={addForm.locationId} onChange={e => setAddForm({ ...addForm, locationId: e.target.value })}>
                    <option value="">Warehouse / Pending Allocation</option>
                    {assetMetadata?.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Floor Number</label>
                  <input style={styles.input} value={addForm.floorNumber} onChange={e => setAddForm({ ...addForm, floorNumber: e.target.value })} placeholder="e.g. 2nd Floor" />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Room Number / Desk</label>
                  <input style={styles.input} value={addForm.roomNumber} onChange={e => setAddForm({ ...addForm, roomNumber: e.target.value })} placeholder="e.g. Room 205" />
                </div>
              </div>

              <div style={{ ...styles.panelTitle, fontSize: "0.85rem", borderBottom: "1px dashed #e2e8f0", paddingBottom: "8px", marginTop: "10px", display: "flex", justifyContent: "space-between" }}>
                <span>GST Tax Details</span>
                <label style={{ fontSize: "0.72rem", color: "#0038a8", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <input type="checkbox" checked={addForm.manualTaxMode} onChange={e => setAddForm({ ...addForm, manualTaxMode: e.target.checked })} />
                  Manual Override Mode
                </label>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Our Branch State</label>
                  <select style={styles.input} disabled={addForm.manualTaxMode} value={addForm.branchState} onChange={e => setAddForm({ ...addForm, branchState: e.target.value })}>
                    {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Vendor billing State</label>
                  <select style={styles.input} disabled={addForm.manualTaxMode} value={addForm.vendorState} onChange={e => setAddForm({ ...addForm, vendorState: e.target.value })}>
                    {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Applicable GST Type</label>
                  <input style={{ ...styles.input, background: "#f1f5f9" }} readOnly value={addForm.gstType === "CGST_SGST" ? "Local (CGST + SGST)" : "Interstate (IGST)"} />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Total GST Rate (%)</label>
                  <input style={styles.input} type="number" value={addForm.gstRate} onChange={e => setAddForm({ ...addForm, gstRate: e.target.value })} />
                </div>

                {addForm.gstType === "CGST_SGST" ? (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>CGST Rate (%)</label>
                      <input style={styles.input} type="number" readOnly={!addForm.manualTaxMode} value={addForm.cgstRate} onChange={e => setAddForm({ ...addForm, cgstRate: e.target.value })} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>CGST Amount (₹)</label>
                      <input style={styles.input} type="number" readOnly={!addForm.manualTaxMode} value={addForm.cgstAmount} onChange={e => setAddForm({ ...addForm, cgstAmount: e.target.value })} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>SGST Rate (%)</label>
                      <input style={styles.input} type="number" readOnly={!addForm.manualTaxMode} value={addForm.sgstRate} onChange={e => setAddForm({ ...addForm, sgstRate: e.target.value })} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>SGST Amount (₹)</label>
                      <input style={styles.input} type="number" readOnly={!addForm.manualTaxMode} value={addForm.sgstAmount} onChange={e => setAddForm({ ...addForm, sgstAmount: e.target.value })} />
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>IGST Rate (%)</label>
                      <input style={styles.input} type="number" readOnly={!addForm.manualTaxMode} value={addForm.igstRate} onChange={e => setAddForm({ ...addForm, igstRate: e.target.value })} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>IGST Amount (₹)</label>
                      <input style={styles.input} type="number" readOnly={!addForm.manualTaxMode} value={addForm.igstAmount} onChange={e => setAddForm({ ...addForm, igstAmount: e.target.value })} />
                    </div>
                  </>
                )}
              </div>

              <div style={{ ...styles.panelTitle, fontSize: "0.85rem", borderBottom: "1px dashed #e2e8f0", paddingBottom: "8px", marginTop: "10px" }}>
                Depreciation Config & Lifespan (Optional)
              </div>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Depreciation Method</label>
                  <select style={styles.input} value={addForm.depreciationMethod} onChange={e => setAddForm({ ...addForm, depreciationMethod: e.target.value })}>
                    <option value="SLM">Straight Line Method (SLM)</option>
                    <option value="WDV">Written Down Value (WDV)</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Annual Rate (%)</label>
                  <input style={styles.input} type="number" step="0.1" value={addForm.depreciationRate} onChange={e => setAddForm({ ...addForm, depreciationRate: e.target.value })} />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Disposal Lifespan (Years)</label>
                  <input style={styles.input} type="number" value={addForm.shortLifeYears} onChange={e => setAddForm({ ...addForm, shortLifeYears: e.target.value })} placeholder="Leave blank if unlimited" />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Warranty (Months)</label>
                  <input style={styles.input} type="number" value={addForm.warrantyMonths} onChange={e => setAddForm({ ...addForm, warrantyMonths: e.target.value })} />
                </div>
              </div>

              <button style={styles.primaryBtn} type="submit" style={{ marginTop: "10px", padding: "12px 24px" }}>Register Asset Batch</button>
            </form>
          )}

          {/* Search, filters, and status controls toolbar */}
          <div style={styles.toolbar}>
            <input style={{ ...styles.filterSelect, flex: 1.5 }} placeholder="Search name, invoice, purchase date (YYYY-MM-DD)..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            
            <select style={styles.filterSelect} value={divFilter} onChange={e => { 
              setDivFilter(e.target.value); 
              setCatFilter(""); // reset category filter
              setPage(1); 
            }}>
              <option value="">All Divisions</option>
              <option value="IT Assets">IT Assets</option>
              <option value="Facility Assets">Facility Assets</option>
            </select>

            <select style={styles.filterSelect} value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {assetMetadata?.categories
                .filter(c => !divFilter || c.division === divFilter)
                .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select style={styles.filterSelect} value={brandFilter} onChange={e => { setBrandFilter(e.target.value); setPage(1); }}>
              <option value="">All Brands</option>
              {assetMetadata?.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select style={styles.filterSelect} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              {["Active", "Repair", "Scrapped", "Inactive", "Disposed", "Stolen"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Assets Grid Table */}
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Asset Code", "Asset Name", "Category", "Location", "Serial No", "Custodian", "Status"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset.id} style={{ ...styles.tr, ...(selectedId === asset.id ? styles.trActive : {}) }} onClick={() => setSelectedId(asset.id)}>
                    <td style={styles.td}><strong>{asset.code}</strong></td>
                    <td style={styles.td}>{asset.name}</td>
                    <td style={styles.td}>{asset.category} {asset.assetType ? `(${asset.assetType})` : ""}</td>
                    <td style={styles.td}>{asset.location}</td>
                    <td style={styles.td}>{asset.serialNo}</td>
                    <td style={styles.td}>{asset.assignedTo}</td>
                    <td style={styles.td}>
                      <span style={{ 
                        ...styles.badge, 
                        background: asset.status === "Active" ? "#22c55e22" : asset.status === "Stolen" || asset.status === "Disposed" ? "#ef444422" : "#f59e0b22", 
                        color: asset.status === "Active" ? "#22c55e" : asset.status === "Stolen" || asset.status === "Disposed" ? "#ef4444" : "#f59e0b" 
                      }}>
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {assets.length === 0 && <div style={styles.empty}>No assets registered.</div>}
          </div>

          {/* Pagination bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Total Assets count: <strong>{totalAssetsCount}</strong>
            </span>
            <div style={{ display: "flex", gap: "10px" }}>
              <button disabled={page === 1} onClick={() => setPage(page - 1)} style={styles.secondaryBtn}>Previous</button>
              <button disabled={page * pageSize >= totalAssetsCount} onClick={() => setPage(page + 1)} style={styles.secondaryBtn}>Next</button>
            </div>
          </div>
        </div>

        {/* Legend for Abbreviations card */}
        <div style={styles.legendCard}>
          <div style={{ ...styles.panelTitle, fontSize: "0.85rem", marginBottom: "10px", color: "#1e293b" }}>
            Abbreviations & References Legend
          </div>
          <div style={styles.legendGrid}>
            <div><strong>SLM:</strong> Straight Line Method (Depreciation)</div>
            <div><strong>WDV:</strong> Written Down Value (Depreciation)</div>
            <div><strong>CGST:</strong> Central Goods and Services Tax</div>
            <div><strong>SGST:</strong> State Goods and Services Tax</div>
            <div><strong>IGST:</strong> Integrated Goods and Services Tax</div>
            <div><strong>HVAC:</strong> Heating, Ventilation, and Air Conditioning</div>
            <div><strong>PPM:</strong> Planned Preventive Maintenance</div>
            <div><strong>AMC:</strong> Annual Maintenance Contract</div>
          </div>
        </div>
      </div>

      {/* Asset Lifecycle Specification Sidebar */}
      <div style={styles.detailPanel}>
        {!selectedId || loadingDetails ? (
          <div style={styles.emptyDetail}>{loadingDetails ? "Loading asset specifications..." : "Select an asset row to view custom barcode values and depreciation ledger."}</div>
        ) : (
          assetDetails && (
            <div>
              {/* Conditional Edit Form Rendering */}
              {isEditing ? (
                <form onSubmit={handleEditSubmit} style={styles.form}>
                  <div style={{ ...styles.panelTitle, fontSize: "0.88rem", borderBottom: "1px dashed #cbd5e1", paddingBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                    <span>Edit Asset Specifications</span>
                    <button type="button" style={{ ...styles.secondaryBtn, fontSize: "0.72rem", padding: "4px 8px" }} onClick={() => setIsEditing(false)}>Cancel</button>
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Asset Name</label>
                    <input style={styles.input} required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Asset Category</label>
                    <select style={styles.input} value={editForm.categoryId} onChange={e => setEditForm({ ...editForm, categoryId: e.target.value })}>
                      {filteredEditCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Asset Type</label>
                    {activeAssetEditTypes.length > 0 ? (
                      <select style={styles.input} value={editForm.assetType} onChange={e => setEditForm({ ...editForm, assetType: e.target.value })}>
                        {activeAssetEditTypes.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                      </select>
                    ) : (
                      <input style={styles.input} required value={editForm.assetType} onChange={e => setEditForm({ ...editForm, assetType: e.target.value })} />
                    )}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Asset Code</label>
                    <input style={styles.input} required value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Manufacturer Make/Brand</label>
                    <input style={styles.input} value={editForm.makeBrand} onChange={e => setEditForm({ ...editForm, makeBrand: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Serial Number</label>
                    <input style={styles.input} value={editForm.serialNo} onChange={e => setEditForm({ ...editForm, serialNo: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Star Efficiency Rating</label>
                    <select style={styles.input} value={editForm.starRating} onChange={e => setEditForm({ ...editForm, starRating: e.target.value })}>
                      {["1", "2", "3", "4", "5", ""].map(s => <option key={s} value={s}>{s ? `${s} Star` : "N/A"}</option>)}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Location / Premises</label>
                    <select style={styles.input} value={editForm.locationId} onChange={e => setEditForm({ ...editForm, locationId: e.target.value })}>
                      <option value="">Warehouse / Unallocated</option>
                      {assetMetadata?.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Floor Number</label>
                    <input style={styles.input} value={editForm.floorNumber} onChange={e => setEditForm({ ...editForm, floorNumber: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Room Number</label>
                    <input style={styles.input} value={editForm.roomNumber} onChange={e => setEditForm({ ...editForm, roomNumber: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Purchase Date</label>
                    <input style={styles.input} type="date" value={editForm.purchaseDate} onChange={e => setEditForm({ ...editForm, purchaseDate: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Per Unit Cost (₹)</label>
                    <input style={styles.input} type="number" value={editForm.purchaseCost} onChange={e => setEditForm({ ...editForm, purchaseCost: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Invoice Number</label>
                    <input style={styles.input} value={editForm.invoiceNo} onChange={e => setEditForm({ ...editForm, invoiceNo: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Invoice Vendor</label>
                    <input style={styles.input} value={editForm.invoiceCompany} onChange={e => setEditForm({ ...editForm, invoiceCompany: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>GST Rate (%)</label>
                    <input style={styles.input} type="number" value={editForm.gstRate} onChange={e => setEditForm({ ...editForm, gstRate: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Depreciation Method</label>
                    <select style={styles.input} value={editForm.depreciationMethod} onChange={e => setEditForm({ ...editForm, depreciationMethod: e.target.value })}>
                      <option value="SLM">SLM (Straight Line)</option>
                      <option value="WDV">WDV (Written Down Value)</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Depreciation Rate (%)</label>
                    <input style={styles.input} type="number" step="0.1" value={editForm.depreciationRate} onChange={e => setEditForm({ ...editForm, depreciationRate: e.target.value })} />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Disposal Lifespan (Years)</label>
                    <input style={styles.input} type="number" value={editForm.shortLifeYears} onChange={e => setEditForm({ ...editForm, shortLifeYears: e.target.value })} placeholder="Leave blank if unlimited" />
                  </div>

                  <button style={styles.primaryBtn} type="submit">Save Updates</button>
                </form>
              ) : (
                <div>
                  <div style={styles.detailHeader}>
                    <div>
                      <div style={styles.muted}>Extended Specs</div>
                      <div style={styles.detailNo}>{assetDetails.basic.code}</div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button style={{ ...styles.secondaryBtn, color: "#0038a8", borderColor: "#0038a8" }} onClick={startEditing}>Edit details</button>
                      <button style={{ ...styles.secondaryBtn, color: "#ef4444", borderColor: "#ef4444" }} onClick={() => setShowDisposeForm(!showDisposeForm)}>Dispose/Stolen</button>
                      <button style={{ ...styles.secondaryBtn, color: "#94a3b8", borderColor: "#cbd5e1" }} onClick={handleArchiveSubmit}>Archive</button>
                    </div>
                  </div>

                  {/* Short-Life Warning Alert */}
                  {isShortLifeExpired && assetDetails.basic.status === "Active" && (
                    <div style={styles.disposalAlert}>
                      <strong>⚠️ Short-Life Disposal Alert</strong>
                      <div>This asset has reached its defined lifespan of {assetDetails.basic.shortLifeYears} years (Purchased: {assetDetails.basic.purchaseDate}). Please coordinate disposal.</div>
                    </div>
                  )}

                  {/* Dynamic SVGs Barcode Render Panel */}
                  <div style={styles.descBox}>
                    <div style={styles.muted}>Auto-Generated Scanner Barcode</div>
                    <div style={{ marginTop: "10px" }}>
                      <BarcodeRenderer value={assetDetails.basic.barcode || `${assetDetails.basic.code} | ${assetDetails.basic.location} | ${assetDetails.basic.purchaseDate}`} />
                    </div>
                  </div>

                  {/* Specs parameters table */}
                  <div style={styles.descBox}>
                    <div style={styles.muted}>Asset Specifications Details</div>
                    <div style={styles.specTable}>
                      <div><strong>Asset Name:</strong> {assetDetails.basic.name}</div>
                      <div><strong>Asset Type:</strong> {assetDetails.basic.assetType || "Other"}</div>
                      <div><strong>Make Brand:</strong> {assetDetails.basic.makeBrand || "N/A"}</div>
                      <div><strong>Serial Tag:</strong> {assetDetails.basic.serialNo || "N/A"}</div>
                      <div><strong>Star Rating:</strong> {assetDetails.basic.starRating ? `${assetDetails.basic.starRating} Star` : "N/A"}</div>
                      <div><strong>Floor Number:</strong> {assetDetails.basic.floorNumber || "N/A"}</div>
                      <div><strong>Room Desk No:</strong> {assetDetails.basic.roomNumber || "N/A"}</div>
                      <div><strong>Purchase Cost:</strong> ₹{Number(assetDetails.basic.purchaseCost).toLocaleString("en-IN")}</div>
                      <div><strong>Purchase Qty:</strong> {assetDetails.basic.purchaseQty} Unit(s)</div>
                      <div><strong>Warranty:</strong> {assetDetails.basic.warrantyExpiry || "N/A"} ({assetDetails.basic.warrantyMonths || 0} Months)</div>
                      <div><strong>Invoice No:</strong> {assetDetails.basic.invoiceNo || "N/A"}</div>
                      <div><strong>Invoice Vendor:</strong> {assetDetails.basic.invoiceCompany || "N/A"}</div>
                      <div><strong>GST Type:</strong> {assetDetails.basic.gstType === "IGST" ? "IGST (Interstate)" : "CGST + SGST (Local)"}</div>
                      {assetDetails.basic.gstType === "IGST" ? (
                        <div><strong>IGST Amount:</strong> ₹{Number(assetDetails.basic.igstAmount).toFixed(2)} ({assetDetails.basic.igstRate}%)</div>
                      ) : (
                        <>
                          <div><strong>CGST Amount:</strong> ₹{Number(assetDetails.basic.cgstAmount).toFixed(2)} ({assetDetails.basic.cgstRate}%)</div>
                          <div><strong>SGST Amount:</strong> ₹{Number(assetDetails.basic.sgstAmount).toFixed(2)} ({assetDetails.basic.sgstRate}%)</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Yearly Depreciation Ledger Card Table */}
                  <div style={styles.descBox}>
                    <div style={styles.muted}>Yearly Depreciation Ledger ({assetDetails.basic.depreciationMethod})</div>
                    <div style={{ overflowX: "auto", marginTop: "10px" }}>
                      <table style={styles.ledgerTable}>
                        <thead>
                          <tr>
                            <th>Year</th>
                            <th>Opening (₹)</th>
                            <th>Depreciation (₹)</th>
                            <th>Closing (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {depreciationSchedule.map(row => (
                            <tr key={row.year}>
                              <td><strong>{row.year}</strong></td>
                              <td>{row.opening}</td>
                              <td style={{ color: "#ef4444" }}>-{row.deduction}</td>
                              <td><strong>{row.closing}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Location Transfer controls panel */}
                  <div style={styles.descBox}>
                    <div style={styles.detailHeader} style={{ borderBottom: "none", paddingBottom: 0, marginBottom: "8px" }}>
                      <div style={styles.muted}>Premises Location custody</div>
                      <button style={styles.secondaryBtn} onClick={() => setShowTransferForm(!showTransferForm)}>Transfer Asset</button>
                    </div>
                    
                    {showTransferForm && (
                      <form onSubmit={handleTransferSubmit} style={styles.embeddedForm}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Transfer Type</label>
                          <select style={styles.input} value={transferForm.type} onChange={e => setTransferForm({ ...transferForm, type: e.target.value })}>
                            <option value="Internal">Internal (Floor/Room location update)</option>
                            <option value="External">External (Sister concern company shipment)</option>
                          </select>
                        </div>

                        {transferForm.type === "Internal" ? (
                          <>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Target Premises</label>
                              <select style={styles.input} required value={transferForm.newLocationId} onChange={e => setTransferForm({ ...transferForm, newLocationId: e.target.value })}>
                                <option value="">Select Premises Location</option>
                                {assetMetadata?.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                              </select>
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>New Floor Level</label>
                              <input style={styles.input} value={transferForm.newFloorNumber} onChange={e => setTransferForm({ ...transferForm, newFloorNumber: e.target.value })} placeholder="e.g. 3rd Floor" />
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>New Room Desk No</label>
                              <input style={styles.input} value={transferForm.newRoomNumber} onChange={e => setTransferForm({ ...transferForm, newRoomNumber: e.target.value })} placeholder="e.g. Room 302" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Sister Concern Company</label>
                              <input style={styles.input} required value={transferForm.sisterCompany} onChange={e => setTransferForm({ ...transferForm, sisterCompany: e.target.value })} placeholder="e.g. Orion Logistics Pvt Ltd" />
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Destination Branch</label>
                              <input style={styles.input} required value={transferForm.destinationBranch} onChange={e => setTransferForm({ ...transferForm, destinationBranch: e.target.value })} placeholder="e.g. Mumbai Hub" />
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Destination State</label>
                              <select style={styles.input} value={transferForm.shippedState} onChange={e => setTransferForm({ ...transferForm, shippedState: e.target.value })}>
                                {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          </>
                        )}

                        <div style={styles.formGroup}>
                          <label style={styles.label}>Transfer Audit notes</label>
                          <input style={styles.input} placeholder="Reason for floor transfer or concern allocation." value={transferForm.notes} onChange={e => setTransferForm({ ...transferForm, notes: e.target.value })} />
                        </div>

                        <button style={styles.primaryBtn} type="submit">Log Transfer</button>
                      </form>
                    )}

                    {/* Transfer History Timeline */}
                    <div style={styles.timelineList}>
                      {assetDetails.transferHistory?.map((item, index) => (
                        <div key={index} style={styles.timelineItem}>
                          <div style={styles.timelineHeader}>
                            <strong>{item.type} Transfer</strong>
                            <span style={styles.muted}>{item.transferDate}</span>
                          </div>
                          <div style={styles.timelineBody}>
                            Moved from {item.oldLocation} ➡️ {item.newLocation}. <br/>
                            <span style={{ fontSize: "0.72rem", fontStyle: "italic", color: "#64748b" }}>"{item.notes}"</span>
                          </div>
                        </div>
                      ))}
                      {(!assetDetails.transferHistory || assetDetails.transferHistory.length === 0) && (
                        <div style={{ fontSize: "0.78rem", color: "#94a3b8", fontStyle: "italic" }}>No location transfers recorded.</div>
                      )}
                    </div>
                  </div>

                  {/* Disposal / Loss Logging Form overlay */}
                  {showDisposeForm && (
                    <div style={styles.descBox}>
                      <div style={styles.muted}>Disposal / Loss Report Logging</div>
                      <form onSubmit={handleDisposeSubmit} style={styles.embeddedForm}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Status Category</label>
                          <select style={styles.input} value={disposeForm.status} onChange={e => setDisposeForm({ ...disposeForm, status: e.target.value })}>
                            <option value="Disposed">Disposed (End-of-life scrapped)</option>
                            <option value="Stolen">Stolen (Asset lost/stolen)</option>
                          </select>
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Action Date</label>
                          <input style={styles.input} type="date" value={disposeForm.disposeDate} onChange={e => setDisposeForm({ ...disposeForm, disposeDate: e.target.value })} />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Notes / Reason / FIR No</label>
                          <input style={styles.input} required placeholder="FIR number or scrapper dealer receipt details." value={disposeForm.disposeReason} onChange={e => setDisposeForm({ ...disposeForm, disposeReason: e.target.value })} />
                        </div>
                        <button style={{ ...styles.primaryBtn, background: "#ef4444" }} type="submit">Complete Log</button>
                      </form>
                    </div>
                  )}

                  {/* Custody Employee checkout section */}
                  <div style={styles.descBox}>
                    <div style={styles.muted}>Current Employee Custody</div>
                    {assetDetails.currentAssignment ? (
                      <div style={{ fontSize: "0.8rem", marginTop: "5px" }}>
                        <div>Custodian Employee: <strong>{assetDetails.currentAssignment.assignedTo}</strong></div>
                        <div>Assigned Date: {assetDetails.currentAssignment.assignedAt}</div>
                        <div style={{ fontStyle: "italic", marginTop: "4px" }}>"{assetDetails.currentAssignment.remarks}"</div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                          <button style={styles.secondaryBtn} onClick={() => setShowAssignForm(!showAssignForm)}>Re-assign Custodian</button>
                          <button style={{ ...styles.secondaryBtn, color: "#ef4444" }} onClick={handleReturnSubmit}>Return Custody</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.8rem", marginTop: "5px", color: "#94a3b8" }}>
                        Unassigned. Kept in store room.
                        <button style={{ ...styles.primaryBtn, width: "100%", marginTop: "10px" }} onClick={() => setShowAssignForm(!showAssignForm)}>Assign Custodian</button>
                      </div>
                    )}
                  </div>

                  {/* Custody Checkout Employee Form */}
                  {showAssignForm && (
                    <form onSubmit={handleAssignSubmit} style={{ ...styles.form, marginTop: "10px" }}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Select Custodian Employee</label>
                        <select style={styles.input} required value={assignForm.employeeId} onChange={e => setAssignForm({ ...assignForm, employeeId: e.target.value })}>
                          <option value="">Choose Employee</option>
                          {assetMetadata?.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Issuance Comments</label>
                        <input style={styles.input} placeholder="Laptop issued for client code deployment." value={assignForm.remarks} onChange={e => setAssignForm({ ...assignForm, remarks: e.target.value })} />
                      </div>
                      <button style={styles.primaryBtn} type="submit">Assign Custodian</button>
                    </form>
                  )}

                  {/* Audits Checkout history timeline */}
                  <div style={styles.timelineBox}>
                    <div style={styles.muted}>Custody Issue Audit Trail</div>
                    <div style={styles.timelineList}>
                      {assetDetails.assignmentHistory.map((item, index) => (
                        <div key={index} style={styles.timelineItem}>
                          <div style={styles.timelineHeader}>
                            <strong>Returned</strong>
                            <span style={styles.muted}>{item.returnedAt}</span>
                          </div>
                          <div style={styles.timelineBody}>Custodian: {item.assignedTo} (Assigned: {item.assignedAt}) — <em>"{item.remarks}"</em></div>
                        </div>
                      ))}
                      {assetDetails.assignmentHistory.length === 0 && <div style={styles.empty}>No past custodian issuance history.</div>}
                    </div>
                  </div>

                  {/* Documents warranties upload & listing */}
                  <div style={styles.timelineBox}>
                    <div style={styles.detailHeader} style={{ marginBottom: "10px", paddingBottom: "5px" }}>
                      <div style={styles.muted}>Invoices & Warranties Files</div>
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
                      {assetDetails.documents.length === 0 && <div style={styles.empty}>No uploaded documents found.</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", gap: "20px", width: "100%", padding: "10px" },
  left: { flex: 1.8, minWidth: "0" },
  panel: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" },
  panelTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" },
  panelSub: { fontSize: "0.8rem", color: "#64748b", marginTop: "2px" },
  primaryBtn: { background: "#0038a8", color: "#fff", border: "none", borderRadius: "4px", padding: "10px 16px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" },
  secondaryBtn: { background: "#fff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 14px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", display: "inline-block", textAlign: "center" },

  form: { background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "16px", marginBottom: "15px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1px", color: "#475569", textTransform: "uppercase" },
  input: { width: "100%", padding: "10px 12px", fontSize: "0.82rem", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#fff", outline: "none", boxSizing: "border-box" },
  embeddedForm: { background: "#ffffff", border: "1px solid #e2e8f0", padding: "14px", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" },

  toolbar: { display: "flex", gap: "12px", flexWrap: "wrap" },
  filterSelect: { padding: "10px 12px", fontSize: "0.8rem", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: "4px", outline: "none", minWidth: "160px" },

  tableWrap: { overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "6px", marginTop: "10px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, color: "#64748b", padding: "14px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "left", letterSpacing: "1px", background: "#f8fafc" },
  tr: { borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.2s" },
  trActive: { background: "#f8fafc" },
  td: { padding: "14px 16px", fontSize: "0.8rem", color: "#334155" },
  badge: { fontSize: "0.68rem", fontWeight: 600, padding: "3px 8px", borderRadius: "20px", display: "inline-block" },
  empty: { color: "#94a3b8", fontSize: "0.82rem", textAlign: "center", padding: "30px" },

  detailPanel: { flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "24px", minWidth: "380px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)" },
  emptyDetail: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "0.82rem", padding: "40px", textAlign: "center", fontStyle: "italic" },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "16px" },
  muted: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1px", color: "#64748b", textTransform: "uppercase" },
  detailNo: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginTop: "4px" },

  descBox: { background: "#f8fafc", padding: "16px", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "6px" },
  specTable: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px", fontSize: "0.78rem", color: "#334155", marginTop: "5px" },
  
  ledgerTable: { width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" },
  disposalAlert: { background: "#fef3c7", border: "1px solid #f59e0b", color: "#b45309", padding: "12px", borderRadius: "6px", fontSize: "0.78rem", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "4px" },

  timelineBox: { border: "1px solid #e2e8f0", borderRadius: "6px", padding: "16px", marginBottom: "20px", background: "#fcfcfd" },
  timelineList: { display: "flex", flexDirection: "column", gap: "14px", maxHeight: "180px", overflowY: "auto", marginTop: "10px" },
  timelineItem: { display: "flex", flexDirection: "column", gap: "4px", borderLeft: "2px solid #e2e8f0", paddingLeft: "12px" },
  timelineHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" },
  timelineBody: { fontSize: "0.78rem", color: "#475569" },

  legendCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px", marginTop: "20px", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)" },
  legendGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px 20px", fontSize: "0.76rem", color: "#475569" }
};
