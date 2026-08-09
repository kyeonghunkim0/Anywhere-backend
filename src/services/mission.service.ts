import { prisma } from "../utils/prisma.js";
import { isWithinRadius } from "../utils/haversine.js";
import { getRegionLevel } from "../utils/gamification.js";

interface CheckInInput {
  userId: string;
  placeId: string;
  userLat: number;
  userLng: number;
}

interface EarnedBadge {
  id: string;
  key: string;
  name: string;
  icon: string;
}

interface CheckInResult {
  success: boolean;
  message: string;
  stamp?: {
    id: string;
    placeName: string;
    regionName: string;
    isDepopulated: boolean;
    bonusMultiplier: number; // 1 = 일반, 2 = 인구감소지역 보상 2배
    stampsEarned: number; // 이번에 획득한 도장 수
    checkedInAt: Date;
    totalStamps: number;
    visitorNumber: number; // 해당 지역의 N번째 방문자 각인
    regionLevel: number; // 체크인 반영 후 지역 레벨
    regionLeveledUp: boolean; // 이번 체크인으로 지역이 레벨업했는지 여부
  };
  newBadges?: EarnedBadge[]; // 이번 체크인으로 새로 획득한 로컬 히든 뱃지
}

/**
 * 체크인 (방문 인증) 처리
 * 1. 목적지 좌표를 DB에서 조회
 * 2. 현재 GPS와 목적지 GPS를 Haversine 공식으로 거리 계산
 * 3. 반경 500m 이내일 경우에만 체크인 성공
 * 4. UserStamp INSERT + 유저 도장 카운트 업데이트
 * 5. 인구감소지역이면 보상 2배 (도장 +2)
 */
export async function checkIn(input: CheckInInput): Promise<CheckInResult> {
  const { userId, placeId, userLat, userLng } = input;

  // 1. 대상 장소 조회
  const place = await prisma.place.findUnique({
    where: { id: placeId },
    include: { region: true },
  });

  if (!place) {
    return {
      success: false,
      message: "존재하지 않는 관광지입니다.",
    };
  }

  // 2. GPS 거리 검증 (반경 500m)
  const withinRange = isWithinRadius(userLat, userLng, place.mapY, place.mapX, 500);

  if (!withinRange) {
    return {
      success: false,
      message: "현재 위치가 목적지에서 500m 이상 떨어져 있습니다. 더 가까이 이동해주세요!",
    };
  }

  // 3. 중복 체크인 방지 (같은 장소에 오늘 이미 체크인했는지 확인)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingStamp = await prisma.userStamp.findFirst({
    where: {
      userId,
      placeId,
      checkedInAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  if (existingStamp) {
    return {
      success: false,
      message: "오늘 이미 이 장소에 체크인하셨습니다. 내일 다시 방문해주세요!",
    };
  }

  // 4. 인구감소지역 보상 2배 적용
  const isDepopulated = place.region.isDepopulated;
  const bonusMultiplier = isDepopulated ? 2 : 1;
  const stampsEarned = bonusMultiplier; // 일반 1개, 인구감소지역 2개

  // 5. 지역 성장 게이지 갱신 (누적 방문 수 +1) + N번째 방문자 각인 번호 확정
  const previousLevel = getRegionLevel(place.region.visitCount);
  const updatedRegion = await prisma.region.update({
    where: { id: place.regionId },
    data: { visitCount: { increment: 1 } },
  });
  const visitorNumber = updatedRegion.visitCount;
  const regionLevel = getRegionLevel(visitorNumber);
  const regionLeveledUp = regionLevel > previousLevel;

  if (regionLeveledUp) {
    await prisma.region.update({
      where: { id: place.regionId },
      data: { level: regionLevel },
    });
  }

  // 5.5. 확정된 여정("여기로 결정")을 통한 체크인이면 도장에 연결해서 이동 거리 집계에 반영
  const confirmedTrip = await prisma.matchHistory.findFirst({
    where: { userId, placeId, confirmedAt: { not: null }, cancelledAt: null, stamp: null },
    orderBy: { confirmedAt: "desc" },
  });

  // 6. 트랜잭션으로 도장 기록 + 카운트 업데이트
  const [stamp, updatedUser] = await prisma.$transaction([
    prisma.userStamp.create({
      data: {
        userId,
        placeId,
        regionId: place.regionId,
        visitorNumber,
        matchHistoryId: confirmedTrip?.id,
        distanceKm: confirmedTrip?.distanceKm,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { totalStamps: { increment: stampsEarned } },
    }),
  ]);

  // 7. 로컬 히든 퀘스트 뱃지 판정 (반경 내 마이크로 스팟 접근 시 자동 획득)
  const newBadges = await awardHiddenBadges({
    userId,
    userLat,
    userLng,
    placeId,
    regionId: place.regionId,
  });

  const bonusMessage = isDepopulated
    ? `🌟 로컬 상생 지역 보너스! 도장 ${stampsEarned}개 획득!`
    : `도장 ${stampsEarned}개 획득!`;

  return {
    success: true,
    message: `🎉 ${place.name} 방문 인증 완료! ${bonusMessage}`,
    stamp: {
      id: stamp.id,
      placeName: place.name,
      regionName: `${place.region.sidoName} ${place.region.sigunguName}`,
      isDepopulated,
      bonusMultiplier,
      stampsEarned,
      checkedInAt: stamp.checkedInAt,
      totalStamps: updatedUser.totalStamps,
      visitorNumber,
      regionLevel,
      regionLeveledUp,
    },
    newBadges,
  };
}

/**
 * 반경 내 활성화된 로컬 히든 퀘스트(마이크로 스팟) 뱃지를 판정하여 자동 지급
 * - 특정 장소/지역에 결부된 히든 뱃지 중, 유저 GPS가 지정된 반경(radiusM) 이내이고
 *   아직 획득하지 않은 뱃지를 획득 처리한다.
 */
async function awardHiddenBadges(input: {
  userId: string;
  userLat: number;
  userLng: number;
  placeId: string;
  regionId: string;
}): Promise<EarnedBadge[]> {
  const { userId, userLat, userLng, placeId, regionId } = input;
  const now = new Date();

  const candidates = await prisma.badge.findMany({
    where: {
      type: "HIDDEN",
      lat: { not: null },
      lng: { not: null },
      OR: [{ placeId }, { regionId, placeId: null }],
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
  });

  if (candidates.length === 0) return [];

  const alreadyEarned = new Set(
    (
      await prisma.userBadge.findMany({
        where: { userId, badgeId: { in: candidates.map((b) => b.id) } },
        select: { badgeId: true },
      })
    ).map((ub) => ub.badgeId)
  );

  const earned: EarnedBadge[] = [];

  for (const badge of candidates) {
    if (alreadyEarned.has(badge.id)) continue;
    if (badge.lat === null || badge.lng === null) continue;

    const withinMicroSpot = isWithinRadius(
      userLat,
      userLng,
      badge.lat,
      badge.lng,
      badge.radiusM ?? 20
    );

    if (!withinMicroSpot) continue;

    await prisma.userBadge.create({
      data: { userId, badgeId: badge.id },
    });

    earned.push({ id: badge.id, key: badge.key, name: badge.name, icon: badge.icon });
  }

  return earned;
}
