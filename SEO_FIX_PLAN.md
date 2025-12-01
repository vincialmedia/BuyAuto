
# SEO Fix Plan: Duplicate Meta Descriptions & Favicons

## Problem
An SEO audit revealed duplicate meta descriptions. This occurs because a global `meta name="description"` tag is hardcoded in `src/pages/_document.tsx`, while individual pages (like `src/pages/index.tsx`) also define their own descriptions using Next.js `Head`. Next.js does not deduplicate tags outside its `Head` component in `_document`.

## Solution

### 1. Fix Meta Descriptions
- **Action:** Remove the `<meta name="description" ... />` tag from `src/pages/_document.tsx`.
- **Reasoning:** This tag forces a description on *every* page. Since pages like Home, Search, and Listing Details already define specific descriptions, this creates duplicates.
- **Fallback:** For pages that *don't* have a specific description, we should add a default description in `src/pages/_app.tsx` using `DefaultSeo` (if using `next-seo`) or a simple fallback `<Head>` component, or ensure every page has one. Given the current setup, removing the global one is the priority.

### 2. Fix Open Graph Duplication
- **Action:** Remove global OG tags (`og:title`, `og:description`, etc.) from `src/pages/_document.tsx`.
- **Reasoning:** Like the description, these are hardcoded and will conflict with page-specific OG tags defined in `index.tsx` and `[id].tsx`.

### 3. Fix Favicons
- **Action:** Ensure `src/pages/_document.tsx` points to the correct favicon and `src/pages/404.tsx` matches it.
- **Current State:** `_document.tsx` uses `/Untitled_design_7_.png`. `404.tsx` uses `/favicon.ico`.
- **Fix:** Standardize on one favicon file.

## Implementation Steps
1.  Modify `src/pages/_document.tsx` to remove all specific meta tags (description, OG tags). Keep only structural links (fonts, favicon, scripts).
2.  Modify `src/pages/404.tsx` to use the correct favicon if it differs.
3.  Verify `src/pages/index.tsx` and other pages retain their correct full SEO setup.

