import { useEffect, useState } from "react";
import { useApp } from "../context/appContextCore";
import { supabase } from "../lib/supabase";
import { MdEdit, MdArchive, MdVisibility, MdSearch, MdFilterList, MdHome, MdPeople, MdPayments, MdPercent } from "react-icons/md";

export default function GuestHouseManagement({ defaultFilter = "All" }) {
  const { session } = useApp();
  
  // Lists
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [formType, setFormType] = useState(null); // 'tenant', 'property', or null
  const [activeTab, setActiveTab] = useState(defaultFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);

  // Tenant Form State
  const [fullName, setFullName] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [phone, setPhone] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [rentStatus, setRentStatus] = useState("Paid");
  const [tenantStatus, setTenantStatus] = useState("Active");

  // Property Form State
  const [name, setName] = useState("");
  const [type, setType] = useState("Flat");
  const [address, setAddress] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerContact, setOwnerContact] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("Vacant");

  async function loadData() {
    setLoading(true);
    try {
      // 1. Load properties
      const { data: propsData, error: propsErr } = await supabase
        .from("hired_properties")
        .select("*")
        .order("name", { ascending: true });
      if (!propsErr && propsData) {
        setProperties(propsData);
        if (propsData.length > 0 && !selectedPropertyId) {
          setSelectedPropertyId(propsData[0].id);
        }
      }

      // 2. Load tenants
      const { data: tensData, error: tensErr } = await supabase
        .from("property_tenants")
        .select("*, hired_properties(name)")
        .order("full_name", { ascending: true });
      if (!tensErr && tensData) {
        setTenants(tensData);
        if (tensData.length > 0 && !selectedTenantId) {
          setSelectedTenantId(tensData[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load Property and Tenant directory:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setActiveTab(defaultFilter);
    setFormType(null);
    setSearchQuery("");
  }, [defaultFilter]);

  useEffect(() => {
    loadData();
  }, []);

  // Format date helper: "2024-02-05" -> "05 Feb 2024"
  function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(date.getDate()).padStart(2, "0");
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  // Handle Onboard Submission (Tenant or Property)
  async function handleOnboardSubmit(e) {
    e.preventDefault();
    const companyId = session?.companyId || "7e85d57c-2dcd-4943-9066-6467c5bb10e4";

    if (formType === "property") {
      // Register Property
      if (!name.trim() || !address.trim()) {
        alert("Please enter property name and address.");
        return;
      }
      const { error } = await supabase.from("hired_properties").insert({
        company_id: companyId,
        name: name.trim(),
        type,
        address: address.trim(),
        owner_name: ownerName.trim(),
        owner_contact: ownerContact.trim(),
        monthly_rent: parseFloat(monthlyRent) || 0,
        security_deposit: parseFloat(securityDeposit) || 0,
        agreement_start_date: startDate || null,
        agreement_end_date: endDate || null,
        status: propertyStatus
      });

      if (error) {
        alert("Failed to register property: " + error.message);
      } else {
        alert("Property and rent agreement registered successfully!");
        setName(""); setAddress(""); setOwnerName(""); setOwnerContact("");
        setMonthlyRent(""); setSecurityDeposit(""); setStartDate(""); setEndDate("");
        setFormType(null);
        loadData();
      }
    } else if (formType === "tenant") {
      // Register Tenant / Occupant
      if (!fullName.trim() || !phone.trim()) {
        alert("Please enter tenant name and phone number.");
        return;
      }
      const { error } = await supabase.from("property_tenants").insert({
        company_id: companyId,
        property_id: propertyId || null,
        full_name: fullName.trim(),
        room_no: roomNo.trim(),
        phone: phone.trim(),
        joining_date: joiningDate || new Date().toISOString().split("T")[0],
        rent_status: rentStatus,
        status: tenantStatus
      });

      if (error) {
        alert("Failed to onboard tenant: " + error.message);
      } else {
        alert("Tenant onboarded successfully!");
        setFullName(""); setRoomNo(""); setPhone(""); setJoiningDate("");
        setPropertyId(""); setRentStatus("Paid"); setTenantStatus("Active");
        setFormType(null);
        loadData();
      }
    }
  }

  // Handle Edit / Save Inline
  async function handleUpdateTenant(e) {
    e.preventDefault();
    if (!editingTenant) return;

    const { error } = await supabase
      .from("property_tenants")
      .update({
        full_name: editingTenant.full_name,
        room_no: editingTenant.room_no,
        phone: editingTenant.phone,
        rent_status: editingTenant.rent_status,
        status: editingTenant.status
      })
      .eq("id", editingTenant.id);

    if (error) {
      alert("Failed to update tenant: " + error.message);
    } else {
      alert("Tenant updated successfully!");
      setEditingTenant(null);
      loadData();
    }
  }

  // Archive Tenant / Property (Set status as Inactive)
  async function handleArchive(id, type) {
    const confirmMsg = `Are you sure you want to archive this ${type}?`;
    if (!confirm(confirmMsg)) return;

    if (type === "tenant") {
      const { error } = await supabase
        .from("property_tenants")
        .update({ status: "Inactive" })
        .eq("id", id);
      if (error) alert("Archive failed: " + error.message);
      else loadData();
    } else {
      const { error } = await supabase
        .from("hired_properties")
        .update({ status: "Inactive" })
        .eq("id", id);
      if (error) alert("Archive failed: " + error.message);
      else loadData();
    }
  }

  // Search filtering
  const query = searchQuery.toLowerCase().trim();

  // Filter occupants
  const filteredTenants = tenants
    .filter(t => {
      if (activeTab === "Active") return t.status === "Active";
      if (activeTab === "Inactive") return t.status === "Inactive";
      return true; // "All" tab show everything
    })
    .filter(t => {
      if (!query) return true;
      return (
        t.full_name?.toLowerCase().includes(query) ||
        t.room_no?.toLowerCase().includes(query) ||
        t.phone?.toLowerCase().includes(query) ||
        t.hired_properties?.name?.toLowerCase().includes(query)
      );
    });

  // Filter properties
  const filteredProperties = properties.filter(p => {
    if (!query) return true;
    return (
      p.name?.toLowerCase().includes(query) ||
      p.address?.toLowerCase().includes(query) ||
      p.owner_name?.toLowerCase().includes(query)
    );
  });

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // Counts & Calculations
  const totalTenantsCount = tenants.length;
  const activeTenantsCount = tenants.filter(t => t.status === "Active").length;
  const inactiveTenantsCount = tenants.filter(t => t.status === "Inactive").length;
  
  const totalPropertiesCount = properties.length;
  const occupiedPropertiesCount = properties.filter(p => p.status === "Occupied").length;
  const activeRentCommitment = properties
    .filter(p => p.status !== "Inactive")
    .reduce((sum, p) => sum + (p.monthly_rent || 0), 0);

  const occupancyRate = totalPropertiesCount > 0 
    ? Math.round((occupiedPropertiesCount / totalPropertiesCount) * 100) 
    : 0;

  // Sorted list for Dashboard Sub-sections
  const soonExpiringAgreements = [...properties]
    .filter(p => p.status !== "Inactive" && p.agreement_end_date)
    .sort((a, b) => new Date(a.agreement_end_date) - new Date(b.agreement_end_date))
    .slice(0, 4);

  const recentCheckins = [...tenants]
    .filter(t => t.status === "Active")
    .sort((a, b) => new Date(b.joining_date) - new Date(a.joining_date))
    .slice(0, 4);

  // Header Title mapping
  let tableHeaderTitle = "All Tenants";
  if (activeTab === "Active") tableHeaderTitle = "Active Tenants";
  else if (activeTab === "Inactive") tableHeaderTitle = "Inactive Tenants";
  else if (activeTab === "Agreements") tableHeaderTitle = "Flats & Landlord Agreements";
  else if (activeTab === "Dashboard") tableHeaderTitle = "Property Overview";

  return (
    <div style={styles.page}>
      <div style={{ ...styles.left, flex: activeTab === "Dashboard" ? 1 : 1.8 }}>
        <div style={styles.panel}>
          
          {/* Top Control Bar with Search and Actions */}
          <div style={styles.topControlBar}>
            <div style={styles.searchWrapper}>
              <MdSearch size={20} color="#94a3b8" style={styles.searchIcon} />
              <input
                style={styles.searchInput}
                type="text"
                placeholder={activeTab === "Agreements" ? "Search properties..." : "Search tenant..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div style={styles.actionButtonGroup}>
              <button type="button" style={styles.filterBtn}>
                <MdFilterList size={18} color="#475569" style={{ marginRight: "6px" }} />
                Filter
              </button>
              
              <button 
                type="button" 
                style={styles.addTenantBtn} 
                onClick={() => { setFormType("tenant"); setSelectedTenantId(null); }}
              >
                + Add Tenant
              </button>
              
              <button 
                type="button" 
                style={styles.addPropertyBtn} 
                onClick={() => { setFormType("property"); setSelectedPropertyId(null); }}
              >
                + Add Hired Flat / Agreement
              </button>
            </div>
          </div>

          {/* Tab Headers */}
          {formType === null && (
            <div style={styles.tabHeader}>
              {[
                { key: "All", label: `All Tenants (${totalTenantsCount})` },
                { key: "Active", label: `Active (${activeTenantsCount})` },
                { key: "Inactive", label: `Inactive (${inactiveTenantsCount})` },
                { key: "Agreements", label: `Flats & Landlord Agreements (${totalPropertiesCount})` }
              ].map(tab => (
                <button
                  key={tab.key}
                  style={{ ...styles.tabBtn, ...(activeTab === tab.key ? styles.tabBtnActive : {}) }}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSelectedTenantId(null);
                    setSearchQuery("");
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {formType !== null ? (
            /* Onboarding Form Container */
            <form onSubmit={handleOnboardSubmit} style={styles.form}>
              {formType === "property" ? (
                /* Onboard Property Form */
                <>
                  <div style={styles.muted}>Register New Leased Property</div>
                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 2 }}>
                      <label style={styles.label}>Property / Flat Name</label>
                      <input style={styles.input} required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Orion Residency, Flat 302" />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Property Type</label>
                      <select style={styles.input} value={type} onChange={e => setType(e.target.value)}>
                        <option value="Flat">Flat</option>
                        <option value="Guest House">Guest House</option>
                        <option value="Villa">Villa</option>
                        <option value="Office">Office</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Full Address</label>
                    <input style={styles.input} required value={address} onChange={e => setAddress(e.target.value)} placeholder="Full street details, city, pincode" />
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Landlord Name</label>
                      <input style={styles.input} value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="e.g. Suresh Kumar" />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Landlord Contact</label>
                      <input style={styles.input} value={ownerContact} onChange={e => setOwnerContact(e.target.value)} placeholder="e.g. +91 98765 43210" />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Monthly Rent (₹)</label>
                      <input type="number" style={styles.input} required value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} placeholder="e.g. 25000" />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Security Deposit (₹)</label>
                      <input type="number" style={styles.input} required value={securityDeposit} onChange={e => setSecurityDeposit(e.target.value)} placeholder="e.g. 75000" />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Agreement Start Date</label>
                      <input type="date" style={styles.input} value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Agreement End Date</label>
                      <input type="date" style={styles.input} value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Initial Property Status</label>
                    <select style={styles.input} value={propertyStatus} onChange={e => setPropertyStatus(e.target.value)}>
                      <option value="Vacant">Vacant</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Inactive">Inactive / Suspended</option>
                    </select>
                  </div>
                </>
              ) : (
                /* Onboard Tenant Form */
                <>
                  <div style={styles.muted}>Register New Occupant / Tenant</div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Occupant Full Name</label>
                    <input style={styles.input} required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Jesvita Fernandes" />
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 2 }}>
                      <label style={styles.label}>Assigned Leased Property</label>
                      <select style={styles.input} value={propertyId} onChange={e => setPropertyId(e.target.value)}>
                        <option value="">-- Choose Flat / Guest House --</option>
                        {properties.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Room No / Tag</label>
                      <input style={styles.input} value={roomNo} onChange={e => setRoomNo(e.target.value)} placeholder="e.g. 31" />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Phone Number</label>
                      <input style={styles.input} required value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +91 99887 76655" />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Joining Date</label>
                      <input type="date" style={styles.input} value={joiningDate} onChange={e => setJoiningDate(e.target.value)} />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Rent Status</label>
                      <select style={styles.input} value={rentStatus} onChange={e => setRentStatus(e.target.value)}>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Tenant Status</label>
                      <select style={styles.input} value={tenantStatus} onChange={e => setTenantStatus(e.target.value)}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button style={styles.primaryBtn} type="submit">Submit Registration</button>
                <button style={styles.secondaryBtn} type="button" onClick={() => setFormType(null)}>Cancel</button>
              </div>
            </form>
          ) : activeTab === "Dashboard" ? (
            /* Dashboard Executive View Screen */
            <div style={styles.dashboardContainer}>
              
              {/* Dashboard Metric Row */}
              <div style={styles.dashStatsGrid}>
                <div style={styles.dashCard}>
                  <div style={styles.dashCardHeader}>
                    <div style={styles.dashCardInfo}>
                      <span style={styles.dashLabel}>Hired Properties</span>
                      <span style={styles.dashValue}>{totalPropertiesCount}</span>
                    </div>
                    <div style={{ ...styles.dashIconCircle, background: "#eff6ff", color: "#3b82f6" }}>
                      <MdHome size={22} />
                    </div>
                  </div>
                  <div style={styles.dashCardFooter} onClick={() => setActiveTab("Agreements")}>
                    Manage properties →
                  </div>
                </div>

                <div style={styles.dashCard}>
                  <div style={styles.dashCardHeader}>
                    <div style={styles.dashCardInfo}>
                      <span style={styles.dashLabel}>Active Stays</span>
                      <span style={styles.dashValue}>{activeTenantsCount}</span>
                    </div>
                    <div style={{ ...styles.dashIconCircle, background: "#f5f3ff", color: "#7c3aed" }}>
                      <MdPeople size={22} />
                    </div>
                  </div>
                  <div style={styles.dashCardFooter} onClick={() => setActiveTab("Active")}>
                    View active occupants →
                  </div>
                </div>

                <div style={styles.dashCard}>
                  <div style={styles.dashCardHeader}>
                    <div style={styles.dashCardInfo}>
                      <span style={styles.dashLabel}>Monthly Rent Outgoings</span>
                      <span style={styles.dashValue}>₹{activeRentCommitment.toLocaleString("en-IN")}</span>
                    </div>
                    <div style={{ ...styles.dashIconCircle, background: "#f0fdf4", color: "#10b981" }}>
                      <MdPayments size={22} />
                    </div>
                  </div>
                  <div style={styles.dashCardFooter} onClick={() => setActiveTab("Agreements")}>
                    Agreements ledgers →
                  </div>
                </div>

                <div style={styles.dashCard}>
                  <div style={styles.dashCardHeader}>
                    <div style={styles.dashCardInfo}>
                      <span style={styles.dashLabel}>Occupancy Rate</span>
                      <span style={styles.dashValue}>{occupancyRate}%</span>
                    </div>
                    <div style={{ ...styles.dashIconCircle, background: "#fff7ed", color: "#ea580c" }}>
                      <MdPercent size={22} />
                    </div>
                  </div>
                  <div style={styles.dashCardFooter}>
                    Based on flat allocations
                  </div>
                </div>
              </div>

              {/* Two Column Grid */}
              <div style={styles.dashTwoColumnGrid}>
                {/* Column 1: Soon Expiring Agreements */}
                <div style={styles.dashGridCol}>
                  <h4 style={styles.dashColTitle}>Soon Expiring Agreements</h4>
                  <div style={styles.dashColTableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Property</th>
                          <th style={styles.th}>Landlord</th>
                          <th style={styles.th}>Rent</th>
                          <th style={styles.th}>Expiry</th>
                        </tr>
                      </thead>
                      <tbody>
                        {soonExpiringAgreements.map(p => (
                          <tr key={p.id} style={styles.tr}>
                            <td style={styles.td}><strong>{p.name}</strong></td>
                            <td style={styles.td}>{p.owner_name}</td>
                            <td style={styles.td}>₹{(p.monthly_rent || 0).toLocaleString("en-IN")}</td>
                            <td style={styles.td}>
                              <span style={{ color: "#ef4444", fontWeight: 600 }}>{p.agreement_end_date}</span>
                            </td>
                          </tr>
                        ))}
                        {soonExpiringAgreements.length === 0 && (
                          <tr><td colSpan={4} style={styles.empty}>No agreements found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Column 2: Recent Check-ins */}
                <div style={styles.dashGridCol}>
                  <h4 style={styles.dashColTitle}>Recent Check-Ins</h4>
                  <div style={styles.dashColTableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Tenant</th>
                          <th style={styles.th}>Room</th>
                          <th style={styles.th}>Phone</th>
                          <th style={styles.th}>Join Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentCheckins.map(t => (
                          <tr key={t.id} style={styles.tr}>
                            <td style={styles.td}><strong>{t.full_name}</strong></td>
                            <td style={styles.td}><span style={styles.roomTag}>{t.room_no || "N/A"}</span></td>
                            <td style={styles.td}>{t.phone}</td>
                            <td style={styles.td}>{formatDate(t.joining_date)}</td>
                          </tr>
                        ))}
                        {recentCheckins.length === 0 && (
                          <tr><td colSpan={4} style={styles.empty}>No check-ins logged.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* Lists Directories Tables rendering */
            <div>
              {/* Dynamic Header Above Table */}
              <div style={styles.tableHeaderSection}>
                <h3 style={styles.tableTitle}>{tableHeaderTitle}</h3>
              </div>

              <div style={styles.tableWrap}>
                {activeTab === "Agreements" ? (
                  /* Landlord Agreements Table View */
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Property</th>
                        <th style={styles.th}>Landlord</th>
                        <th style={styles.th}>Monthly Rent</th>
                        <th style={styles.th}>Deposit</th>
                        <th style={styles.th}>Start / End Date</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProperties.map(p => {
                        const isSelected = p.id === selectedPropertyId;
                        return (
                          <tr
                            key={p.id}
                            style={{ ...styles.tr, ...(isSelected ? styles.trActive : {}) }}
                            onClick={() => setSelectedPropertyId(p.id)}
                          >
                            <td style={styles.td}><strong>{p.name}</strong></td>
                            <td style={styles.td}>{p.owner_name || "N/A"}</td>
                            <td style={styles.td}>₹{(p.monthly_rent || 0).toLocaleString("en-IN")}</td>
                            <td style={styles.td}>₹{(p.security_deposit || 0).toLocaleString("en-IN")}</td>
                            <td style={styles.td}>
                              <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                                {p.agreement_start_date || "N/A"} to {p.agreement_end_date || "N/A"}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                <button 
                                  type="button" 
                                  style={styles.actionIconBtn} 
                                  onClick={(e) => { e.stopPropagation(); setSelectedPropertyId(p.id); }}
                                  title="View Details"
                                >
                                  <MdVisibility size={16} color="#2563eb" />
                                </button>
                                {p.status !== "Inactive" && (
                                  <button 
                                    type="button" 
                                    style={styles.actionIconBtn} 
                                    onClick={(e) => { e.stopPropagation(); handleArchive(p.id, "property"); }}
                                    title="Archive Lease"
                                  >
                                    <MdArchive size={16} color="#ef4444" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  /* Tenants Directory Table View */
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Tenant</th>
                        <th style={styles.th}>Room No</th>
                        <th style={styles.th}>Phone</th>
                        <th style={styles.th}>Join Date</th>
                        <th style={styles.th}>Rent Status</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTenants.map(t => {
                        const isSelected = t.id === selectedTenantId;
                        const isEditing = editingTenant && editingTenant.id === t.id;
                        
                        // Get initials for Avatar Badge
                        const initials = t.full_name
                          .split(" ")
                          .map(n => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);

                        if (isEditing) {
                          return (
                            <tr key={t.id} style={{ ...styles.tr, ...styles.trActive }}>
                              <td style={styles.td}>
                                <input 
                                  style={styles.inputMini} 
                                  value={editingTenant.full_name} 
                                  onChange={e => setEditingTenant({ ...editingTenant, full_name: e.target.value })} 
                                />
                              </td>
                              <td style={styles.td}>
                                <input 
                                  style={styles.inputMini} 
                                  value={editingTenant.room_no} 
                                  onChange={e => setEditingTenant({ ...editingTenant, room_no: e.target.value })} 
                                />
                              </td>
                              <td style={styles.td}>
                                <input 
                                  style={styles.inputMini} 
                                  value={editingTenant.phone} 
                                  onChange={e => setEditingTenant({ ...editingTenant, phone: e.target.value })} 
                                />
                              </td>
                              <td style={styles.td}>{formatDate(t.joining_date)}</td>
                              <td style={styles.td}>
                                <select 
                                  style={styles.selectMini}
                                  value={editingTenant.rent_status} 
                                  onChange={e => setEditingTenant({ ...editingTenant, rent_status: e.target.value })}
                                >
                                  <option value="Paid">Paid</option>
                                  <option value="Unpaid">Unpaid</option>
                                  <option value="Pending">Pending</option>
                                </select>
                              </td>
                              <td style={styles.td}>
                                <select 
                                  style={styles.selectMini}
                                  value={editingTenant.status} 
                                  onChange={e => setEditingTenant({ ...editingTenant, status: e.target.value })}
                                >
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                </select>
                              </td>
                              <td style={styles.td}>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button type="button" onClick={handleUpdateTenant} style={{ ...styles.primaryBtn, padding: "4px 8px", fontSize: "0.72rem" }}>Save</button>
                                  <button type="button" onClick={() => setEditingTenant(null)} style={{ ...styles.secondaryBtn, padding: "4px 8px", fontSize: "0.72rem" }}>Cancel</button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr
                            key={t.id}
                            style={{ ...styles.tr, ...(isSelected ? styles.trActive : {}) }}
                            onClick={() => setSelectedTenantId(t.id)}
                          >
                            <td style={styles.td}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={styles.avatar}>{initials}</span>
                                <div>
                                  <strong>{t.full_name}</strong>
                                  {t.hired_properties?.name && (
                                    <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
                                      {t.hired_properties.name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={styles.td}>
                              <span style={styles.roomTag}>{t.room_no || "N/A"}</span>
                            </td>
                            <td style={styles.td}>{t.phone}</td>
                            <td style={styles.td}>{formatDate(t.joining_date)}</td>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.badge,
                                background: t.rent_status === "Paid" ? "#e6fbf2" : t.rent_status === "Pending" ? "#fffbeb" : "#fdf2f2",
                                color: t.rent_status === "Paid" ? "#10b981" : t.rent_status === "Pending" ? "#d97706" : "#ef4444"
                              }}>
                                {t.rent_status}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ 
                                  display: "inline-block", 
                                  width: "6px", 
                                  height: "6px", 
                                  borderRadius: "50%", 
                                  background: t.status === "Active" ? "#10b981" : "#94a3b8" 
                                }} />
                                <span style={{ fontSize: "0.8rem", color: t.status === "Active" ? "#10b981" : "#64748b" }}>
                                  {t.status}
                                </span>
                              </div>
                            </td>
                            <td style={styles.td}>
                              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                <button 
                                  type="button" 
                                  style={styles.actionIconBtn} 
                                  onClick={(e) => { e.stopPropagation(); setSelectedTenantId(t.id); }}
                                  title="View Details"
                                >
                                  <MdVisibility size={16} color="#2563eb" />
                                </button>
                                <button 
                                  type="button" 
                                  style={styles.actionIconBtn} 
                                  onClick={(e) => { e.stopPropagation(); setEditingTenant({ ...t }); }}
                                  title="Edit Tenant"
                                >
                                  <MdEdit size={16} color="#7c3aed" />
                                </button>
                                {t.status !== "Inactive" && (
                                  <button 
                                    type="button" 
                                    style={styles.actionIconBtn} 
                                    onClick={(e) => { e.stopPropagation(); handleArchive(t.id, "tenant"); }}
                                    title="Archive Tenant"
                                  >
                                    <MdArchive size={16} color="#ef4444" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                {activeTab !== "Agreements" && filteredTenants.length === 0 && !loading && <div style={styles.empty}>No occupants found.</div>}
                {activeTab === "Agreements" && filteredProperties.length === 0 && !loading && <div style={styles.empty}>No leased properties found.</div>}
                {loading && <div style={styles.empty}>Loading directory records...</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Details Panel (Hidden on Dashboard View) */}
      {activeTab !== "Dashboard" && (
        <div style={styles.detailPanel}>
          {activeTab === "Agreements" ? (
            /* Property Details Panel */
            !selectedProperty ? (
              <div style={styles.emptyDetail}>Select a property from the directory to view agreements ledger.</div>
            ) : (
              <div>
                <div style={styles.detailHeader}>
                  <div>
                    <span style={styles.muted}>Property Specification</span>
                    <h3 style={styles.detailNo}>{selectedProperty.name}</h3>
                  </div>
                </div>

                <div style={styles.descBox}>
                  <span style={styles.muted}>Lease Address</span>
                  <p style={{ fontSize: "0.85rem", color: "#334155", marginTop: "6px", lineHeight: "1.4" }}>
                    {selectedProperty.address}
                  </p>
                </div>

                <div style={styles.descBox}>
                  <span style={styles.muted}>Landlord / Contact Details</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", marginTop: "10px", fontSize: "0.82rem" }}>
                    <div><strong>Full Name:</strong> {selectedProperty.owner_name || "N/A"}</div>
                    <div><strong>Phone / Contact:</strong> {selectedProperty.owner_contact || "N/A"}</div>
                  </div>
                </div>

                <div style={styles.descBox}>
                  <span style={styles.muted}>Rent & Agreement Ledger</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", marginTop: "10px", fontSize: "0.82rem" }}>
                    <div><strong>Monthly Rent Payout:</strong> ₹{(selectedProperty.monthly_rent || 0).toLocaleString("en-IN")}</div>
                    <div><strong>Security Deposit:</strong> ₹{(selectedProperty.security_deposit || 0).toLocaleString("en-IN")}</div>
                    <div><strong>Agreement Period:</strong> {selectedProperty.agreement_start_date || "N/A"} to {selectedProperty.agreement_end_date || "N/A"}</div>
                    <div>
                      <strong>Lease Status: </strong>
                      <span style={{ fontWeight: "bold", color: selectedProperty.status === 'Inactive' ? '#ef4444' : '#16a34a' }}>
                        {selectedProperty.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* Tenant / Occupant Details Panel */
            !selectedTenant ? (
              <div style={styles.emptyDetail}>Select a tenant profile to view stay specifications.</div>
            ) : (
              <div>
                <div style={styles.detailHeader}>
                  <div>
                    <span style={styles.muted}>Stay Occupancy Details</span>
                    <h3 style={styles.detailNo}>{selectedTenant.full_name}</h3>
                  </div>
                </div>

                <div style={styles.descBox}>
                  <span style={styles.muted}>Assigned Residence</span>
                  <p style={{ fontSize: "0.85rem", color: "#334155", marginTop: "6px", fontWeight: "bold" }}>
                    {selectedTenant.hired_properties?.name || "No Flat Assigned"}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", marginTop: "10px", fontSize: "0.82rem" }}>
                    <div><strong>Room / Space No:</strong> {selectedTenant.room_no || "N/A"}</div>
                    <div><strong>Occupant Phone:</strong> {selectedTenant.phone}</div>
                  </div>
                </div>

                <div style={styles.descBox}>
                  <span style={styles.muted}>Lease & Rent Status</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", marginTop: "10px", fontSize: "0.82rem" }}>
                    <div><strong>Check-in / Join Date:</strong> {formatDate(selectedTenant.joining_date)}</div>
                    <div><strong>Rent Payment Status:</strong> {selectedTenant.rent_status}</div>
                    <div><strong>Occupancy Profile:</strong> {selectedTenant.status}</div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { display: "flex", gap: "20px", width: "100%" },
  left: { flex: 1.8, minWidth: "0", transition: "all 0.3s ease" },
  panel: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" },

  // Top control bar matching screenshot
  topControlBar: { display: "flex", gap: "16px", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap" },
  searchWrapper: { display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#fff", padding: "6px 12px", width: "300px", position: "relative" },
  searchIcon: { marginRight: "8px" },
  searchInput: { border: "none", outline: "none", fontSize: "0.85rem", color: "#0f172a", width: "100%" },

  actionButtonGroup: { display: "flex", gap: "12px", alignItems: "center" },
  filterBtn: { display: "flex", alignItems: "center", background: "#fff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 16px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", outline: "none" },
  addTenantBtn: { background: "#7c3aed", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", outline: "none" },
  addPropertyBtn: { background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", outline: "none" },

  tabHeader: { display: "flex", gap: "6px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", flexWrap: "wrap", marginTop: "10px" },
  tabBtn: { background: "none", border: "none", color: "#64748b", fontSize: "0.82rem", fontWeight: 600, padding: "8px 12px", cursor: "pointer", outline: "none" },
  tabBtnActive: { color: "#0038a8", borderBottom: "2px solid #0038a8" },

  // Header above table
  tableHeaderSection: { borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", marginBottom: "16px", marginTop: "16px" },
  tableTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" },

  // Dashboard Executive Styles
  dashboardContainer: { display: "flex", flexDirection: "column", gap: "24px", marginTop: "10px" },
  dashStatsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" },
  dashCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" },
  dashCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  dashCardInfo: { display: "flex", flexDirection: "column", gap: "6px" },
  dashLabel: { fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" },
  dashValue: { fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Space Grotesk', sans-serif" },
  dashIconCircle: { width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  dashCardFooter: { borderTop: "1px solid #f1f5f9", paddingTop: "12px", fontSize: "0.78rem", color: "#0038a8", fontWeight: 600, cursor: "pointer", transition: "color 0.2s" },

  dashTwoColumnGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" },
  dashGridCol: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" },
  dashColTitle: { fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Space Grotesk', sans-serif" },
  dashColTableWrap: { background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", overflowX: "auto" },

  form: { background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px" },
  formRow: { display: "flex", gap: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1px", color: "#111625", textTransform: "uppercase" },
  input: { padding: "8px 12px", fontSize: "0.82rem", color: "#111625", border: "1px solid #e2e8f0", borderRadius: "4px", background: "#fff", outline: "none" },
  inputMini: { padding: "4px 8px", fontSize: "0.78rem", color: "#111625", border: "1px solid #cbd5e1", borderRadius: "4px", width: "100%" },
  selectMini: { padding: "4px 8px", fontSize: "0.78rem", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#fff", width: "100%" },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, color: "#64748b", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "left", letterSpacing: "1px" },
  tr: { borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.2s" },
  trActive: { background: "#eff6ff", borderLeft: "4px solid #0038a8" },
  td: { padding: "12px 16px", fontSize: "0.8rem", color: "#111625" },
  empty: { color: "#94a3b8", fontSize: "0.82rem", textAlign: "center", padding: "30px" },
  badge: { fontSize: "0.68rem", fontWeight: 600, padding: "3px 8px", borderRadius: "20px", display: "inline-block" },

  avatar: { display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", background: "#10b981", color: "#fff", fontWeight: 700, fontSize: "0.82rem" },
  roomTag: { background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", color: "#334155", fontWeight: 600, border: "1px solid #e2e8f0" },
  actionIconBtn: { background: "none", border: "none", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },

  detailPanel: { flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "24px", minWidth: "320px", maxHeight: "100vh", overflowY: "auto" },
  emptyDetail: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "0.85rem", padding: "40px", textAlign: "center" },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "16px" },
  detailNo: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#111625", marginTop: "2px" },
  muted: { fontSize: "0.65rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" },
  descBox: { background: "#f8fafc", borderRadius: "4px", padding: "16px", border: "1px solid #cbd5e1", marginBottom: "12px" }
};
