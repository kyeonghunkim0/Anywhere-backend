-- CreateTable
CREATE TABLE "section_visibility" (
    "id" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_visibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "section_visibility_sectionKey_key" ON "section_visibility"("sectionKey");
