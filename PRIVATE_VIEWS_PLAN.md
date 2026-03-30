# Plan: Add View Counts to Private Dashboard

## 1. Backend Status (Already Complete)
The data fetching logic is fully implemented in `src/services/dashboardService.ts`:
- `getDashboardStats()` natively calculates `totalViews` by summing `view_count` for all listings belonging to the private user.
- `getUserListings()` automatically includes `view_count` in the `ListingDetail` object returned to the frontend.

## 2. Frontend UI Implementation (Required Steps)

### Step 2.1: Update Overview Statistics
**Target File:** `src/components/buyauto/dashboard/StatsCards.tsx` & `src/components/buyauto/dashboard/ListingStatsSection.tsx`
- **Action:** Add `totalViews` to the component props if it isn't mapped yet.
- **UI Update:** Introduce a new "Aufrufe" (Views) card to the stats grid, displaying the total accumulated views across all the user's active and past listings using the `Eye` icon from `lucide-react`.

### Step 2.2: Update Individual Listing Cards
**Target File:** `src/components/buyauto/dashboard/ListingsSection.tsx`
- **Action:** Inside the mapped listing cards, display the specific view count for each car.
- **UI Update:** Add a small badge or text row (e.g., `<Eye className="w-4 h-4 mr-1"/> {listing.view_count} Aufrufe`) near the status badge or inside the listing details section. This will give private users granular insights into which car is performing best, exactly like the Garage dashboard does.

## 3. Review & Polish
- Ensure the newly added View metrics align perfectly with the dashboard's design system (matching text colors like `text-neutral-500` for secondary metadata).
- Verify mobile responsiveness so the view count doesn't break the listing card layout on smaller screens.