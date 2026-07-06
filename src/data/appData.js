export const tenants = {
  orion: {
    name: "Orion Corporate Park",
    stats: {
      openComplaints: 18, todayTasks: 42, amcDue: 7,
      vendorPayments: "INR 4.8L", electricity: "38,420 kWh",
      water: "1,280 KL", visitors: 136, assets: 924,
    },
  },
  greenfield: {
    name: "Greenfield School Campus",
    stats: {
      openComplaints: 9, todayTasks: 31, amcDue: 4,
      vendorPayments: "INR 1.9L", electricity: "18,760 kWh",
      water: "690 KL", visitors: 82, assets: 486,
    },
  },
};

export const demoUsers = {
  "super@facilityops.test": { password: "demo123", name: "Platform Owner", role: "Super Admin", tenant: "orion" },
  "manager@orion.test": { password: "demo123", name: "Nisha Facility Manager", role: "Admin Manager", tenant: "orion" },
  "vendor@orion.test": { password: "demo123", name: "CoolTech Vendor", role: "Vendor", tenant: "orion" },
  "employee@orion.test": { password: "demo123", name: "Rohit Employee", role: "Employee", tenant: "orion" },
  "security@orion.test": { password: "demo123", name: "Arun Security Supervisor", role: "Security Supervisor", tenant: "orion" },
  "housekeeping@orion.test": { password: "demo123", name: "Sunita Housekeeping Supervisor", role: "Housekeeping Supervisor", tenant: "orion" },
};

export const rolePermissions = {
  "Super Admin": ["dashboard","checklist","tickets","ppm","assets","inventory","itasset","mobile","sim","furniture","hvac","vendors","visitors","housekeeping","security","attendance","purchase","workorders","energy","documents","reports","roles","automation"],
  "Admin Manager": [ "dashboard","checklist","tickets","ppm","assets","inventory","itasset","mobile","sim","furniture","hvac","vendors","visitors","housekeeping","security","attendance","purchase","workorders","energy","documents","reports","automation"],
  Vendor: ["dashboard","tickets","ppm","workorders","documents"],
  Employee: ["dashboard","tickets","visitors","purchase"],
  "Security Supervisor": ["dashboard","tickets","visitors","security","attendance","reports"],
  "Housekeeping Supervisor": ["dashboard","checklist","tickets","housekeeping","attendance","inventory","reports"],
};

export const navItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "checklist", label: "Maintenance Checklist" },
  { key: "tickets", label: "Complaints / Tickets" },
  { key: "ppm", label: "PPM Schedule" },
  { key: "assets", label: "Asset Management" },
  { key: "vendors", label: "Vendor Management" },
  { key: "visitors", label: "Visitor Management" },
  { key: "housekeeping", label: "Housekeeping" },
  { key: "security", label: "Security" },
  { key: "attendance", label: "Attendance" },
  { key: "inventory", label: "Inventory" },
  { key: "purchase", label: "Purchase Requisition" },
  { key: "workorders", label: "Work Orders" },
  { key: "energy", label: "Energy Monitoring" },
  { key: "documents", label: "Documents" },
  { key: "reports", label: "Reports" },
  { key: "roles", label: "User Roles" },
];

export const defaultTickets = [
  { no:"TKT-1001", category:"Electrical Complaint", location:"Tower A - Basement", priority:"High", raisedBy:"Rohit Sharma", assignedTo:"Facility Electrician", status:"Open", completion:"Pending", description:"Basement light circuit is tripping repeatedly.", createdAt:"2026-06-25, 09:10 AM", updatedAt:"2026-06-25, 09:10 AM", tenant:"orion", timeline:[{ at:"2026-06-25, 09:10 AM", by:"Rohit Sharma", action:"Ticket created", remarks:"Electrical issue raised from basement." }] },
  { no:"TKT-1002", category:"Plumbing Complaint", location:"3rd Floor Washroom", priority:"Medium", raisedBy:"Anita Desai", assignedTo:"Plumbing Vendor", status:"In Progress", completion:"Today 6:00 PM", description:"Washroom flush tank is continuously leaking.", createdAt:"2026-06-25, 10:05 AM", updatedAt:"2026-06-25, 11:30 AM", tenant:"orion", timeline:[{ at:"2026-06-25, 10:05 AM", by:"Anita Desai", action:"Ticket created", remarks:"Leakage reported." },{ at:"2026-06-25, 11:30 AM", by:"Nisha Facility Manager", action:"Assigned", remarks:"Assigned to plumbing vendor." }] },
  { no:"TKT-1003", category:"HVAC Complaint", location:"Conference Room 2", priority:"Critical", raisedBy:"Admin Desk", assignedTo:"HVAC Vendor", status:"Escalated", completion:"Immediate", description:"Conference Room 2 cooling is not effective.", createdAt:"2026-06-25, 08:40 AM", updatedAt:"2026-06-25, 12:15 PM", tenant:"orion", timeline:[{ at:"2026-06-25, 08:40 AM", by:"Admin Desk", action:"Ticket created", remarks:"Cooling complaint raised." }] },
];

export const genericViews = {
  ppm: { title:"PPM Schedule", subtitle:"Track AMC vendor, next service date, and reminders.", headers:["Asset","Location","AMC Vendor","Next Service","Status"], rows:[["Lift","Tower A","Otis Services","2026-07-05","Pending"],["DG Set","Utility Block","PowerCare","2026-07-12","In Progress"],["Fire System","All Blocks","SafeFire India","2026-07-20","Pending"],["HVAC","Admin Floor","CoolTech","2026-06-28","Escalated"]] },
  assets: { title:"Asset Management", subtitle:"Track asset code, purchase date, warranty, and status.", headers:["Asset Code","Asset","Purchase Date","Warranty","Vendor","Location","Status"], rows:[["AC-0142","Cassette AC","2024-04-12","2027-04-11","CoolTech","Conference Room","Active"],["FE-0088","Fire Extinguisher","2025-01-18","2026-01-17","SafeFire India","Tower B Lobby","Active"],["PR-0021","Printer","2023-09-02","2026-09-01","PrintMax","Admin Office","Repair"],["CCTV-034","CCTV Camera","2024-11-22","2027-11-21","SecureVision","Parking","Active"]] },
  vendors: { title:"Vendor Management", subtitle:"Vendor master, contract value, and performance.", headers:["Vendor","Service","Contract Value","Contact Person","Payment Due","Rating"], rows:[["CoolTech","HVAC","INR 9.6L","Amit Jain","2026-06-30","4.4"],["SafeFire India","Fire System","INR 6.2L","Meera Rao","2026-07-05","4.7"],["CleanPro","Housekeeping","INR 18L","Rakesh Patil","2026-06-28","4.1"]] },
  visitors: { title:"Visitor Management", subtitle:"Visitor entry, meeting person, timing, and vehicle details.", headers:["Visitor","Meeting With","In Time","Out Time","Vehicle No.","Status"], rows:[["Nikhil Shah","Facility Manager","10:20 AM","-","GJ01AB1234","Inside"],["Ravi Mehta","Purchase Team","11:05 AM","12:10 PM","GJ05CD8821","Checked Out"],["Vendor Engineer","Admin Desk","12:30 PM","-","MH12RT9940","Inside"]] },
  housekeeping: { title:"Housekeeping Management", subtitle:"Daily checklist for lobby, washroom, pantry, and parking.", headers:["Area","Shift","Supervisor","Checklist","Status","Photo"], rows:[["Lobby","Morning","Sunita","Floor, glass, dustbins","Completed","Uploaded"],["Washroom","Morning","Sunita","WC, basin, soap, tissue","In Progress","Required"],["Parking","Evening","Manoj","Sweeping, blockage, waste","Pending","Required"]] },
  security: { title:"Security Management", subtitle:"Guard attendance, shift allocation, and incident reports.", headers:["Guard","Shift","Post","Checkpoint","Incident","Status"], rows:[["Arun Singh","Day","Main Gate","Visitor register","No","Completed"],["Javed Khan","Night","Basement","Patrolling checkpoint","No","Pending"],["Suresh Yadav","Day","Fire Exit","Exit clear","Yes","Escalated"]] },
  attendance: { title:"Attendance Management", subtitle:"Mobile attendance, GPS, shift management, and overtime.", headers:["Staff","Team","Shift","In Time","GPS","Overtime","Status"], rows:[["Kiran","Housekeeping","Morning","08:02 AM","Verified","0 hr","Present"],["Arun Singh","Security","Day","07:55 AM","Verified","1 hr","Present"],["Mahesh","Facility Team","General","09:18 AM","Verified","0 hr","Late"]] },
  inventory: { title:"Inventory Management", subtitle:"Track opening stock, issue, receive, and closing stock.", headers:["Item","Opening","Received","Issued","Closing","Reorder Level"], rows:[["Cleaning Chemicals","45 L","20 L","18 L","47 L","30 L"],["Tissue Paper","220 rolls","100 rolls","86 rolls","234 rolls","100 rolls"],["Garbage Bags","1,100 pcs","500 pcs","420 pcs","1,180 pcs","600 pcs"]] },
  purchase: { title:"Purchase Requisition", subtitle:"Employee request flow: Employee â†’ Manager â†’ Purchase.", headers:["Request No.","Type","Raised By","Manager","Purchase Status","Amount"], rows:[["PR-501","Stationery Request","HR Desk","Approved","Pending PO","INR 8,500"],["PR-502","Pantry Request","Admin Desk","Pending","Not Started","INR 12,400"],["PR-503","Maintenance Material","Facility Team","Approved","Vendor Quote","INR 27,800"]] },
  workorders: { title:"Work Order Management", subtitle:"Generate work orders, assign vendors, and track completion.", headers:["WO No.","Vendor","Scope","Quotation","Start Date","Status"], rows:[["WO-301","CoolTech","AC gas charging","Attached","2026-06-24","In Progress"],["WO-302","SafeFire India","Hydrant valve replacement","Attached","2026-06-25","Pending"],["WO-303","CleanPro","Deep cleaning basement","Pending","2026-06-27","Pending"]] },
  energy: { title:"Energy Monitoring", subtitle:"Electricity, DG diesel, and water meter readings.", headers:["Type","Meter Location","Opening","Closing","Consumption","Cost"], rows:[["Electricity","Main Meter","128,400","166,820","38,420 kWh","INR 4.22L"],["DG Diesel","DG Tank","2,800","2,120","680 L","INR 64,600"],["Water","Main Meter","9,400","10,680","1,280 KL","INR 38,400"]] },
  documents: { title:"Document Management", subtitle:"Store AMC contracts, insurance, NOC, and certificates.", headers:["Document","Category","Vendor / Owner","Expiry Date","Status"], rows:[["Lift AMC","AMC Contract","Otis Services","2026-08-30","Active"],["Fire NOC","Compliance","Fire Department","2026-09-12","Active"],["Pollution Certificate","Compliance","Govt Authority","2026-07-18","Due Soon"]] },
  reports: { title:"Reports", subtitle:"Complaint TAT, vendor performance, AMC, attendance, and expense reports.", headers:["Report","Frequency","Owner","Last Generated","Format"], rows:[["Complaint TAT","Weekly","Admin Manager","2026-06-22","PDF / Excel"],["Vendor Performance","Monthly","Facility Head","2026-06-01","PDF"],["AMC Due Report","Monthly","Admin Manager","2026-06-01","Excel"]] },
  roles: { title:"User Roles", subtitle:"Permissions define which module each role can access.", headers:["Role","Access","Main Screens"], rows:[["Super Admin","Everything","All modules, all organizations, billing"],["Admin Manager","Facility Operations","Dashboard, tickets, PPM, assets, vendors"],["Vendor","Assigned Tasks Only","Assigned tickets, work orders"],["Employee","Raise Complaints","Complaint raise, own tickets"],["Security Supervisor","Visitor & Security","Visitors, guard attendance, incidents"],["Housekeeping Supervisor","Checklist & Attendance","Housekeeping checklist, staff attendance"]] },
};
