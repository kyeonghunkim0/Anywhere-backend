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

  console.log(`✅ 시딩 완료! 태그 ${tags.length}개, 뱃지 ${badges.length}개`);
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
