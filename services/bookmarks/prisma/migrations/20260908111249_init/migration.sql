-- CreateEnum
CREATE TYPE "FieldSource" AS ENUM ('NONE', 'USER', 'METADATA');

-- CreateEnum
CREATE TYPE "MetadataStatus" AS ENUM ('READY', 'FAILED', 'PENDING');

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "urlRevision" INTEGER NOT NULL DEFAULT 1,
    "title" VARCHAR(160) NOT NULL DEFAULT '',
    "titleSource" "FieldSource" NOT NULL DEFAULT 'NONE',
    "description" VARCHAR(280) NOT NULL DEFAULT '',
    "descriptionSource" "FieldSource" NOT NULL DEFAULT 'NONE',
    "faviconAssetId" UUID,
    "faviconSource" "FieldSource" NOT NULL DEFAULT 'NONE',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastVisitedAt" TIMESTAMPTZ(3),
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMPTZ(3),
    "metadataStatus" "MetadataStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmark_tags" (
    "bookmarkId" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmark_tags_pkey" PRIMARY KEY ("bookmarkId","tagId")
);

-- CreateTable
CREATE TABLE "bookmark_metadata_caches" (
    "bookmarkId" UUID NOT NULL,
    "urlRevision" INTEGER NOT NULL,
    "title" VARCHAR(160),
    "description" VARCHAR(280),
    "faviconAssetId" UUID,
    "fetchedAt" TIMESTAMPTZ(3) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bookmark_metadata_caches_pkey" PRIMARY KEY ("bookmarkId")
);

-- CreateIndex
CREATE INDEX "bookmarks_userId_archivedAt_createdAt_idx" ON "bookmarks"("userId", "archivedAt", "createdAt");

-- CreateIndex
CREATE INDEX "bookmarks_userId_archivedAt_lastVisitedAt_idx" ON "bookmarks"("userId", "archivedAt", "lastVisitedAt");

-- CreateIndex
CREATE INDEX "bookmarks_userId_archivedAt_viewCount_idx" ON "bookmarks"("userId", "archivedAt", "viewCount");

-- CreateIndex
CREATE INDEX "bookmarks_userId_pinned_idx" ON "bookmarks"("userId", "pinned");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_normalizedUrl_key" ON "bookmarks"("userId", "normalizedUrl");

-- CreateIndex
CREATE UNIQUE INDEX "tags_userId_name_key" ON "tags"("userId", "name");

-- CreateIndex
CREATE INDEX "bookmark_tags_tagId_idx" ON "bookmark_tags"("tagId");

-- AddForeignKey
ALTER TABLE "bookmark_tags" ADD CONSTRAINT "bookmark_tags_bookmarkId_fkey" FOREIGN KEY ("bookmarkId") REFERENCES "bookmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmark_tags" ADD CONSTRAINT "bookmark_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmark_metadata_caches" ADD CONSTRAINT "bookmark_metadata_caches_bookmarkId_fkey" FOREIGN KEY ("bookmarkId") REFERENCES "bookmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Positive urlRevision
ALTER TABLE "bookmarks"
ADD CONSTRAINT "bookmarks_url_revision_positive"
CHECK ("urlRevision" > 0);

-- Nonnegative viewCount
ALTER TABLE "bookmarks"
ADD CONSTRAINT "bookmarks_view_count_nonnegative"
CHECK ("viewCount" >= 0);

-- Lowercase Tags name
ALTER TABLE "tags"
ADD CONSTRAINT "tags_name_lowercase"
CHECK ("name" = lower("name"));

-- Positive Cache urlRevision
ALTER TABLE "bookmark_metadata_caches"
ADD CONSTRAINT "bookmark_metadata_caches_url_revision_positive"
CHECK ("urlRevision" > 0);

ALTER TABLE "bookmark_metadata_caches"
ADD CONSTRAINT "bookmark_metadata_caches_expiry_after_fetch"
CHECK ("expiresAt" > "fetchedAt");
