# Mobile Performance Optimization Plan (Target: 90+ Score)

Based on the Google PageSpeed Insights analysis, this plan addresses the specific bottlenecks slowing down mobile loading times.

## 1. Fix the "Big Logo" Issue (High Priority)
**Problem:** The logo (`Header.tsx`) is currently a standard HTML `<img>` tag loading a massive 1024x1024px file but displaying it at ~100px width. This wastes ~100KB of data.
**Solution:**
- Replace `<img>` with the Next.js `<Image />` component.
- **Why:** Next.js will automatically generate a smaller, resized version of the logo specifically for the header, converting it to modern formats like WebP.
- **Implementation:**
  ```tsx
  // src/components/buyauto/Header.tsx
  import Image from "next/image";
  // ...
  <Image
    src="/Untitled_design_6_.png"
    alt="BuyAuto Logo"
    width={100} // Explicit render width
    height={40} // Aspect ratio equivalent
    priority    // Mark as LCP (Largest Contentful Paint)
    className="w-[100px] h-auto"
  />
  ```

## 2. Eliminate Render-Blocking CSS (High Priority)
**Problem:** The `uppy.min.css` file is loaded in `src/pages/_document.tsx`. This blocks the **entire website** from rendering until this CSS file downloads, even on the homepage where it isn't used.
**Solution:**
- Remove the `<link>` tag from `_document.tsx`.
- Import the CSS directly inside `src/components/buyauto/create-listing/Step4_Images.tsx` where Uppy is actually used.
- **Why:** The browser will only download this CSS when the user actually starts creating a listing, making the homepage load significantly faster.

## 3. Optimize Hero Image Compression
**Problem:** The Hero image is currently set to `quality={85}`. The report suggests this is too high for mobile data networks.
**Solution:**
- Reduce `quality` prop in `HeroSection.tsx` from `85` to `75`.
- **Why:** The visual difference is negligible to the human eye, but the file size reduction is significant (often 30-40%).

## 4. Optimize Listing Card Thumbnails
**Problem:** The listing images in `ListingCard.tsx` and `PremiumListings.tsx` are flagging for "compression."
**Solution:**
- Add explicit `quality={70}` to the `next/image` components in these cards.
- Ensure the `sizes` prop accurately reflects the 3-column grid layout to prevent mobile devices from downloading desktop-sized images.

## Execution Order
1.  **Safe CSS Move:** Move Uppy CSS to `Step4_Images.tsx` first (verify upload still looks correct).
2.  **Logo Replacement:** Update `Header.tsx`.
3.  **Image Tuning:** Adjust quality settings in Hero and Cards.