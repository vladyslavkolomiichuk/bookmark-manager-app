import {
  BookmarkListResponseSchema,
  type BookmarkListResponse,
} from '@bookmark-manager/contracts';
import type { BookmarkListResult } from '../services/BookmarkService.js';
import { toBookmarkResponse } from './bookmark-response.mapper.js';

export const toBookmarkListResponse = (
  input: BookmarkListResult
): BookmarkListResponse => {
  const { page, nextCursor } = input;

  const items = page.map((bookmark) =>
    toBookmarkResponse(bookmark)
  );

  return BookmarkListResponseSchema.parse({
    items,
    nextCursor,
  });
};
