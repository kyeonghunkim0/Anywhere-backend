import { prisma } from "../utils/prisma.js";
import { REGION_LEVELS, getNextRegionLevelTarget } from "../utils/gamification.js";
import { NotFoundError } from "../utils/errors.js";
import { formatRegionName } from "../utils/regionName.js";

interface GrowthRegionItem {
  regionId: string;
  sidoName: string;
  sigunguName: string;
  displayName: string; // 화면 표시용 (예: "부산 중구")
  isDepopulated: boolean;
  level: number;
  current: number;
  target: number;
  remaining: number; // "N명만 더 오면 레벨업!"
  imageUrl: string | null; // 지역 대표 사진
}

/**
 * 홈/랭킹 화면 [레벨업 임박 로컬] 리스트
 * - 다음 레벨까지 방문이 가장 적게 남은 인구감소지역 순으로 정렬
 */
export async function getGrowthRegions(limit: number = 10): Promise<GrowthRegionItem[]> {
  const regions = await prisma.region.findMany({
    where: { isDepopulated: true },
  });

  const items = regions
    .map((region) => {
      const nextTarget = getNextRegionLevelTarget(region.visitCount);
      return { region, nextTarget };
    })
    .filter((item) => item.nextTarget !== null) as {
    region: (typeof regions)[number];
    nextTarget: NonNullable<ReturnType<typeof getNextRegionLevelTarget>>;
  }[];

  return items
    .sort((a, b) => a.nextTarget.remaining - b.nextTarget.remaining)
    .slice(0, limit)
    .map(({ region, nextTarget }) => ({
      regionId: region.id,
      sidoName: region.sidoName,
      sigunguName: region.sigunguName,
      displayName: formatRegionName(region.sidoName, region.sigunguName),
      isDepopulated: region.isDepopulated,
      level: region.level,
      current: nextTarget.current,
      target: nextTarget.target,
      remaining: nextTarget.remaining,
      imageUrl: region.imageUrl,
    }));
}

interface RegionLevelRow {
  level: number;
  label: string;
  reward: string;
  achieved: boolean;
}

interface RegionStat {
  label: string;
  value: string | number;
}

interface RegionDetailResult {
  regionId: string;
  sidoName: string;
  sigunguName: string;
  displayName: string; // 화면 표시용 (예: "부산 중구")
  isDepopulated: boolean;
  level: number;
  current: number;
  target: number | null; // 최고 레벨 달성 시 null
  progressLabel: string; // "5.3%" 등 progress bar용
  remainLabel: string; // "15명만 더 오면 레벨업!"
  quote: string | null;
  imageUrl: string | null; // 지역 대표 사진
  imageCredit: string | null; // 촬영자 (라이선스 표시용)
  stats: RegionStat[];
  levels: RegionLevelRow[];
}

/**
 * 지역 상세 (여권 - 지역 카드 상세) 조회
 */
export async function getRegionDetail(regionId: string): Promise<RegionDetailResult> {
  const region = await prisma.region.findUnique({ where: { id: regionId } });
  if (!region) {
    throw new NotFoundError("존재하지 않는 지역입니다.");
  }

  const [visitorCount, uniqueVisitorCount] = await Promise.all([
    prisma.userStamp.count({ where: { regionId } }),
    prisma.userStamp.findMany({
      where: { regionId },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);

  const nextTarget = getNextRegionLevelTarget(region.visitCount);
  const target = nextTarget?.target ?? null;
  const progressPercent = target
    ? Math.min(100, Math.round((region.visitCount / target) * 1000) / 10)
    : 100;

  return {
    regionId: region.id,
    sidoName: region.sidoName,
    sigunguName: region.sigunguName,
    displayName: formatRegionName(region.sidoName, region.sigunguName),
    isDepopulated: region.isDepopulated,
    level: region.level,
    current: region.visitCount,
    target,
    progressLabel: `${progressPercent}%`,
    remainLabel: nextTarget
      ? `${nextTarget.remaining}명만 더 오면 레벨업!`
      : "최고 레벨을 달성했어요!",
    quote: region.quote,
    imageUrl: region.imageUrl,
    imageCredit: region.imageCredit,
    stats: [
      { label: "누적 방문", value: visitorCount },
      { label: "방문자 수", value: uniqueVisitorCount.length },
      { label: "레벨", value: `Lv.${region.level}` },
    ],
    levels: REGION_LEVELS.map((def) => ({
      level: def.level,
      label: def.label,
      reward: def.reward,
      achieved: region.level >= def.level,
    })),
  };
}
