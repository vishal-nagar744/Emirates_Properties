import { createApp } from './app.js';
import { config } from './config.js';
import { connectDb } from './db.js';
import { seed } from './seed.js';

const app = createApp();

await connectDb();
await seed();

app.listen(config.port, () => {
  console.log(`Emirates Properties API on http://127.0.0.1:${config.port}`);
});
