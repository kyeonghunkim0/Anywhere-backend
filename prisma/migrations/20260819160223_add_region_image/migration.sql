-- AlterTable
ALTER TABLE "regions" ADD COLUMN     "imageCredit" TEXT,
ADD COLUMN     "imageSource" TEXT,
ADD COLUMN     "imageUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "imageUrl" TEXT;
