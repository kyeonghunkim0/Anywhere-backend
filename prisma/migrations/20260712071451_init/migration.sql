-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "socialType" TEXT NOT NULL,
    "socialId" TEXT NOT NULL,
    "totalStamps" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "sidoName" TEXT NOT NULL,
    "sigunguName" TEXT NOT NULL,
    "areaCode" TEXT NOT NULL,
    "sigunguCode" TEXT NOT NULL,
    "isDepopulated" BOOLEAN NOT NULL DEFAULT false,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "thumbnail" TEXT,
    "mapX" DOUBLE PRECISION NOT NULL,
    "mapY" DOUBLE PRECISION NOT NULL,
    "contentId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_stamps" (
    "id" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,

    CONSTRAINT "user_stamps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_socialId_key" ON "users"("socialId");

-- CreateIndex
CREATE UNIQUE INDEX "regions_areaCode_sigunguCode_key" ON "regions"("areaCode", "sigunguCode");

-- CreateIndex
CREATE UNIQUE INDEX "places_contentId_key" ON "places"("contentId");

-- CreateIndex
CREATE INDEX "places_regionId_idx" ON "places"("regionId");

-- CreateIndex
CREATE INDEX "user_stamps_userId_idx" ON "user_stamps"("userId");

-- CreateIndex
CREATE INDEX "user_stamps_placeId_idx" ON "user_stamps"("placeId");

-- CreateIndex
CREATE INDEX "user_stamps_regionId_idx" ON "user_stamps"("regionId");

-- CreateIndex
CREATE INDEX "user_stamps_checkedInAt_idx" ON "user_stamps"("checkedInAt");

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stamps" ADD CONSTRAINT "user_stamps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stamps" ADD CONSTRAINT "user_stamps_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stamps" ADD CONSTRAINT "user_stamps_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
