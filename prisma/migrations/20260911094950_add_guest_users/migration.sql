-- AlterTable
ALTER TABLE "users" ADD COLUMN     "guestExpiresAt" TIMESTAMP(3),
ADD COLUMN     "isGuest" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "users_isGuest_guestExpiresAt_idx" ON "users"("isGuest", "guestExpiresAt");
