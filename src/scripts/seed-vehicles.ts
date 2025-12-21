import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), ".env.local") });

// Initialize Supabase client for seeding
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VehicleRecord {
  make: string;
  model: string;
}

async function seedVehicles() {
  console.log("🚗 Starting vehicle catalog seeding...");

  try {
    // Read the CSV file
    const csvPath = path.join(process.cwd(), "public", "cars_sold_2015_2025_expanded_no_series_class_no_duplicates_-_cars_sold_2015_2025_expanded_no_series_class_no_duplicates.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    
    // Parse CSV (skip header row)
    const lines = csvContent.split("\n").slice(1);
    const vehicles: VehicleRecord[] = [];
    const seenCombinations = new Set<string>();

    for (const line of lines) {
      if (!line.trim()) continue;
      
      const [make, model] = line.split(",").map(col => col.trim());
      
      if (make && model) {
        // Create unique key to avoid duplicates
        const key = `${make}|${model}`;
        if (!seenCombinations.has(key)) {
          seenCombinations.add(key);
          vehicles.push({ make, model });
        }
      }
    }

    console.log(`📊 Found ${vehicles.length} unique make/model combinations`);

    // Insert in batches of 100 to avoid timeout
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < vehicles.length; i += batchSize) {
      const batch = vehicles.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from("vehicle_catalog")
        .insert(batch);

      if (error) {
        console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
      } else {
        inserted += batch.length;
        console.log(`✅ Inserted batch ${i / batchSize + 1} (${inserted}/${vehicles.length})`);
      }
    }

    console.log(`🎉 Successfully seeded ${inserted} vehicles!`);

    // Verify data
    const { count } = await supabase
      .from("vehicle_catalog")
      .select("*", { count: "exact", head: true });

    console.log(`📈 Total records in database: ${count}`);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedVehicles();