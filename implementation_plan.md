# Revised Implementation Plan - Dynamic Dashboard Widget Registry Manager

This revised plan details the technical architecture, database migrations, repository methods, context wrappers, and UI designs for the **Dynamic Dashboard Widget Catalog Manager** inside the Admin Console, incorporating security audits, immutability constraints, and widget preview utilities.

---

## User Review Required

> [!IMPORTANT]
> - **Soft-Delete Archival**: Instead of hard delete, we will add an `is_archived` column to the `dashboard_widgets` table. Archiving a widget hides it from future layouts but prevents older layout configurations from throwing reference errors.
> - **Immutability of keys**: The `widget_key` (unique identifier) will be editable only during registration. For editing existing widgets, the key input field will be read-only to prevent breaking existing layouts.
> - **Audit Logs**: Every action (Creation, Edit, Archive, Duplicate, Toggle Status) will write an entry in the system's `audit_logs` table.

---

## Proposed Changes

### 1. Database Schema Migration (`database/15_DashboardWidgetArchivalMigration.sql`)

#### [NEW] [15_DashboardWidgetArchivalMigration.sql](file:///d:/SetuOne/database/15_DashboardWidgetArchivalMigration.sql)
```sql
-- Add is_archived flag to dashboard_widgets catalog
ALTER TABLE public.dashboard_widgets ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Update available widgets SELECT policy or view if necessary
```

---

### 2. Database Repository Layer (`dashboardRepository.js`)

#### [MODIFY] [dashboardRepository.js](file:///d:/SetuOne/src/lib/dashboardRepository.js)
Update select query to filter out archived widgets, and add CRUD methods:
```javascript
// 1. Fetch available widgets catalog (excluding archived ones)
export async function fetchAvailableWidgets() {
  try {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('is_archived', false) // Filter out archived widgets
      .order('widget_category', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], message: 'Widgets loaded.', error: null };
  } catch (error) {
    return { success: false, data: [], message: error.message, error };
  }
}

// 2. Create dynamic widget
export async function createDashboardWidget(widgetData) {
  try {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .insert(widgetData)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Widget registered successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 3. Update widget configuration
export async function updateDashboardWidget(widgetId, updates) {
  try {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .update(updates)
      .eq('id', widgetId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Widget updated successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}

// 4. Archive widget (Soft Delete)
export async function archiveDashboardWidget(widgetId) {
  try {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .update({ is_archived: true, is_active: false })
      .eq('id', widgetId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Widget archived successfully.', error: null };
  } catch (error) {
    return { success: false, data: null, message: error.message, error };
  }
}
```

---

### 3. Context Layer (`AppContext.jsx`)

#### [MODIFY] [AppContext.jsx](file:///d:/SetuOne/src/context/AppContext.jsx)
Expose state wrappers and inject audit log triggers:
```javascript
  // Context wrapper for Create Widget
  async function createDashboardWidget(widgetData) {
    const res = await apiCreateDashboardWidget(widgetData);
    if (res.success && session) {
      await loadDashboardWidgets();
      await apiWriteAuditLog({
        module: 'Dashboard Catalog',
        tableName: 'public.dashboard_widgets',
        recordId: res.data.id,
        action: 'INSERT',
        newData: res.data,
        changedBy: session.id
      }, session.companyId);
    }
    return res;
  }

  // Context wrapper for Update Widget
  async function updateDashboardWidget(widgetId, updates) {
    const res = await apiUpdateDashboardWidget(widgetId, updates);
    if (res.success && session) {
      await loadDashboardWidgets();
      await apiWriteAuditLog({
        module: 'Dashboard Catalog',
        tableName: 'public.dashboard_widgets',
        recordId: res.data.id,
        action: 'UPDATE',
        newData: res.data,
        changedBy: session.id
      }, session.companyId);
    }
    return res;
  }

  // Context wrapper for Archive Widget
  async function archiveDashboardWidget(widgetId) {
    const res = await apiArchiveDashboardWidget(widgetId);
    if (res.success && session) {
      await loadDashboardWidgets();
      await apiWriteAuditLog({
        module: 'Dashboard Catalog',
        tableName: 'public.dashboard_widgets',
        recordId: res.data.id,
        action: 'SOFT_DELETE_ARCHIVE',
        newData: res.data,
        changedBy: session.id
      }, session.companyId);
    }
    return res;
  }
```

---

### 4. UI Layer (`AdminConsoleSettings.jsx`)

#### [MODIFY] [AdminConsoleSettings.jsx](file:///d:/SetuOne/src/pages/AdminConsoleSettings.jsx)
Implement form structures, mutability locks, dropdowns, and previews:

1. **State Hooks**:
   ```javascript
   const [showWidgetDrawer, setShowWidgetDrawer] = useState(false);
   const [editingWidgetId, setEditingWidgetId] = useState(null);
   const [showPreview, setShowPreview] = useState(false);
   const [widgetForm, setWidgetForm] = useState({
     widget_name: "",
     widget_key: "",
     widget_category: "Operations",
     description: "",
     default_w: 4,
     default_h: 3,
     min_w: 2,
     min_h: 2,
     component_name: "GenericWidget",
     refresh_interval_seconds: 60,
     visible_roles: [],
     visible_modules: [],
     required_permission: "VIEW_DASHBOARD",
     default_config: "{}",
     is_required: false,
     is_active: true
   });
   ```

2. **Immutable Key Check**:
   In the drawer input element:
   ```javascript
   <input
     disabled={editingWidgetId !== null} // Read-only on Edit
     value={widgetForm.widget_key}
     onChange={e => setWidgetForm({ ...widgetForm, widget_key: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
     placeholder="e.g. CUSTOM_INVENTORY_METRICS"
   />
   ```

3. **Component Name Dropdown Selection**:
   Options list in drawer selection box:
   * `TicketsWidget`
   * `VisitorsWidget`
   * `PurchaseWidget`
   * `InventoryWidget`
   * `AttendanceWidget`
   * `EnergyWidget`
   * `VendorsWidget`
   * `GenericWidget`
   * `ChartWidget`
   * `TableWidget`

4. **Unique Duplicate Key Generator**:
   ```javascript
   const handleDuplicateWidget = (widget) => {
     // Generate unique suffix to prevent primary key collision
     const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
     const uniqueKey = `${widget.widget_key}_COPY_${randomSuffix}`;

     setEditingWidgetId(null);
     setWidgetForm({
       ...widget,
       widget_key: uniqueKey,
       widget_name: `${widget.widget_name} (Copy)`,
       default_config: JSON.stringify(widget.default_config || {})
     });
     setShowWidgetDrawer(true);
   };
   ```

5. **Drawer Preview Block**:
   Renders a dummy box preview containing dynamic dimensions and labels to visually verify UI configurations before saving.

---

## Verification Plan

### Automated Tests
- Run React build checks:
  ```bash
  npm run build
  ```

### Manual Verification
- Register a custom widget from the Admin Templates drawer, save, verify database insertion in Supabase.
- Edit the custom widget, confirm the `widget_key` is disabled (read-only), modify category, save.
- Archive the widget, confirm it disappears from the templates list, and check the `audit_logs` table for soft-delete action registration.
