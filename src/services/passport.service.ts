import { prisma } from "../utils/prisma.js";
import { NotFoundError } from "../utils/errors.js";
import { formatRegionName } from "../utils/regionName.js";

interface PassportRegion {
  regionId: string;
  sidoName: string;
  sigunguName: string;
  displayName: string; // 화면 표시용 (예: "부산 중구")
  isDepopulated: boolean;
  isVisited: boolean;
  visitCount: number;
  lastVisitedAt: Date | null;
  level: number; // 지역 로컬 성장 레벨
  visitorNumber: number | null; // 내가 그 지역의 몇 번째 방문자였는지 (최초 방문 기준)
}

interface PassportResult {
  userId: string;
  nickname: string;
  totalStamps: number;
  totalRegions: number;
  visitedRegions: number;
  completionRate: number; // 0~100 퍼센트
  regions: PassportRegion[];
}

/**
 * 사용자의 228개 지역 도장 수집 현황 조회
 */
export async function getPassport(userId: string): Promise<PassportResult> {
  // 유저 정보
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("존재하지 않는 사용자입니다.");
  }

  // 전체 지역 목록
  const allRegions = await prisma.region.findMany({
    orderBy: [{ sidoName: "asc" }, { sigunguName: "asc" }],
  });

  // 해당 유저의 방문 기록을 regionId 기준으로 집계
  const visitedStamps = await prisma.userStamp.groupBy({
    by: ["regionId"],
    where: { userId },
    _count: { id: true },
    _max: { checkedInAt: true },
    _min: { visitorNumber: true }, // 최초 방문 시점의 N번째 방문자 번호
  });

  // regionId → 방문 정보 맵
  const visitedMap = new Map(
    visitedStamps.map((s) => [
      s.regionId,
      {
        count: s._count.id,
        lastVisitedAt: s._max.checkedInAt,
        visitorNumber: s._min.visitorNumber,
      },
    ])
  );

  // 228개 지역 매핑
  const regions: PassportRegion[] = allRegions.map((region) => {
    const visited = visitedMap.get(region.id);
    return {
      regionId: region.id,
      sidoName: region.sidoName,
      sigunguName: region.sigunguName,
      displayName: formatRegionName(region.sidoName, region.sigunguName),
      isDepopulated: region.isDepopulated,
      isVisited: !!visited,
      visitCount: visited?.count ?? 0,
      lastVisitedAt: visited?.lastVisitedAt ?? null,
      level: region.level,
      visitorNumber: visited?.visitorNumber ?? null,
    };
  });

  const visitedRegions = regions.filter((r) => r.isVisited).length;

  return {
    userId: user.id,
    nickname: user.nickname,
    totalStamps: user.totalStamps,
    totalRegions: allRegions.length,
    visitedRegions,
    completionRate: allRegions.length > 0
      ? Math.round((visitedRegions / allRegions.length) * 1000) / 10
      : 0,
    regions,
  };
}
