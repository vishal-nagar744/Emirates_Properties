/**
 * Rebuilds the orders collection without the legacy embedded `image` field.
 *
 * Why this exists: dropping and recreating the collection is the reliable way to
 * return the duplicated image bytes to Atlas. Removing the field in place (`$unset`)
 * reduces the logical data size, but WiredTiger does not always shrink the data file,
 * so Atlas can keep reporting the cluster as full.
 *
 * Safe by default: without --confirm it only reports what it would do.
 * With --confirm it:
 *   1. reads every order without the `image` field,
 *   2. writes an EJSON backup next to this script,
 *   3. drops and recreates the orders collection,
 *   4. restores every order and recreates the indexes.
 *
 * Run while the API is stopped:
 *   npm run rebuild:orders -- --confirm
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EJSON } from 'bson';
import mongoose from 'mongoose';
import { connectDb } from '../src/db.js';
import { config } from '../src/config.js';
import { Order } from '../src/modules/orders/model.js';

const BATCH = 500;
const CONFIRM = process.argv.includes('--confirm');

function safeUri(uri) {
  return String(uri).replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');
}

async function main() {
  console.log(`Connecting to ${safeUri(config.mongoUri)}`);
  await connectDb();

  const total = await Order.estimatedDocumentCount();
  const withImages = await Order.countDocuments({ 'image.data': { $exists: true } });
  console.log(`Orders: ${total}`);
  console.log(`Orders carrying embedded images: ${withImages}`);

  if (!CONFIRM) {
    console.log('\nDry run only. Re-run with --confirm to rebuild the collection.');
    console.log('Example: npm run rebuild:orders -- --confirm');
    return;
  }

  const rows = await Order.find({}).select('-image').lean();
  if (rows.length !== total) {
    throw new Error(`Refusing to rebuild: read ${rows.length} of ${total} orders.`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(path.dirname(fileURLToPath(import.meta.url)), `orders-backup-${stamp}.json`);
  fs.writeFileSync(backupPath, EJSON.stringify(rows, null, 2));
  console.log(`Backup written to ${backupPath}`);

  await Order.collection.drop().catch((err) => {
    if (err && err.codeName !== 'NamespaceNotFound') throw err;
  });
  console.log('Dropped orders collection.');

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await Order.collection.insertMany(batch, { ordered: false });
    console.log(`Restored ${Math.min(i + BATCH, rows.length)}/${rows.length} orders`);
  }

  await Order.createIndexes();
  const after = await Order.estimatedDocumentCount();
  console.log(`Done. Orders in collection: ${after}`);
  if (after !== total) {
    throw new Error(`Restored ${after} of ${total} orders. Backup: ${backupPath}`);
  }
  console.log(`Indexes recreated. Backup kept at ${backupPath}`);
}

main()
  .catch((err) => {
    console.error('Rebuild failed:', err && err.message ? err.message : err);
    if (err && /quota|space|storage|writes are blocked/i.test(String(err.message))) {
      console.error('Atlas is still blocking writes. Free a little space or temporarily upgrade the tier, then retry.');
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
