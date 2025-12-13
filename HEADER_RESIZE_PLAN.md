# Header Resize Plan

## Objective
Reduce the header height by approximately 50% as requested by the user.

## Target Dimensions (~50% Reduction)
- **Mobile Header Height:** Change `h-28` (112px) → `h-16` (64px)
- **Desktop Header Height:** Change `h-36` (144px) → `h-20` (80px)

- **Mobile Logo Height:** Change `h-24` → `h-12` (48px)
- **Desktop Logo Height:** Change `h-32` → `h-16` (64px)

- **Hero Section Padding:** Update to match header height
  - Change `pt-28 md:pt-36` → `pt-16 md:pt-20`

## Files to Modify

### 1. src/components/buyauto/Header.tsx
- Update the main header container classes:
  - `h-28` → `h-16`
  - `md:h-36` → `md:h-20`
- Update the Logo `Image` component classes:
  - `h-24` → `h-12`
  - `md:h-32` → `md:h-16`

### 2. src/components/buyauto/HeroSection.tsx
- Update the `<section>` element classes:
  - `pt-28` → `pt-16`
  - `md:pt-36` → `md:pt-20`

## Verification
- Ensure the navigation menu items are vertically centered.
- Check that the mobile menu button is properly aligned.
- Verify that the Hero background image still covers the top area correctly.