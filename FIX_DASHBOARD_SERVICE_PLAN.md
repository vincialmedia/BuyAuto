# Dashboard Service Fix Plan

## Objective
Resolve TypeScript errors in `src/services/dashboardService.ts` caused by exporting undefined functions.

## Context
The following functions are exported but not defined:
- `updateListing`
- `deleteListing`
- `upgradeToPremium`
- `extendListing`

## Implementation Details

### 1. `updateListing`
- **Signature**: `async (id: string, updates: Partial<ListingDetail>)`
- **Logic**: 
  - Sanitize updates (remove read-only fields if necessary).
  - Call `supabase.from('listings').update(updates).eq('id', id)`.
  - Return updated data or success boolean.

### 2. `deleteListing`
- **Signature**: `async (id: string)`
- **Logic**:
  - Call `supabase.from('listings').delete().eq('id', id)`.
  - Alternatively, soft delete: `update({ status: 'deleted' })` (Check project policy).
  - *Decision*: Use hard delete for now to match standard behavior, or check if `deleted_at` column exists.

### 3. `upgradeToPremium`
- **Signature**: `async (id: string)`
- **Logic**:
  - This usually requires payment. 
  - *Temporary Fix*: Return a placeholder or unimplemented error to satisfy the compiler, OR implement a direct DB update if this is an admin/internal function.
  - *Better Fix*: Redirect to Stripe or call `create-checkout-session`.
  - *Action*: Implement as a "Not implemented" stub or basic DB update for now to fix the build.

### 4. `extendListing`
- **Signature**: `async (id: string, days: number)`
- **Logic**:
  - Calculate new expiration date.
  - Update `expires_at` column.

## Code Structure for `src/services/dashboardService.ts`

```typescript
// ... existing imports and types

// Add these implementations before the export object

async function updateListing(id: string, updates: Partial<DashboardListing>) {
  const { data, error } = await supabase
    .from('listings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteListing(id: string) {
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

async function upgradeToPremium(id: string) {
  // Placeholder for now
  console.log("Upgrade to premium requested for", id);
  // In reality, this should probably trigger a payment flow
  throw new Error("Not implemented yet");
}

async function extendListing(id: string) {
  // Placeholder logic - extend by 30 days
  const { data, error } = await supabase.rpc('extend_listing_validity', { listing_id: id });
  
  // Fallback if RPC doesn't exist
  if (error) {
     const nextMonth = new Date();
     nextMonth.setDate(nextMonth.getDate() + 30);
     
     const { error: updateError } = await supabase
       .from('listings')
       .update({ expires_at: nextMonth.toISOString() })
       .eq('id', id);
       
     if (updateError) throw updateError;
  }
  return true;
}

export const dashboardService = {
  getUserListings,
  getDashboardStats, // Ensure this includes the 'sold' fix from previous steps
  updateListing,
  deleteListing,
  upgradeToPremium,
  extendListing,
};
```

## Verification
- Run type checker.
- Verify `dashboard.tsx` loads without crashing.