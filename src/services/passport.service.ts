import { prisma } from "../utils/prisma.js";

interface PassportRegion {
  regionId: string;
  sidoName: string;
  sigunguName: string;
  isDepopulated: boolean;
  isVisited: boolean;
  visitCount: number;
  lastVisitedAt: Date | null;
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
    throw new Error("존재하지 않는 사용자입니다.");
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
  });

  // regionId → 방문 정보 맵
  const visitedMap = new Map(
    visitedStamps.map((s) => [
      s.regionId,
      { count: s._count.id, lastVisitedAt: s._max.checkedInAt },
    ])
  );

  // 228개 지역 매핑
  const regions: PassportRegion[] = allRegions.map((region) => {
    const visited = visitedMap.get(region.id);
    return {
      regionId: region.id,
      sidoName: region.sidoName,
      sigunguName: region.sigunguName,
      isDepopulated: region.isDepopulated,
      isVisited: !!visited,
      visitCount: visited?.count ?? 0,
      lastVisitedAt: visited?.lastVisitedAt ?? null,
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
