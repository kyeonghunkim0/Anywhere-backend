import { prisma } from "../utils/prisma.js";
import { formatRegionName } from "../utils/regionName.js";
import { distanceToPlace, type Coords } from "../utils/coords.js";
import { isPrismaErrorCode } from "../utils/prismaError.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import {
  activeSeasonalBadgeWhere,
  toActiveFestivalBadge,
  type ActiveFestivalBadge,
} from "./place.service.js";

interface TagItem {
  id: string;
  label: string;
  emoji: string | null;
  placeCount: number;
}

/**
 * 홈 화면 상단 큐레이션 해시태그 칩 목록 조회
 * (#밤하늘_별맛집, #현지인_추천_노포, #바다향기 등)
 */
export async function getTags(): Promise<TagItem[]> {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { places: true } } },
    orderBy: { label: "asc" },
  });

  return tags.map((tag) => ({
    id: tag.id,
    label: tag.label,
    emoji: tag.emoji,
    placeCount: tag._count.places,
  }));
}

interface TaggedPlace {
  id: string;
  name: string;
  address: string;
  thumbnail: string | null;
  mapX: number; // 경도
  mapY: number; // 위도
  distanceKm: number | null; // 좌표(lat/lng)를 넘겼을 때만 채워진다
  sidoName: string;
  sigunguName: string;
  displayName: string; // 화면 표시용 (예: "부산 중구")
  isDepopulated: boolean;
  activeFestivals: ActiveFestivalBadge[]; // 지금 이 지역에서 진행 중인 스페셜 퀘스트(축제)
}

/**
 * 특정 해시태그가 달린 관광지 목록 조회.
 * coords(lat/lng)를 넘기면 각 관광지까지의 distanceKm를 서버에서 계산한다.
 */
export async function getPlacesByTag(
  tagId: string,
  coords?: Coords | null
): Promise<TaggedPlace[]> {
  const now = new Date();

  const placeTags = await prisma.placeTag.findMany({
    where: { tagId },
    include: {
      place: { include: { region: { include: { badges: { where: activeSeasonalBadgeWhere(now) } } } } },
    },
  });

  return placeTags.map(({ place }) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    thumbnail: place.thumbnail,
    mapX: place.mapX,
    mapY: place.mapY,
    distanceKm: distanceToPlace(coords, place.mapY, place.mapX),
    sidoName: place.region.sidoName,
    sigunguName: place.region.sigunguName,
    displayName: formatRegionName(place.region.sidoName, place.region.sigunguName),
    isDepopulated: place.region.isDepopulated,
    activeFestivals: place.region.badges.map((badge) => toActiveFestivalBadge(badge, now)),
  }));
}

/**
 * (관리자) 태그-관광지 연결 추가
 * 큐레이션 태그는 Place 데이터만으로는 자동 판별할 수 없어 운영자가 수동으로 큐레이션합니다.
 */
export async function attachPlaceTag(tagId: string, placeId: string): Promise<void> {
  const [tag, place] = await Promise.all([
    prisma.tag.findUnique({ where: { id: tagId } }),
    prisma.place.findUnique({ where: { id: placeId } }),
  ]);
  if (!tag) throw new NotFoundError("tag.notFound");
  if (!place) throw new NotFoundError("place.notFound");

  try {
    await prisma.placeTag.create({ data: { tagId, placeId } });
  } catch (error) {
    if (isPrismaErrorCode(error, "P2002")) throw new ConflictError("tag.alreadyLinked");
    throw error;
  }
}

/**
 * (관리자) 태그-관광지 연결 해제
 */
export async function detachPlaceTag(tagId: string, placeId: string): Promise<void> {
  try {
    await prisma.placeTag.delete({ where: { placeId_tagId: { placeId, tagId } } });
  } catch (error) {
    if (isPrismaErrorCode(error, "P2025")) throw new NotFoundError("tag.linkNotFound");
    throw error;
  }
}
