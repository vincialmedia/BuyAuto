# Plan: Redesign /suche Page

## 1. Goal
Redesign the `/suche` page into a sleek, minimalistic, and dynamic experience.

- **Design Philosophy**: Swiss clean design (white, light grey, thin dividers, red as a highlight).
- **Focus**: Results dominate the viewport in a vertical list; filters are light and interactive.
- **Dynamic Effects**: Subtle animations like a background color shift on the price slider.
- **Out of Scope**: Vehicle detail pages, dealer dashboards.

## 2. Route & Data
- **Route**: `/suche`
- **Default State**: Always shows all listings if no filters are applied.
- **Data Source**: Supabase `public_listings` table or `search_listings` RPC.
- **Pagination**: 12 results per page, controlled by a `page` URL parameter.

## 3. UI/UX Flow

### Header (Slim, Fixed)
- **Dimensions**: Max height of 60px.
- **Style**: White background, thin bottom shadow.
- **Content**:
  - Left: Small logo.
  - Right: "Fahrzeuge suchen", "So funktioniert’s", "Kontakt", "Inserat erstellen" (red button), "Anmelden".
- **Responsive**: Collapses into a hamburger menu on mobile.

### Search/Filters Section (Dynamic, Sticky)
- **Layout**: Compact, 1-line filter bar.
- **Filters**: Brand, Model, Year, Price Slider, Restlaufzeit (remaining term), Sort.
- **Behavior**: Sticks to the top just below the header on scroll.
- **Responsive**: Collapses into a "Filter" button on mobile, which opens a drawer.

### Dynamic Interactions
- **Price Slider**: The track background behind the slider thumb fills with a gradient (grey → light red → deep red) as the max price increases.
- **Restlaufzeit Selector**: Options show a subtle animation on hover (e.g., underline or fade).
- **Filter Chips**: Applied filters appear as small, elegant chips below the filter bar, each with an "x" to remove it.

### Results List (Vertical Stack)
- **Layout**: Clean vertical stack of cards, 1 per row, full-width with padding.
- **Loading State**: Skeleton loading components will be shown while fetching data.
- **Card Design**:
  - **Left**: Car image (16:9 aspect ratio, object-fit: cover).
  - **Middle**:
    - **Title**: `Brand Model · Year`
    - **Subline Pills**: `CHF X / Monat`, `Restlaufzeit Y Mon.`, `Km`, `Antrieb`, `Getriebe`, `Kanton`.
  - **Right**:
    - **Price**: Emphasized, bold, and red (e.g., `CHF 1’290 / Monat`).
    - **Premium Badge**: A badge and a subtle glow effect on the card border if `is_premium` is true.
    - **CTA**: "Details ansehen" (minimalist outline style button).
- **Micro-interactions**: On hover, the card raises slightly (transform) and its background fades to a soft grey.

### Pagination
- **Style**: Centered, minimal controls: "‹ Zurück" | page numbers | "Weiter ›".
- **Functionality**: Updates the `page` URL parameter and fetches the corresponding result set.

### Empty State
- **Message**: "Keine Fahrzeuge gefunden."
- **Actions**: Buttons for "Filter zurücksetzen" and "Alle Anzeigen".

## 4. SEO & Copy

### SEO
- **Title**: "Auto Leasingübernahme – Fahrzeuge suchen | BuyAuto Schweiz"
- **Meta Description**: "Minimalistische Suche für Auto-Leasingübernahmen in der Schweiz. Finde dein nächstes Fahrzeug nach Preis, Marke und Restlaufzeit."
- **Structured Data**: Implement JSON-LD `ItemList` schema for the search results.

### Copy (DE-CH)
- **Price**: `CHF 1’290 / Monat`
- **Remaining Term**: `14 Mon.`
- **Buttons**: "Filter anwenden", "Zurücksetzen", "Details ansehen".

## 5. Acceptance Criteria
- [ ] Header height is ≤ 60px and does not dominate the viewport.
- [ ] Adjusting the price slider dynamically changes the gradient background.
- [ ] Active filters are displayed as removable chips.
- [ ] Premium listings are visually distinct with a badge and glow.
- [ ] Results are in a vertical stack, not a grid.
- [ ] Pagination correctly updates results and URL state.
- [ ] The empty state provides clear actions to the user.
- [ ] The page is fully responsive and touch-friendly.

## 6. Constraints
- The design must be minimalistic (no heavy borders, no large color blocks).
- All dynamic interactions must be subtle and performant (using CSS transforms and gradients).
- No fake statistics or logos.
- The primary focus is on readability and elegance.
