/**
 * Weekly ingest of ASTRA TARGA type approvals (Typengenehmigungen) into
 * Supabase Postgres. Runs in GitHub Actions (not Vercel).
 *
 * Env:
 *   TARGA_URL     source file (default: TG-Automobil.txt, ~300 MB)
 *   DATABASE_URL  Postgres connection string (Supabase). Optional — without
 *                 it the script always runs as a dry run.
 *   DRY_RUN       "1"/"true": download, decode, parse, report; write nothing.
 *
 * Flow: HEAD request first and skip when Last-Modified matches the previous
 * successful run; otherwise stream-download (windows-1252 → utf-8 on the
 * fly), stream-parse the TSV, batch-insert into a staging table and swap the
 * live table in one transaction. Memory stays flat throughout.
 *
 * Source: Bundesamt für Strassen ASTRA – TARGA Typengenehmigungen (OGD).
 */
import { Client } from "pg";
import { parseTargaStream, TgRecord } from "./targa-parser";

const DEFAULT_TARGA_URL =
  "https://opendata.astra.admin.ch/ivzod/2000-Typengenehmigungen_TG_TARGA/2200-Basisdaten_TG_ab_1995/TG-Automobil.txt";

const TARGA_URL = process.env.TARGA_URL || DEFAULT_TARGA_URL;
const DATABASE_URL = process.env.DATABASE_URL || "";
const DRY_RUN =
  !DATABASE_URL || ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

const BATCH_SIZE = 1000;
const STAGING_TABLE = "tg_vehicle_types_staging";

// Supabase's direct-connection host (db.<ref>.supabase.co) is IPv6-only, and
// GitHub Actions runners have no IPv6 — connecting from CI fails with
// ENETUNREACH. When DATABASE_URL points at the direct host, fall back to the
// IPv4 session poolers (same credentials, username becomes postgres.<ref>).
const SUPABASE_DIRECT_HOST = /^db\.([a-z0-9]+)\.supabase\.co$/;
const SUPABASE_REGION = process.env.SUPABASE_REGION || "eu-central-2";

function connectionCandidates(databaseUrl: string): string[] {
  const candidates = [databaseUrl];
  try {
    const url = new URL(databaseUrl);
    const match = url.hostname.match(SUPABASE_DIRECT_HOST);
    if (match) {
      for (const cluster of [`aws-1-${SUPABASE_REGION}`, `aws-0-${SUPABASE_REGION}`]) {
        const alt = new URL(databaseUrl);
        alt.hostname = `${cluster}.pooler.supabase.com`;
        alt.port = "5432";
        alt.username = `postgres.${match[1]}`;
        candidates.push(alt.toString());
      }
    }
  } catch {
    /* not URL-shaped — let pg try it verbatim */
  }
  return candidates;
}

async function connectClient(databaseUrl: string): Promise<Client> {
  let lastError: unknown;
  for (const candidate of connectionCandidates(databaseUrl)) {
    let host = "";
    try {
      host = new URL(candidate).hostname;
    } catch {
      /* keep host empty for logging */
    }
    const client = new Client({
      connectionString: candidate,
      // Supabase certs are signed by Supabase's own CA.
      ssl: host.endsWith(".supabase.co") || host.endsWith(".supabase.com")
        ? { rejectUnauthorized: false }
        : undefined,
    });
    try {
      await client.connect();
      console.log(`  db host: ${host} (connected)`);
      return client;
    } catch (err) {
      lastError = err;
      await client.end().catch(() => {});
      console.log(`  db host: ${host} failed: ${(err as Error).message}`);
    }
  }
  throw lastError;
}

const DATA_COLUMNS = [
  "tg_nr",
  "variante",
  "marke",
  "typ",
  "fahrzeugart",
  "karosserieform",
  "karosserieform_code",
  "treibstoff",
  "hubraum_ccm",
  "leistung_kw",
  "getriebe",
  "motor_marke",
  "motor_typ",
  "vmax_kmh",
  "tg_erteilt",
  "raw",
  "source_updated_at",
] as const;

function recordToRow(record: TgRecord, sourceUpdatedAt: string | null): unknown[] {
  return [
    record.tg_nr,
    record.variante,
    record.marke,
    record.typ,
    record.fahrzeugart,
    record.karosserieform,
    record.karosserieform_code,
    record.treibstoff,
    record.hubraum_ccm,
    record.leistung_kw,
    record.getriebe,
    record.motor_marke,
    record.motor_typ,
    record.vmax_kmh,
    record.tg_erteilt,
    JSON.stringify(record.raw),
    sourceUpdatedAt,
  ];
}

async function insertBatch(client: Client, rows: unknown[][]): Promise<void> {
  if (rows.length === 0) return;
  const width = DATA_COLUMNS.length;
  const placeholders = rows
    .map(
      (_, r) =>
        `(${Array.from({ length: width }, (__, c) => `$${r * width + c + 1}`).join(",")})`
    )
    .join(",");
  await client.query(
    `insert into ${STAGING_TABLE} (${DATA_COLUMNS.join(",")}) values ${placeholders}`,
    rows.flat()
  );
}

async function decodedChunks(
  body: ReadableStream<Uint8Array>
): Promise<AsyncIterable<string>> {
  // windows-1252 is supported by Node's built-in TextDecoder (ICU).
  return body.pipeThrough(
    new TextDecoderStream("windows-1252")
  ) as unknown as AsyncIterable<string>;
}

async function main(): Promise<void> {
  console.log(`TARGA ingest starting`);
  console.log(`  url:     ${TARGA_URL}`);
  console.log(`  mode:    ${DRY_RUN ? "DRY_RUN (no writes)" : "live ingest"}`);

  const head = await fetch(TARGA_URL, { method: "HEAD" });
  if (!head.ok) {
    throw new Error(`HEAD ${TARGA_URL} failed: ${head.status} ${head.statusText}`);
  }
  const lastModified = head.headers.get("last-modified");
  const contentLength = head.headers.get("content-length");
  console.log(`  last-modified:  ${lastModified ?? "(absent)"}`);
  console.log(`  content-length: ${contentLength ?? "(absent)"} bytes`);

  let client: Client | null = null;
  let runId: number | null = null;

  if (!DRY_RUN) {
    client = await connectClient(DATABASE_URL);

    if (lastModified) {
      const prev = await client.query(
        `select source_last_modified from tg_ingest_runs
         where status = 'success' order by started_at desc limit 1`
      );
      if (prev.rows[0]?.source_last_modified === lastModified) {
        console.log(`Source unchanged since last successful run — skipping ingest.`);
        await client.end();
        return;
      }
    }

    const run = await client.query(
      `insert into tg_ingest_runs (source_last_modified) values ($1) returning id`,
      [lastModified]
    );
    runId = run.rows[0].id;

    await client.query(`drop table if exists ${STAGING_TABLE}`);
    await client.query(`
      create unlogged table ${STAGING_TABLE} (
        tg_nr text not null,
        variante text,
        marke text,
        typ text,
        fahrzeugart text,
        karosserieform text,
        karosserieform_code text,
        treibstoff text,
        hubraum_ccm integer,
        leistung_kw numeric,
        getriebe text,
        motor_marke text,
        motor_typ text,
        vmax_kmh integer,
        tg_erteilt date,
        raw jsonb not null,
        source_updated_at timestamptz
      )`);
  }

  const sourceUpdatedAt = lastModified ? new Date(lastModified).toISOString() : null;

  try {
    const res = await fetch(TARGA_URL);
    if (!res.ok || !res.body) {
      throw new Error(`GET ${TARGA_URL} failed: ${res.status} ${res.statusText}`);
    }

    const samples: TgRecord[] = [];
    let pending: unknown[][] = [];
    let inserted = 0;

    const result = await parseTargaStream(await decodedChunks(res.body), async (record) => {
      if (samples.length < 3) {
        // keep raw out of the sample log — it repeats every column
        samples.push({ ...record, raw: {} });
      }
      if (client) {
        pending.push(recordToRow(record, sourceUpdatedAt));
        if (pending.length >= BATCH_SIZE) {
          await insertBatch(client, pending);
          inserted += pending.length;
          pending = [];
          if (inserted % 100000 === 0) console.log(`  ...${inserted} rows staged`);
        }
      }
    });

    if (client) {
      await insertBatch(client, pending);
      inserted += pending.length;
    }

    console.log(`\nDetected header columns (${result.headers.length}):`);
    console.log(result.headers.map((h) => `  - ${JSON.stringify(h)}`).join("\n"));
    console.log(`\nResolved column mapping:`);
    console.log(JSON.stringify(result.mapping, null, 2));
    console.log(`vmax_kmh = max of: ${JSON.stringify(result.vmaxColumns)}`);
    console.log(`\nParsed rows: ${result.rowCount} (skipped without TG-Nr: ${result.skipped})`);
    console.log(`\nSample parsed records (raw omitted):`);
    console.log(JSON.stringify(samples, null, 2));

    if (result.rowCount === 0) {
      throw new Error("Parsed 0 rows — refusing to continue");
    }

    if (client && runId !== null) {
      console.log(`\nSwapping ${inserted} staged rows into tg_vehicle_types...`);
      await client.query("begin");
      await client.query("delete from tg_vehicle_types");
      await client.query(`
        insert into tg_vehicle_types (${DATA_COLUMNS.join(",")})
        select ${DATA_COLUMNS.join(",")} from ${STAGING_TABLE}`);
      await client.query("commit");
      await client.query(`drop table if exists ${STAGING_TABLE}`);
      await client.query(
        `update tg_ingest_runs
         set finished_at = now(), rows = $1, status = 'success'
         where id = $2`,
        [inserted, runId]
      );
      console.log(`Ingest complete: ${inserted} rows live.`);
    } else {
      console.log(`\nDRY_RUN complete — nothing written.`);
    }
  } catch (err) {
    if (client && runId !== null) {
      try {
        await client.query("rollback");
      } catch {
        /* no open transaction */
      }
      await client.query(
        `update tg_ingest_runs set finished_at = now(), status = 'failed' where id = $1`,
        [runId]
      );
    }
    throw err;
  } finally {
    if (client) await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
