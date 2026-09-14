import type { Request, Response } from 'express';
import type { BookmarkService } from '../services/BookmarkService.js';
import type { BookmarkListQuery } from '@bookmark-manager/contracts';
import { toBookmarkListResponse } from '../mappers/bookmark-list-response.mapper.js';

export class BookmarkController {
  constructor(
    private readonly bookmarkService: BookmarkService
  ) {}

  async list(req: Request, res: Response) {
    const userId = req.auth!.userId;
    const query = req.validated!
      .query as BookmarkListQuery;

    const list =
      await this.bookmarkService.listForUser(
        userId,
        query
      );

    const response = toBookmarkListResponse(list);

    res.status(200).json(response);
  }
}
