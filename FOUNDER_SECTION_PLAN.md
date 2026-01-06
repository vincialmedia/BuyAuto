# Founder Story Section Implementation Plan

## 1. New Component: `src/components/buyauto/FounderStory.tsx`

Create a new React component to display the founder's story and image.

### Content Structure
- **Heading:** "Über uns" (or "Die Geschichte hinter BuyAuto" as a subhead)
- **Text Body:**
  - Paragraph 1: "BuyAuto ist entstanden..."
  - Paragraph 2: "Statt mich durch schlechte Nutzerführung..."
  - Paragraph 3: "BuyAuto richtet sich an Menschen..."
  - Paragraph 4: "Die Plattform wurde von VincialMedia..."
  - **Conclusion (Bold/Emphasized):** "Kurz gesagt: BuyAuto wurde von jemandem gebaut, der selbst genau dieses Problem hatte. Und genau deshalb ist es besser gelöst."
- **Signature:**
  - Name: Vincent Hänggi
  - Title: Gründer von BuyAuto
- **Image:**
  - Source: `/Vince.jpeg`
  - Style: Modern portrait, rounded corners (`rounded-3xl`), shadow-lg.

### Technical Design
- **Container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Padding:** `py-20` or `py-24` (Consistent with design system generous spacing)
- **Responsive Grid:**
  - Mobile: Stacked (Image top or bottom depending on visual weight, likely text first for storytelling)
  - Desktop: 2 columns (`lg:grid-cols-2`), gap-12 or gap-16.
- **Theme:** Clean, professional, trustworthy.

## 2. Integration: `src/pages/index.tsx`

Update the homepage to include the new component.

### Steps
1. Import `FounderStory` at the top of the file (or use dynamic import if it's below the fold, but since it's high up, a standard import or eager dynamic import is better).
2. Insert `<FounderStory />` component:
   - **After:** `<UspBar />`
   - **Before:** `<PremiumListings />`

### Expected Homepage Order
1. `HeroSection`
2. `UspBar`
3. **`FounderStory` (NEW)**
4. `PremiumListings` ("Exklusive Premium Fahrzeuge")
5. `BenefitsSection` ("Warum BuyAuto")
...

## 3. Assets
- Verify `public/Vince.jpeg` loads correctly.
- Ensure alt text is descriptive ("Vincent Hänggi, Gründer von BuyAuto").

## 4. Design System Compliance
- Use `text-neutral-900` for headings.
- Use `text-neutral-600` for body text.
- Use `rounded-3xl` for image borders.
- Ensure accessibility (contrast, responsive scaling).