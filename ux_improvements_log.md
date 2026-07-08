# UX Audit & Improvements Log

This document identifies small visual inconsistencies, minor navigation gaps, input validation edge cases, and user experience (UX) enhancements across the SetuOne ERP application. We will resolve these systematically.

---

## 🛠️ Completed Refinements

### 1. Clickable Home Breadcrumb Link
* **Status**: ✅ **Completed & Live**
* **Details**: The `Home` breadcrumb link is now clickable, with hover styles, and redirects the user directly back to the main/home **Dashboard** page.

### 2. Multi-Level Dynamic Breadcrumbs
* **Status**: ✅ **Completed & Live**
* **Details**: Upgraded the header breadcrumb component to dynamically support up to 3 levels (e.g. `Home › Maintenance › PPM Schedule`) for sub-menu items, while avoiding redundancy for single-item categories.
* **Navigation Shortcut**: The parent category name (Level 2) is also clickable and redirects the user to the first sub-tab of that module group.

---

## 🔍 Identified Improvements & Audit Log

We have audited the core page components of the ERP platform. Below is the checklist of potential UX/UI enhancements:

| Page / Component | Target Item | Description of Gaps / Desired Behavior | Status |
| :--- | :--- | :--- | :---: |
| **Global Navigation** | Sidebar Launcher Reset | When switching main module groups via the launcher grid, the navigation does not reset to the default view, causing layout mismatches on initial click. | ⏳ Planned |
| **All Lists / Tables** | Empty State UI | When zero records match active search/date range filters, the page shows a blank table header. Needs a premium "No matching records found" card with an icon. | ⏳ Planned |
| **Global Controls** | Date Filter Validation | In any date range filter, the user can select a "Start Date" that is later than the "End Date", resulting in empty data output with no warnings. Needs automatic validation. | ⏳ Planned |
| **PPM Scheduler** | Active Status Colors | In the Planned Preventive Maintenance schedule table, the status badges (Pending, Done) have plain static styling. Needs dynamic matching corporate badge colors. | ⏳ Planned |
| **Pantry Log Form** | Minimum Quantity Lock | In inline editing mode, the Super Admin can set negative numbers as quantity. Needs client-side min="1" limits. | ⏳ Planned |
| **Visitor Management** | Check-out Validation | Check-out action button remains enabled even if the visitor has already checked out. Needs disabled state toggle. | ⏳ Planned |

---

> [!NOTE]
> We will proceed to implement these systematically. Please review the checklist and let us know which item you would like us to tackle next, or if there is any other specific screen behavior you want to refine!
