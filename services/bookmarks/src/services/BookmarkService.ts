import type { CreateBookmark } from '@bookmark-manager/contracts';
import {
  BookmarkNotFoundError,
  DuplicateBookmarkUrlError,
} from '../domain/errors.js';
import type { PrismaClient } from '../generate/prisma/client.js';
import { BookmarkRepository } from '../repositories/BookmarkRepository.js';
import type { TagRepository } from '../repositories/TagRepository.js';
import { normalizeBookmarkUrl } from '../lib/url-normalization.js';

export class BookmarkService {
  // Adding all repositories and single db connection
  constructor(
    private readonly prisma: PrismaClient,
    private readonly bookmarkRepository: BookmarkRepository,
    private readonly tagRepository: TagRepository
  ) {}

  // Getting bookmark by its id and user id for individual work with bookmark
  async getByIdForUser(
    bookmarkId: string,
    userId: string
  ) {
    const bookmark =
      await this.bookmarkRepository.findByIdForUser(
        this.prisma,
        bookmarkId,
        userId
      );

    if (!bookmark) {
      throw new BookmarkNotFoundError();
    }

    return bookmark;
  }

  // Creating bookmark:
  //   - normalizing url
  //   - checking for duplication
  //   - creating tags
  //   - creating bookmark with linking to tags
  async create(
    userId: string,
    bookmark: CreateBookmark
  ) {
    const normalizedUrl = normalizeBookmarkUrl(
      bookmark.url
    );

    return this.prisma.$transaction(
      async (tx) => {
        const existingBookmark =
          await this.bookmarkRepository.findByNormalizedUrlForUser(
            tx,
            normalizedUrl,
            userId
          );

        if (!existingBookmark) {
          throw new DuplicateBookmarkUrlError();
        }
      }
    );
  }
}
