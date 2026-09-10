import { PrismaClient } from "../src/generated/prisma/client.js";
import type { Place, Region } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import { getRegionLevel } from "../src/utils/gamification.js";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

/**
 * API 테스트용 실제 계정에 데이터를 채워 넣는 시드
 * - 대상 유저는 로그인 응답(`data.user.id`)의 DB 유저 id로 지정합니다.
 * - 재실행 시 이 유저가 남긴 도장/매칭/후기/뱃지만 정리 후 다시 채웁니다.
 */
const TARGET_USER_ID = "cmt06uztc0001889tb37zuzqr";

const daysAgo = (n: number): Date => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main(): Promise<void> {
  console.log("🌱 테스트 계정 목데이터 시딩 시작...\n");

  const targetUser = await prisma.user.findUnique({ where: { id: TARGET_USER_ID } });
  if (!targetUser) {
    throw new Error(`id="${TARGET_USER_ID}" 유저를 찾을 수 없습니다. 먼저 앱/Swagger에서 로그인한 계정인지 확인하세요.`);
  }

  const depopulatedRegions = await prisma.region.findMany({
    where: { isDepopulated: true },
    orderBy: [{ sidoName: "asc" }, { sigunguName: "asc" }],
    take: 2,
  });
  const normalRegions = await prisma.region.findMany({
    where: { isDepopulated: false },
    orderBy: [{ sidoName: "asc" }, { sigunguName: "asc" }],
    take: 1,
  });
  if (depopulatedRegions.length < 2 || normalRegions.length < 1) {
    throw new Error("지역 데이터가 부족합니다. 먼저 `npm run seed`를 실행하세요.");
  }
  const [regionA, regionB] = depopulatedRegions;
  const [regionC] = normalRegions;

  // 1) 재실행 대비: 이 유저가 남긴 테스트 데이터부터 정리 (지역 방문수 되돌린 뒤 삭제)
  const oldStamps = await prisma.userStamp.findMany({ where: { userId: targetUser.id } });
  const decrementByRegion = new Map<string, number>();
  for (const s of oldStamps) {
    decrementByRegion.set(s.regionId, (decrementByRegion.get(s.regionId) ?? 0) + 1);
  }
  await prisma.userStamp.deleteMany({ where: { userId: targetUser.id } });
  await prisma.review.deleteMany({ where: { userId: targetUser.id } });
  await prisma.matchHistory.deleteMany({ where: { userId: targetUser.id } });
  await prisma.userBadge.deleteMany({ where: { userId: targetUser.id } });

  for (const [regionId, count] of decrementByRegion) {
    const region = await prisma.region.findUniqueOrThrow({ where: { id: regionId } });
    const visitCount = Math.max(0, region.visitCount - count);
    await prisma.region.update({
      where: { id: regionId },
      data: { visitCount, level: getRegionLevel(visitCount) },
    });
  }
  await prisma.user.update({ where: { id: targetUser.id }, data: { totalStamps: 0 } });

  // 2) 테스트용 관광지 업서트 (TourAPI 캐시와 겹치지 않도록 contentId를 test- 로 구분)
  const placesData = [
    { contentId: "test-001", name: "테스트 전망대", address: `${regionA.sidoName} ${regionA.sigunguName} 전망대길 1`, mapX: regionA.centerLng, mapY: regionA.centerLat, regionId: regionA.id },
    { contentId: "test-002", name: "테스트 시장", address: `${regionA.sidoName} ${regionA.sigunguName} 시장길 2`, mapX: regionA.centerLng + 0.001, mapY: regionA.centerLat + 0.001, regionId: regionA.id },
    { contentId: "test-003", name: "테스트 해변", address: `${regionB.sidoName} ${regionB.sigunguName} 해변로 3`, mapX: regionB.centerLng, mapY: regionB.centerLat, regionId: regionB.id },
    { contentId: "test-004", name: "테스트 박물관", address: `${regionC.sidoName} ${regionC.sigunguName} 박물관로 4`, mapX: regionC.centerLng, mapY: regionC.centerLat, regionId: regionC.id },
  ];
  const places: Place[] = [];
  for (const p of placesData) {
    const place = await prisma.place.upsert({ where: { contentId: p.contentId }, update: p, create: p });
    places.push(place);
  }
  const [place1, place2, place3, place4] = places;

  // 3) 큐레이션 태그 연결 (있는 경우만)
  const tags = await prisma.tag.findMany({ take: 2 });
  if (tags.length > 0) {
    await prisma.placeTag.deleteMany({ where: { placeId: { in: places.map((p) => p.id) } } });
    await prisma.placeTag.create({ data: { placeId: place1.id, tagId: tags[0].id } });
    if (tags[1]) await prisma.placeTag.create({ data: { placeId: place3.id, tagId: tags[1].id } });
  }

  // 4) 체크인(도장) — 실제 checkIn 로직처럼 지역 방문수/레벨, 유저 누적 도장수를 함께 갱신
  async function checkIn(place: Place, region: Region, checkedInAt: Date, opts?: { distanceKm?: number; matchHistoryId?: string }) {
    const fresh = await prisma.region.findUniqueOrThrow({ where: { id: region.id } });
    const visitCount = fresh.visitCount + 1;
    const level = getRegionLevel(visitCount);
    const stamp = await prisma.userStamp.create({
      data: {
        userId: targetUser.id,
        placeId: place.id,
        regionId: region.id,
        visitorNumber: visitCount,
        checkedInAt,
        distanceKm: opts?.distanceKm,
        matchHistoryId: opts?.matchHistoryId,
      },
    });
    await prisma.region.update({ where: { id: region.id }, data: { visitCount, level } });
    await prisma.user.update({ where: { id: targetUser.id }, data: { totalStamps: { increment: 1 } } });
    return stamp;
  }

  // 확정 매칭 → 체크인까지 이어진 케이스
  const mh1 = await prisma.matchHistory.create({
    data: { userId: targetUser.id, placeId: place1.id, matchedAt: daysAgo(6), confirmedAt: daysAgo(6), distanceKm: 12.3 },
  });
  await checkIn(place1, regionA, daysAgo(6), { distanceKm: 12.3, matchHistoryId: mh1.id });

  // 매칭 없이 바로 체크인한 케이스
  await checkIn(place2, regionA, daysAgo(3));
  await checkIn(place3, regionB, daysAgo(1));

  // 진행 중(미확정) 매칭 — "여기로 결정" 누르기 전 상태
  await prisma.matchHistory.create({
    data: { userId: targetUser.id, placeId: place4.id, matchedAt: daysAgo(0), distanceKm: 8.1 },
  });

  // 취소된 매칭
  await prisma.matchHistory.create({
    data: { userId: targetUser.id, placeId: place4.id, matchedAt: daysAgo(2), cancelledAt: daysAgo(2), distanceKm: 20.0 },
  });

  // 5) 후기
  await prisma.review.createMany({
    data: [
      { userId: targetUser.id, placeId: place1.id, content: "생각보다 별이 진짜 잘 보여요, 완전 힐링됐어요." },
      { userId: targetUser.id, placeId: place3.id, content: "바다 냄새가 최고였어요, 다음에 또 올게요." },
    ],
  });

  // 6) 히든/지역 보상 뱃지 샘플 추가 후 지급
  const hiddenBadge = await prisma.badge.upsert({
    where: { key: "test_hidden_spot_1" },
    update: {},
    create: {
      key: "test_hidden_spot_1",
      name: "골목 탐정",
      description: "테스트 시장 근처 숨겨진 마이크로 스팟에서 발견되는 히든 뱃지입니다.",
      icon: "detective",
      type: "HIDDEN",
      lat: place2.mapY,
      lng: place2.mapX,
      radiusM: 20,
      placeId: place2.id,
    },
  });
  const regionBadge = await prisma.badge.upsert({
    where: { key: "test_region_reward_1" },
    update: {},
    create: {
      key: "test_region_reward_1",
      name: `${regionA.sigunguName} 히든 뱃지 오픈 기념`,
      description: "지역이 Lv.2를 달성하면 지급되는 지역 레벨업 보상 뱃지입니다.",
      icon: "sunrise",
      type: "REGION",
      regionId: regionA.id,
    },
  });
  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId: targetUser.id, badgeId: hiddenBadge.id } },
    update: {},
    create: { userId: targetUser.id, badgeId: hiddenBadge.id },
  });
  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId: targetUser.id, badgeId: regionBadge.id } },
    update: {},
    create: { userId: targetUser.id, badgeId: regionBadge.id },
  });
  // 스페셜 퀘스트(SEASONAL) — 지금 활성 기간인 뱃지로 획득/미획득 두 상태를 모두 만들어 둔다
  const earnedSeasonalBadge = await prisma.badge.findUnique({ where: { key: "summer_2026_night_market" } });
  if (earnedSeasonalBadge) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: targetUser.id, badgeId: earnedSeasonalBadge.id } },
      update: {},
      create: { userId: targetUser.id, badgeId: earnedSeasonalBadge.id },
    });
  }
  // "summer_2026_watermelon_beach"는 지급하지 않아 status: "AVAILABLE" 케이스로 남겨둔다

  console.log(`✅ 테스트 계정(${targetUser.nickname}) 목데이터 시딩 완료!`);
  console.log(`- 관광지 ${places.length}개, 도장 3개, 매칭이력 4건, 후기 2건, 뱃지 지급 3건(스페셜 퀘스트 1건 포함)`);
  console.log(`- 지역: ${regionA.sigunguName}(인구감소) / ${regionB.sigunguName}(인구감소) / ${regionC.sigunguName}(일반)`);
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
