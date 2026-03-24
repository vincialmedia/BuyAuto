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
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
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

  console.log('Upserting Makes (ignoring duplicates)...');
  const { error: makeErr } = await supabase.from('makes').upsert(makeUpserts, {
    onConflict: 'normalized_name',
    ignoreDuplicates: true
  });
  if (makeErr) throw makeErr;

  console.log('Fetching all makes to map their IDs...');
  const { data: allMakes, error: fetchErr } = await supabase.from('makes').select('id, normalized_name');
  if (fetchErr) throw fetchErr;

  const makeMap = new Map(allMakes.map(m => [m.normalized_name, m.id]));

  const modelUpserts = rows.map(r => {
    const makeId = makeMap.get(normalizeVehicleKey(r.make));
    if (!makeId) throw new Error(`Make ID not found for ${r.make}`);
    return {
      make_id: makeId,
      name: r.model,
      normalized_name: normalizeVehicleKey(r.model),
      is_active: true
    };
  });

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