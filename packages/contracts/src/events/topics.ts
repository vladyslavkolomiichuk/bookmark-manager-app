export const EVENT_TOPICS = {
  BOOKMARK_METADATA_REQUESTED:
    'bookmark.metadata.requested.v1',
  BOOKMARK_METADATA_RESULT:
    'bookmark.metadata.result.v1',
} as const;

export type EventTopic =
  (typeof EVENT_TOPICS)[keyof typeof EVENT_TOPICS];
