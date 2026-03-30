# Remove redundant logo on Auth (login/register) form

## Goal
On `/auth`, remove the redundant “BuyAuto” branding above the login/register form card **while keeping the header nav logo unchanged** (AuthLayout header stays as-is).

## What’s happening now (source of the duplicate)
There are two separate brand renderings:

1. **Header nav logo (KEEP)**
   - File: `src/components/buyauto/auth/AuthLayout.tsx`
   - Renders: the BA badge + “BuyAuto” wordmark in the header bar.

2. **Form-card branding (REMOVE)**
   - File: `src/components/buyauto/auth/AuthForm.tsx`
   - In the default login/register view it renders:
     ```tsx
     <CardHeader ...>
       <h1>BuyAuto</h1>
       <p>Verwalten Sie Ihre Auto-Leasing-Inserate</p>
     </CardHeader>
     ```
   - This is exactly the large “BuyAuto” block shown in the screenshot.

`LoginForm.tsx` and `RegisterForm.tsx` do **not** render this header; they only render inputs/buttons.

## Recommended change (minimal, scoped, safe)
Edit **only** `src/components/buyauto/auth/AuthForm.tsx`:

### A) Default view (login/register tabs)
- Remove the `CardHeader` block that contains the `h1` “BuyAuto” + subtitle.
- Adjust `CardContent` padding since it currently relies on `CardHeader` spacing.

**Before**
```tsx
return (
  <Card className="w-full max-w-md mx-auto shadow-xl shadow-neutral-900/5 border-neutral-200/60">
    <CardHeader className="space-y-1 text-center pb-4">
      <h1 className="text-2xl font-semibold text-neutral-900">BuyAuto</h1>
      <p className="text-sm text-neutral-600">Verwalten Sie Ihre Auto-Leasing-Inserate</p>
    </CardHeader>
    <CardContent className="pt-0">
      ...
    </CardContent>
  </Card>
);
```

**After**
```tsx
return (
  <Card className="w-full max-w-md mx-auto shadow-xl shadow-neutral-900/5 border-neutral-200/60">
    <CardContent className="p-6 sm:p-8">
      ...
    </CardContent>
  </Card>
);
```

### B) Reset-password + update-password views
- Leave their headers intact (they are not redundant brand logos; they are flow titles like “Passwort zurücksetzen” / “Neues Passwort”).

## Validation checklist
- [ ] Header nav logo still visible (AuthLayout unchanged)
- [ ] No “BuyAuto” title appears above the Tabs card on the default login/register view
- [ ] Reset password and update password screens still show their titles
- [ ] Layout spacing looks correct (no awkward empty space at top of card)

## Implementation note
To apply this change, switch to **Standard Mode** (code edit mode) in Softgen and I’ll implement the diff.