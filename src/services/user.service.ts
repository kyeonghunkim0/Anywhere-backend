import { prisma } from "../utils/prisma.js";
import { getUserLevel } from "../utils/gamification.js";
import { getMyRanking } from "./ranking.service.js";

interface UserProfile {
  id: string;
  nickname: string;
  socialType: string;
  totalStamps: number;
  profileImage: string | null;
  pushEnabled: boolean;
  level: number;
  levelLabel: string;
}

function toProfile(user: {
  id: string;
  nickname: string;
  socialType: string;
  totalStamps: number;
  profileImage: string | null;
  pushEnabled: boolean;
}): UserProfile {
  const { level, label } = getUserLevel(user.totalStamps);
  return {
    id: user.id,
    nickname: user.nickname,
    socialType: user.socialType,
    totalStamps: user.totalStamps,
    profileImage: user.profileImage,
    pushEnabled: user.pushEnabled,
    level,
    levelLabel: label,
  };
}

/**
 * 내 프로필 조회
 */
export async function getMyProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("존재하지 않는 사용자입니다.");
  return toProfile(user);
}

interface ProfileStatsResult {
  joinedAt: Date;
  collectedRegions: number; // 수집 도시 (지역) 수
  totalRegions: number; // 전국 기초자치단체 총 개수
  depopulatedVisitedRegions: number; // 방문한 지역 중 인구감소지역 수
  depopulatedVisitedPercent: number; // collectedRegions 대비 비율 (%)
  totalDistanceKm: number; // 확정 여정을 통해 체크인한 누적 이동 거리
  recentStamp: { placeName: string; regionName: string; checkedInAt: Date } | null;
  badgeCount: number;
  reviewCount: number;
  nationalRank: number;
  totalUsers: number;
}

/**
 * 내 프로필 상세 통계 (프로필 화면 - 수집 도시/소멸지역 기여도/누적 이동/기록 섹션)
 */
export async function getMyProfileStats(userId: string): Promise<ProfileStatsResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("존재하지 않는 사용자입니다.");

  const [
    totalRegions,
    visitedRegionIds,
    depopulatedVisitedRegions,
    distanceAgg,
    recentStamp,
    badgeCount,
    reviewCount,
    myRanking,
  ] = await Promise.all([
    prisma.region.count(),
    prisma.userStamp.findMany({ where: { userId }, distinct: ["regionId"], select: { regionId: true } }),
    prisma.userStamp
      .findMany({
        where: { userId, region: { isDepopulated: true } },
        distinct: ["regionId"],
        select: { regionId: true },
      })
      .then((r) => r.length),
    prisma.userStamp.aggregate({ where: { userId }, _sum: { distanceKm: true } }),
    prisma.userStamp.findFirst({
      where: { userId },
      orderBy: { checkedInAt: "desc" },
      include: { place: true, region: true },
    }),
    prisma.userBadge.count({ where: { userId } }),
    prisma.review.count({ where: { userId } }),
    getMyRanking(userId),
  ]);

  const collectedRegions = visitedRegionIds.length;

  return {
    joinedAt: user.createdAt,
    collectedRegions,
    totalRegions,
    depopulatedVisitedRegions,
    depopulatedVisitedPercent:
      collectedRegions > 0 ? Math.round((depopulatedVisitedRegions / collectedRegions) * 1000) / 10 : 0,
    totalDistanceKm: Math.round((distanceAgg._sum.distanceKm ?? 0) * 10) / 10,
    recentStamp: recentStamp
      ? {
          placeName: recentStamp.place.name,
          regionName: `${recentStamp.region.sidoName} ${recentStamp.region.sigunguName}`,
          checkedInAt: recentStamp.checkedInAt,
        }
      : null,
    badgeCount,
    reviewCount,
    nationalRank: myRanking.rank,
    totalUsers: myRanking.totalUsers,
  };
}

interface UpdateProfileInput {
  nickname?: string;
  profileImage?: string;
}

/**
 * 프로필 편집 (닉네임 최대 12자, 프로필 이미지)
 */
export async function updateMyProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UserProfile> {
  const { nickname, profileImage } = input;

  if (nickname !== undefined && nickname.length > 12) {
    throw new Error("닉네임은 12자 이내로 입력해주세요.");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(nickname !== undefined ? { nickname } : {}),
      ...(profileImage !== undefined ? { profileImage } : {}),
    },
  });

  return toProfile(user);
}

/**
 * 설정 - 푸시 알림 on/off
 */
export async function updateMySettings(
  userId: string,
  pushEnabled: boolean
): Promise<UserProfile> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { pushEnabled },
  });

  return toProfile(user);
}

interface WeekActivity {
  label: string; // "7/1주" 등
  count: number;
}

interface RepresentativeStamp {
  regionId: string;
  sidoName: string;
  sigunguName: string;
  visitCount: number;
}

interface RankerDetail {
  userId: string;
  nickname: string;
  profileImage: string | null;
  level: number;
  levelLabel: string;
  totalStamps: number;
  dash: { label: string; value: string | number }[];
  weeks: WeekActivity[];
  stamps: RepresentativeStamp[];
}

/**
 * 랭킹 유저 상세 (여권형 대시보드) - 이번 달 활동 그래프 + 대표 도장
 */
export async function getRankerDetail(userId: string): Promise<RankerDetail> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("존재하지 않는 사용자입니다.");

  const [visitedRegionCount, depopulatedVisitCount, weeklyStamps, topRegions] = await Promise.all([
    prisma.userStamp
      .findMany({ where: { userId }, distinct: ["regionId"], select: { regionId: true } })
      .then((r) => r.length),
    prisma.userStamp.count({ where: { userId, region: { isDepopulated: true } } }),
    getLast8WeeksActivity(userId),
    getTopRegions(userId, 4),
  ]);

  const { level, label } = getUserLevel(user.totalStamps);

  return {
    userId: user.id,
    nickname: user.nickname,
    profileImage: user.profileImage,
    level,
    levelLabel: label,
    totalStamps: user.totalStamps,
    dash: [
      { label: "총 도장", value: user.totalStamps },
      { label: "방문 지역", value: visitedRegionCount },
      { label: "소멸지역 기여", value: depopulatedVisitCount },
      { label: "레벨", value: `Lv.${level}` },
    ],
    weeks: weeklyStamps,
    stamps: topRegions,
  };
}

/**
 * 최근 8주간 주차별 체크인 활동 집계 (활동 그래프용)
 */
async function getLast8WeeksActivity(userId: string): Promise<WeekActivity[]> {
  const WEEKS = 8;
  const now = new Date();
  const weeks: WeekActivity[] = [];

  for (let i = WEEKS - 1; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const count = await prisma.userStamp.count({
      where: { userId, checkedInAt: { gte: weekStart, lte: weekEnd } },
    });

    weeks.push({ label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`, count });
  }

  return weeks;
}

/**
 * 유저가 가장 많이 체크인한 지역 상위 N개 (대표 도장)
 */
async function getTopRegions(userId: string, limit: number): Promise<RepresentativeStamp[]> {
  const grouped = await prisma.userStamp.groupBy({
    by: ["regionId"],
    where: { userId },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const regions = await prisma.region.findMany({
    where: { id: { in: grouped.map((g) => g.regionId) } },
  });
  const regionMap = new Map(regions.map((r) => [r.id, r]));

  return grouped.map((g) => {
    const region = regionMap.get(g.regionId);
    return {
      regionId: g.regionId,
      sidoName: region?.sidoName ?? "",
      sigunguName: region?.sigunguName ?? "",
      visitCount: g._count.id,
    };
  });
}
