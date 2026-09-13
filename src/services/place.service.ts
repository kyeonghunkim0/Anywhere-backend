import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../utils/prisma.js";
import { NotFoundError } from "../utils/errors.js";
import { formatRegionName } from "../utils/regionName.js";
import { CITY_COUNTY_ONLY } from "../utils/regionFilter.js";
import { regionGroupWhere } from "../utils/regionGroup.js";
import { distanceToPlace, type Coords } from "../utils/coords.js";
import { toPublicAssetUrl } from "../utils/assetUrl.js";
import { getReviewsByPlace } from "./review.service.js";

// 지역에 연결된, 지금 진행 중인 스페셜 퀘스트(SEASONAL 뱃지=지역 축제) 조건
export function activeSeasonalBadgeWhere(now: Date): Prisma.BadgeWhereInput {
  return {
    type: "SEASONAL",
    startAt: { lte: now },
    endAt: { gte: now },
  };
}

export interface ActiveFestivalBadge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string | null;
  endAt: Date;
  daysRemaining: number;
}

export function toActiveFestivalBadge(
  badge: { id: string; key: string; name: string; description: string; icon: string | null; endAt: Date | null },
  now: Date
): ActiveFestivalBadge {
  const endAt = badge.endAt as Date;
  return {
    id: badge.id,
    key: badge.key,
    name: badge.name,
    description: badge.description,
    icon: toPublicAssetUrl(badge.icon) ?? badge.icon,
    endAt,
    daysRemaining: Math.ceil((endAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  };
}

// ============================================
// 장소 상세 조회
// ============================================

interface PlaceDetailRegion {
  id: string;
  sidoName: string;
  sigunguName: string;
  displayName: string; // 화면 표시용 (예: "부산 중구")
  isDepopulated: boolean;
  activeFestivals: ActiveFestivalBadge[]; // 지금 이 지역에서 진행 중인 스페셜 퀘스트(축제)
}

interface PlaceDetailTag {
  id: string;
  label: string;
  emoji: string | null;
}

interface PlaceDetailReview {
  id: string;
  content: string;
  createdAt: Date;
  nickname: string;
}

interface PlaceDetail {
  id: string;
  name: string;
  address: string;
  thumbnail: string | null;
  mapX: number; // 경도
  mapY: number; // 위도
  region: PlaceDetailRegion;
  tags: PlaceDetailTag[];
  stampCount: number; // 이 장소에 도장을 찍은 방문자 수
  reviewCount: number; // 전체 후기 수
  reviews: PlaceDetailReview[]; // 최신 후기 (기본 20건)
}

/**
 * placeId 단건으로 장소 상세를 조회한다.
 * 클라이언트 "장소 상세" 화면(이름·주소·좌표·지역·태그·후기)을 한 번에 채운다.
 */
export async function getPlaceDetail(placeId: string, reviewLimit: number = 20): Promise<PlaceDetail> {
  const now = new Date();

  const place = await prisma.place.findUnique({
    where: { id: placeId },
    include: {
      region: { include: { badges: { where: activeSeasonalBadgeWhere(now) } } },
      tags: { include: { tag: true } },
      _count: { select: { stamps: true, reviews: true } },
    },
  });

  if (!place) {
    throw new NotFoundError("place.notFound");
  }

  const reviews = await getReviewsByPlace(placeId, reviewLimit);

  return {
    id: place.id,
    name: place.name,
    address: place.address,
    thumbnail: place.thumbnail,
    mapX: place.mapX,
    mapY: place.mapY,
    region: {
      id: place.region.id,
      sidoName: place.region.sidoName,
      sigunguName: place.region.sigunguName,
      displayName: formatRegionName(place.region.sidoName, place.region.sigunguName),
      isDepopulated: place.region.isDepopulated,
      activeFestivals: place.region.badges.map((badge) => toActiveFestivalBadge(badge, now)),
    },
    tags: place.tags.map(({ tag }) => ({
      id: tag.id,
      label: tag.label,
      emoji: tag.emoji,
    })),
    stampCount: place._count.stamps,
    reviewCount: place._count.reviews,
    reviews,
  };
}

// ============================================
// 장소 브라우즈 목록 (검색어가 비었을 때의 "추천 목록")
// ============================================

interface PlaceCardRegion {
  id: string;
  sidoName: string;
  sigunguName: string;
  displayName: string; // 화면 표시용 (예: "부산 중구")
  isDepopulated: boolean;
  activeFestivals: ActiveFestivalBadge[]; // 지금 이 지역에서 진행 중인 스페셜 퀘스트(축제)
}

export interface PlaceCardItem {
  id: string;
  name: string;
  address: string;
  thumbnail: string | null;
  mapX: number; // 경도
  mapY: number; // 위도
  stampCount: number;
  distanceKm: number | null; // 좌표(lat/lng)를 넘겼을 때만 채워진다
  region: PlaceCardRegion;
}

export interface PlaceListPage {
  total: number;
  limit: number;
  offset: number;
  items: PlaceCardItem[];
}

interface ListPlacesOptions {
  limit?: number;
  offset?: number;
  regionGroup?: string;
  depopulatedOnly?: boolean;
  coords?: Coords | null;
}

/**
 * 검색·발견 대상 장소 카탈로그.
 * - 특별·광역시 자치구는 제외(시·군 단위만), regionGroup 권역 필터 적용
 * - 인구감소지역 → 도장 수 → 이름 순으로 정렬 (depopulatedOnly면 인구감소지역만)
 * - coords를 넘기면 각 장소까지의 distanceKm를 서버에서 계산해 실어 준다
 */
export async function listPlaces(options: ListPlacesOptions = {}): Promise<PlaceListPage> {
  const { limit = 20, offset = 0, regionGroup, depopulatedOnly = false, coords } = options;
  const now = new Date();

  const where: Prisma.PlaceWhereInput = {
    region: {
      ...CITY_COUNTY_ONLY,
      ...regionGroupWhere(regionGroup),
      ...(depopulatedOnly ? { isDepopulated: true } : {}),
    },
  };

  const [total, places] = await Promise.all([
    prisma.place.count({ where }),
    prisma.place.findMany({
      where,
      include: {
        region: { include: { badges: { where: activeSeasonalBadgeWhere(now) } } },
        _count: { select: { stamps: true } },
      },
      orderBy: [
        { region: { isDepopulated: "desc" } },
        { stamps: { _count: "desc" } },
        { name: "asc" },
      ],
      skip: offset,
      take: limit,
    }),
  ]);

  const items: PlaceCardItem[] = places.map((place) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    thumbnail: place.thumbnail,
    mapX: place.mapX,
    mapY: place.mapY,
    stampCount: place._count.stamps,
    distanceKm: distanceToPlace(coords, place.mapY, place.mapX),
    region: {
      id: place.region.id,
      sidoName: place.region.sidoName,
      sigunguName: place.region.sigunguName,
      displayName: formatRegionName(place.region.sidoName, place.region.sigunguName),
      isDepopulated: place.region.isDepopulated,
      activeFestivals: place.region.badges.map((badge) => toActiveFestivalBadge(badge, now)),
    },
  }));

  return { total, limit, offset, items };
}
