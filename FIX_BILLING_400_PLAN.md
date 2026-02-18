# Fix Billing 400 Error Plan

## Problem
Selecting a garage plan returns "Invalid plan_code" error.

## Root Cause
**Field Name Mismatch**:
- Frontend (`garage-plan.tsx`) sends the plan code as `planCode` (camelCase).
- Backend (`api/dealer/prepare.ts`) expects `plan_code` (snake_case).

Because of this mismatch, the backend sees `undefined` for `plan_code`, causing validation to fail.

## Solution
Modify `src/pages/garage-plan.tsx`:
- Update the fetch body to use `plan_code` as the key.

```typescript
// BEFORE
body: JSON.stringify({ planCode }),

// AFTER
body: JSON.stringify({ plan_code: planCode }),
```