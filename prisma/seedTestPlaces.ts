import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

/**
 * 특정 좌표 주변에 매칭/체크인 테스트용 관광지를 꽂아 넣는 시드
 * - 기준 좌표(BASE_LAT/BASE_LNG)에서 거리별로 4곳을 만들어 500m 체크인 판정과
 *   반경 필터를 한 자리에서 확인할 수 있게 합니다.
 * - contentId에 "TEST-" 접두사를 붙여 실제 TourAPI 데이터와 섞이지 않게 하고,
 *   재실행 시 같은 contentId를 upsert 하므로 중복이 쌓이지 않습니다.
 */
const BASE_LAT = 37.503;
const BASE_LNG = 126.793;

// 위도 1도 ≈ 111,320m / 경도 1도 ≈ 88,340m (위도 37.5 기준)
const METERS_PER_LAT = 111_320;
const METERS_PER_LNG = 88_340;

const offset = (northM: number, eastM: number): { lat: number; lng: number } => ({
  lat: BASE_LAT + northM / METERS_PER_LAT,
  lng: BASE_LNG + eastM / METERS_PER_LNG,
});

/** 테스트 장소가 소속될 지역 (기준 좌표에서 가장 가까운 기초자치단체) */
const REGION_SIDO = "경기도";
const REGION_SIGUNGU = "부천시";

const testPlaces = [
  {
    contentId: "TEST-NEAR-50M",
    name: "[테스트] 코앞 스팟",
    address: "경기도 부천시 테스트로 1 (기준 좌표 북쪽 50m)",
    ...offset(50, 0),
    tagLabel: "#골목_산책",
  },
  {
    contentId: "TEST-NEAR-400M",
    name: "[테스트] 체크인 경계 안쪽",
    address: "경기도 부천시 테스트로 2 (기준 좌표 동쪽 400m)",
    ...offset(0, 400),
    tagLabel: "#숨은_출사명소",
  },
  {
    contentId: "TEST-FAR-800M",
    name: "[테스트] 체크인 경계 바깥",
    address: "경기도 부천시 테스트로 3 (기준 좌표 남쪽 800m)",
    ...offset(-800, 0),
    tagLabel: null,
  },
  {
    contentId: "TEST-FAR-2500M",
    name: "[테스트] 매칭 확인용 2.5km",
    address: "경기도 부천시 테스트로 4 (기준 좌표 북동쪽 2.5km)",
    ...offset(1768, 1768),
    tagLabel: "#밤하늘_별맛집",
  },
];

async function main(): Promise<void> {
  console.log(`🌱 테스트 관광지 시딩 시작... (기준 ${BASE_LAT}, ${BASE_LNG})\n`);

  const region = await prisma.region.findFirst({
    where: { sidoName: REGION_SIDO, sigunguName: REGION_SIGUNGU },
  });
  if (!region) {
    throw new Error(`"${REGION_SIDO} ${REGION_SIGUNGU}" 지역이 없습니다. 먼저 npm run seed 를 실행하세요.`);
  }

  for (const place of testPlaces) {
    const { tagLabel, lat, lng, ...rest } = place;

    const saved = await prisma.place.upsert({
      where: { contentId: rest.contentId },
      update: { name: rest.name, address: rest.address, mapX: lng, mapY: lat, regionId: region.id },
      create: { ...rest, mapX: lng, mapY: lat, regionId: region.id },
    });

    if (tagLabel) {
      const tag = await prisma.tag.findUnique({ where: { label: tagLabel } });
      if (tag) {
        await prisma.placeTag.upsert({
          where: { placeId_tagId: { placeId: saved.id, tagId: tag.id } },
          update: {},
          create: { placeId: saved.id, tagId: tag.id },
        });
      }
    }

    console.log(`  ✓ ${rest.name} (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
  }

  console.log(`\n✅ 시딩 완료! 테스트 관광지 ${testPlaces.length}곳 (${region.sidoName} ${region.sigunguName})`);
  console.log(`   삭제: DELETE FROM places WHERE content_id LIKE 'TEST-%';`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ 시딩 실패:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
