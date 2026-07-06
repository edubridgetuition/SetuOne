# SetuOne Integrated Facility ERP
## Complete Project Presentation Deck (10-Slide Structure)

---

### Slide 1: Introduction & Mission
* **Title**: SetuOne: Next-Gen Facility & Operations ERP
* **Subtitle**: Streamlining Facility Management, Asset Lifecycles, and Staff Workflows.
* **Core Value**: Transitioning legacy spreadsheets into a unified, secure, real-time database-driven platform.
* **Target Users**: Corporate Admins, Facility Managers, Security Guards, and Field Employees.

---

### Slide 2: Technology Stack & Core Architecture
* **Frontend**: React 19, Vite, React Router, React Icons.
* **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) policies.
* **Security & Tenant Isolation**: Unified metadata-driven tenant boundaries.
* **Design Philosophy**: High-performance, responsive CSS layouts with active feedback loops.

---

### Slide 3: Helpdesk & Ticket Lifecycle
* **Problem**: Unresolved facilities complaints, lack of ownership, slow communication.
* **Solution**: Real-time ticketing pipeline.
* **Features**:
  - Log complaints with location & category tags.
  - Live status tracking: Open ➡️ Assigned ➡️ In Progress ➡️ Resolved.
  - Mandatory resolution remarks and auditor feed.

---

### Slide 4: Asset Tracking & AMC Contracts
* **Problem**: Lost assets, expired warranties, and missed service contracts.
* **Solution**: Global Asset Registry with lifecycle stamps.
* **Features**:
  - QR-ready unique asset IDs.
  - Assign / Return / Transfer transactions history.
  - AMC contracts renewal alerts and vendor configurations.

---

### Slide 5: Procurement & Purchase Requisitions
* **Problem**: Unauthorized purchases, lack of vendor price transparency.
* **Solution**: Three-way quote approval engine.
* **Features**:
  - Raise PRs with specific items.
  - Upload multiple vendor quotations.
  - Unified comparative grid: Admin selects best quote and auto-generates purchase orders (PO).

---

### Slide 6: Inventory & Daily Consumption Trackers
* **Problem**: Stock leaks, daily water bottle supply returns, and coffee machine consumable shortages.
* **Solution**: Dynamic transaction ledgers.
* **Features**:
  - Real-time stock levels of water bottles and returnable water jugs.
  - Log daily consumption and returned empties.
  - Month-wise coffee ingredients (beans, milk, cups) consumption logs.

---

### Slide 7: Planned Preventive Maintenance (PPM)
* **Problem**: Unplanned equipment breakdowns, missed checklist inspections.
* **Solution**: Dynamic schedule engine.
* **Features**:
  - Checklist templates for ACs, DG sets, and plumbing.
  - Set recurring schedules (Weekly, Monthly, Quarterly).
  - Track technician submissions and verify spare parts consumption.

---

### Slide 8: Visitor Management & Pass Engine
* **Problem**: Unregistered guests, manual paper logs at security gates.
* **Solution**: Digital gatekeeper registry.
* **Features**:
  - Issue auto-generated pass codes (e.g., `VIS-000245`).
  - Log ID proofs, mobile numbers, vehicle types, and purposes of visit.
  - Capture base64 security photos and stamp checkout remarks on exit.

---

### Slide 9: Geofenced Attendance & Rosters
* **Problem**: Remote attendance fraud, incorrect shifts mapping.
* **Solution**: GPS-validated check-in portal.
* **Features**:
  - Simulated geofence radar checking branch GPS coordinates.
  - Multiple shifts selection (General, Morning, Evening, Night).
  - Regularization workflow: Employee requests correction, manager approves.

---

### Slide 10: Reports & Analytics Engine
* **Problem**: Fragmented reporting views, static filters, manual export tasks.
* **Solution**: Metadata-driven reporting engine.
* **Features**:
  - Live KPI ribbon with clickable drill-down filters.
  - Check/uncheck dynamic column visibility selector.
  - Saved filters configuration and CSV exporter.

---

### Slide 11: Automation Rules & Notifications Engine
* **Problem**: Unmonitored events, delayed stock orders, manual report emails.
* **Solution**: Event & Time-based automation pipeline.
* **Features**:
  - Toggled notification channels (Email, SMS, Push, In-App).
  - Dynamic mustache variables template parser.
  - Multi-recipient group routing and latency logs audit.

---

### Slide 12: Implementation Roadmap & Milestones
* **Phase 1-5**: Helpdesk, Assets, Procurement, Inventory, PPM (Completed)
* **Phase 6-7**: Visitors Gate, Geofenced Attendance (Completed)
* **Phase 8**: Dynamic Reports & Filtering (Completed)
* **Phase 9**: Notifications, Alerts & Automation (Completed)
* **Phase 10-11**: Dynamic Metadata & Mobile Support (In Progress)
