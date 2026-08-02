import { prisma } from "../utils/prisma.js";
import { haversineDistance } from "../utils/haversine.js";

const MAX_DAILY_MATCHES = 3;

interface MatchInput {
  userId: string;
  userLat: number;
  userLng: number;
  radiusKm?: number; // 기본값: 50km
  tagId?: string; // 큐레이션 해시태그 필터 (예: #밤하늘_별맛집)
}

interface MatchResult {
  place: {
    id: string;
    name: string;
    address: string;
    thumbnail: string | null;
    mapX: number;
    mapY: number;
    distanceKm: number;
  };
  region: {
    id: string;
    sidoName: string;
    sigunguName: string;
    isDepopulated: boolean;
  };
  matchInfo: {
    remainingMatches: number; // 오늘 남은 매칭 횟수
    isDepopulatedBonus: boolean; // 인구감소지역 골드 배지
  };
}

/**
 * 사용자 GPS 기반 랜덤 관광지 매칭
 * - 반경 N km 이내의 관광지 중 랜덤 1곳 반환
 * - 인구감소지역 70% 가중치 적용
 * - 하루 최대 3회 제한
 * - 이미 방문한 장소는 우선순위를 낮춤
 */
export async function getRandomMatch(input: MatchInput): Promise<MatchResult | null> {
  const { userId, userLat, userLng, radiusKm = 50, tagId } = input;

  // 0. 일일 매칭 횟수 체크
  const todayCount = await getTodayMatchCount(userId);
  if (todayCount >= MAX_DAILY_MATCHES) {
    throw new MatchLimitExceededError(
      `오늘의 매칭 횟수(${MAX_DAILY_MATCHES}회)를 모두 사용했습니다. 내일 다시 시도해주세요!`
    );
  }

  // 1. 전체 관광지를 region 정보와 함께 조회 (큐레이션 태그 선택 시 해당 태그로 필터링)
  const allPlaces = await prisma.place.findMany({
    where: tagId ? { tags: { some: { tagId } } } : undefined,
    include: {
      region: true,
    },
  });

  if (allPlaces.length === 0) {
    return null;
  }

  // 2. 반경 내 관광지 필터링 + 거리 계산
  const nearbyPlaces = allPlaces
    .map((place) => ({
      ...place,
      distanceKm: haversineDistance(userLat, userLng, place.mapY, place.mapX),
    }))
    .filter((place) => place.distanceKm <= radiusKm);

  if (nearbyPlaces.length === 0) {
    return null;
  }

  // 3. 이미 방문한 장소 목록 조회 (우선순위 낮춤)
  const visitedPlaceIds = new Set(
    (
      await prisma.userStamp.findMany({
        where: { userId },
        select: { placeId: true },
        distinct: ["placeId"],
      })
    ).map((s) => s.placeId)
  );

  // 4. 인구감소지역 70% 가중치 + 방문 여부 반영 랜덤 선택
  const selected = weightedRandomSelect(nearbyPlaces, visitedPlaceIds);

  // 5. 매칭 이력 기록
  await prisma.matchHistory.create({
    data: {
      userId,
      placeId: selected.id,
    },
  });

  const remainingMatches = MAX_DAILY_MATCHES - todayCount - 1;

  return {
    place: {
      id: selected.id,
      name: selected.name,
      address: selected.address,
      thumbnail: selected.thumbnail,
      mapX: selected.mapX,
      mapY: selected.mapY,
      distanceKm: Math.round(selected.distanceKm * 10) / 10,
    },
    region: {
      id: selected.region.id,
      sidoName: selected.region.sidoName,
      sigunguName: selected.region.sigunguName,
      isDepopulated: selected.region.isDepopulated,
    },
    matchInfo: {
      remainingMatches,
      isDepopulatedBonus: selected.region.isDepopulated,
    },
  };
}

/**
 * 오늘 해당 유저의 매칭 횟수 조회
 */
async function getTodayMatchCount(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.matchHistory.count({
    where: {
      userId,
      matchedAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });
}

/**
 * 인구감소지역 가중치 랜덤 선택 알고리즘
 * - 인구감소지역: 가중치 7 (70%)
 * - 일반 지역: 가중치 3 (30%)
 * - 이미 방문한 장소: 가중치 1/3 감소 (새로운 곳 우선)
 */
function weightedRandomSelect<T extends { id: string; region: { isDepopulated: boolean } }>(
  places: T[],
  visitedPlaceIds: Set<string>
): T {
  const DEPOPULATED_WEIGHT = 7;
  const NORMAL_WEIGHT = 3;
  const VISITED_PENALTY = 0.3; // 방문한 장소는 가중치 30%로 감소

  // 각 장소에 가중치 부여
  const weighted = places.map((place) => {
    let weight = place.region.isDepopulated ? DEPOPULATED_WEIGHT : NORMAL_WEIGHT;

    // 이미 방문한 장소는 가중치 감소 (완전히 제외하지는 않음)
    if (visitedPlaceIds.has(place.id)) {
      weight *= VISITED_PENALTY;
    }

    return { place, weight };
  });

  // 총 가중치 합산
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);

  // 가중치 기반 랜덤 선택
  let random = Math.random() * totalWeight;

  for (const item of weighted) {
    random -= item.weight;
    if (random <= 0) {
      return item.place;
    }
  }

  // fallback (이론상 도달 불가)
  return weighted[weighted.length - 1].place;
}

/**
 * 일일 매칭 횟수 초과 에러
 */
export class MatchLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MatchLimitExceededError";
  }
}
