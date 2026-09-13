import { prisma } from "../utils/prisma.js";
import { getCurrentTrip } from "./match.service.js";
import { getActiveSeasonalBadges } from "./badge.service.js";
import { getGrowthRegions } from "./region.service.js";

// 운영자가 수동으로 껐다 켤 수 있는 홈 섹션 키 목록.
// 여기 없는 키는 sectionVisibility 응답에서 항상 true로 취급된다 (기본 노출).
const CONTROLLABLE_SECTION_KEYS = ["specialQuests", "trendingLocal"] as const;

type SectionKey = (typeof CONTROLLABLE_SECTION_KEYS)[number];

type SectionVisibilityMap = Record<SectionKey, boolean>;

interface HomeResult {
  currentTrip: Awaited<ReturnType<typeof getCurrentTrip>>;
  seasonalBadges: Awaited<ReturnType<typeof getActiveSeasonalBadges>>;
  growthRegions: Awaited<ReturnType<typeof getGrowthRegions>>;
  sectionVisibility: SectionVisibilityMap;
}

/**
 * section_visibility 테이블을 조회해 { specialQuests, trendingLocal } 형태로 정리합니다.
 * 행이 없는 섹션(운영자가 아직 끈 적 없음)은 기본값 true.
 */
async function getSectionVisibility(): Promise<SectionVisibilityMap> {
  const rows = await prisma.sectionVisibility.findMany({
    where: { sectionKey: { in: [...CONTROLLABLE_SECTION_KEYS] } },
  });

  const overrides = new Map(rows.map((row) => [row.sectionKey, row.enabled]));

  return CONTROLLABLE_SECTION_KEYS.reduce((acc, key) => {
    acc[key] = overrides.get(key) ?? true;
    return acc;
  }, {} as SectionVisibilityMap);
}

/**
 * 홈 화면 진입 시 필요한 데이터를 한 번에 내려줍니다.
 * - currentTrip: 이동 중인 여정 (로그인 유저 전용)
 * - seasonalBadges: 스페셜 퀘스트(시즌 한정 뱃지) 캐러셀
 * - growthRegions: 레벨업 임박 로컬 리스트
 * - sectionVisibility: 운영자가 끈 섹션은 false. 클라이언트는 isEmpty와 AND로 결합해서 사용.
 */
export async function getHomeData(userId: string): Promise<HomeResult> {
  const [currentTrip, seasonalBadges, growthRegions, sectionVisibility] = await Promise.all([
    getCurrentTrip(userId),
    getActiveSeasonalBadges(),
    getGrowthRegions(),
    getSectionVisibility(),
  ]);

  return { currentTrip, seasonalBadges, growthRegions, sectionVisibility };
}
