# Plan: Move “Öffentliches Profil & Embed” panel to bottom

## Goal
On the Garage Dashboard → “Profil Informationen” (GarageProfileTab), move the entire **“Öffentliches Profil & Embed”** section to the bottom of the page so it becomes the last element **after “Team”**.

## Current state (as observed)
In `src/components/buyauto/dashboard/GarageProfileTab.tsx`, the “Share Panel” block:
- Starts with comment `/* Share Panel */`
- Renders the card with heading **“Öffentliches Profil & Embed”**
- Currently appears **near the top**, after the Logo/Header grid and before “Kontakt & Beschreibung”.

## Proposed change
Reorder JSX blocks only:
1. Keep existing sections in the same order up through “Team”.
2. Move the entire Share Panel JSX block to **after the Team section**.
3. Ensure it appears **before the final Save Button** (since Save Button is the actual last element in layout; if “last element after Team” means before Save, we keep Save as the call-to-action footer. If you truly want it after Save, we can do that too, but it’s uncommon UX).

## Acceptance criteria
- “Öffentliches Profil & Embed” card is displayed after the Team card.
- No functional changes to copy/open buttons or computed URLs/snippet.
- No styling regressions.

## Implementation notes
- This is a pure layout reorder (no logic changes).
- No new components/files required.