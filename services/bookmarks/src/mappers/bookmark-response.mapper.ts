import {
  BookmarkResponseSchema,
  type BookmarkResponse,
} from '@bookmark-manager/contracts';
import type {
  BookmarkDetail,
  BookmarkRepository,
} from '../repositories/BookmarkRepository.js';

export const toBookmarkResponse = (
  bookmark: BookmarkDetail
): BookmarkResponse => {
  return BookmarkResponseSchema.parse({
    id: bookmark.id,
    title: bookmark.title,
    description: bookmark.description,
    faviconUrl: null, // TEMPORARY
    url: bookmark.url,
    viewCount: bookmark.viewCount,
    lastVisitedAt:
      bookmark.lastVisitedAt?.toISOString() ??
      null,
    createdAt: bookmark.createdAt.toISOString(),
    updatedAt: bookmark.updatedAt.toISOString(),
    pinned: bookmark.pinned,
    archivedAt:
      bookmark.archivedAt?.toISOString() ?? null,
    metadataStatus: bookmark.metadataStatus,

    tags: bookmark.tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
    })),
  });
};
