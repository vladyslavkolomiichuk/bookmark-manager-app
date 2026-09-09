import { InvalidBookmarkUrlError } from '../domain/errors.js';

// For now func only check if url has HTTP/HTTPS protocol and user:secret pattern
export const normalizeBookmarkUrl = (
  userUrl: string
) => {
  let url: URL;

  try {
    url = new URL(userUrl);
  } catch {
    throw new InvalidBookmarkUrlError(
      'URL must be a valid absolute URL.'
    );
  }

  if (
    url.protocol !== 'http:' &&
    url.protocol !== 'https:'
  ) {
    throw new InvalidBookmarkUrlError(
      'Only http and https URLs are supported.'
    );
  }

  if (url.username || url.password) {
    throw new InvalidBookmarkUrlError(
      'Embedded URL credentials are not allowed.'
    );
  }

  return url.toString();
};
