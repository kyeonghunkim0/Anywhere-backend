import { prisma } from "../src/utils/prisma.js";
import { syncRegionPhotos } from "../src/services/regionPhoto.service.js";
import { env } from "../src/config/env.js";

/**
 * 지역 대표 사진 수집 스크립트
 *
 *   npm run seed:region-photos            아직 사진이 없는 지역만 수집
 *   npm run seed:region-photos -- --force 이미 있는 지역까지 전부 재수집
 *
 * 관광사진갤러리(PhotoGalleryService1)는 공공데이터포털에서 별도 활용신청이 필요합니다.
 * 개발계정 기준 오퍼레이션당 일 1,000건 제한이 있습니다.
 */
async function main(): Promise<void> {
  const force = process.argv.includes("--force");

  if (!env.PHOTO_API_KEY) {
    throw new Error(
      "❌ PHOTO_API_KEY(또는 TOUR_API_KEY)가 설정되지 않았습니다. .env 파일을 확인해주세요."
    );
  }

  const result = await syncRegionPhotos({ force });

  console.log("");
  console.log("📊 수집 결과");
  console.log(`   대상 지역        : ${result.totalRegions}개`);
  console.log(`   관광사진갤러리   : ${result.fromGallery}개`);
  console.log(`   관광지 썸네일    : ${result.fromPlace}개`);
  console.log(`   실패             : ${result.failedRegions.length}개`);
  console.log(`   소요 시간        : ${result.elapsedSec}초`);

  if (result.failedRegions.length > 0) {
    console.log("");
    console.log("⚠️ 사진을 못 채운 지역:");
    console.log(`   ${result.failedRegions.join(", ")}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ 지역 사진 수집 실패:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
