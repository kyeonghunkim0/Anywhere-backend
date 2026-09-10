-- AlterTable
ALTER TABLE "match_histories" ADD COLUMN     "distanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "cancelledAt" TIMESTAMP(3);
ALTER TABLE "match_histories" ALTER COLUMN "distanceKm" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_stamps" ADD COLUMN     "distanceKm" DOUBLE PRECISION,
ADD COLUMN     "matchHistoryId" TEXT;

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_stamps_matchHistoryId_key" ON "user_stamps"("matchHistoryId");

-- CreateIndex
CREATE INDEX "match_histories_userId_confirmedAt_idx" ON "match_histories"("userId", "confirmedAt");

-- CreateIndex
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId");

-- CreateIndex
CREATE INDEX "reviews_placeId_idx" ON "reviews"("placeId");

-- AddForeignKey
ALTER TABLE "user_stamps" ADD CONSTRAINT "user_stamps_matchHistoryId_fkey" FOREIGN KEY ("matchHistoryId") REFERENCES "match_histories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
