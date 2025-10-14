
# Plan: Remove "Meine Inserate" from Header Dropdown

The "Meine Inserate" page has been replaced by the new unified dashboard. This plan outlines the steps to remove the now-redundant link from the user profile dropdown in the main header.

## 1. Target File Identification
The component responsible for the site header is `src/components/buyauto/Header.tsx`. This file contains the user profile avatar and the associated dropdown menu.

## 2. Locate the Dropdown Menu Code
Within `Header.tsx`, I will find the `DropdownMenu` component that is rendered when a user is authenticated.

## 3. Identify and Remove Redundant Menu Item
I will locate the `DropdownMenuItem` that links to the old "Meine Inserate" page and remove its corresponding code block.

## 4. Final State
After the change, the dropdown menu will only contain two items:
- "Dashboard"
- "Abmelden" (Log out)

This ensures the user navigation is clean and only points to existing pages.
