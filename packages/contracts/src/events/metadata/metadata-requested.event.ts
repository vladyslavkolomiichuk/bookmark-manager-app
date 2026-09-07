import z from 'zod';
import { EventEnvelopeSchema } from '../event-envelope.schema.js';

export const MetadataRequestedPayloadSchema =
  z.strictObject({
    bookmarkId: z.uuid(),
    userId: z.uuid(),
    url: z.httpUrl(),
    urlRevision: z.int().positive(),
  });

export type MetadataRequestedPayload = z.infer<
  typeof MetadataRequestedPayloadSchema
>;

export const MetadataRequestedEventSchema =
  EventEnvelopeSchema.extend({
    eventType: z.literal('metadata.requested.v1'),
    producer: z.literal('bookmarks'),
    payload: MetadataRequestedPayloadSchema,
  });

export type MetadataRequestedEvent = z.infer<
  typeof MetadataRequestedEventSchema
>;
