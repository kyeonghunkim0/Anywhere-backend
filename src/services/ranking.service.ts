import { prisma } from "../utils/prisma.js";
import { NotFoundError } from "../utils/errors.js";
import { formatRegionName } from "../utils/regionName.js";
import { CITY_COUNTY_ONLY } from "../utils/regionFilter.js";

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
  displayName: string; // 화면 표시용 (예: "부산 중구")
  isDepopulated: boolean;
  visitCount: number;
}

interface MyRankResult {
  rank: number;
  totalUsers: number;
  userId: string;
  nickname: string;
  totalStamps: number;
  topPercentage: number; // 상위 N%
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
      region: CITY_COUNTY_ONLY,
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
      displayName: region ? formatRegionName(region.sidoName, region.sigunguName) : "",
      isDepopulated: region?.isDepopulated ?? false,
      visitCount: item._count.id,
    };
  });
}

/**
 * 내 랭킹 조회
 * - 전체 유저 중 내 순위를 계산하여 반환
 * - 상위 N% 정보 포함
 */
export async function getMyRanking(userId: string): Promise<MyRankResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nickname: true, totalStamps: true },
  });

  if (!user) {
    throw new NotFoundError("존재하지 않는 사용자입니다.");
  }

  // 나보다 도장이 많은 유저 수 = 내 순위 - 1
  const usersAbove = await prisma.user.count({
    where: {
      totalStamps: { gt: user.totalStamps },
    },
  });

  const totalUsers = await prisma.user.count();

  const rank = usersAbove + 1;
  const topPercentage = totalUsers > 0
    ? Math.round((rank / totalUsers) * 1000) / 10
    : 0;

  return {
    rank,
    totalUsers,
    userId: user.id,
    nickname: user.nickname,
    totalStamps: user.totalStamps,
    topPercentage,
  };
}
