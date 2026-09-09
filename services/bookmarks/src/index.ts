import 'dotenv/config';

import { createApp } from './app.js';
import { env } from './config/env.js';
import {
  connectDatabase,
  disconnectDatabase,
} from './database/client.js';

// Starting a single prisma entry point
await connectDatabase();

const app = createApp();

// Starting server with listening from all ip
const server = app.listen(
  env.PORT,
  '0.0.0.0',
  () => {
    console.log(
      `Bookmarks service listening on port ${env.PORT}`
    );
  }
);

// When server is closing prisma should close connecting
async function shutdown() {
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

// Cases when server is closing
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
