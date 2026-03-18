# Dealer Microsite — QA & Polish Plan (Google Maps)

## Goal
Ship a dealer microsite that is mobile-first, minimalistic, premium (“Swiss clean”), and SEO-indexable:
Hero (lower-third info card) → Bio + Map → Inventory → Team + Opening hours.
Also provide an embeddable inventory widget for external dealer websites.

---

## 1) UX / Layout Acceptance Criteria
### Hero
- Full-bleed header image with dark overlay for readability
- Lower-third floating “Light Glass” card:
  - Logo (optional)
  - Garage name + city
  - Services chips (optional)
  - Primary CTA: “Zum Inventar”
  - Secondary CTAs: Website / Phone / Email (only if present)
- Mobile: content stacks; buttons wrap cleanly

### Bio + Map
- Desktop: two-column layout (Bio left, Google Map right)
- Mobile: Map below bio
- Map UX:
  - Google Maps iframe embed using a query string:
    `GarageName, City, Schweiz`
  - “In Google Maps öffnen” link for navigation

### Inventory
- Filter + sort + pagination
- Cards: consistent radius (rounded-3xl) and hover polish
- Works both on microsite and embed route

### Team + Opening hours
- Team:
  - Grid of members: name, role, bio (optional), image (optional)
- Opening hours:
  - Render weekly schedule; highlight “Heute” (nice-to-have)

---

## 2) Data Requirements (Team + Opening Hours)
### Opening hours
- Already stored as `garages.opening_hours` (JSON-like)

### Team members (must be editable in dashboard AND visible publicly)
**Needs to exist in DB and be included in public RPC:**
- Column: `garages.team_members` (jsonb, default [])
- Public RPC: `get_public_garage_by_slug` must select/return `team_members`
- RLS: owners can update their garage; public can read only through RPC or a restricted view

---

## 3) Embeddable Inventory Widget
Route: `/embed/garage/[dealerSlug]`
Requirements:
- `<meta name="robots" content="noindex, nofollow" />`
- Reliable iframe auto-height:
  - Emit resize events from the embedded page after data loads + on resize
  - Dashboard snippet listens to messages and sets iframe height
- Query-param filters supported:
  - saleType, yearMin, priceMin, priceMax, monthsMax, sort, embedId

---

## 4) SEO Checklist (Google)
- Dealer page has:
  - unique title/description
  - canonical URL `https://www.buyauto.ch/{dealerSlug}`
  - OG image (header image → logo → fallback)
- JSON-LD:
  - AutoDealer schema with name/url/logo/image/telephone/address/city/openingHoursSpecification
- Sitemap:
  - Includes dealer slugs
  - Must NOT rely on direct `garages` select if RLS blocks it → use public RPC/view

Validation tools:
- Google Rich Results Test
- Search Console URL Inspection (after deploy)
- Verify `/sitemap.xml` contains dealer URLs

---

## 5) Recommended Implementation Order (Creative Mode)
1. UI polish: ensure hero + about+map section exactly match mobile/desktop spec
2. Team persistence:
   - Add `team_members` column
   - Update public RPC to include it
   - Ensure dashboard save flow persists it
3. Sitemap fix (public-safe data source for garages)
4. Embed hardening: noindex + consistent resize messaging + docs in dashboard

---

## 6) Go/No-Go QA (quick)
- [ ] Dealer page renders on mobile and desktop without layout shifts
- [ ] Google map loads and shows the correct location
- [ ] Inventory filters work and pagination works
- [ ] Team edits in dashboard appear on public dealer page
- [ ] Opening hours appear correctly
- [ ] Embed snippet auto-resizes on dealer website
- [ ] Dealer URLs appear in sitemap