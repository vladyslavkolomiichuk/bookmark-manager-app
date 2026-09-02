# Bookmark Manager — Project Plan

## Stack

| Area | Technology |
|---|---|
| Frontend | Next.js |
| HTTP services | Node.js + Express |
| Validation/contracts | Zod |
| Data access | Prisma |
| Database | PostgreSQL |
| Async messaging | Kafka |
| Containers | Docker |
| Monorepo | pnpm workspaces only — no Turborepo or Nx |

## System map

```text
┌─────────────────┐
│ Next.js frontend│
└────────┬────────┘
         │ HTTP
┌────────▼────────┐
│ Express gateway│
└────┬────────┬───┘
     │        │
┌────▼───┐ ┌──▼──────────────┐
│  Auth  │ │ Bookmark service│
│ service│ │ + PostgreSQL    │
└────────┘ └────────┬────────┘
                    │ Kafka events
             ┌──────▼─────────┐
             │ Metadata worker│
             └────────────────┘
```

```text
apps/
├── frontend/          Next.js UI
└── gateway/           Public API and service coordination

services/
├── auth/              Users and authentication
├── bookmarks/         Bookmarks, tags, visits and persistence
└── metadata/          Kafka worker for website metadata

packages/
├── contracts/         Shared Zod API/event contracts
├── config/            Shared configuration utilities
├── errors/            Shared technical error definitions
└── logger/            Shared logging utilities
```

> Express services use `routes → controllers → services → repositories`. The Next.js frontend and metadata worker follow structures appropriate to their own responsibilities.

## Domain model

### User

| Field | Type |
|---|---|
| `id` | UUID |
| `fullName` | string |
| `email` | unique string |
| `hashedPassword` | string |

### Bookmark

| Field | Type / rule |
|---|---|
| `id` | UUID |
| `userId` | UUID identity owned by the auth service |
| `title` | string |
| `favicon` | string or null; automatic or manually overridden |
| `description` | string |
| `url` | original/user-facing URL |
| `normalizedUrl` | normalized URL used for duplicate detection |
| `visitCount` | number, default `0` |
| `lastVisitedAt` | date or null |
| `createdAt` | date |
| `updatedAt` | date |
| `pinned` | boolean |
| `archived` | boolean |
| `tags` | many-to-many relationship |

### Tag

| Field | Type / rule |
|---|---|
| `id` | UUID |
| `userId` | UUID |
| `name` | lowercase; unique per user |
| `createdAt` | date |

## Domain rules

```text
Archive bookmark ──► automatically unpin ──► remove from active view
Unarchive bookmark ──► remains unpinned
Pin archived bookmark ──► reject
Delete bookmark ──► permanent
```

- `Tools`, `tools`, and `TOOLS` represent the same tag.
- Tags can exist without bookmarks and may be reused later.
- When deletion leaves tags unused, ask whether to keep or delete those tags.
- Shared tags must not be deleted when another bookmark still uses them.
- Bookmark deletion and optional unused-tag deletion are one transaction.
- Different users may save the same URL.
- One user cannot save the same normalized URL twice.
- Duplicate detection is scoped to `(userId, normalizedUrl)`.
- Users visit bookmarks through the application so visits can be counted atomically.
- Editing a URL keeps existing metadata by default while refreshed metadata is fetched.
- A manual favicon override must not be overwritten by the metadata worker.
- Auth owns users; bookmarks stores `userId` without a cross-service database relation.

## Bookmark API shape

| Action | Resource shape |
|---|---|
| List, search, filter, sort | `GET /bookmarks` with query parameters |
| Get one | `GET /bookmarks/:id` |
| Create | `POST /bookmarks` |
| Partially update | `PATCH /bookmarks/:id` |
| Permanently delete | `DELETE /bookmarks/:id` |
| Track a visit | Dedicated visit/redirect action |

Search, tags, archive state, pinned state, sorting, and pagination belong in query parameters. Titles are not resource identifiers.

## Metadata flow

```text
Save bookmark
     │
     ▼
Commit bookmark + metadata request
     │
     ▼ Kafka
Metadata worker fetches safe remote metadata
     │
     ├── success ──► favicon/title/description result
     └── failure ──► retry or failed status; bookmark remains usable
```

- Consumers must be idempotent because events may be delivered more than once.
- Results must be correlated with the current URL so stale results cannot overwrite newer edits.
- Publishing and persistence should account for the database/Kafka dual-write problem.
- Metadata fetching must defend against SSRF, redirects, timeouts, private networks, and oversized responses.

## Feature scope

### Frontend

- [ ] Reset filters
- [ ] Copy bookmark URLs
- [ ] View archived bookmarks
- [ ] Visit bookmarked websites directly from the app
- [ ] Toggle between light and dark themes
- [ ] Sort by **Recently added**, **Recently visited**, or **Most visited**
- [ ] Add keyboard shortcuts for quick actions:
  - Add bookmark
  - Focus search
  - Navigate between main views

### Backend

- [ ] Archive bookmarks without deleting them
- [ ] Pin and unpin bookmarks
- [ ] Automatically fetch website metadata—favicon, title, and description—when adding a URL
- [ ] Detect duplicates and prevent the same user from saving the same normalized URL more than once

### Additional

- [ ] Create a browser extension for saving the current webpage
- [ ] Add PWA capabilities for mobile installation and offline access

## Suggested delivery path

```text
Domain rules + contracts
          ↓
Auth and bookmark persistence
          ↓
Create/list vertical slice through the gateway
          ↓
Search, tags, sorting and pagination
          ↓
Edit, archive, pin, delete and visit tracking
          ↓
Kafka metadata pipeline
          ↓
Resilience, observability and security
          ↓
Browser extension and PWA
```
