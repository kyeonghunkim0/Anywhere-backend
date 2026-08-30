import { prisma } from "../utils/prisma.js";
import { NotFoundError } from "../utils/errors.js";
import { formatRegionName } from "../utils/regionName.js";
import { getReviewsByPlace } from "./review.service.js";

// ============================================
// 장소 상세 조회
// ============================================

interface PlaceDetailRegion {
  id: string;
  sidoName: string;
  sigunguName: string;
  displayName: string; // 화면 표시용 (예: "부산 중구")
  isDepopulated: boolean;
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
  const place = await prisma.place.findUnique({
    where: { id: placeId },
    include: {
      region: true,
      tags: { include: { tag: true } },
      _count: { select: { stamps: true, reviews: true } },
    },
  });

  if (!place) {
    throw new NotFoundError("존재하지 않는 관광지입니다.");
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
