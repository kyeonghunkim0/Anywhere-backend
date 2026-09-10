import { Request, Response, NextFunction } from "express";
import { isPrismaErrorCode } from "../utils/prismaError.js";
import { AppError } from "../utils/errors.js";
import { translate, type MessageKey, type MessageParams } from "../i18n/index.js";
import { getLocale } from "./locale.middleware.js";

// ============================================
// 로케일 응답 헬퍼
// ============================================

/**
 * 실패 응답을 요청 로케일에 맞춰 내려줍니다.
 * 본문은 항상 `{ success: false, code, message }` 형태입니다.
 * - code: 기계용 메시지 키 (클라이언트 분기·자체 문구용)
 * - message: 요청 Accept-Language에 맞춰 번역된 문구
 */
export function respondFail(
  res: Response,
  status: number,
  key: MessageKey,
  params?: MessageParams
): void {
  const locale = getLocale(res.req as Request);
  res.status(status).json({ success: false, code: key, message: translate(key, locale, params) });
}

/** 성공 응답의 message 필드 등에 넣을 번역된 문구를 반환합니다. */
export function localize(res: Response, key: MessageKey, params?: MessageParams): string {
  return translate(key, getLocale(res.req as Request), params);
}

// ============================================
// 404 핸들러
// ============================================

/**
 * 등록된 라우트에 걸리지 않은 요청을 JSON 404로 응답합니다.
 * (없으면 Express 기본 HTML 404가 나가서 클라이언트 파싱이 깨집니다)
 */
export function notFoundHandler(req: Request, res: Response): void {
  respondFail(res, 404, "common.routeNotFound", { method: req.method, path: req.path });
}

// ============================================
// 컨트롤러 공통 에러 응답
// ============================================

/**
 * 컨트롤러 catch 블록의 공통 처리기입니다.
 * - AppError: 에러가 들고 있는 상태 코드·메시지 키로 응답 (예상된 실패이므로 로그를 남기지 않음)
 * - Prisma 제약 위반: 409 / 404
 * - 그 외: 예상 못 한 실패이므로 로그를 남기고 500
 *
 * @param context 로그에 남길 작업 이름 (예: "매칭 확정")
 */
export function respondWithError(res: Response, error: unknown, context: string): void {
  if (error instanceof AppError) {
    respondFail(res, error.status, error.messageKey, error.params);
    return;
  }

  if (isPrismaErrorCode(error, "P2002")) {
    console.error(`${context} 에러(중복 데이터):`, error);
    respondFail(res, 409, "common.duplicate");
    return;
  }

  if (isPrismaErrorCode(error, "P2025")) {
    console.error(`${context} 에러(대상 없음):`, error);
    respondFail(res, 404, "common.notFound");
    return;
  }

  console.error(`${context} 에러:`, error);
  respondFail(res, 500, "common.serverError");
}

// ============================================
// 전역 에러 핸들러
// ============================================

/** express.json()이 본문 파싱에 실패했을 때 붙는 형태인지 확인합니다. */
function isJsonParseError(error: unknown): boolean {
  return (
    error instanceof SyntaxError &&
    "body" in error &&
    (error as SyntaxError & { status?: number }).status === 400
  );
}

/**
 * 컨트롤러 try/catch 밖에서 발생한 에러의 최종 안전망입니다.
 * 본문 파싱 실패(400)와 Prisma 제약 위반(409/404)만 구분하고, 나머지는 500으로 통일합니다.
 * Express가 에러 핸들러로 인식하려면 인자가 반드시 4개여야 합니다.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // 이미 응답이 나가기 시작했다면 Express 기본 처리에 맡깁니다.
  if (res.headersSent) {
    next(error);
    return;
  }

  if (isJsonParseError(error)) {
    respondFail(res, 400, "common.invalidJson");
    return;
  }

  if (isPrismaErrorCode(error, "P2002")) {
    console.error("중복 데이터 생성 시도:", error);
    respondFail(res, 409, "common.duplicate");
    return;
  }

  if (isPrismaErrorCode(error, "P2025")) {
    console.error("대상 레코드 없음:", error);
    respondFail(res, 404, "common.notFound");
    return;
  }

  console.error("처리되지 않은 서버 에러:", error);
  respondFail(res, 500, "common.serverError");
}
