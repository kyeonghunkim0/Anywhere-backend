import { prisma } from "../utils/prisma.js";

interface UserRankItem {
  rank: number;
  userId: string;
  nickname: string;
  totalStamps: number;
}

interface PlaceRankItem {
  rank: number;
  regionId: string;
  sidoName: string;
  sigunguName: string;
  visitCount: number;
}

/**
 * 전체 사용자 도장 개수 기준 TOP 10
 */
export async function getUserRanking(): Promise<UserRankItem[]> {
  const topUsers = await prisma.user.findMany({
    orderBy: { totalStamps: "desc" },
    take: 10,
    select: {
      id: true,
      nickname: true,
      totalStamps: true,
    },
  });

  return topUsers.map((user, index) => ({
    rank: index + 1,
    userId: user.id,
    nickname: user.nickname,
    totalStamps: user.totalStamps,
  }));
}

/**
 * 최근 1주일간 가장 많이 체크인된 지역 TOP 10
 */
export async function getPlaceRanking(): Promise<PlaceRankItem[]> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // regionId 기준으로 최근 1주일 체크인 횟수 집계
  const topRegions = await prisma.userStamp.groupBy({
    by: ["regionId"],
    where: {
      checkedInAt: { gte: oneWeekAgo },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  if (topRegions.length === 0) {
    return [];
  }

  // region 상세 정보 조회
  const regionIds = topRegions.map((r) => r.regionId);
  const regions = await prisma.region.findMany({
    where: { id: { in: regionIds } },
  });

  const regionMap = new Map(regions.map((r) => [r.id, r]));

  return topRegions.map((item, index) => {
    const region = regionMap.get(item.regionId);
    return {
      rank: index + 1,
      regionId: item.regionId,
      sidoName: region?.sidoName ?? "",
      sigunguName: region?.sigunguName ?? "",
      visitCount: item._count.id,
    };
  });
}
