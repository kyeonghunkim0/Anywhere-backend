import { prisma } from "../utils/prisma.js";
import { formatRegionName } from "../utils/regionName.js";

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
  sidoName: string;
  sigunguName: string;
  displayName: string; // 화면 표시용 (예: "부산 중구")
  isDepopulated: boolean;
}

/**
 * 특정 해시태그가 달린 관광지 목록 조회
 */
export async function getPlacesByTag(tagId: string): Promise<TaggedPlace[]> {
  const placeTags = await prisma.placeTag.findMany({
    where: { tagId },
    include: { place: { include: { region: true } } },
  });

  return placeTags.map(({ place }) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    thumbnail: place.thumbnail,
    sidoName: place.region.sidoName,
    sigunguName: place.region.sigunguName,
    displayName: formatRegionName(place.region.sidoName, place.region.sigunguName),
    isDepopulated: place.region.isDepopulated,
  }));
}
