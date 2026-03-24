import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse .env.local manually to reliably get the Service Role Key
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envObj = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envObj[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envObj['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envObj['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeVehicleKey(str) {
  return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
}

async function run() {
  const filePath = path.join(__dirname, '../../public/Makes_Models_V2.csv');
  const csv = fs.readFileSync(filePath, 'utf-8');
  const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(l => l && l !== 'Make,Model');

  const makes = new Set();
  const rows = lines.map(line => {
    // Handling models that might have a comma in the string safely by splitting on the FIRST comma only
    const firstComma = line.indexOf(',');
    const make = line.substring(0, firstComma).trim();
    const model = line.substring(firstComma + 1).trim();
    makes.add(make);
    return { make, model };
  });

  console.log(`Parsed ${makes.size} unique makes and ${rows.length} models from CSV.`);

  const makeUpserts = Array.from(makes).map(m => ({
    name: m,
    normalized_name: normalizeVehicleKey(m)
  }));

  console.log(`Upserting ${makeUpserts.length} Makes (ignoring duplicates)...`);
  const { data: makeData, error: makeErr } = await supabase.from('makes').upsert(makeUpserts, {
    onConflict: 'normalized_name',
    ignoreDuplicates: true
  }).select();
  
  if (makeErr) {
    console.error("Make Upsert Error:", makeErr);
    throw makeErr;
  }
  console.log(`Upsert successful. Returned ${makeData?.length || 0} rows from upsert.`);

  console.log('Fetching all makes to map their IDs...');
  const { data: allMakes, error: fetchErr } = await supabase.from('makes').select('id, normalized_name, name');
  if (fetchErr) throw fetchErr;

  console.log(`Fetched ${allMakes?.length || 0} makes from the database.`);

  // Map by both normalized name AND exact name (lowercased) for maximum resilience
  const makeMap = new Map();
  for (const m of allMakes) {
    makeMap.set(m.normalized_name, m.id);
    makeMap.set(m.name.toLowerCase(), m.id);
  }

  const modelUpserts = [];
  const missingMakes = new Set();
  
  for (const r of rows) {
    const normMake = normalizeVehicleKey(r.make);
    const lowerMake = r.make.toLowerCase();
    
    // Try matching by exact lowercase name first, fallback to normalized
    const makeId = makeMap.get(lowerMake) || makeMap.get(normMake);
    
    if (!makeId) {
      missingMakes.add(r.make);
      continue;
    }
    modelUpserts.push({
      make_id: makeId,
      name: r.model,
      normalized_name: normalizeVehicleKey(r.model),
      is_active: true
    });
  }

  if (missingMakes.size > 0) {
    console.error(`ERROR: Missing Make IDs for ${missingMakes.size} makes:`, Array.from(missingMakes).join(', '));
    process.exit(1);
  }

  // Deduplicate in memory in case the CSV itself contains duplicate model rows
  const uniqueModels = new Map();
  for (const m of modelUpserts) {
    uniqueModels.set(`${m.make_id}_${m.normalized_name}`, m);
  }
  const finalModelUpserts = Array.from(uniqueModels.values());

  console.log(`Upserting ${finalModelUpserts.length} unique models in batches...`);
  const BATCH_SIZE = 200;
  let insertedModels = 0;

  for (let i = 0; i < finalModelUpserts.length; i += BATCH_SIZE) {
    const batch = finalModelUpserts.slice(i, i + BATCH_SIZE);
    
    // PostgREST handles matching unique index constraints if column names are provided
    const { error: modelErr } = await supabase.from('models').upsert(batch, {
      onConflict: 'make_id,normalized_name',
      ignoreDuplicates: true
    });

    if (modelErr) {
      console.error('Batch error details:', modelErr);
      throw modelErr;
    }

    insertedModels += batch.length;
    console.log(`Progress: ${insertedModels} / ${finalModelUpserts.length} inserted.`);
  }

  console.log('✅ Import successfully completed!');
}

run().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});