export const menuBar = [
  {
    key: "dashboard",
    label: "Dashboard",
    subItems: [{ key: "dashboard", label: "Dashboard" }],
  },
  {
    key: "maintenance",
    label: "Maintenance",
    subItems: [
      { key: "checklist", label: "Checklist" },
      { key: "tickets", label: "Complaints / Tickets" },
      { key: "ppm", label: "PPM Schedule" },
      { key: "energy", label: "Energy Monitoring" },
      { key: "documents", label: "Service Document" },
    ],
  },
  {
    key: "asset",
    label: "Asset",
    subItems: [
      { key: "assets", label: "Asset Management" },
      { key: "inventory", label: "Inventory" },
      { key: "it_assets", label: "IT Assets" },
      { key: "facility_assets", label: "Facility Assets" }
    ]
  },
  {
    key: "purchase",
    label: "Purchase",
    subItems: [
      { key: "purchasereq_form", label: "Requisition Form" },
      { key: "purchase", label: "Purchase Request" },
      { key: "workorders", label: "Work Order / PO" },
      { key: "grn", label: "Goods Received (GRN)" },
    ],
  },
  {
    key: "vendors",
    label: "Vendor Management",
    subItems: [{ key: "vendors", label: "Vendor Management" }],
  },
  {
    key: "visitors",
    label: "Visitor Management",
    subItems: [{ key: "visitors", label: "Visitor Management" }],
  },
  {
    key: "facility",
    label: "Facility",
    subItems: [
      { key: "housekeeping", label: "Housekeeping" },
      { key: "security", label: "Security" },
    ],
  },
  {
    key: "attendance",
    label: "Attendance",
    subItems: [
      { key: "attendance", label: "Attendance Management" },
      { key: "attendance_housekeeping", label: "Housekeeping" },
      { key: "attendance_security", label: "Security" },
      { key: "attendance_electrician", label: "Electrician" },
      { key: "attendance_facility", label: "Facility Team" },
    ],
  },
  {
    key: "property_management",
    label: "Property Management",
    subItems: [
      { key: "properties_all", label: "All" },
      { key: "properties_active", label: "Active" },
      { key: "properties_inactive", label: "Inactive" },
      { key: "landlord_agreements", label: "Hired Flats & Landlord Agreements" }
    ]
  },
  {
    key: "reports",
    label: "Reports",
    subItems: [
      { key: "reports", label: "Reports" },
      { key: "report_attendance", label: "Attendance Report" },
      { key: "report_visitor", label: "Visitor Report" },
      { key: "report_tickets", label: "Complaints / Tickets" },
      { key: "report_ppm", label: "PPM Schedule" },
    ],
  },
  {
    key: "roles",
    label: "User Roles",
    subItems: [
      { key: "roles", label: "User Roles" },
      { key: "automation", label: "Automation Rules" },
      { key: "admin_console", label: "Admin Console" }
    ],
  },
    {
    key: "admin_setup",
    label: "Admin Setup",
    subItems: [
      { key: "permission_manager", label: "Permission Manager" },
      { key: "admin_roles", label: "User Roles" },
    ],
  }
];
