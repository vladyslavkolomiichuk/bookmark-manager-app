import { Router } from 'express';
import type { BookmarkController } from '../controllers/BookmarkController.js';
import { validateQuery } from '../middleware/validate-request.js';
import { BookmarkListQuerySchema } from '@bookmark-manager/contracts';
import { verifyInternalUserJwt } from '../middleware/verify-internal-user-jwt.js';

export function createBookmarkRouter(
  controller: BookmarkController
): Router {
  const router = Router();

  router.get(
    '/',
    verifyInternalUserJwt,
    validateQuery(BookmarkListQuerySchema),
    controller.list.bind(controller)
  );

  return router;
}
