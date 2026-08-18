import { prisma } from "../utils/prisma.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";

const MAX_CONTENT_LENGTH = 500;

interface CreateReviewInput {
  userId: string;
  placeId: string;
  content: string;
}

interface ReviewResult {
  id: string;
  content: string;
  createdAt: Date;
  placeId: string;
  placeName: string;
}

/**
 * 로컬 후기 작성
 */
export async function createReview(input: CreateReviewInput): Promise<ReviewResult> {
  const { userId, placeId, content } = input;

  const trimmed = content.trim();
  if (!trimmed) {
    throw new ValidationError("후기 내용을 입력해주세요.");
  }
  if (trimmed.length > MAX_CONTENT_LENGTH) {
    throw new ValidationError(`후기는 ${MAX_CONTENT_LENGTH}자 이내로 작성해주세요.`);
  }

  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) {
    throw new NotFoundError("존재하지 않는 관광지입니다.");
  }

  const review = await prisma.review.create({
    data: { userId, placeId, content: trimmed },
  });

  return {
    id: review.id,
    content: review.content,
    createdAt: review.createdAt,
    placeId: place.id,
    placeName: place.name,
  };
}

interface PlaceReviewItem {
  id: string;
  content: string;
  createdAt: Date;
  nickname: string;
}

/**
 * 특정 관광지에 달린 후기 목록 (최신순)
 */
export async function getReviewsByPlace(placeId: string, limit: number = 20): Promise<PlaceReviewItem[]> {
  const reviews = await prisma.review.findMany({
    where: { placeId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { nickname: true } } },
  });

  return reviews.map((r) => ({
    id: r.id,
    content: r.content,
    createdAt: r.createdAt,
    nickname: r.user.nickname,
  }));
}
