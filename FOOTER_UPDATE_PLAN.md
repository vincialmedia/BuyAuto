# Footer Update Plan

## Objective
Add a new "Seiten" section to the footer with links to specific SEO landing pages.

## Changes
Modify `src/components/buyauto/Footer.tsx`:

1.  Update the `footerSections` array.
2.  Insert a new section object:
    ```typescript
    {
      title: "Seiten",
      links: [
        { label: "Leasingübernahme", href: "/leasinguebernahme" },
        { label: "Leasing Abgeben", href: "/leasing-abgeben-schweiz" }
      ]
    }
    ```
3.  Ensure this new section is placed appropriately (e.g., after "Services" or before "Rechtliches").

## Expected Outcome
The footer will display a new column titled "Seiten" containing the requested links.