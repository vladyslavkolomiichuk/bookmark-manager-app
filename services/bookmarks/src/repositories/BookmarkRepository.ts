import type { DbClient } from '../database/types.js';
import type { FieldSource } from '../generate/prisma/enums.js';

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

export class BookmarkRepository {
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
}
