# Founder Story Section Implementation Plan (Revised)

## 1. Updates to: `src/components/buyauto/FounderStory.tsx`

Refine the component to be more compact and focused, removing the requested paragraph.

### Revised Content Structure
- **Heading:** "Über uns" (Keep concise)
- **Text Body (Reduced):**
  - Paragraph 1: "BuyAuto ist entstanden..." (Problem statement)
  - Paragraph 2: "Statt mich durch schlechte Nutzerführung..." (Solution/Action)
  - ~~[REMOVED] "BuyAuto richtet sich an Menschen..."~~
  - Paragraph 3: "Die Plattform wurde von VincialMedia..." (Credibility)
  - **Conclusion:** "Kurz gesagt: BuyAuto wurde von jemandem gebaut, der selbst genau dieses Problem hatte. Und genau deshalb ist es besser gelöst."
- **Signature:** Vincent Hänggi, Gründer von BuyAuto
- **Image:** `/Vince.jpeg`

### Revised Technical Design ("Much Smaller")
- **Container Width:** Reduce from `max-w-7xl` to **`max-w-5xl`** to create a more intimate, readable column width.
- **Vertical Spacing:** Reduce padding from `py-20` to **`py-16`** (or `py-12` on mobile).
- **Grid Layout:**
  - Maintain 2 columns but with a tighter gap (`gap-8` or `gap-12`).
  - **Image Sizing:** Reduce image visual weight. Instead of a massive hero-style image, use a smaller, perhaps `aspect-[4/5]` or slightly smaller square profile shot that doesn't dominate the viewport.
- **Typography:**
  - Heading: `text-3xl` (slightly smaller than hero headers).
  - Body: Maintain readability but ensure text blocks are tight.

## 2. Revised Integration: `src/pages/index.tsx`

Move the component to the new requested position.

### New Order
1. `HeroSection`
2. `UspBar`
3. `PremiumListings` ("Exklusive Premium Fahrzeuge")
4. **`FounderStory` (NEW POSITION)**
5. `BenefitsSection` ("Warum BuyAuto")
...

This placement serves as a "trust bridge" between the vehicle listings (the "what") and the benefits (the "why").

## 3. Assets
- Continue using `public/Vince.jpeg`.

## 4. Next Steps
- Switch to Creative/Standard Mode to apply these code changes.