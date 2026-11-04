/**
 * Frees MongoDB storage used by duplicated group images inside the orders collection.
 *
 * Older versions copied the full group image buffer into every order. Each order is
 * ~60 KB because of that, even though the image is already stored once in
 * projectgroups. This script removes the `image` sub-document from orders in batches.
 *
 * Usage:
 *   npm run cleanup:order-images
 */
import mongoose from 'mongoose';
import { connectDb } from '../src/db.js';
import { config } from '../src/config.js';
import { Order } from '../src/modules/orders/model.js';

const BATCH = 500;

function safeUri(uri) {
  return String(uri).replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');
}

async function main() {
  console.log(`Connecting to ${safeUri(config.mongoUri)}`);
  await connectDb();

  const total = await Order.countDocuments({ 'image.data': { $exists: true } });
  console.log(`Orders with embedded image data: ${total}`);
  if (!total) {
    console.log('Nothing to clean up.');
    return;
  }

  let removed = 0;
  for (;;) {
    const rows = await Order.find({ 'image.data': { $exists: true } })
      .select('_id')
      .limit(BATCH)
      .lean();
    if (!rows.length) break;
    const ids = rows.map((row) => row._id);
    const result = await Order.updateMany(
      { _id: { $in: ids } },
      { $unset: { image: '' } },
    );
    removed += result.modifiedCount;
    console.log(`Removed image data from ${removed}/${total} orders`);
  }

  console.log(`Done. Cleaned ${removed} orders.`);
}

main()
  .catch((err) => {
    console.error('Cleanup failed:', err && err.message ? err.message : err);
    if (err && /quota|space|storage|writes are blocked/i.test(String(err.message))) {
      console.error('Atlas is blocking writes because the cluster is over its storage limit.');
      console.error('Free space first (delete old orders / temporary tier upgrade), then run this again.');
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
