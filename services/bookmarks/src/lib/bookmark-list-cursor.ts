import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  MAX_CURSOR_LENGTH,
  type BookmarkSort,
  type BookmarkStatus,
} from '@bookmark-manager/contracts';
import { InvalidBookmarkListCursorError } from '../domain/errors.js';
import { normalizeTags } from './tags-normalization.js';
import { normalizeSearch } from './search-normalization.js';

const CURSOR_VERSION = 1;

// Type for set of queries what we get
export type BookmarkListFilterScope = {
  userId: string;
  status: BookmarkStatus;
  pinned: boolean | null;
  search: string | null;
  tags: string[];
  sort: BookmarkSort;
};

export type BookmarkListCursorWithoutTags =
  BookmarkListCursor & {
    matchCount: null;
  };

export type TagRankedBookmarkListCursor =
  BookmarkListCursor & {
    matchCount: number;
  };

export function isCursorWithoutTags(
  cursor: BookmarkListCursor
): cursor is BookmarkListCursorWithoutTags {
  return cursor.matchCount === null;
}

export function isTagRankedCursor(
  cursor: BookmarkListCursor
): cursor is TagRankedBookmarkListCursor {
  return cursor.matchCount !== null;
}

// Base for cursor what contains id and matchCount of bookmark
const CursorBaseSchema = z.strictObject({
  version: z.literal(CURSOR_VERSION),

  id: z.uuid(),

  fingerprint: z.string().min(1),

  matchCount: z
    .number()
    .int()
    .positive()
    .nullable(),
});

// Types of cursor for every sort
export const BookmarkListCursorSchema =
  z.discriminatedUnion('sort', [
    CursorBaseSchema.extend({
      sort: z.literal('recently-added'),
      createdAt: z.iso.datetime(),
    }),

    CursorBaseSchema.extend({
      sort: z.literal('recently-visited'),
      lastVisitedAt: z.iso.datetime().nullable(),
    }),

    CursorBaseSchema.extend({
      sort: z.literal('most-visited'),
      viewCount: z.number().int().nonnegative(),
    }),
  ]);

export type BookmarkListCursor = z.infer<
  typeof BookmarkListCursorSchema
>;

// Creating a fingerprint to store encoded query params
export function createBookmarkListFilterFingerprint(
  scope: BookmarkListFilterScope
): string {
  const canonicalScope = {
    userId: scope.userId,
    status: scope.status,
    pinned: scope.pinned,
    search: normalizeSearch(scope.search),
    tags: normalizeTags(scope.tags),
    sort: scope.sort,
  };

  return createHash('sha256')
    .update(JSON.stringify(canonicalScope))
    .digest('base64url');
}

// Encoded cursor for sending through url
export function encodeBookmarkListCursor(
  cursor: BookmarkListCursor
): string {
  const parsed =
    BookmarkListCursorSchema.parse(cursor);

  return Buffer.from(
    JSON.stringify(parsed),
    'utf8'
  ).toString('base64url');
}

// Encoded cursor and checking if this cursor belongs to current queries set (fingerprint)
export function decodeBookmarkListCursor(
  encodedCursor: string,
  expectedScope: BookmarkListFilterScope
): BookmarkListCursor {
  // If cursor has valid decoded form
  if (
    encodedCursor.length === 0 ||
    encodedCursor.length > MAX_CURSOR_LENGTH
  ) {
    throw new InvalidBookmarkListCursorError();
  }

  let raw: unknown;

  // Decoding
  try {
    const decoded = Buffer.from(
      encodedCursor,
      'base64url'
    ).toString('utf8');

    raw = JSON.parse(decoded);
  } catch {
    throw new InvalidBookmarkListCursorError();
  }

  const result =
    BookmarkListCursorSchema.safeParse(raw);

  // Checking if cursor has valid shape
  if (!result.success) {
    throw new InvalidBookmarkListCursorError();
  }

  // Getting a fingerprint from current cursor's scope
  const cursor = result.data;

  // Getting expected fingerprint for current scope
  const expectedFingerprint =
    createBookmarkListFilterFingerprint(
      expectedScope
    );

  // Checking of cursor belongs to current queries set
  if (
    cursor.fingerprint !== expectedFingerprint
  ) {
    throw new InvalidBookmarkListCursorError();
  }

  // If set of tags and matchCount not valid
  // it means that cursor invalid
  validateMatchCount(
    cursor.matchCount,
    expectedScope
  );

  return cursor;
}

function validateMatchCount(
  matchCount: number | null,
  scope: BookmarkListFilterScope
): void {
  const hasTagFilters =
    normalizeTags(scope.tags).length > 0;

  if (hasTagFilters && matchCount === null) {
    throw new InvalidBookmarkListCursorError();
  }

  if (!hasTagFilters && matchCount !== null) {
    throw new InvalidBookmarkListCursorError();
  }
}
