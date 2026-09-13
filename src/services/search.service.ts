import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../utils/prisma.js";
import { formatRegionName } from "../utils/regionName.js";
import { CITY_COUNTY_ONLY } from "../utils/regionFilter.js";
import { regionGroupWhere } from "../utils/regionGroup.js";
import { distanceToPlace, type Coords } from "../utils/coords.js";
import { toPublicAssetUrl } from "../utils/assetUrl.js";
import { listPlaces } from "./place.service.js";

/** 검색 결과에 얹을 스페셜 퀘스트(축제) 후보 상한 */
const FESTIVAL_CANDIDATE_CAP = 20;

// ============================================
// 통합 검색 (관광지 이름·주소 / 지역 이름)
// ============================================

/** 이름 일치 우선 정렬을 위해 메모리로 끌어올 관광지 후보 상한 */
const PLACE_CANDIDATE_CAP = 500;

interface SearchRegionItem {
  regionId: string;
  sidoName: string;
  sigunguName: string;
  displayName: string; // 화면 표시용 (예: "부산 중구")
  isDepopulated: boolean;
  imageUrl: string | null;
}

interface SearchPlaceRegion {
  id: string;
  sidoName: string;
  sigunguName: string;
  displayName: string;
  isDepopulated: boolean;
}

interface SearchPlaceItem {
  id: string;
  name: string;
  address: string;
  thumbnail: string | null;
  mapX: number; // 경도
  mapY: number; // 위도
  stampCount: number;
  distanceKm: number | null; // 좌표(lat/lng)를 넘겼을 때만 채워진다
  region: SearchPlaceRegion;
}

interface SearchPage<T> {
  total: number;
  limit: number;
  offset: number;
  items: T[];
}

interface SearchFestivalItem {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  status: "UPCOMING" | "ACTIVE" | "EXPIRED";
  startAt: Date | null;
  endAt: Date | null;
  daysRemaining: number | null; // 마감까지 D-day (음수면 마감, 시작 전이면 시작까지 남은 일수)
  region: SearchPlaceRegion | null;
}

interface SearchResult {
  query: string;
  regions: SearchPage<SearchRegionItem>;
  places: SearchPage<SearchPlaceItem>;
  festivals: SearchFestivalItem[]; // 이름·설명에 검색어가 걸리는 스페셜 퀘스트(시즌 한정 뱃지)
}

/**
 * 키워드로 지역과 관광지를 한 번에 검색한다.
 *
 * - 특별·광역시 자치구는 결과에서 제외한다 (시·군 단위만).
 * - 관광지는 "이름이 키워드로 시작 → 이름에 포함 → 주소에만 포함" 순으로 정렬한 뒤
 *   limit/offset으로 잘라 내려준다.
 * - 검색어(q)가 비면 검색 대신 "추천 목록"(listPlaces)을 places에 담아 돌려준다.
 *   이때 regions는 빈 페이지다.
 * - coords(lat/lng)를 넘기면 각 관광지까지의 distanceKm를 서버에서 계산한다.
 */
export async function search(
  rawQuery: string,
  limit: number = 20,
  offset: number = 0,
  regionLimit: number = 20,
  regionOffset: number = 0,
  regionGroup?: string,
  coords?: Coords | null
): Promise<SearchResult> {
  const query = rawQuery.trim();

  // 검색어가 비면 "추천 목록"을 내려준다 (클라이언트의 빈 검색어 가드 제거용).
  if (query.length < 1) {
    const browse = await listPlaces({ limit, offset, regionGroup, coords });
    return {
      query: "",
      regions: { total: 0, limit: regionLimit, offset: regionOffset, items: [] },
      places: browse,
      festivals: [],
    };
  }

  // 권역 칩("충청" 등) 필터. 지역·관광지 양쪽에 동일하게 적용한다.
  const groupWhere = regionGroupWhere(regionGroup);
  const placeWhere: Prisma.PlaceWhereInput = {
    region: { ...CITY_COUNTY_ONLY, ...groupWhere },
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { address: { contains: query, mode: "insensitive" } },
    ],
  };

  const [regions, placeCandidates, placeTotal, festivals] = await Promise.all([
    searchRegions(query, regionLimit, regionOffset, groupWhere),
    prisma.place.findMany({
      where: placeWhere,
      include: {
        region: true,
        _count: { select: { stamps: true } },
      },
      take: PLACE_CANDIDATE_CAP,
    }),
    prisma.place.count({ where: placeWhere }),
    searchFestivals(query),
  ]);

  const lowered = query.toLowerCase();
  const ranked = placeCandidates
    .map((place) => ({ place, rank: placeMatchRank(place.name, lowered) }))
    .sort((a, b) => a.rank - b.rank || a.place.name.localeCompare(b.place.name, "ko"));

  const items: SearchPlaceItem[] = ranked
    .slice(offset, offset + limit)
    .map(({ place }) => ({
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
      },
    }));

  return {
    query,
    regions,
    places: { total: placeTotal, limit, offset, items },
    festivals,
  };
}

/**
 * 이름·설명에 검색어가 걸리는 스페셜 퀘스트(SEASONAL 뱃지) 검색.
 * 시즌이 지났거나 아직 시작 전이어도 결과에 포함하고 status로 구분한다.
 */
async function searchFestivals(query: string): Promise<SearchFestivalItem[]> {
  const now = new Date();

  const badges = await prisma.badge.findMany({
    where: {
      type: "SEASONAL",
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    include: { region: true },
    orderBy: { endAt: "asc" },
    take: FESTIVAL_CANDIDATE_CAP,
  });

  return badges.map((badge) => {
    let status: SearchFestivalItem["status"] = "ACTIVE";
    if (badge.startAt && badge.startAt > now) status = "UPCOMING";
    else if (badge.endAt && badge.endAt < now) status = "EXPIRED";

    const referenceDate = status === "UPCOMING" ? badge.startAt : badge.endAt;
    const daysRemaining = referenceDate
      ? Math.ceil((referenceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      id: badge.id,
      key: badge.key,
      name: badge.name,
      description: badge.description,
      icon: toPublicAssetUrl(badge.icon) ?? badge.icon,
      status,
      startAt: badge.startAt,
      endAt: badge.endAt,
      daysRemaining,
      region: badge.region
        ? {
            id: badge.region.id,
            sidoName: badge.region.sidoName,
            sigunguName: badge.region.sigunguName,
            displayName: formatRegionName(badge.region.sidoName, badge.region.sigunguName),
            isDepopulated: badge.region.isDepopulated,
          }
        : null,
    };
  });
}

/** 시·군 단위 지역만: 검색 조건(where) 조립 (권역 필터를 AND로 합친다) */
function regionWhere(query: string, groupWhere: Prisma.RegionWhereInput): Prisma.RegionWhereInput {
  const tokens = Array.from(new Set(query.split(/\s+/).filter(Boolean)));
  return {
    ...CITY_COUNTY_ONLY,
    ...groupWhere,
    OR: tokens.flatMap((token) => [
      { sidoName: { contains: token, mode: "insensitive" as const } },
      { sigunguName: { contains: token, mode: "insensitive" as const } },
    ]),
  };
}

/**
 * 지역 이름 검색. sidoName·sigunguName에 키워드가 들어가면 매칭.
 * (공백으로 토큰을 나눠 "강릉 카페"처럼 시·도 + 시·군 조합 검색도 받는다.)
 * 시·도 → 시·군 순으로 정렬한 뒤 offset/limit으로 페이징한다.
 */
async function searchRegions(
  query: string,
  limit: number,
  offset: number,
  groupWhere: Prisma.RegionWhereInput
): Promise<SearchPage<SearchRegionItem>> {
  const where = regionWhere(query, groupWhere);

  const [total, regions] = await Promise.all([
    prisma.region.count({ where }),
    prisma.region.findMany({
      where,
      orderBy: [{ sidoName: "asc" }, { sigunguName: "asc" }],
      skip: offset,
      take: limit,
    }),
  ]);

  const items = regions.map((region) => ({
    regionId: region.id,
    sidoName: region.sidoName,
    sigunguName: region.sigunguName,
    displayName: formatRegionName(region.sidoName, region.sigunguName),
    isDepopulated: region.isDepopulated,
    imageUrl: region.imageUrl,
  }));

  return { total, limit, offset, items };
}

/** 낮을수록 우선: 0 정확히 일치, 1 접두 일치, 2 이름 포함, 3 주소에만 포함 */
function placeMatchRank(name: string, loweredQuery: string): number {
  const loweredName = name.toLowerCase();
  if (loweredName === loweredQuery) return 0;
  if (loweredName.startsWith(loweredQuery)) return 1;
  if (loweredName.includes(loweredQuery)) return 2;
  return 3;
}
