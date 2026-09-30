import { createApp } from './app.js';
import { config } from './config.js';
import { connectDb } from './db.js';
import { seed } from './seed.js';

function databaseTarget(uri) {
  return String(uri).replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');
}

const app = createApp();

try {
  await connectDb();
  await seed();
} catch (err) {
  console.error('Could not start the API.');
  console.error(err && err.message ? err.message : err);
  console.error(`Database: ${databaseTarget(config.mongoUri)}`);
  console.error('Start MongoDB, confirm server/.env, then run npm start again.');
  process.exit(1);
}

app.listen(config.port, () => {
  console.log(`Emirates Properties API on ${config.publicApiUrl}`);
});
