# Project Implementation Plan: Secure "My Listings"

**Objective:** To ensure users can only see their own listings on the "Meine Inserate" dashboard page by implementing ownership controls across the full stack. This plan addresses the bug where users could see all listings in the system.

---

### Phase 1: Database Hardening & Ownership

This phase establishes the source of truth for listing ownership and enforces access rules directly within the Supabase database.

1.  **Add `owner_id` Column:**
    *   **Action:** Execute an `ALTER TABLE` statement to add a new `owner_id` column to the `public_listings` table.
    *   **Details:** This column will be of type `uuid` and will have a foreign key constraint referencing `auth.users(id)`.
    *   **SQL:** `ALTER TABLE public_listings ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);`

2.  **Implement Row-Level Security (RLS):**
    *   **Action:** Enable RLS on the `public_listings` table and create a set of policies to govern access.
    *   **Details:** The policies will ensure that users can only perform `SELECT`, `INSERT`, `UPDATE`, and `DELETE` operations on rows where their `auth.uid()` matches the `owner_id`.
    *   **SQL:**
        ```sql
        -- Enable RLS
        ALTER TABLE public_listings ENABLE ROW LEVEL SECURITY;

        -- Create policies for own data
        CREATE POLICY "listings_select_own" ON public_listings FOR SELECT USING (owner_id = auth.uid());
        CREATE POLICY "listings_insert_as_self" ON public_listings FOR INSERT WITH CHECK (owner_id = auth.uid());
        CREATE POLICY "listings_update_own" ON public_listings FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
        CREATE POLICY "listings_delete_own" ON public_listings FOR DELETE USING (owner_id = auth.uid());
        ```

3.  **Create Ownership Trigger:**
    *   **Action:** Create a PostgreSQL function and a trigger to automatically populate the `owner_id` on new listing insertions.
    *   **Details:** This serves as a backend safety measure, guaranteeing that every new listing is assigned an owner, even if the `owner_id` is omitted in the insert call.
    *   **SQL:**
        ```sql
        -- Function to set owner_id
        CREATE OR REPLACE FUNCTION set_owner_id()
        RETURNS trigger AS $$
        BEGIN
          IF NEW.owner_id IS NULL THEN
            NEW.owner_id := auth.uid();
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Trigger to execute the function before insert
        DROP TRIGGER IF EXISTS trg_set_owner_id ON public_listings;
        CREATE TRIGGER trg_set_owner_id
        BEFORE INSERT ON public_listings
        FOR EACH ROW EXECUTE FUNCTION set_owner_id();
        ```

---

### Phase 2: Create Secure Server-Side API Endpoint

This phase creates a dedicated API route that acts as a secure gateway for fetching user-specific listings.

1.  **Create API Route File:**
    *   **Action:** Create a new TypeScript file at `src/pages/api/listings/my.ts`.

2.  **Implement `GET` Handler:**
    *   **Action:** Implement a `GET` request handler within the new API route.
    *   **Logic:**
        1.  Initialize a server-side Supabase client (this needs a helper function, e.g., `createServerClient` that can handle cookies).
        2.  Fetch the authenticated user from the current session.
        3.  If no user is found, return a `401 Unauthorized` response.
        4.  Query the `public_listings` table. The RLS policy `listings_select_own` will automatically filter for the current user's listings.
        5.  Handle pagination and sorting parameters from the request URL.
        6.  Return the filtered list of listings as a JSON response.

---

### Phase 3: Refactor Frontend Dashboard Component

This phase updates the user-facing dashboard to consume data from the new, secure API endpoint.

1.  **Identify Target Component:**
    *   **File:** `src/components/buyauto/dashboard/ListingsSection.tsx` is the primary component to modify.
    *   **Service:** `src/services/dashboardService.ts` likely contains the current fetching logic that needs to be replaced.

2.  **Update Data Fetching Logic:**
    *   **Action:** Modify the component and/or service to stop calling the public Supabase REST endpoint.
    *   **New Logic:** Implement a function that makes a `fetch` request to our new `/api/listings/my` endpoint, passing along any necessary pagination or sorting parameters.

3.  **Implement Empty State:**
    *   **Action:** Ensure the component correctly handles an empty response from the API.
    *   **UI:** When the fetched data array is empty, render the message: "Du hast noch keine Inserate. Jetzt Inserat erstellen."

---

### Phase 4: Verify Create/Update Flow

This final phase ensures that new listings are created with the correct ownership from the start.

1.  **Review Create Listing Logic:**
    *   **File:** `src/services/createListingService.ts`.
    *   **Action:** Review the `insert` logic for new listings.

2.  **Confirm Authenticated Client:**
    *   **Verification:** Ensure that all database write operations (`insert`, `update`) are performed using an authenticated Supabase client instance from the browser. The RLS policies and database trigger will automatically enforce ownership. This is a verification step; no code changes are anticipated.

