import { prisma } from "../src/utils/prisma.js";
import { syncRegionNamesEn } from "../src/services/regionNameEn.service.js";
import { env } from "../src/config/env.js";

/**
 * 지역 영문명 수집 스크립트
 *
 *   npm run seed:region-names-en
 *
 * TourAPI 영문 서비스(EngService2)는 공공데이터포털에서 별도 활용신청이 필요합니다.
 * 인증키는 TOUR_API_KEY를 그대로 씁니다.
 */
async function main(): Promise<void> {
  if (!env.TOUR_API_KEY) {
    throw new Error("❌ TOUR_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.");
  }

  const result = await syncRegionNamesEn();

  console.log("");
  console.log("📊 수집 결과");
  console.log(`   대상 시·도       : ${result.totalSido}개`);
  console.log(`   갱신된 지역       : ${result.updated}개`);
  console.log(`   실패             : ${result.failedAreaCodes.length}개`);
  console.log(`   소요 시간        : ${result.elapsedSec}초`);

  if (result.failedAreaCodes.length > 0) {
    console.log("");
    console.log("⚠️ 영문명을 못 채운 시·도 코드:");
    console.log(`   ${result.failedAreaCodes.join(", ")}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ 지역 영문명 수집 실패:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
