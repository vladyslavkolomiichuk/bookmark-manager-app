import z from 'zod';
import { EventEnvelopeSchema } from '../event-envelope.schema.js';

export const MetadataCompletedPayloadSchema =
  z.strictObject({
    bookmarkId: z.uuid(),
    urlRevision: z.int().positive(),
    title: z.string().optional(),
    description: z.string().optional(),
    faviconAssetId: z.uuid().optional(),
  });

export type MetadataCompletedPayload = z.infer<
  typeof MetadataCompletedPayloadSchema
>;

export const MetadataCompletedEventSchema =
  EventEnvelopeSchema.extend({
    eventType: z.literal('metadata.completed.v1'),
    producer: z.literal('metadata'),
    payload: MetadataCompletedPayloadSchema,
  });

export type MetadataCompletedEvent = z.infer<
  typeof MetadataCompletedEventSchema
>;
