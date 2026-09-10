import { prisma } from "../utils/prisma.js";
import { toPublicAssetUrl } from "../utils/assetUrl.js";

type BadgeStatus = "EARNED" | "AVAILABLE" | "EXPIRED";

interface BadgeItem {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  type: string; // "SEASONAL" | "HIDDEN" | "REGION"
  status: BadgeStatus;
  earnedAt: Date | null;
  daysRemaining: number | null; // 시즌 한정 뱃지 마감까지 D-day (음수면 마감)
  isLocationHidden: boolean; // 히든 퀘스트 미획득 시 좌표를 노출하지 않음
  lat: number | null;
  lng: number | null;
  radiusM: number | null;
  regionId: string | null;
  placeId: string | null;
}

/**
 * 유저의 스페셜(시즌 한정) & 로컬 히든 뱃지 전체 현황 조회
 * - 시즌 한정 뱃지: 마감이 지난 뱃지는 목록에서 제외 (미획득 상태에 한함)
 * - 히든 뱃지: 미획득 상태에서는 좌표를 노출하지 않아 수집 재미를 해치지 않음
 */
export async function getUserBadges(userId: string): Promise<BadgeItem[]> {
  const now = new Date();

  // 기초자치단체(REGION) 뱃지는 여권/수집판 전용이므로 이 목록에서는 제외한다.
  const [badges, userBadges] = await Promise.all([
    prisma.badge.findMany({
      where: { type: { not: "REGION" } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userBadge.findMany({ where: { userId } }),
  ]);

  const earnedMap = new Map(userBadges.map((ub) => [ub.badgeId, ub.earnedAt]));

  return badges
    .filter((badge) => {
      const isEarned = earnedMap.has(badge.id);
      const isExpiredSeasonal = badge.type === "SEASONAL" && badge.endAt && badge.endAt < now;
      // 미획득 + 마감된 시즌 뱃지는 노출하지 않음 (더 이상 획득 불가하므로)
      return isEarned || !isExpiredSeasonal;
    })
    .map((badge) => {
      const earnedAt = earnedMap.get(badge.id) ?? null;
      const isEarned = earnedAt !== null;

      let daysRemaining: number | null = null;
      if (badge.endAt) {
        const diffMs = badge.endAt.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }

      let status: BadgeStatus = "AVAILABLE";
      if (isEarned) status = "EARNED";
      else if (daysRemaining !== null && daysRemaining < 0) status = "EXPIRED";

      const isLocationHidden = badge.type === "HIDDEN" && !isEarned;

      return {
        id: badge.id,
        key: badge.key,
        name: badge.name,
        description: badge.description,
        icon: toPublicAssetUrl(badge.icon) ?? badge.icon,
        type: badge.type,
        status,
        earnedAt,
        daysRemaining,
        isLocationHidden,
        lat: isLocationHidden ? null : badge.lat,
        lng: isLocationHidden ? null : badge.lng,
        radiusM: isLocationHidden ? null : badge.radiusM,
        regionId: badge.regionId,
        placeId: badge.placeId,
      };
    });
}

/**
 * 홈 화면 [스페셜 퀘스트] 캐러셀용 - 진행 중인 시즌 한정 뱃지 목록
 */
export async function getActiveSeasonalBadges(): Promise<BadgeItem[]> {
  const now = new Date();

  const badges = await prisma.badge.findMany({
    where: {
      type: "SEASONAL",
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    },
    orderBy: { endAt: "asc" },
  });

  return badges.map((badge) => {
    const daysRemaining = badge.endAt
      ? Math.ceil((badge.endAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      id: badge.id,
      key: badge.key,
      name: badge.name,
      description: badge.description,
      icon: toPublicAssetUrl(badge.icon) ?? badge.icon,
      type: badge.type,
      status: "AVAILABLE",
      earnedAt: null,
      daysRemaining,
      isLocationHidden: false,
      lat: badge.lat,
      lng: badge.lng,
      radiusM: badge.radiusM,
      regionId: badge.regionId,
      placeId: badge.placeId,
    };
  });
}

// ============================================
// 기초자치단체(REGION) 뱃지 - 여권/수집판용
// ============================================

export interface RegionBadgeSummary {
  key: string;
  name: string;
  description: string;
  icon: string; // 절대 URL로 변환된 아이콘 주소
}

/**
 * regionId → 해당 지역의 기초자치단체 뱃지 요약 맵.
 * 여권(passport)·수집판(regions/growth)에서 지역마다 뱃지를 붙일 때 사용한다.
 * regionIds를 주면 그 지역만, 없으면 전체 REGION 뱃지를 조회한다.
 */
export async function getRegionBadgeMap(
  regionIds?: string[]
): Promise<Map<string, RegionBadgeSummary>> {
  const badges = await prisma.badge.findMany({
    where: {
      type: "REGION",
      regionId: regionIds ? { in: regionIds } : { not: null },
    },
  });

  const map = new Map<string, RegionBadgeSummary>();
  for (const badge of badges) {
    if (!badge.regionId) continue;
    map.set(badge.regionId, {
      key: badge.key,
      name: badge.name,
      description: badge.description,
      icon: toPublicAssetUrl(badge.icon) ?? badge.icon,
    });
  }
  return map;
}
