import type { DbClient } from '../database/types.js';

export class TagRepository {
  ensureForUser(
    db: DbClient,
    userId: string,
    tagNames: string[]
  ) {
    if (tagNames.length === 0) {
      return [];
    }

    return Promise.all(
      tagNames.map((tagName) =>
        db.tag.upsert({
          where: {
            userId_name: {
              userId,
              name: tagName,
            },
          },
          create: {
            userId,
            name: tagName,
          },
          update: {},
        })
      )
    );
  }
}
