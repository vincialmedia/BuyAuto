# Mobile Overflow and Header Fix Plan

This document outlines the plan to fix the horizontal overflow issue on mobile devices, which causes a black border to appear on the right side and the hamburger menu to be cut off.

## 1. Problem Analysis

- **Symptom:** The mobile view has a horizontal scrollbar, revealing a black background area on the right. The hamburger menu icon in the header is partially pushed off-screen.
- **Root Cause:** An element on the page, most likely within the `<Header>` component, has a total width greater than 100% of the viewport width. This is a common CSS overflow issue.

## 2. Plan of Action

### Phase 1: Investigation
1.  **Inspect `src/components/buyauto/Header.tsx`**: This is the primary file to investigate. I will analyze the JSX and Tailwind CSS classes applied to the mobile view of the header. I'll check the main container and the flex properties of the elements within it.
2.  **Inspect `src/pages/index.tsx` and `src/styles/globals.css`**: Review the homepage structure and global styles to ensure no parent container or global style is causing the overflow.

### Phase 2: Implementation
Based on the investigation, I will apply the following fixes:

1.  **Fix the Root Cause in `Header.tsx`**:
    - Adjust horizontal padding (`px-`) on the header's main container to give elements more space.
    - Modify the arrangement or spacing (`gap`) of the navigation items and buttons to ensure they fit on smaller screens without overflowing.
2.  **Apply a Safeguard**:
    - Add the `overflow-x-hidden` class to a main layout container (e.g., in `_app.tsx` or a layout component) or the `body` tag to prevent any future horizontal overflow issues across the site. This is a robust solution for a better user experience.

## 3. Expected Outcome
- The horizontal scrollbar on mobile will be gone.
- The black border on the right will no longer be visible.
- The hamburger menu icon will be fully visible and correctly aligned within the header.
- The mobile layout will be clean and fit perfectly within the device's screen width.