-- AlterTable
ALTER TABLE "regions" ADD COLUMN     "isCityCounty" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "regions_isCityCounty_idx" ON "regions"("isCityCounty");
