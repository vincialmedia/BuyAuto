
# Plan: Make Search Bar Semi-Transparent

**Objective:**
Make the background of the search bar on the hero section slightly transparent, while ensuring the "Fahrzeug finden" button remains fully opaque. This will create a modern "glassmorphism" effect.

**File to Modify:**
- `src/components/buyauto/SearchForm.tsx`

**Analysis:**
The `SearchForm.tsx` component contains a `<Card>` element that wraps all the search inputs and the search button. The goal is to apply the transparency effect to the card itself, without affecting the button.

**Proposed Changes:**
1.  **Target the `<Card>` component:** The main container in `SearchForm.tsx` is a `<Card>`.
2.  **Apply Tailwind CSS classes:**
    -   Add `bg-white/80` (or a similar value like `bg-white/90` for less transparency) to set a white background with an alpha channel.
    -   Add `backdrop-blur-sm` to create a subtle blur on the part of the background image visible through the card.
    -   Add corresponding dark mode classes like `dark:bg-zinc-900/80` to ensure the effect works in both themes.
3.  **Ensure Button Opacity:** The button component (`<Button>`) within the card has its own solid background color defined by its `variant`. This means it will not inherit the card's transparency and will remain opaque, which is the desired behavior. No changes are expected to be needed for the button itself.

**Implementation Steps:**
1.  Open `src/components/buyauto/SearchForm.tsx`.
2.  Find the `<Card>` component near the top of the `return` statement.
3.  Modify its `className` to include the transparency and blur classes.
4.  Review the result to confirm the visual effect is correct and the button is unaffected.
