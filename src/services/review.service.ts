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
    throw new ValidationError("review.contentRequired");
  }
  if (trimmed.length > MAX_CONTENT_LENGTH) {
    throw new ValidationError("review.contentTooLong", { max: MAX_CONTENT_LENGTH });
  }

  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) {
    throw new NotFoundError("place.notFound");
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

const REPORT_REASONS = ["SPAM", "ABUSE", "INAPPROPRIATE", "ETC"] as const;
type ReportReason = (typeof REPORT_REASONS)[number];

function isReportReason(value: unknown): value is ReportReason {
  return typeof value === "string" && (REPORT_REASONS as readonly string[]).includes(value);
}

interface ReportReviewInput {
  reporterId: string;
  reviewId: string;
  reason: string;
  detail?: string;
}

interface ReviewReportResult {
  id: string;
  reviewId: string;
  reason: string;
  detail: string | null;
  createdAt: Date;
}

/**
 * 후기 신고
 */
export async function reportReview(input: ReportReviewInput): Promise<ReviewReportResult> {
  const { reporterId, reviewId, reason, detail } = input;

  if (!isReportReason(reason)) {
    throw new ValidationError("review.reasonInvalid", { options: REPORT_REASONS.join(", ") });
  }

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new NotFoundError("review.notFound");
  }
  if (review.userId === reporterId) {
    throw new ValidationError("review.cannotReportOwn");
  }

  const report = await prisma.reviewReport.create({
    data: { reporterId, reviewId, reason, detail: detail?.trim() || null },
  });

  return {
    id: report.id,
    reviewId: report.reviewId,
    reason: report.reason,
    detail: report.detail,
    createdAt: report.createdAt,
  };
}

interface ReviewReportAdminItem {
  id: string;
  reason: string;
  detail: string | null;
  createdAt: Date;
  reporterId: string;
  reporterNickname: string;
  review: {
    id: string;
    content: string;
    authorId: string;
    authorNickname: string;
    placeId: string;
    placeName: string;
  };
}

/**
 * (관리자) 신고 목록 조회 - 최신순
 */
export async function getReviewReports(limit: number = 50): Promise<ReviewReportAdminItem[]> {
  const reports = await prisma.reviewReport.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      reporter: { select: { nickname: true } },
      review: {
        include: {
          user: { select: { id: true, nickname: true } },
          place: { select: { id: true, name: true } },
        },
      },
    },
  });

  return reports.map((r) => ({
    id: r.id,
    reason: r.reason,
    detail: r.detail,
    createdAt: r.createdAt,
    reporterId: r.reporterId,
    reporterNickname: r.reporter.nickname,
    review: {
      id: r.review.id,
      content: r.review.content,
      authorId: r.review.user.id,
      authorNickname: r.review.user.nickname,
      placeId: r.review.place.id,
      placeName: r.review.place.name,
    },
  }));
}

/**
 * (관리자) 신고된 후기 삭제 - 신고 기록도 cascade로 함께 삭제됩니다.
 */
export async function deleteReview(reviewId: string): Promise<void> {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new NotFoundError("review.notFound");
  }

  await prisma.review.delete({ where: { id: reviewId } });
}
