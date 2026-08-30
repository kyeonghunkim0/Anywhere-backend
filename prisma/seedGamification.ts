import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

/**
 * 큐레이션 해시태그 (홈 화면 상단 감성 태그 칩)
 */
const tags = [
  { label: "#밤하늘_별맛집", emoji: "✨" },
  { label: "#현지인_추천_노포", emoji: "🍚" },
  { label: "#바다향기", emoji: "🌊" },
  { label: "#골목_산책", emoji: "🚶" },
  { label: "#숨은_출사명소", emoji: "📷" },
];

/**
 * 스페셜(시즌 한정) & 로컬 히든 퀘스트 뱃지 샘플
 * - SEASONAL: 마감 기한(D-day)이 있는 시즌 한정 뱃지
 * - HIDDEN: 반경 10~20m 마이크로 스팟에서만 활성화되는 히든 뱃지
 */
const badges = [
  {
    key: "jinhae_2026_spring",
    name: "진해 군항제 벚꽃",
    description: "군항제 방문 인증",
    icon: "cherry-blossom",
    type: "SEASONAL",
    startAt: new Date("2026-03-28"),
    endAt: new Date("2026-04-06"),
  },
  {
    key: "autumn_secret_fishing_spot",
    name: "강태공의 계절",
    description: "비밀 낚시터 방문 인증",
    icon: "fish",
    type: "SEASONAL",
    startAt: new Date("2026-09-01"),
    endAt: new Date("2026-11-30"),
  },
  {
    key: "summer_2026_night_market",
    name: "여름밤 야시장",
    description: "야시장 맛집 방문 인증",
    icon: "night-market",
    type: "SEASONAL",
    startAt: new Date("2026-08-01"),
    endAt: new Date("2026-08-31"),
  },
  {
    key: "summer_2026_watermelon_beach",
    name: "수박 비치 파티",
    description: "해변 수박 축제 방문 인증",
    icon: "watermelon",
    type: "SEASONAL",
    startAt: new Date("2026-08-10"),
    endAt: new Date("2026-09-10"),
  },
];

/**
 * 지역(REGION) 뱃지 - 기초자치단체 수집판 뱃지 (지역 1곳 = 뱃지 1개)
 * - regionId(시·도 + 시·군·구)로 지역에 연결한다. 좌표(lat/lng)는 없다.
 * - icon 값은 assets/badges/<icon>.png 파일과 1:1로 대응하며,
 *   DB에는 `badges/<icon>.png` 상대 경로로 저장한다. (서버가 /static 으로 서빙)
 */
const regionBadges = [
  { key: "gangwon_donghae", icon: "gangwon-donghae", sidoName: "강원특별자치도", sigunguName: "동해시" },
  { key: "gangwon_yanggu", icon: "gangwon-yanggu", sidoName: "강원특별자치도", sigunguName: "양구군" },
  { key: "gangwon_goseong", icon: "gangwon-goseong", sidoName: "강원특별자치도", sigunguName: "고성군" },
  { key: "gangwon_yeongwol", icon: "gangwon-yeongwol", sidoName: "강원특별자치도", sigunguName: "영월군" },
  { key: "gangwon_samcheok", icon: "gangwon-samcheok", sidoName: "강원특별자치도", sigunguName: "삼척시" },
  { key: "gangwon_inje", icon: "gangwon-inje", sidoName: "강원특별자치도", sigunguName: "인제군" },
  { key: "gangwon_yangyang", icon: "gangwon-yangyang", sidoName: "강원특별자치도", sigunguName: "양양군" },
];

/** 시·도명 → 수집판 표시용 짧은 이름 (예: "강원특별자치도" → "강원") */
const SHORT_SIDO: Record<string, string> = {
  강원특별자치도: "강원",
};

async function main() {
  console.log("🌱 큐레이션 태그 & 뱃지 시딩 시작...\n");

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { label: tag.label },
      update: { emoji: tag.emoji },
      create: tag,
    });
  }

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: badge,
      create: badge,
    });
  }

  // 예전 랜드마크식 key로 만들어졌던 지역 뱃지 정리 (기초자치단체 뱃지로 재정의)
  await prisma.badge.deleteMany({
    where: {
      key: {
        in: [
          "gangwon_donghae_lighthouse",
          "gangwon_yanggu_punchbowl",
          "gangwon_goseong_observatory",
          "gangwon_yeongwol_donggang",
          "gangwon_samcheok_cave",
          "gangwon_inje_birch_forest",
          "gangwon_yangyang_surfbeach",
        ],
      },
    },
  });

  let regionBadgeCount = 0;
  for (const badge of regionBadges) {
    const region = await prisma.region.findFirst({
      where: { sidoName: badge.sidoName, sigunguName: badge.sigunguName },
    });
    if (!region) {
      console.warn(`  ⚠️  "${badge.sidoName} ${badge.sigunguName}" 지역이 없어 건너뜁니다. (npm run seed 먼저 실행)`);
      continue;
    }

    const shortSido = SHORT_SIDO[badge.sidoName] ?? badge.sidoName;
    const data = {
      key: badge.key,
      name: `${shortSido} ${badge.sigunguName}`,
      description: `${badge.sidoName} ${badge.sigunguName} 기초자치단체 뱃지`,
      icon: `badges/${badge.icon}.png`,
      type: "REGION",
      regionId: region.id,
    };
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: data,
      create: data,
    });
    regionBadgeCount += 1;
  }

  console.log(
    `✅ 시딩 완료! 태그 ${tags.length}개, 시즌 뱃지 ${badges.length}개, 지역 뱃지 ${regionBadgeCount}개`
  );
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
