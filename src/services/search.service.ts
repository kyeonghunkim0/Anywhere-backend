import { prisma } from "../utils/prisma.js";
import { ValidationError } from "../utils/errors.js";
import { formatRegionName } from "../utils/regionName.js";
import { CITY_COUNTY_ONLY } from "../utils/regionFilter.js";

// ============================================
// 통합 검색 (관광지 이름·주소 / 지역 이름)
// ============================================

/** 지역 검색 결과 최대 개수 */
const REGION_LIMIT = 20;
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
  region: SearchPlaceRegion;
}

interface SearchResult {
  query: string;
  regions: SearchRegionItem[];
  places: {
    total: number;
    limit: number;
    offset: number;
    items: SearchPlaceItem[];
  };
}

/**
 * 키워드로 지역과 관광지를 한 번에 검색한다.
 *
 * - 특별·광역시 자치구는 결과에서 제외한다 (시·군 단위만).
 * - 관광지는 "이름이 키워드로 시작 → 이름에 포함 → 주소에만 포함" 순으로 정렬한 뒤
 *   limit/offset으로 잘라 내려준다.
 */
export async function search(
  rawQuery: string,
  limit: number = 20,
  offset: number = 0
): Promise<SearchResult> {
  const query = rawQuery.trim();
  if (query.length < 1) {
    throw new ValidationError("검색어(q)를 입력해주세요.");
  }

  const [regions, placeCandidates, placeTotal] = await Promise.all([
    searchRegions(query),
    prisma.place.findMany({
      where: {
        region: CITY_COUNTY_ONLY,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        region: true,
        _count: { select: { stamps: true } },
      },
      take: PLACE_CANDIDATE_CAP,
    }),
    prisma.place.count({
      where: {
        region: CITY_COUNTY_ONLY,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
        ],
      },
    }),
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
  };
}

/**
 * 지역 이름 검색. sidoName·sigunguName에 키워드가 들어가면 매칭.
 * (displayName은 파생값이라 DB에 없으므로, "부산 중구"처럼 축약 표기로 검색한 경우를
 *  대비해 시·도 축약 접두사를 제거한 나머지로 한 번 더 훑는다.)
 */
async function searchRegions(query: string): Promise<SearchRegionItem[]> {
  const tokens = Array.from(new Set(query.split(/\s+/).filter(Boolean)));

  const regions = await prisma.region.findMany({
    where: {
      ...CITY_COUNTY_ONLY,
      OR: tokens.flatMap((token) => [
        { sidoName: { contains: token, mode: "insensitive" as const } },
        { sigunguName: { contains: token, mode: "insensitive" as const } },
      ]),
    },
    orderBy: [{ sidoName: "asc" }, { sigunguName: "asc" }],
    take: REGION_LIMIT,
  });

  return regions.map((region) => ({
    regionId: region.id,
    sidoName: region.sidoName,
    sigunguName: region.sigunguName,
    displayName: formatRegionName(region.sidoName, region.sigunguName),
    isDepopulated: region.isDepopulated,
    imageUrl: region.imageUrl,
  }));
}

/** 낮을수록 우선: 0 정확히 일치, 1 접두 일치, 2 이름 포함, 3 주소에만 포함 */
function placeMatchRank(name: string, loweredQuery: string): number {
  const loweredName = name.toLowerCase();
  if (loweredName === loweredQuery) return 0;
  if (loweredName.startsWith(loweredQuery)) return 1;
  if (loweredName.includes(loweredQuery)) return 2;
  return 3;
}
