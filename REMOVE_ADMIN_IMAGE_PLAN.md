# Plan: Remove Cover Image from Admin Listing View

**Objective:**
Remove the cover image from the listings table in the admin dashboard as it is not needed.

**File to Modify:**
- `src/components/admin/AllListingsView.tsx`

**Change:**
- Locate the table cell (`<td>`) for the "Fahrzeug" (Vehicle) column.
- Remove the `<img>` tag and its conditional rendering logic.
- Clean up any related styling, like spacing classes.
