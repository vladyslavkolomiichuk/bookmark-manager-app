import type {
  BookmarkListQuery,
  CreateBookmark,
} from '@bookmark-manager/contracts';
import {
  BookmarkNotFoundError,
  DuplicateBookmarkUrlError,
} from '../domain/errors.js';
import {
  Prisma,
  type PrismaClient,
} from '../generate/prisma/client.js';
import {
  BookmarkRepository,
  type BookmarkDetail,
  type TagRankedCandidate,
} from '../repositories/BookmarkRepository.js';
import type { TagRepository } from '../repositories/TagRepository.js';
import { normalizeBookmarkUrl } from '../lib/url-normalization.js';
import { deriveField } from '../domain/derive-bookmark-field.js';
import {
  createBookmarkListFilterFingerprint,
  decodeBookmarkListCursor,
  encodeBookmarkListCursor,
  isCursorWithoutTags,
  isTagRankedCursor,
  type BookmarkListCursorWithoutTags,
  type BookmarkListFilterScope,
  type TagRankedBookmarkListCursor,
} from '../lib/bookmark-list-cursor.js';
import { normalizeSearch } from '../lib/search-normalization.js';
import { normalizeTags } from '../lib/tags-normalization.js';
import { isNonEmptyArray } from '../lib/bookmark-list-filter.js';

export type BookmarkListResult = {
  page: BookmarkDetail[];
  nextCursor: string | null;
};

export class BookmarkService {
  // Adding all repositories and single db connection
  constructor(
    private readonly prisma: PrismaClient,
    private readonly bookmarkRepository: BookmarkRepository,
    private readonly tagRepository: TagRepository
  ) {}

  // Creating next cursor based on last bookmark and current scope
  // without matchCount

  private buildNoTagNextCursor(
    bookmark: BookmarkDetail | undefined,
    scope: BookmarkListFilterScope
  ): string | null {
    if (!bookmark) {
      return null;
    }

    // Getting a finger print of a scope
    const fingerprint =
      createBookmarkListFilterFingerprint(scope);

    let rawNextCursor: BookmarkListCursorWithoutTags;

    // By sort deciding a cursor shape
    switch (scope.sort) {
      case 'recently-added':
        rawNextCursor = {
          version: 1,
          sort: 'recently-added',
          id: bookmark.id,
          fingerprint,
          matchCount: null,
          createdAt:
            bookmark.createdAt.toISOString(),
        };
        break;

      case 'recently-visited':
        rawNextCursor = {
          version: 1,
          sort: 'recently-visited',
          id: bookmark.id,
          fingerprint,
          matchCount: null,
          lastVisitedAt:
            bookmark.lastVisitedAt?.toISOString() ??
            null,
        };
        break;

      case 'most-visited':
        rawNextCursor = {
          version: 1,
          sort: 'most-visited',
          id: bookmark.id,
          fingerprint,
          matchCount: null,
          viewCount: bookmark.viewCount,
        };
        break;
    }

    return encodeBookmarkListCursor(
      rawNextCursor
    );
  }

  // Creating next cursor based on last candidate and current scope
  // with matchCount
  private buildTagRankedNextCursor(
    candidate: TagRankedCandidate | undefined,
    scope: BookmarkListFilterScope
  ): string | null {
    if (!candidate) {
      return null;
    }

    const fingerprint =
      createBookmarkListFilterFingerprint(scope);

    let rawNextCursor: TagRankedBookmarkListCursor;

    switch (scope.sort) {
      case 'recently-added':
        rawNextCursor = {
          version: 1,
          sort: 'recently-added',
          id: candidate.id,
          fingerprint,
          matchCount: candidate.matchCount,
          createdAt:
            candidate.createdAt.toISOString(),
        };
        break;

      case 'recently-visited':
        rawNextCursor = {
          version: 1,
          sort: 'recently-visited',
          id: candidate.id,
          fingerprint,
          matchCount: candidate.matchCount,
          lastVisitedAt:
            candidate.lastVisitedAt?.toISOString() ??
            null,
        };
        break;

      case 'most-visited':
        rawNextCursor = {
          version: 1,
          sort: 'most-visited',
          id: candidate.id,
          fingerprint,
          matchCount: candidate.matchCount,
          viewCount: candidate.viewCount,
        };
        break;
    }

    return encodeBookmarkListCursor(
      rawNextCursor
    );
  }

  // Getting bookmark by its id and user id for individual work with bookmark
  async getByIdForUser(
    bookmarkId: string,
    userId: string
  ) {
    const bookmark =
      await this.bookmarkRepository.findDetailByIdForUser(
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

    // TEMPORARY
    const url = normalizedUrl;

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // Getting existing bookmark by url
          const existingBookmark =
            await this.bookmarkRepository.findByNormalizedUrlForUser(
              tx,
              normalizedUrl,
              userId
            );

          // Checking if it exist
          if (existingBookmark) {
            throw new DuplicateBookmarkUrlError();
          }

          // Ensuring tags are in the db
          const tags =
            await this.tagRepository.ensureForUser(
              tx,
              userId,
              bookmark.tags
            );

          // Getting tags ids
          const tagIds = tags.map(
            (tag) => tag.id
          );

          // Deriving fields
          const title = deriveField(
            bookmark.title
          );
          const description = deriveField(
            bookmark.description
          );

          // Creating bookmark
          return await this.bookmarkRepository.create(
            tx,
            {
              userId,
              description: description.value,
              descriptionSource:
                description.source,
              normalizedUrl,
              tagIds,
              title: title.value,
              titleSource: title.source,
              url,
            }
          );
        }
      );
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target;

        if (
          Array.isArray(target) &&
          target.includes('userId') &&
          target.includes('normalizedUrl')
        ) {
          throw new DuplicateBookmarkUrlError();
        }
      }

      throw error;
    }
  }

  async listForUser(
    userId: string,
    query: BookmarkListQuery
  ): Promise<BookmarkListResult> {
    // Creating a canonic scope
    const scope: BookmarkListFilterScope = {
      userId,
      status: query.status,
      pinned: query.pinned ?? null,
      search: query.search
        ? normalizeSearch(query.search)
        : null,
      tags: query.tags
        ? normalizeTags(query.tags)
        : [],
      sort: query.sort,
    };

    // Getting a current cursor
    const cursor = query.cursor
      ? decodeBookmarkListCursor(
          query.cursor,
          scope
        )
      : null;

    // If we dont have a tags in scope and cursor
    if (
      scope.tags.length === 0 &&
      (cursor === null ||
        (cursor && isCursorWithoutTags(cursor)))
    ) {
      // Getting a bookmarks
      const bookmarkList =
        await this.bookmarkRepository.findPageWithoutTagFilter(
          this.prisma,
          { scope, cursor, limit: query.limit }
        );

      // Checking if we have bookmarks for more then 1 page
      const hasNextPage =
        bookmarkList.length > query.limit;

      // Getting a bookmarks for 1 page
      const page = bookmarkList.slice(
        0,
        query.limit
      );

      // If we have more then 1 page create a cursor
      const nextCursor = hasNextPage
        ? this.buildNoTagNextCursor(
            page.at(-1),
            scope
          )
        : null;

      return {
        page,
        nextCursor,
      };
    }

    // If cursor and scope have tags
    const tags = scope.tags;
    if (
      isNonEmptyArray(tags) &&
      (cursor === null ||
        (cursor && isTagRankedCursor(cursor)))
    ) {
      return await this.prisma.$transaction(
        async (tx) => {
          // Getting bookmarks without details in correct order
          const candidates =
            await this.bookmarkRepository.findTagRankedCandidates(
              tx,
              {
                scope: {
                  ...scope,
                  tags,
                },
                cursor,
                limit: query.limit,
              }
            );

          //  Checking if pages more then 1
          const hasNextPage =
            candidates.length > query.limit;

          // Getting 1 page candidates
          const pageCandidates = candidates.slice(
            0,
            query.limit
          );

          const pageCandidateIds =
            pageCandidates.map(
              (candidate) => candidate.id
            );

          // Getting details of our candidates
          const details =
            await this.bookmarkRepository.findDetailsByIdsForUser(
              tx,
              userId,
              pageCandidateIds
            );

          // Matching details and their ids
          const detailsById = new Map(
            details.map((bookmark) => [
              bookmark.id,
              bookmark,
            ])
          );

          // Depends on candidates order creating detailed bookmarks list
          const page = pageCandidates.map(
            (candidate) => {
              const bookmark = detailsById.get(
                candidate.id
              );

              if (!bookmark) {
                throw new Error(
                  `Bookmark detail missing for candidate ${candidate.id}`
                );
              }

              return bookmark;
            }
          );

          // Creating a cursor if have more then 1 page
          const nextCursor = hasNextPage
            ? this.buildTagRankedNextCursor(
                pageCandidates.at(-1),
                scope
              )
            : null;

          return {
            page,
            nextCursor,
          };
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .RepeatableRead,
        }
      );
    }

    throw new Error(
      'Unreachable bookmark list state.'
    );
  }
}
