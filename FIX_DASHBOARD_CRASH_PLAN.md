# Dashboard Crash Fix Plan

## Issue Analysis
- **Error**: `TypeError: Cannot read properties of null (reading 'active')`
- **Location**: `src/components/buyauto/dashboard/ListingStatsSection.tsx` (or similar stats component)
- **Cause**: The `stats` prop is passed as `null` initially (or on error), but the component attempts to access `stats.active` immediately without a check.
- **Context**: User is logged in as Admin, but the dashboard stats data is likely not ready or failed to load.

## Proposed Fixes

### 1. Harden `ListingStatsSection.tsx`
Modify `src/components/buyauto/dashboard/ListingStatsSection.tsx` to handle the `null` case gracefully.
- Add a check at the top: `if (!stats) return null;` (or return a skeleton loader).
- Alternatively, provide default values if `stats` is optional.

### 2. Verify `src/pages/dashboard.tsx`
Check how `ListingStatsSection` is instantiated.
- Ensure it's only rendered when `!isLoading` AND `stats` is available.
- Or, pass a default empty stats object if appropriate.

### 3. Check `dashboardService.ts` (Optional)
- Ensure `getStats` returns a defined structure even if data is missing (e.g., all zeros), rather than `null`, to prevent downstream crashes.

## Files to Modify
1. `src/components/buyauto/dashboard/ListingStatsSection.tsx`
2. `src/pages/dashboard.tsx`

## Implementation Steps
1. Open `ListingStatsSection.tsx` and add:
   ```typescript
   if (!stats) {
     return null; // or <ListingStatsSkeleton />
   }
   ```
2. Check `dashboard.tsx` for the render logic:
   ```typescript
   // Ensure we don't render with null stats if possible
   {dashboardStats && <ListingStatsSection stats={dashboardStats} />}
   ```