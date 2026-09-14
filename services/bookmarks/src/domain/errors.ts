import { AppError } from '@bookmark-manager/common';

export class BookmarkNotFoundError extends AppError {
  readonly code: string = 'BOOKMARK_NOT_FOUND';
  readonly statusCode = 404;

  constructor() {
    super('Bookmark not found.');
  }
}

export class DuplicateBookmarkUrlError extends AppError {
  readonly code: string =
    'DUPLICATE_BOOKMARK_URL';
  readonly statusCode = 409;

  constructor() {
    super('This URL is already saved.');
  }
}

export class CannotPinArchivedBookmarkError extends AppError {
  readonly code: string =
    'CANNOT_PIN_ARCHIVED_BOOKMARK';
  readonly statusCode = 409;

  constructor() {
    super('Archived bookmarks cannot be pinned.');
  }
}

export class InvalidBookmarkStateError extends AppError {
  readonly code: string =
    'INVALID_BOOKMARK_STATE';
  readonly statusCode = 409;

  constructor(
    message = 'The requested bookmark state transition is invalid.'
  ) {
    super(message);
  }
}

export class FaviconAssetNotFoundError extends AppError {
  readonly code: string =
    'FAVICON_ASSET_NOT_FOUND';
  readonly statusCode = 404;

  constructor() {
    super('Favicon asset not found.');
  }
}

export class FaviconAssetNotOwned extends AppError {
  readonly code: string =
    'FAVICON_ASSET_NOT_OWNED';
  readonly statusCode = 404;

  constructor() {
    super('Favicon asset not found.');
  }
}

export class InvalidBookmarkUrlError extends AppError {
  readonly code: string = 'INVALID_BOOKMARK_URL';
  readonly statusCode = 400;

  constructor(message = 'Invalid bookmark url.') {
    super(message);
  }
}

export class InvalidBookmarkListCursorError extends AppError {
  readonly code = 'INVALID_BOOKMARK_LIST_CURSOR';

  readonly statusCode = 400;

  constructor() {
    super('Invalid bookmark list cursor.');
  }
}
