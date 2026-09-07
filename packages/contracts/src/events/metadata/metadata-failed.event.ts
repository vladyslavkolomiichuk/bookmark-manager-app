import z from 'zod';
import { EventEnvelopeSchema } from '../event-envelope.schema.js';

export const MetadataFailureReasonCodeSchema =
  z.enum([
    'FETCH_FAILED',
    'TIMEOUT',
    'UNSUPPORTED_CONTENT',
    'INVALID_METADATA',
  ]);

export type MetadataFailureReasonCode = z.infer<
  typeof MetadataFailureReasonCodeSchema
>;

export const MetadataFailedPayloadSchema =
  z.strictObject({
    bookmarkId: z.uuid(),
    urlRevision: z.int().positive(),
    reasonCode: MetadataFailureReasonCodeSchema,
  });

export type MetadataFailedPayload = z.infer<
  typeof MetadataFailedPayloadSchema
>;

export const MetadataFailedEventSchema =
  EventEnvelopeSchema.extend({
    eventType: z.literal('metadata.failed.v1'),
    producer: z.literal('metadata'),
    payload: MetadataFailedPayloadSchema,
  });

export type MetadataFailedEvent = z.infer<
  typeof MetadataFailedEventSchema
>;
