/*
  Warnings:

  - Added the required column `visitorNumber` to the `user_stamps` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "regions" ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "quote" TEXT,
ADD COLUMN     "visitCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "user_stamps" ADD COLUMN     "visitorNumber" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "pushEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "match_histories" (
    "id" TEXT NOT NULL,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,

    CONSTRAINT "match_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_tags" (
    "placeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "place_tags_pkey" PRIMARY KEY ("placeId","tagId")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "radiusM" INTEGER,
    "placeId" TEXT,
    "regionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "match_histories_userId_matchedAt_idx" ON "match_histories"("userId", "matchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tags_label_key" ON "tags"("label");

-- CreateIndex
CREATE INDEX "place_tags_tagId_idx" ON "place_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "badges_key_key" ON "badges"("key");

-- CreateIndex
CREATE INDEX "badges_type_idx" ON "badges"("type");

-- CreateIndex
CREATE INDEX "user_badges_userId_idx" ON "user_badges"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");

-- AddForeignKey
ALTER TABLE "match_histories" ADD CONSTRAINT "match_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_histories" ADD CONSTRAINT "match_histories_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_tags" ADD CONSTRAINT "place_tags_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_tags" ADD CONSTRAINT "place_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
