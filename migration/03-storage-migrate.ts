#!/usr/bin/env node
/**
 * Copies every storage bucket and object from SOURCE to TARGET.
 *
 * Uploading through the Storage API (rather than restoring storage.objects
 * rows from the SQL dump) is deliberate: the API writes the object row and the
 * underlying bytes as one operation, so metadata can never end up pointing at
 * a file that was not copied.
 *
 * Idempotent — re-running skips objects already present on the target with a
 * matching size, so an interrupted run can simply be repeated.
 *
 * Usage: node --env-file=.env.migration 03-storage-migrate.ts [--dry-run]
 */
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

type BucketConfig = {
  id: string;
  public: boolean;
  file_size_limit: number | null;
  allowed_mime_types: string[] | null;
};

const DRY_RUN = process.argv.includes("--dry-run");
const DUMP_DIR = process.env.DUMP_DIR ?? "./dump";

const required = [
  "SOURCE_URL",
  "SOURCE_SERVICE_ROLE_KEY",
  "TARGET_URL",
  "TARGET_SERVICE_ROLE_KEY",
] as const;

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing env: ${missing.join(", ")}`);
  console.error("Run with: node --env-file=.env.migration 03-storage-migrate.ts");
  process.exit(1);
}

const source = createClient(
  process.env.SOURCE_URL!,
  process.env.SOURCE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
const target = createClient(
  process.env.TARGET_URL!,
  process.env.TARGET_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

/** Storage list() is per-prefix, so directories have to be walked explicitly. */
async function listAllObjects(
  client: ReturnType<typeof createClient>,
  bucket: string,
  prefix = "",
): Promise<{ path: string; size: number }[]> {
  const found: { path: string; size: number }[] = [];
  const pageSize = 100;
  let offset = 0;

  for (;;) {
    const { data, error } = await client.storage
      .from(bucket)
      .list(prefix, { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });

    if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      // A null id marks a synthetic folder row rather than a real object.
      if (entry.id === null) {
        found.push(...(await listAllObjects(client, bucket, path)));
      } else {
        found.push({ path, size: entry.metadata?.size ?? 0 });
      }
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return found;
}

async function ensureBuckets(): Promise<BucketConfig[]> {
  const raw = await readFile(`${DUMP_DIR}/buckets.json`, "utf8");
  const buckets: BucketConfig[] = JSON.parse(raw.trim());

  console.log(`\n── BUCKETS (${buckets.length}) ───────────────────────`);
  for (const bucket of buckets) {
    if (DRY_RUN) {
      console.log(`  [dry-run] would create ${bucket.id} (public=${bucket.public})`);
      continue;
    }
    const { error } = await target.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: bucket.file_size_limit,
      allowedMimeTypes: bucket.allowed_mime_types,
    });
    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`createBucket ${bucket.id}: ${error.message}`);
    }
    console.log(
      `  ✓ ${bucket.id.padEnd(18)} public=${String(bucket.public).padEnd(5)}` +
        ` limit=${bucket.file_size_limit ?? "none"}${error ? " (existed)" : ""}`,
    );
  }
  return buckets;
}

async function copyBucket(bucket: string): Promise<{ copied: number; skipped: number; bytes: number }> {
  const objects = await listAllObjects(source, bucket);
  const existing = new Map(
    (await listAllObjects(target, bucket).catch(() => [])).map((o) => [o.path, o.size]),
  );

  let copied = 0;
  let skipped = 0;
  let bytes = 0;

  console.log(`\n── ${bucket} (${objects.length} objects) ───────────────────────`);
  for (const object of objects) {
    if (existing.get(object.path) === object.size && object.size > 0) {
      skipped++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`  [dry-run] ${object.path} (${object.size} B)`);
      copied++;
      continue;
    }

    const { data, error: dlError } = await source.storage.from(bucket).download(object.path);
    if (dlError || !data) throw new Error(`download ${bucket}/${object.path}: ${dlError?.message}`);

    const body = Buffer.from(await data.arrayBuffer());
    const { error: upError } = await target.storage.from(bucket).upload(object.path, body, {
      contentType: data.type || "application/octet-stream",
      upsert: true,
    });
    if (upError) throw new Error(`upload ${bucket}/${object.path}: ${upError.message}`);

    copied++;
    bytes += body.byteLength;
    console.log(`  ✓ ${object.path} (${(body.byteLength / 1024).toFixed(1)} KB)`);
  }
  if (skipped > 0) console.log(`  · ${skipped} already present, skipped`);
  return { copied, skipped, bytes };
}

const buckets = await ensureBuckets();

let totalCopied = 0;
let totalSkipped = 0;
let totalBytes = 0;
for (const bucket of buckets) {
  const result = await copyBucket(bucket.id);
  totalCopied += result.copied;
  totalSkipped += result.skipped;
  totalBytes += result.bytes;
}

console.log(`\n── SUMMARY ───────────────────────`);
console.log(`  buckets: ${buckets.length}`);
console.log(`  copied:  ${totalCopied} objects (${(totalBytes / 1024 / 1024).toFixed(1)} MB)`);
console.log(`  skipped: ${totalSkipped} already present`);
if (DRY_RUN) console.log(`\n  DRY RUN — nothing was written.`);
