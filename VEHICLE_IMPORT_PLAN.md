# Vehicle Catalog Import Plan

## Overview
This document outlines the strategy for safely importing a comprehensive list of vehicle makes and models without creating duplicates, while respecting the existing schema's canonical structure.

## Core Principles
1. **Idempotency**: The import script must be safe to run multiple times. If a record exists, it should be skipped or updated, never duplicated.
2. **Normalization**: All strings must pass through `normalizeVehicleKey()` to generate the `normalized_name` used for unique constraints.
3. **Relational Integrity**: Models must be strictly tied to their respective Make IDs.

## Data Flow Pipeline

### 1. Data Ingestion & Parsing
- Read the uploaded file (CSV or JSON) from the `public/` directory.
- Parse the rows into a structured format: `Array<{ makeName: string, modelName: string, variantName?: string }>`

### 2. In-Memory Deduplication & Grouping
- Group all raw rows by Make to prevent attempting to insert the same Make multiple times in one batch.
- Inside each Make, group by Model.

### 3. Upserting Makes
- **Action**: Bulk upsert the unique makes.
- **Conflict Resolution**: `ON CONFLICT (normalized_name) DO NOTHING` (or `DO UPDATE` if we want to refresh display names).
- **Post-Action**: Fetch all makes from the database to map `make.normalized_name` to `make.id`.

### 4. Upserting Models
- **Action**: Map the parsed models to their new/existing `make_id` from Step 3.
- **Conflict Resolution**: `ON CONFLICT (make_id, normalized_name) DO NOTHING`.
- **Post-Action**: Fetch all models to map `(make_id, model.normalized_name)` to `model.id`.

### 5. Upserting Variants (If applicable)
- **Action**: Map the parsed variants to their new/existing `model_id` from Step 4.
- **Conflict Resolution**: `ON CONFLICT (model_id, normalized_name) DO NOTHING`.

## Required Tools for Standard Mode
We will create a temporary Next.js API route (e.g., `src/pages/api/admin/import-vehicles.ts`) or a one-off standalone script that executes this exact logic using the Supabase admin client. This ensures we bypass RLS for the import and handle large batches efficiently.