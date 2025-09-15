# Plan to Fix Missing Database Functions

The application is failing to load car brands and models in the search filters because the necessary functions are missing in the Supabase database.

Here is the step-by-step plan to resolve this issue:

### Step 1: Understand the Root Cause

The errors `Could not find the function public.get_distinct_brands` and `Failed to load resource: /rest/v1/rpc/get_distinct_brands` confirm that the application is trying to call a remote procedure call (RPC) on Supabase that doesn't exist.

The frontend code in `src/services/listingsService.ts` makes two such calls:
1.  `get_distinct_brands()`: To get a unique list of all car brands.
2.  `get_models_for_brand(brand)`: To get the models available for a selected brand.

Both of these functions need to be created in the database.

### Step 2: Create the `get_distinct_brands` SQL Function

I will execute the following SQL command to create the function that returns all unique car brands from the `public_listings` view. This view is safe to use as it's designed for public access.

```sql
CREATE OR REPLACE FUNCTION public.get_distinct_brands()
RETURNS SETOF TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT DISTINCT brand
    FROM public.public_listings
    WHERE brand IS NOT NULL
    ORDER BY brand;
$$;
```

### Step 3: Create the `get_models_for_brand` SQL Function

Next, I will execute a similar SQL command to create the function that returns all unique models for a given brand.

```sql
CREATE OR REPLACE FUNCTION public.get_models_for_brand(p_brand TEXT)
RETURNS SETOF TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT DISTINCT model
    FROM public.public_listings
    WHERE brand = p_brand
    AND model IS NOT NULL
    ORDER BY model;
$$;
```

### Step 4: Execution and Verification

To implement this solution, please switch to **Standard Mode**. I will then use the `execute_sql_query` tool to add these functions to your Supabase database.

Once created, the network errors will be resolved, and the "Brand" and "Model" dropdowns on the search page will populate with data as expected. No changes to the frontend code are required.
