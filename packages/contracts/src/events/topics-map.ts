import type { MetadataCompletedEvent } from './metadata/metadata-completed.event.js';
import type { MetadataFailedEvent } from './metadata/metadata-failed.event.js';
import type { MetadataRequestedEvent } from './metadata/metadata-requested.event.js';
import { EVENT_TOPICS } from './topics.js';

// This type will be used for publish func
// it will help in matching topics and event (payload type)
export type TopicEventMap = {
  [EVENT_TOPICS.BOOKMARK_METADATA_REQUESTED]: MetadataRequestedEvent;

  [EVENT_TOPICS.BOOKMARK_METADATA_RESULT]:
    MetadataCompletedEvent | MetadataFailedEvent;
};
