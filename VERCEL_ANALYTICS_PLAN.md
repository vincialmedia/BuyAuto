# Vercel Analytics Implementation Plan

## Goal
Enable Vercel Analytics to track visitors and page views.

## Technical Details
- **Framework**: Next.js (Pages Router)
- **File to Modify**: `src/pages/_app.tsx`
- **Package**: `@vercel/analytics`

## Implementation Steps

1.  **Install Package**
    -   Command: `npm install @vercel/analytics`

2.  **Modify `src/pages/_app.tsx`**
    -   **Import**: Add `import { Analytics } from "@vercel/analytics/react"`
    -   **Component**: Place `<Analytics />` inside the main returned JSX, ensuring it's rendered on every page.

    **Planned Code Structure:**
    ```typescript
    import { Analytics } from "@vercel/analytics/react"
    // ... other imports

    export default function App({ Component, pageProps }: AppProps) {
      return (
        <div className={`${manrope.variable} font-sans overflow-x-hidden min-h-screen`}>
          <AuthProvider>
            <MainLayout>
              <Component {...pageProps} />
            </MainLayout>
            <Toaster />
            <Analytics /> {/* Added here */}
          </AuthProvider>
        </div>
      );
    }
    ```

3.  **Deploy & Verify**
    -   Push changes to GitHub/Vercel.
    -   Visit the live site to generate initial data.
    -   Check Vercel Dashboard > Analytics tab.
