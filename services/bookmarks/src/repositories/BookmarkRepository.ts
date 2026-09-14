import type { DbClient } from '../database/types.js';
import { Prisma } from '../generate/prisma/client.js';
import type { FieldSource } from '../generate/prisma/enums.js';
import type {
  BookmarkListCursorWithoutTags,
  BookmarkListFilterScope,
  TagRankedBookmarkListCursor,
} from '../lib/bookmark-list-cursor.js';
import type { NonEmptyArray } from '../lib/bookmark-list-filter.js';

type CreateBookmarkData = {
  userId: string;
  url: string;
  normalizedUrl: string;
  title: string;
  titleSource: FieldSource;
  description: string;
  descriptionSource: FieldSource;
  tagIds: string[];
};

type FindPageWithoutTagFilterInput = {
  scope: Omit<BookmarkListFilterScope, 'tags'>;
  cursor: BookmarkListCursorWithoutTags | null;
  limit: number;
};

type FindPageTagRankedFilterInput = {
  scope: BookmarkListFilterScope & {
    tags: NonEmptyArray<string>;
  };
  cursor: TagRankedBookmarkListCursor | null;
  limit: number;
};

export type TagRankedCandidate = {
  id: string;
  matchCount: number;
  createdAt: Date;
  lastVisitedAt: Date | null;
  viewCount: number;
};

export type BookmarkDetail =
  Prisma.BookmarkGetPayload<{
    select: typeof detailBookmarkSelect;
  }>;

const detailBookmarkSelect = {
  id: true,
  title: true,
  description: true,
  url: true,
  viewCount: true,
  lastVisitedAt: true,
  createdAt: true,
  updatedAt: true,
  pinned: true,
  archivedAt: true,
  metadataStatus: true,

  tags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.BookmarkSelect;

export class BookmarkRepository {
  // Creating a WHERE for Prisma by current scope
  private getBaseWhere(
    scope:
      | Omit<BookmarkListFilterScope, 'tags'>
      | BookmarkListFilterScope
  ): Prisma.BookmarkWhereInput {
    const baseWhere: Prisma.BookmarkWhereInput = {
      userId: scope.userId,
    };

    if (scope.status === 'active') {
      baseWhere.archivedAt = null;
    }

    if (scope.status === 'archived') {
      baseWhere.archivedAt = {
        not: null,
      };
    }

    if (scope.pinned !== null) {
      baseWhere.pinned = scope.pinned;
    }

    if (scope.search !== null) {
      baseWhere.title = {
        contains: scope.search,
        mode: 'insensitive',
      };
    }

    return baseWhere;
  }

  // Based on sort we creating a WHERE for Prisma when cursor existing
  private getNoTagCursorWhere(
    cursor: BookmarkListCursorWithoutTags | null
  ): Prisma.BookmarkWhereInput | null {
    if (!cursor) {
      return null;
    }

    switch (cursor.sort) {
      case 'recently-added': {
        return {
          OR: [
            {
              createdAt: {
                lt: new Date(cursor.createdAt),
              },
            },
            {
              createdAt: new Date(
                cursor.createdAt
              ),
              id: {
                lt: cursor.id,
              },
            },
          ],
        };
      }
      case 'most-visited': {
        return {
          OR: [
            {
              viewCount: {
                lt: cursor.viewCount,
              },
            },
            {
              viewCount: cursor.viewCount,
              id: {
                lt: cursor.id,
              },
            },
          ],
        };
      }
      case 'recently-visited':
        if (cursor.lastVisitedAt === null) {
          return {
            lastVisitedAt: null,
            id: {
              lt: cursor.id,
            },
          };
        }

        return {
          OR: [
            {
              lastVisitedAt: {
                lt: new Date(
                  cursor.lastVisitedAt
                ),
              },
            },
            {
              lastVisitedAt: new Date(
                cursor.lastVisitedAt
              ),
              id: {
                lt: cursor.id,
              },
            },
            {
              lastVisitedAt: null,
            },
          ],
        };
    }
  }

  // Creating a WHERE when cursor is present and with matchCount included
  private getTagRankedCursorWhere(
    cursor: TagRankedBookmarkListCursor | null
  ): Prisma.Sql | null {
    if (!cursor) {
      return null;
    }

    switch (cursor.sort) {
      case 'recently-added': {
        return Prisma.sql`
          AND (
             "matchCount" < ${cursor.matchCount}

            OR (
              "matchCount" = ${cursor.matchCount}
              AND "createdAt" < ${new Date(cursor.createdAt)}
            )

            OR (
              "matchCount" = ${cursor.matchCount}
              AND "createdAt" = ${new Date(cursor.createdAt)}
              AND id < ${cursor.id}::uuid
            )
          )
        `;
      }
      case 'most-visited': {
        return Prisma.sql`
          AND (
            "matchCount" < ${cursor.matchCount}

            OR (
              "matchCount" = ${cursor.matchCount}
              AND "viewCount" < ${cursor.viewCount}
            )

            OR (
              "matchCount" = ${cursor.matchCount}
              AND "viewCount" = ${cursor.viewCount}
              AND id < ${cursor.id}::uuid
            )
          )
        `;
      }
      case 'recently-visited': {
        if (cursor.lastVisitedAt === null) {
          return Prisma.sql`
            AND (
              "matchCount" < ${cursor.matchCount}

              OR (
                "matchCount" = ${cursor.matchCount}
                AND "lastVisitedAt" IS NULL
                AND id < ${cursor.id}::uuid
              )
            )
          `;
        }
        return Prisma.sql`
          AND (
            "matchCount" < ${cursor.matchCount}

            OR (
              "matchCount" = ${cursor.matchCount}
              AND (
                "lastVisitedAt" < ${new Date(cursor.lastVisitedAt)}

                OR "lastVisitedAt" IS NULL
              )
            )

            OR (
              "matchCount" = ${cursor.matchCount}
              AND "lastVisitedAt" = ${new Date(cursor.lastVisitedAt)}
              AND id < ${cursor.id}::uuid
            )
          )
        `;
      }
    }
  }

  // Getting a ORDER BY current sort
  private getOrderBySort(
    sort: BookmarkListFilterScope['sort']
  ): Prisma.BookmarkOrderByWithRelationInput[] {
    switch (sort) {
      case 'recently-added': {
        return [
          { createdAt: 'desc' },
          { id: 'desc' },
        ];
      }
      case 'most-visited': {
        return [
          { viewCount: 'desc' },
          { id: 'desc' },
        ];
      }
      case 'recently-visited': {
        return [
          {
            lastVisitedAt: {
              sort: 'desc',
              nulls: 'last',
            },
          },
          { id: 'desc' },
        ];
      }
    }
  }

  // Getting a ORDER BY but with matchCount option
  private getTagRankedOrderBySort(
    sort: BookmarkListFilterScope['sort']
  ): Prisma.Sql {
    switch (sort) {
      case 'recently-added': {
        return Prisma.sql`
          ORDER BY
            "matchCount" DESC,
            "createdAt" DESC,
            id DESC
        `;
      }
      case 'most-visited': {
        return Prisma.sql`
          ORDER BY
            "matchCount" DESC,
            "viewCount" DESC,
            id DESC
        `;
      }
      case 'recently-visited': {
        return Prisma.sql`
          ORDER BY
            "matchCount" DESC,
            "lastVisitedAt" DESC NULLS LAST,
            id DESC
        `;
      }
    }
  }

  private escapeLikePattern(
    value: string
  ): string {
    return value
      .replaceAll('\\', '\\\\')
      .replaceAll('%', '\\%')
      .replaceAll('_', '\\_');
  }

  findByIdForUser(
    db: DbClient,
    bookmarkId: string,
    userId: string
  ) {
    return db.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
      },
    });
  }

  findDetailByIdForUser(
    db: DbClient,
    bookmarkId: string,
    userId: string
  ) {
    return db.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
      },

      select: detailBookmarkSelect,
    });
  }

  findDetailsByIdsForUser(
    db: DbClient,
    userId: string,
    bookmarkIds: string[]
  ) {
    return db.bookmark.findMany({
      where: {
        userId,
        id: {
          in: bookmarkIds,
        },
      },

      select: detailBookmarkSelect,
    });
  }

  findByNormalizedUrlForUser(
    db: DbClient,
    normalizedUrl: string,
    userId: string
  ) {
    return db.bookmark.findUnique({
      where: {
        userId_normalizedUrl: {
          normalizedUrl,
          userId,
        },
      },
    });
  }

  create(db: DbClient, data: CreateBookmarkData) {
    return db.bookmark.create({
      data: {
        userId: data.userId,
        url: data.url,
        normalizedUrl: data.normalizedUrl,
        title: data.title,
        titleSource: data.titleSource,
        description: data.description,
        descriptionSource: data.descriptionSource,

        tags: {
          create: data.tagIds.map((tagId) => ({
            tagId,
          })),
        },
      },

      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  findPageWithoutTagFilter(
    db: DbClient,
    input: FindPageWithoutTagFilterInput
  ) {
    const { scope, cursor, limit } = input;

    const baseWhere = this.getBaseWhere(scope);

    const orderBy = this.getOrderBySort(
      scope.sort
    );

    const cursorWhere =
      this.getNoTagCursorWhere(cursor);

    return db.bookmark.findMany({
      where: cursorWhere
        ? {
            AND: [baseWhere, cursorWhere],
          }
        : baseWhere,
      orderBy,
      take: limit + 1,
      select: detailBookmarkSelect,
    });
  }

  async findTagRankedCandidates(
    db: DbClient,
    input: FindPageTagRankedFilterInput
  ) {
    const { scope, cursor, limit } = input;

    const tagFilter = Prisma.sql`
          AND t.name IN (${Prisma.join(scope.tags)})
        `;

    const statusFilter =
      scope.status === 'active'
        ? Prisma.sql`AND b."archivedAt" IS NULL`
        : scope.status === 'archived'
          ? Prisma.sql`AND b."archivedAt" IS NOT NULL`
          : Prisma.empty;

    const pinnedFilter =
      scope.pinned !== null
        ? Prisma.sql`AND b.pinned = ${scope.pinned}`
        : Prisma.empty;

    const searchFilter =
      scope.search !== null
        ? Prisma.sql`
            AND b.title ILIKE
              ${`%${this.escapeLikePattern(scope.search)}%`}
            ESCAPE '\'
          `
        : Prisma.empty;

    const cursorWhere =
      this.getTagRankedCursorWhere(cursor) ??
      Prisma.empty;

    const orderBy = this.getTagRankedOrderBySort(
      scope.sort
    );

    return await db.$queryRaw<
      Array<{
        id: string;
        matchCount: number;
        createdAt: Date;
        lastVisitedAt: Date | null;
        viewCount: number;
      }>
    >(Prisma.sql`
      WITH candidates AS (
        SELECT
          b.id,
          b."createdAt",
          b."lastVisitedAt",
          b."viewCount",
          COUNT(DISTINCT t.id)::int AS "matchCount"

        FROM bookmarks b

        JOIN bookmark_tags bt
          ON bt."bookmarkId" = b.id

        JOIN tags t
          ON t.id = bt."tagId"

        WHERE
          b."userId" = ${scope.userId}
          AND t."userId" = ${scope.userId}

          ${tagFilter}
          ${statusFilter}
          ${pinnedFilter}
          ${searchFilter}

        GROUP BY b.id
      )

      SELECT
        id,
        "matchCount",
        "createdAt",
        "lastVisitedAt",
        "viewCount"

      FROM candidates

      WHERE TRUE
        ${cursorWhere}

      ${orderBy}

      LIMIT ${limit + 1}
    `);
  }
}
