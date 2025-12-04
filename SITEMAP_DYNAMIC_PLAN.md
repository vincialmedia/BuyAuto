# Dynamic Sitemap Implementation Plan

## Objective
Replace the hardcoded static page list in `src/pages/sitemap.xml.ts` with a dynamic file system scan. This ensures that new pages (like `leasing-abgeben-schweiz.tsx`) are automatically added to `sitemap.xml` without manual intervention.

## Technical Implementation

### 1. Import Node Modules
Use `fs` (File System) and `path` modules, which are available in Next.js `getServerSideProps` (Server-Side Only).

```typescript
import fs from 'fs';
import path from 'path';
```

### 2. Define Exclusion Rules
We must exclude specific files and directories that should not be in the sitemap:
- **Directories**: `api`, `fonts`, `fahrzeug` (handled separately), `admin`, `dashboard`, `auth` (optional, but usually private/no-index).
- **Files**: 
  - `_app.tsx`, `_document.tsx`, `_error.tsx`, `404.tsx`
  - `sitemap.xml.ts`
  - Dynamic route files (e.g., `[id].tsx`)

### 3. Scanning Logic (`getServerSideProps`)
1. Resolve the `src/pages` directory path.
2. Read all files in the directory.
3. Filter the list based on the exclusion rules.
4. Map filenames to URL paths:
   - `index.tsx` -> `/`
   - `about.tsx` -> `/about`
5. Collect these into a `staticPaths` array.

### 4. Integration
Merge the `staticPaths` with the existing database-fetched `listings` to generate the full XML.

### Proposed Code Structure for `getServerSideProps`

```typescript
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = "https://buyauto.ch";
  
  // 1. Get Static Pages
  const pagesDirectory = path.join(process.cwd(), 'src/pages');
  const filenames = fs.readdirSync(pagesDirectory);
  
  const staticPages = filenames
    .filter(name => {
      return (
        name.endsWith('.tsx') && 
        !name.startsWith('_') && 
        !name.startsWith('[') &&
        !['api', 'fonts', 'admin.tsx', 'dashboard.tsx', 'auth.tsx', 'sitemap.xml.ts', '404.tsx'].includes(name)
      );
    })
    .map(name => {
      const pageName = name.replace('.tsx', '');
      return pageName === 'index' ? '' : `/${pageName}`;
    });

  // 2. Get Dynamic Listings (Existing Logic)
  const { data: listings } = await supabase...

  // 3. Generate XML
  // ...
}
```

## Verification
- Check that `/leasing-abgeben-schweiz` appears in the output.
- Check that private/system pages (`_app`, `api`) do not appear.
- Verify `lastmod` dates (can use `fs.statSync` for file modification time if desired, or default to current date).

## Next Steps
Switch to **Creative Mode** or **Standard Mode** to apply this implementation.