import z from 'zod';

export const EventProducerSchema = z.enum([
  'bookmarks',
  'metadata',
]);

export type EventProducer = z.infer<
  typeof EventProducerSchema
>;

export const EventEnvelopeSchema = z.strictObject(
  {
    eventId: z.uuid(),
    eventType: z.string().min(1),
    eventVersion: z.literal(1),
    occurredAt: z.iso.datetime(),
    correlationId: z.uuid(),
    producer: EventProducerSchema,
    payload: z.unknown(),
  }
);

export type EventEnvelope = z.infer<
  typeof EventEnvelopeSchema
>;
