export const roles = [
  "Admin Manager",
  "Employee",
  "Vendor",
  "Security Supervisor",
  "HK Supervisor",
];

export const permissionTabs = [
  { key: "dashboard", label: "Dashboard" },
  { key: "maintenance", label: "Maintenance" },
  { key: "checklist", label: "Checklist" },
  { key: "tickets", label: "Complaints / Tickets" },
  { key: "ppm", label: "PPM Schedule" },
  { key: "energy", label: "Energy Monitoring" },
  { key: "documents", label: "Service Document" },
  { key: "asset", label: "Asset" },
  { key: "assets", label: "Asset Management" },
  { key: "inventory", label: "Inventory" },
  { key: "itasset", label: "IT Asset" },
  { key: "mobile", label: "Mobile" },
  { key: "sim", label: "SIM" },
  { key: "furniture", label: "Furniture" },
  { key: "hvac", label: "HVAC" },
  { key: "purchase", label: "Purchase" },
  { key: "workorders", label: "Work Order / PO" },
  { key: "vendors", label: "Vendor Management" },
  { key: "visitors", label: "Visitor Management" },
  { key: "housekeeping", label: "Housekeeping" },
  { key: "security", label: "Security" },
  { key: "attendance", label: "Attendance" },
  { key: "reports", label: "Reports" },
  { key: "roles", label: "User Roles" },
];

export const defaultCompanyPermissions = {
  orion: {
    "Admin Manager": ["dashboard", "maintenance", "checklist", "tickets", "ppm", "asset", "assets", "inventory", "itasset", "mobile", "sim", "furniture", "hvac", "vendors", "reports"],
    Employee: ["dashboard", "tickets", "visitors"],
    Vendor: ["dashboard", "tickets", "workorders"],
    "Security Supervisor": ["dashboard", "visitors", "security", "attendance"],
    "HK Supervisor": ["dashboard", "checklist", "housekeeping", "attendance"],
  },
  greenfield: {
    "Admin Manager": ["dashboard", "maintenance", "tickets", "reports"],
    Employee: ["dashboard", "tickets"],
    Vendor: ["dashboard", "tickets"],
    "Security Supervisor": ["dashboard", "visitors", "security"],
    "HK Supervisor": ["dashboard", "checklist", "housekeeping"],
  },
};