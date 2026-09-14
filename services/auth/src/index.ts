import 'dotenv/config';

import { createApp } from './app.js';
import { env } from './config/env.js';
import {
  connectDatabase,
  disconnectDatabase,
} from './database/client.js';

await connectDatabase();

const app = createApp();

const server = app.listen(
  env.PORT,
  '0.0.0.0',
  () => {
    console.log(
      `Auth service listening on port ${env.PORT}`
    );
  }
);

async function shutdown() {
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
