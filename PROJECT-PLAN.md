# Bookmark Manager — Project Plan

## Stack and system map

| Area | Choice |
|---|---|
| Frontend | Next.js |
| HTTP services | Node.js + Express |
| Validation and shared contracts | Zod |
| Persistence | Prisma + PostgreSQL |
| Asynchronous work | Kafka |
| Local infrastructure | Docker Compose |
| Monorepo | pnpm workspaces only — no Turborepo or Nx |

```text
Next.js frontend
       │ HTTP
       ▼
Express gateway
   ┌───┴──────────────┐
   ▼                  ▼
Auth service       Bookmarks service ──► Kafka ──► Metadata worker
   │                  │                                  │
   ▼                  ▼                                  └── fetches website metadata
auth database    bookmarks database
```

```text
apps/       frontend, gateway
services/   auth, bookmarks, metadata
packages/   contracts
```

Express services use `routes → controllers → services → repositories`. The gateway
uses service clients, not repositories. The metadata worker is a Kafka consumer,
not an HTTP service.

## Current position

- [x] pnpm workspace and shared TypeScript configuration
- [x] Empty shells for frontend, gateway, auth, bookmarks, and metadata
- [x] Shared Zod request/response contracts for auth, bookmarks, tags, and errors
- [x] Metadata event schemas and two versioned Kafka topics
- [ ] Close the event-contract checkpoint: import `EVENT_TOPICS` normally in
      `topics-map.ts` because its values form computed keys; adjust the comment to
      say the map contains full events, not payloads.
- [ ] Ensure `node_modules` is ignored rather than tracked before committing.

## Domain rules already decided

```text
Archive bookmark ──► automatically unpin ──► remove from active view
Unarchive bookmark ──► remains unpinned
Pin archived bookmark ──► reject
Delete bookmark ──► permanent; optionally delete tags made unused
```

- Tags are lowercase and unique per user; unused tags may remain for future use.
- Different users may save the same URL. One user may not save the same normalized
  URL twice.
- Auth owns users. Bookmarks stores `userId` as a UUID scalar, with no cross-service
  foreign key.
- The app records visits atomically; direct external visits cannot be fully tracked.
- Editing a URL keeps current visible metadata until refreshed data arrives.
- Manual title, description, and favicon choices must not be overwritten by metadata.
- An omitted update field leaves its value unchanged. Non-empty text becomes a user
  override. An empty string removes the user override.

## Database tables

Tables belong to the service that makes decisions about their data. A service may
read another service only through an API or event, never through its database.

| Database owner | Tables | Why they exist |
|---|---|---|
| Auth service | `users`, `auth_sessions`, `password_reset_tokens` | Identity, revocable login sessions, and safe password reset flow |
| Bookmarks service | `bookmarks`, `tags`, `bookmark_tags`, `bookmark_metadata_cache`, `bookmark_assets`, `outbox_events`, `inbox_events` | The bookmark domain, metadata fallback, file references, and reliable events |
| Metadata worker | `metadata_jobs`, `outbox_events` | Durable fetch/retry work and reliable result publishing; introduced with Kafka work |
| Gateway / frontend | none | They do not own durable domain data |

### Auth database

| Table | Essential columns | Rules |
|---|---|---|
| `users` | `id`, `fullName`, `email`, `hashedPassword`, `createdAt`, `updatedAt` | `email` is unique; never expose `hashedPassword` |
| `auth_sessions` | `id`, `userId`, `refreshTokenHash`, `expiresAt`, `revokedAt`, `createdAt`, `lastUsedAt` | Store only a refresh-token hash; enables logout and session revocation |
| `password_reset_tokens` | `id`, `userId`, `tokenHash`, `expiresAt`, `usedAt`, `createdAt` | Store only a hash; a token is single-use when `usedAt` is set |

`auth_sessions` is required if the chosen authentication flow uses refresh tokens.
Access tokens themselves remain short-lived signed values, not database rows.

### Bookmarks database

| Table | Essential columns | Key constraints and relationships |
|---|---|---|
| `bookmarks` | `id`, `userId`, `url`, `normalizedUrl`, `urlRevision`, `title`, `titleSource`, `description`, `descriptionSource`, `faviconAssetId`, `faviconSource`, `viewCount`, `lastVisitedAt`, `pinned`, `archivedAt`, `metadataStatus`, `createdAt`, `updatedAt` | unique `(userId, normalizedUrl)`; `userId` is a scalar, not an Auth foreign key |
| `tags` | `id`, `userId`, `name`, `createdAt` | `name` is stored lowercase; unique `(userId, name)` |
| `bookmark_tags` | `bookmarkId`, `tagId`, `createdAt` | explicit many-to-many join; unique `(bookmarkId, tagId)`; foreign keys stay inside this database |
| `bookmark_metadata_cache` | `bookmarkId`, `urlRevision`, `title`, `description`, `faviconAssetId`, `fetchedAt`, `expiresAt` | one-to-one with bookmark; cache is usable only for its matching URL revision |
| `bookmark_assets` | `id`, `userId`, `storageKey`, `contentType`, `sizeBytes`, `status`, `createdAt`, `deletedAt` | stores file references and lifecycle, never file bytes; `storageKey` is unique |
| `outbox_events` | `id`, `aggregateType`, `aggregateId`, `topic`, `eventType`, `eventVersion`, `payload`, `correlationId`, `occurredAt`, `publishedAt`, `attemptCount`, `lastError` | written in the same transaction as a bookmark change; unpublished rows are retried |
| `inbox_events` | `consumerName`, `eventId`, `processedAt` | unique `(consumerName, eventId)` prevents a result event being processed twice |

Useful Bookmark indexes beyond the unique URL constraint:

```text
(userId, archivedAt, createdAt)
(userId, archivedAt, lastVisitedAt)
(userId, archivedAt, viewCount)
(userId, pinned)
```

### Metadata worker database — add in the Kafka milestone

| Table | Essential columns | Rules |
|---|---|---|
| `metadata_jobs` | `id`, `sourceEventId`, `bookmarkId`, `url`, `urlRevision`, `status`, `attemptCount`, `failureReasonCode`, `createdAt`, `startedAt`, `finishedAt` | unique `sourceEventId` makes request consumption idempotent; `bookmarkId` is a scalar, not a foreign key |
| `outbox_events` | same operational fields as the bookmarks outbox | result event is persisted before Kafka publishing is retried |

Do not add a global URL metadata-cache table yet. It is an optimization with privacy
and cache-key risks for URLs containing private query parameters or signed tokens.

### Values that are enums, not tables

```text
FieldSource        = NONE | METADATA | USER
MetadataStatus     = PENDING | READY | FAILED
AssetStatus        = PENDING | READY | DELETED
MetadataJobStatus  = PENDING | PROCESSING | COMPLETED | FAILED
```

## Delivery sequence

### 1. Local database foundation

**Goal:** run a reproducible database without installing PostgreSQL directly on the
host machine.

- [ ] Add root Docker Compose configuration for PostgreSQL.
- [ ] Use one local PostgreSQL server but separate logical databases for `bookmarks`,
      future `auth`, and later durable `metadata` worker data.
- [ ] Add a persistent volume, health check, `.env.example`, and ignored real `.env`.
- [ ] Confirm a single Node/pnpm environment can install workspace dependencies and
      type-check packages.

Do not add Kafka yet. It has no useful work until bookmark persistence exists.

### 2. Bookmarks persistence design

**Goal:** agree on the database model before a migration or controller is written.

- [ ] Add Prisma CLI as a bookmarks-service development dependency and Prisma Client
      as its runtime dependency.
- [ ] Create `services/bookmarks/prisma/schema.prisma`.
- [ ] Draft these models:

```text
Bookmark ──< BookmarkTag >── Tag
    │
    └── BookmarkMetadataCache (one-to-one)
```

`Bookmark` owns its identity, `userId`, public and normalized URL, `urlRevision`,
visible title/description/favicon reference, source state, visit data, timestamps,
pinned state, nullable `archivedAt`, and metadata status.

`Tag` belongs to one user. `BookmarkTag` is explicit so tag cleanup previews and
tag counts remain reliable.

`BookmarkMetadataCache` is owned by the bookmarks service. It stores the last
fetched title, description, favicon asset reference, URL revision, `fetchedAt`, and
`expiresAt`. It stores references only; image bytes belong in object storage later.

**Source and cache semantics**

```text
field omitted       → retain current value and source
non-empty text      → source becomes USER
empty string        → remove USER override
fresh cache exists  → restore its METADATA value; do not fetch again
no usable cache     → source is NONE; metadata can be requested
```

Changing the URL increments `urlRevision`. Old metadata can remain visible while a
new fetch is pending, but cache from an old revision must never restore data for a
new URL.

**Database constraints and indexes**

- [ ] tag uniqueness: `(userId, name)` because `name` is already lowercase;
- [ ] bookmark uniqueness: `(userId, normalizedUrl)`;
- [ ] join uniqueness: `(bookmarkId, tagId)`;
- [ ] indexes for a user’s active/archived list, pinned state, and list sorting.

### 3. Migration and repository boundary

**Goal:** prove the model before building HTTP behavior around it.

- [ ] Create and inspect the first bookmarks migration.
- [ ] Generate Prisma Client and create one client lifecycle module.
- [ ] Create bookmark/tag repository interfaces and Prisma implementations.
- [ ] Keep Prisma calls in repositories; controllers and services do not call Prisma
      directly.

### 4. Bookmark HTTP vertical slice

**Goal:** complete the core feature through routes → controllers → services → repositories.

- [ ] Create: normalize URL, detect duplicate, create/reuse tags, and queue metadata.
- [ ] List: search, tag filters, active/archived state, sort, and cursor pagination.
- [ ] Read one: enforce ownership using trusted gateway user context.
- [ ] Update: apply source/cache semantics and increment URL revision when needed.
- [ ] Pin/unpin and archive/unarchive while preserving archive rules.
- [ ] Delete: preview unused tags, then delete requested unused tags in the same
      transaction as bookmark removal.
- [ ] Visit action: increment `viewCount` and update `lastVisitedAt` atomically.

### 5. Reliable metadata pipeline

**Goal:** fetch website metadata asynchronously without stale results corrupting a
bookmark.

```text
bookmark write + outbox row
          │
          ▼
bookmark.metadata.requested.v1
          │
          ▼
metadata worker fetches safely
          │
          ▼
bookmark.metadata.result.v1 (completed or failed)
```

- [ ] Add an outbox record in the bookmarks database; do not directly couple the
      database write and Kafka publish.
- [ ] Use `bookmarkId` as the Kafka message key to preserve per-bookmark ordering.
- [ ] Validate a specific Zod event schema selected by `eventType` in every consumer.
- [ ] Apply a result only if its `urlRevision` matches the current bookmark.
- [ ] Ignore events for deleted bookmarks and make consumers idempotent.
- [ ] Never overwrite fields whose source is `USER`.
- [ ] Consult fresh per-bookmark cached metadata before requesting another fetch.

Kafka event boundaries never contain password-reset tokens, raw HTML, favicon bytes,
or internal stack traces.

### 6. Manual favicon uploads and storage

**Goal:** support a manual override without treating image files as bookmark JSON.

- [ ] Choose object storage and an opaque asset-ID/key strategy.
- [ ] Add a dedicated multipart upload flow.
- [ ] Store an asset reference in bookmark/cache data and expose `faviconUrl` in the
      API response.
- [ ] Mark manual upload source as `USER`.
- [ ] Define cleanup of abandoned uploads and unreferenced assets.

### 7. Auth, gateway, and frontend integration

- [ ] Build the Auth service and its own database.
- [ ] Let the gateway authenticate requests and send trusted user context downstream.
- [ ] Build the frontend against the contracts: add/edit, search, filters/reset,
      archive view, pinning, sorting, visit/copy actions, and light/dark themes.
- [ ] Add keyboard shortcuts after the core interactions are stable and accessible.

### 8. Later enhancements

- [ ] PWA installation and offline strategy.
- [ ] Browser extension for saving the current page.
- [ ] Consider a global metadata-worker URL cache only after threat-modeling private
      URLs, signed URLs, and query parameters.

## Definition of done for a milestone

```text
design reviewed → implementation complete → type-check passes → manual happy path
and failure path checked → commit
```

Unit tests are not a current project requirement. Schema validation, database
migrations, and manual failure-path checks are still required.
