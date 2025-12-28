# Plan: Remove "Aktuelle Inserate" Statistics from Homepage

## Goal
Remove the "Aktuelle Inserate" text and counter from the Hero section on the homepage, as requested by the user to avoid showing low listing counts.

## Files to Modify

### 1. `src/components/buyauto/HeroSection.tsx`
- **Current State**: Displays listing count in a paragraph tag.
- **Action**: 
  - Remove `totalListings` from `HeroSectionProps` interface.
  - Remove `totalListings` from the component arguments.
  - Delete the following JSX block:
    ```tsx
    {/* Subtle statistics */}
    <p className="text-neutral-300 text-sm md:text-base font-medium tracking-wide">
      Aktuelle Inserate: <span className="text-white font-semibold">{totalListings.toLocaleString("de-CH")}</span>
    </p>
    ```

### 2. `src/pages/index.tsx`
- **Current State**: Fetches `totalListings` using `getStaticProps` and passes it to `HeroSection`.
- **Action**:
  - Remove `getPublishedListingsCount` import.
  - Remove `totalListings` from `HomePageProps`.
  - Remove `totalListings` prop passed to `<HeroSection />`.
  - Remove `getStaticProps` function entirely (or just the `totalListings` part if other data is added later). Since it's the only prop, the entire function can be removed to simplify the page.

## Execution Steps for Standard Mode
1. Open `src/components/buyauto/HeroSection.tsx` and remove the UI element and props.
2. Open `src/pages/index.tsx` and remove the data fetching logic.
