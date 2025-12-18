# Remaining KM Field Implementation - Fix Summary

## Problem Identified
The "Kilometerstand" (mileage) field was not persisting correctly when navigating between wizard steps. The value would reset to 0 when returning to Step 1.

## Root Cause
**Property Name Mismatch** across different parts of the application:
- **Database**: Uses `mileage_km` (column name in `listings` table)
- **ListingData Type**: Has `mileage`, `km` properties (but NOT `mileage_km`)
- **Step1 Form**: Was trying to access `data.mileage_km` (which doesn't exist)
- **createListingService**: Sends `mileage_km` to database

## The Fix Applied

### 1. Fixed Step1_VehicleData.tsx (Line 58)
**BEFORE:**
```typescript
km: data.mileage_km || 0, // ❌ Property doesn't exist on ListingData
```

**AFTER:**
```typescript
km: data.km || data.mileage || 0, // ✅ Use existing properties with fallback
```

### 2. Ensured Data Persistence (Line 95)
**Added explicit storage of `km` value:**
```typescript
updateData({ 
  ...validatedData,
  km: parsedKm, // ✅ Explicitly save km to wizard state
  id: result.id
});
```

### 3. Input Formatting Improvements
- Removed problematic `useEffect` that used `document.getElementById`
- Improved number formatting to support Swiss format (35'000)
- Better handling of input/blur events for formatting

## Complete Data Flow Now

1. **User Input**: Types "35000" in the form
2. **Display**: Shows as "35'000" (Swiss number format)
3. **On Submit**: 
   - Strips formatting → "35000"
   - Parses to integer → `35000`
   - Saves to database as `mileage_km: 35000`
   - Updates wizard state with `km: 35000`
4. **On Return**: Form loads `data.km` → Shows "35'000"

## Remaining KM Field Implementation Status

### ✅ COMPLETED (Already in Database)
1. **Database Schema**: `remaining_km` column exists in `listings` table (nullable integer)
2. **Database Types**: TypeScript types generated and include `remaining_km`
3. **ListingData Type**: Has `remaining_km?: number` property
4. **Step5 Preview**: Already displays remaining_km if present

### ❌ OUTSTANDING TASKS

#### Task 1: Add Remaining KM Field to Step2_LeasingDetails.tsx
**Location**: `src/components/buyauto/create-listing/Step2_LeasingDetails.tsx`

**What to Add:**
```typescript
// Add to the form after "Restlaufzeit" field:
<div className="space-y-2">
  <Label htmlFor="remaining_km" className="text-sm font-medium text-neutral-700">
    Verbleibende KM (optional)
  </Label>
  <div className="relative">
    <Input
      id="remaining_km"
      {...register("remaining_km")}
      type="text"
      placeholder="z.B. 15'000"
      className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pr-12"
      onChange={(e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setValue("remaining_km", value ? parseInt(value) : undefined, { shouldValidate: true });
        e.target.value = value;
      }}
      onBlur={(e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (value) {
          const num = parseInt(value, 10);
          e.target.value = new Intl.NumberFormat('de-CH').format(num);
        }
        trigger("remaining_km");
      }}
      onFocus={(e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = value;
      }}
    />
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-light">
      km
    </span>
  </div>
  {errors.remaining_km && (
    <p className="text-sm text-red-500 font-light">{errors.remaining_km.message}</p>
  )}
  <p className="text-xs text-neutral-500">
    Wie viele Kilometer sind noch im Leasingvertrag enthalten?
  </p>
</div>
```

#### Task 2: Update Zod Schema in schemas.ts
**Location**: `src/lib/buyauto/schemas.ts`

**Add to leasingDetailsSchema:**
```typescript
remaining_km: z.number().int().positive().optional()
  .or(z.string().transform((val) => val ? parseInt(val.replace(/[^0-9]/g, ''), 10) : undefined)),
```

**Add to TypeScript type:**
```typescript
export type LeasingDetailsForm = {
  // ... existing fields
  remaining_km?: number;
};
```

#### Task 3: Update createListingService.ts
**Location**: `src/services/createListingService.ts`

**Add to ListingUpdatePayload type (Line ~15):**
```typescript
remaining_km?: number | null;
```

**The service already handles all fields generically, so no other changes needed.**

#### Task 4: Update Step2 Default Values
**Location**: `src/components/buyauto/create-listing/Step2_LeasingDetails.tsx`

**Add to useForm defaultValues:**
```typescript
remaining_km: data.remaining_km || undefined,
```

#### Task 5: Update Step2 Submit Handler
**Location**: `src/components/buyauto/create-listing/Step2_LeasingDetails.tsx`

**Add to validatedData object:**
```typescript
const validatedData = {
  // ... existing fields
  remaining_km: formData.remaining_km || null,
};
```

## Testing Checklist

After implementing the outstanding tasks:

- [ ] Field appears in Step 2 after "Restlaufzeit"
- [ ] Input accepts numbers and formats with apostrophes (35'000)
- [ ] Optional field - form submits without value
- [ ] Value persists when navigating back to Step 2
- [ ] Value appears in Step 5 preview (already implemented)
- [ ] Value saves to database correctly
- [ ] Value displays in public listings (already implemented in search results)

## Summary

**The Fix**: Changed `data.mileage_km` to `data.km || data.mileage || 0` in Step1_VehicleData.tsx to use the correct property names from the ListingData type.

**Remaining Work**: Add the "Verbleibende KM" input field to Step2_LeasingDetails.tsx (5 small tasks listed above).

**Estimated Time**: 15-20 minutes to complete all outstanding tasks.