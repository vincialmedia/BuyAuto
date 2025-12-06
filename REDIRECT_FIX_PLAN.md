# Redirect Fix & Canonical Domain Plan

## Goal
Ensure a strict "One Hop" redirect strategy where any non-canonical URL (http, non-www) redirects directly to `https://www.buyauto.ch` with status 200, resolving Google Search Console "Redirect error" for `/leasinguebernahme`.

## 1. Configuration Clean Up

### `vercel.json`
**Action**: Remove routing properties that conflict with Next.js.
- Remove `"cleanUrls": true` (Next.js handles this natively)
- Remove `"trailingSlash": false` (Next.js handles this natively)
- Keep `headers` for security (X-Content-Type-Options)

### `next.config.mjs`
**Action**: Explicitly define routing behavior to be unambiguous.
- Add `trailingSlash: false`
- (Optional) Add `skipTrailingSlashRedirect: true` if using advanced middleware, but usually `false` is sufficient with proper middleware.

## 2. Middleware Implementation (The "One Hop" Engine)

We will update `src/middleware.ts` to handle the canonical redirect *before* any auth logic or other processing.

**Logic Flow:**
1. **Check Environment**: Only run strict redirects in `production` (preserve localhost for dev).
2. **Check Hostname**: Inspect `req.nextUrl.hostname`.
3. **Strict Rule**:
   - IF hostname is `buyauto.ch` (or any alias)
   - THEN `NextResponse.redirect('https://www.buyauto.ch' + pathname, 301)`
   - This combines the HTTP->HTTPS and non-www->www jump into a single 301.

## 3. Specific Page Verification: `/leasinguebernahme`

The "Redirect Error" is likely caused by the `cleanUrls` setting in `vercel.json` fighting with Next.js.
- By removing `cleanUrls` from `vercel.json`, Next.js `pages/leasinguebernahme.tsx` will be served directly.
- `trailingSlash: false` in `next.config.mjs` ensures `/leasinguebernahme/` -> `/leasinguebernahme` is handled by Next.js consistently.

## 4. Implementation Steps

1. **Modify `vercel.json`**: Strip routing keys.
2. **Modify `next.config.mjs`**: Set `trailingSlash: false`.
3. **Update `src/middleware.ts`**: Add the canonical redirect block at the very top.

## 5. Validation Checklist

- [ ] `http://buyauto.ch/leasinguebernahme` -> 301 -> `https://www.buyauto.ch/leasinguebernahme` (200 OK)
- [ ] `https://buyauto.ch/leasinguebernahme` -> 301 -> `https://www.buyauto.ch/leasinguebernahme` (200 OK)
- [ ] `https://www.buyauto.ch/leasinguebernahme` -> 200 OK (No redirect)
- [ ] `http://buyauto.ch` -> 301 -> `https://www.buyauto.ch/` (200 OK)