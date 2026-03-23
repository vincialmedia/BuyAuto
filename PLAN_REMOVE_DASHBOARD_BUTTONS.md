# Plan: Remove Duplicate "Neues Inserat Erstellen" Buttons

## Objective
The user requested to remove the redundant "Neues Inserat" (Create new listing) buttons across the dashboard and only keep:
1. The one directly above the listings (`ListingsSection.tsx`).
2. The global one in the main header menu (not to be touched).

## Files to Modify

### 1. `src/components/buyauto/dashboard/DashboardLayout.tsx`
**Action:** Remove the "Neues Inserat" buttons from the sidebar and mobile menus.
- **Desktop Sidebar:** Remove the `<div className="mt-8">` wrapper and its `<Button>` child that triggers `router.push("/inserat-erstellen")`.
- **Mobile Menu:** Remove the `<Button>` that triggers `router.push("/inserat-erstellen")` located at the bottom of the `isMobileMenuOpen` conditional rendering block.

### 2. `src/components/buyauto/dashboard/GarageDashboard.tsx`
**Action:** Remove the "Neues Inserat" button from the Garage Dashboard hero section.
- Locate the action buttons section in the top-right of the hero card.
- Remove `<Button onClick={() => router.push("/inserat-erstellen")}>Neues Inserat</Button>`.

### 3. `src/components/buyauto/dashboard/OverviewSection.tsx`
**Action:** Remove the "Neues Inserat erstellen" button from the overview header.
- Locate the flex container holding the `<h2>Übersicht</h2>` tag.
- Remove the adjacent `<Button onClick={() => router.push("/inserat-erstellen")}>` containing the `Plus` icon.

## Files to Keep As-Is

### `src/components/buyauto/dashboard/ListingsSection.tsx`
- The "Neues Inserat erstellen" button situated above the actual list of vehicles will **not** be removed, per the user's instructions.
- The empty state "Erstes Inserat erstellen" will also be preserved.

### Global Header
- Any button located in the global main layout (`Header.tsx` etc.) will remain untouched.

## Next Steps
Switch to **Standard Mode** to implement these changes across the defined files.