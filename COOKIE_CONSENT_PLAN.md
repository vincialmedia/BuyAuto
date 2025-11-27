# Simple Cookie Consent Banner Plan

## Overview
Create a lightweight, custom cookie consent banner for the Swiss market. The banner will be simple, informative, and unobtrusive, persisting only until the user agrees.

## Requirements
1.  **Text**: German notification about cookie usage.
2.  **Actions**:
    *   "Einverstanden" (Agree) button: Closes banner and saves consent.
    *   "Datenschutz" (Privacy) button: Links to `/datenschutz`.
3.  **Behavior**:
    *   Appears on all pages if consent not yet given.
    *   Disappears immediately upon agreement.
    *   Uses `localStorage` to remember choice (persistent across sessions).
4.  **Design**: Fixed banner at the bottom of the screen.

## Implementation Steps

### 1. Create Component: `src/components/buyauto/CookieConsent.tsx`
*   **State Management**: Use `useState` to track visibility.
*   **Effect**: Use `useEffect` to check `localStorage` on mount (avoids server-side rendering mismatches).
*   **Storage Key**: `buyauto_cookie_consent` (boolean 'true').
*   **Styling**:
    *   Fixed position at bottom (`fixed bottom-0 left-0 right-0`).
    *   High z-index to appear above other content.
    *   Background color matching theme (e.g., white or dark gray).
    *   Responsive layout (stack on mobile, row on desktop).

### 2. Integration: Update `src/components/layout/MainLayout.tsx`
*   Import and add `<CookieConsent />` to the main layout.
*   Ensure it sits outside the main content flow so it overlays correctly.

### 3. Content (German)
*   **Message**: "Diese Website verwendet Cookies, um Ihnen das beste Nutzererlebnis zu bieten." (Standard professional phrasing)
*   **Primary Button**: "Einverstanden"
*   **Secondary Button**: "Datenschutz"

## Technical Details
*   **No external dependencies**: Pure React + Tailwind CSS.
*   **GDPR/nFADP Compliance**: This implements a "Notice and Consent" pattern, which is generally sufficient for simple analytics/functional cookies in Switzerland, provided the Privacy Policy is comprehensive.

## Next Steps
1.  Create the component.
2.  Add to MainLayout.
3.  Verify visibility and dismissal behavior.
