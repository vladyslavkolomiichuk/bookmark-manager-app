import 'dotenv/config';

import { createApp } from './app.js';
import { env } from './config/env.js';
import {
  connectDatabase,
  disconnectDatabase,
  prisma,
} from './database/client.js';
import { BookmarkRepository } from './repositories/BookmarkRepository.js';
import { TagRepository } from './repositories/TagRepository.js';
import { BookmarkService } from './services/BookmarkService.js';
import { BookmarkController } from './controllers/BookmarkController.js';
import { createBookmarkRouter } from './routes/bookmark.routes.js';

// Starting a single prisma entry point
await connectDatabase();

const bookmarkRepository =
  new BookmarkRepository();
const tagRepository = new TagRepository();

const bookmarkService = new BookmarkService(
  prisma,
  bookmarkRepository,
  tagRepository
);

const bookmarkController = new BookmarkController(
  bookmarkService
);

const bookmarkRouter = createBookmarkRouter(
  bookmarkController
);

const app = createApp(bookmarkRouter);

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
