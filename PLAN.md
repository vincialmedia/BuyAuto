# BuyAuto Homepage - Implementation Plan

## 1. Project Structure &amp; Data

### File Creation
-   `src/lib/buyauto/`: A new directory for BuyAuto-specific library code.
-   `src/lib/buyauto/types.ts`: To define the `Listing` TypeScript type.
-   `src/lib/buyauto/data.ts`: To house the mock data for car listings.
-   `src/components/buyauto/`: A new directory for all project-specific React components.
    -   `Header.tsx`
    -   `Footer.tsx`
    -   `HeroSection.tsx`
    -   `SearchForm.tsx`
    -   `PremiumListings.tsx`
    -   `ListingCard.tsx`
    -   `BenefitsSection.tsx`
    -   `HowItWorksSection.tsx`
    -   `TrustSection.tsx`
    -   `FaqSection.tsx`

### Data Flow
1.  **Type Definition (`types.ts`)**: A strict `Listing` interface will be the single source of truth for the listing data structure, ensuring type safety.
2.  **Mock Data (`data.ts`)**: An array of `Listing` objects will be created and exported. This will include 6–8 demo listings, with at least 2 marked as `premium: true`.
3.  **Homepage (`pages/index.tsx`)**:
    -   This page component will statically import the mock data from `data.ts`.
    -   It will pass the filtered list of premium listings to the `PremiumListings` component.
    -   It will pass the total count of all listings (`listings.length`) to the `HeroSection` component for display.

## 2. Component Breakdown

### `Header.tsx`
-   **Structure**: A `nav` element using Flexbox for alignment.
-   **Content**: "BuyAuto" logo, navigation links (`Fahrzeuge suchen`, `So funktioniert’s`, `Kontakt`), and two action buttons (`Inserat erstellen`, `Anmelden`).
-   **Styling**: White background, a subtle bottom border or shadow for separation.
-   **Behavior**: The header will be sticky to the top of the viewport on scroll.

### `HeroSection.tsx`
-   **Structure**: A full-width section with a background image, a container for text, and the search form component.
-   **Content**: Main H1 headline, a supporting subheading, and the `SearchForm` component.
-   **Styling**: A high-quality, relevant car photograph will be used as the background, with a dark gradient overlay to ensure text is legible.

### `SearchForm.tsx`
-   **Structure**: A `form` element wrapped in a `Card` component for styling (white, rounded, subtle shadow).
-   **State Management**: It will be a client component (`"use client"`) using `useState` hooks to manage the state of all form fields (dropdowns, slider, checkboxes, and the expanded state for advanced filters).
-   **Shadcn/UI Components**:
    -   `Select` for Marke, Jahr, and Restlaufzeit.
    -   `Slider` for Preis pro Monat.
    -   `Collapsible` to toggle the "Erweiterte Filter" section.
    -   `Checkbox` for the Kaution filter.
    -   `Button` for the main search call-to-action.
-   **Behavior**: The advanced filters will smoothly expand and collapse. The form will be fully interactive, but the actual filtering logic will be implemented later.

### `PremiumListings.tsx`
-   **Structure**: A section with a title (e.g., `H2: Unsere Premium Inserate`). It will use a responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
-   **Logic**: It will receive a list of listings as a prop, map over them, and render a `ListingCard` for each one.

### `ListingCard.tsx`
-   **Structure**: A `Card` component containing an `Image`, and sections for car details.
-   **Content**: Displays key fields from the `Listing` object: brand, model, year, price, remaining months, location, and mileage.
-   **Conditional UI**: If `listing.premium` is `true`, a "Premium" `Badge` will be prominently displayed, and the card will have a subtle highlight (e.g., a colored border or shadow) to distinguish it.
-   **CTA**: A "Details ansehen" button.

### `BenefitsSection.tsx`
-   **Structure**: A section with a 4-column responsive grid.
-   **Content**: Each grid item will feature a `lucide-react` icon, a bolded title, and a short description of a key benefit.
-   **Styling**: A light grey background (`bg-slate-50`) to visually separate it from adjacent white sections.

### `HowItWorksSection.tsx`
-   **Structure**: A section with a 3-step horizontal layout, likely using Flexbox or Grid.
-   **Content**: Each step will consist of an icon, a title (`Schritt 1`, `Schritt 2`, etc.), and a brief explanation.
-   **Styling**: Clean white background.

### `TrustSection.tsx`
-   **Structure**: A section with a headline, a 3-column grid for trust tiles, and a distinctively styled box for the customer testimonial.
-   **Content**: Icons and text for trust signals (e.g., "Geprüfte Inserate"). The testimonial will include the quote and the author's name/location.

### `FaqSection.tsx`
-   **Structure**: It will use the `Accordion` component from shadcn/ui.
-   **Content**: A list of questions and their corresponding answers.
-   **SEO**: A `<script type="application/ld+json">` tag will be embedded within the component, containing valid `FAQPage` schema markup dynamically generated from the FAQ content to improve search engine visibility.

### `Footer.tsx`
-   **Structure**: A multi-column layout using Grid for organized link sections.
-   **Content**: Columns for Services, Company, and Legal links, plus a contact block and copyright notice.
-   **Styling**: A dark grey (`slate-900`) background with light-colored text.

## 3. Styling &amp; Theming

-   **Primary Color (Red)**: `hsl(0 84.2% 60.2%)` which corresponds to Tailwind's `red-600`. This will be used for primary buttons, active links, and other key highlights.
-   **Backgrounds**:
    -   Default: `white`
    -   Subtle Contrast: `hsl(210 40% 96.1%)` (`slate-100`) for sections like "Benefits".
    -   Footer: `hsl(222.2 47.4% 11.2%)` (`slate-900`).
-   **Fonts**: The project's default `sans` font family defined in `tailwind.config.ts` will be used for a clean, modern aesthetic.
-   **Sizing & Spacing**: Tailwind's default spacing scale will be used for all padding, margins, and gaps to ensure consistency. A `max-w-7xl` class will constrain the main page content width.
-   **Icons**: The `lucide-react` library will be the sole source for icons to maintain a uniform visual style.

This plan provides a clear roadmap. The next step is to switch to Creative Mode and begin implementation.
