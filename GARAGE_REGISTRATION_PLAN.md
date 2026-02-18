# Garage Registration Integration Plan

## Goal
Allow new users to select whether they are a "Private User" or a "Garage" during registration. This selection determines their role in the `profiles` table and subsequently redirects them to the correct dashboard (`/dashboard/garage` vs `/dashboard/private`).

## Analysis
- **Database**: `profiles` table has `role` column (`private` | `garage` | `admin`).
- **Trigger**: `public.handle_new_user` currently defaults role to `'private'`.
- **Frontend**: `RegisterForm.tsx` currently only collects standard fields.
- **Service**: `authService.ts` handles Supabase `signUp`.
- **Validation**: `schemas.ts` defines `registerSchema` without a role field.

## Implementation Steps

### Phase 1: Database Logic Update
1.  **Update Trigger Function**: Modify `public.handle_new_user` to check `raw_user_meta_data` for a `role` field.
    *   If `raw_user_meta_data->>'role'` is present, use it (validating it is 'garage' or 'private').
    *   Default to `'private'` if missing or invalid.

### Phase 2: Validation Schema Update
1.  **Update `src/lib/buyauto/schemas.ts`**:
    *   Add `accountType` field to `registerSchema`.
    *   Type: `z.enum(["private", "garage"])`.
    *   Default to `private`.

### Phase 3: Auth Service Update
1.  **Update `src/services/authService.ts`**:
    *   Modify `signUp` function to accept the `accountType` parameter.
    *   Pass this as `role` in the `options.data` object (which becomes `raw_user_meta_data`).

### Phase 4: Frontend Implementation
1.  **Update `src/components/buyauto/auth/RegisterForm.tsx`**:
    *   Add a visual selector (Cards with icons) for "Private" vs "Garage" at the top of the form.
    *   Connect this selection to the form state.
    *   Pass the selected accountType to the `onRegister` handler.

### Phase 5: Verification
1.  Register a new user as "Garage".
2.  Verify `profiles` table entry has `role = 'garage'`.
3.  Verify automatic redirect to `/dashboard/garage`.

## Technical Details

### Database Function Update SQL
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  selected_role text;
BEGIN
  -- Get role from metadata, default to 'private'
  selected_role := COALESCE(new.raw_user_meta_data->>'role', 'private');
  
  -- Validate role (security precaution)
  IF selected_role NOT IN ('private', 'garage') THEN
    selected_role := 'private';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    selected_role
  );
  
  RETURN new;
END;
$function$;
```

### Schema Addition
```typescript
accountType: z.enum(["private", "garage"]).default("private")
```

### Auth Service Addition
```typescript
options: {
  data: {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    role: accountType, // NEW: Pass the selected account type
  },
}
```

### UI Component (Card Selection)
Two side-by-side cards:
- **Private**: Icon (User), "Privatkunde"
- **Garage**: Icon (Building2), "Garage/Händler"

Active card gets highlighted border and background.