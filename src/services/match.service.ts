import { prisma } from "../utils/prisma.js";
import { haversineDistance } from "../utils/haversine.js";

interface MatchInput {
  userLat: number;
  userLng: number;
  radiusKm?: number; // 기본값: 50km
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
}

/**
 * 사용자 GPS 기반 랜덤 관광지 매칭
 * - 반경 N km 이내의 관광지 중 랜덤 1곳 반환
 * - 인구감소지역 70% 가중치 적용
 */
export async function getRandomMatch(input: MatchInput): Promise<MatchResult | null> {
  const { userLat, userLng, radiusKm = 50 } = input;

  // 1. 전체 관광지를 region 정보와 함께 조회
  const allPlaces = await prisma.place.findMany({
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

  // 3. 인구감소지역 70% 가중치 적용 랜덤 선택
  const selected = weightedRandomSelect(nearbyPlaces);

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
  };
}

/**
 * 인구감소지역 가중치 랜덤 선택 알고리즘
 * - 인구감소지역: 가중치 7 (70%)
 * - 일반 지역: 가중치 3 (30%)
 */
function weightedRandomSelect<T extends { region: { isDepopulated: boolean } }>(
  places: T[]
): T {
  const DEPOPULATED_WEIGHT = 7;
  const NORMAL_WEIGHT = 3;

  // 각 장소에 가중치 부여
  const weighted = places.map((place) => ({
    place,
    weight: place.region.isDepopulated ? DEPOPULATED_WEIGHT : NORMAL_WEIGHT,
  }));

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
