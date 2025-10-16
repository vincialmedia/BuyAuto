
# Plan: Update SEO Copy Block with Expandable Text

This plan outlines the steps to replace the content in the `SeoCopyBlock` component and make it expandable, as requested.

## 1. Objective
- Replace the current text in the `src/components/buyauto/SeoCopyBlock.tsx` component with the new content provided.
- Implement a "show more/less" functionality. Only the first section of text will be visible initially.
- The rest of the content will be revealed upon clicking a "Mehr Erfahren" button.

## 2. Component to Modify
- `src/components/buyauto/SeoCopyBlock.tsx`

## 3. Implementation Strategy

### Component Logic
- We will use the `Collapsible` component from shadcn/ui, which is perfect for this use case. It handles state management and animations for expanding and collapsing content.

### Structure
1.  **Static Content**: The `h2` title and the first introductory paragraph will always be visible.
2.  **Collapsible Trigger**: A `<Button>` component will serve as the trigger. Its text will dynamically update based on the open/closed state (e.g., "Mehr Erfahren" / "Weniger anzeigen"), and it will include an icon like `ChevronDown` for better UX.
3.  **Collapsible Content**: The remainder of the provided text will be placed inside the `<CollapsibleContent>` tag, making it initially hidden.

## 4. Text Allocation

- **Always Visible Part:**
  - Title: "Auto-Leasing Übernehmen oder Verkaufen in der Schweiz"
  - Intro Paragraph: "BuyAuto.ch ist die führende Plattform für Leasingübernahmen in der Schweiz..."

- **Collapsible Part:**
  - "Wie funktioniert eine Leasingübernahme?"
  - "Vorteile für Käufer"
  - "Vorteile für Verkäufer"
  - "Sicherer Prozess mit Schweizer Standards"
  - "Warum BuyAuto.ch?"
  - The final concluding paragraph.

## 5. Next Steps
- After this plan is reviewed, switch to **Standard Mode** to apply the code changes to the `src/components/buyauto/SeoCopyBlock.tsx` file.
