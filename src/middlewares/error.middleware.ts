import { Request, Response, NextFunction } from "express";
import { isPrismaErrorCode } from "../utils/prismaError.js";
import { AppError } from "../utils/errors.js";

// ============================================
// 404 핸들러
// ============================================

/**
 * 등록된 라우트에 걸리지 않은 요청을 JSON 404로 응답합니다.
 * (없으면 Express 기본 HTML 404가 나가서 클라이언트 파싱이 깨집니다)
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `요청하신 경로를 찾을 수 없습니다. (${req.method} ${req.path})`,
  });
}

// ============================================
// 컨트롤러 공통 에러 응답
// ============================================

/**
 * 컨트롤러 catch 블록의 공통 처리기입니다.
 * - AppError: 에러가 들고 있는 상태 코드로 그대로 응답 (예상된 실패이므로 로그를 남기지 않음)
 * - Prisma 제약 위반: 409 / 404
 * - 그 외: 예상 못 한 실패이므로 로그를 남기고 500
 *
 * @param context 로그에 남길 작업 이름 (예: "매칭 확정")
 */
export function respondWithError(res: Response, error: unknown, context: string): void {
  if (error instanceof AppError) {
    res.status(error.status).json({ success: false, message: error.message });
    return;
  }

  if (isPrismaErrorCode(error, "P2002")) {
    console.error(`${context} 에러(중복 데이터):`, error);
    res.status(409).json({ success: false, message: "이미 존재하는 데이터입니다." });
    return;
  }

  if (isPrismaErrorCode(error, "P2025")) {
    console.error(`${context} 에러(대상 없음):`, error);
    res.status(404).json({ success: false, message: "요청하신 데이터를 찾을 수 없습니다." });
    return;
  }

  console.error(`${context} 에러:`, error);
  res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
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
    res.status(400).json({
      success: false,
      message: "요청 본문이 올바른 JSON 형식이 아닙니다.",
    });
    return;
  }

  if (isPrismaErrorCode(error, "P2002")) {
    console.error("중복 데이터 생성 시도:", error);
    res.status(409).json({
      success: false,
      message: "이미 존재하는 데이터입니다.",
    });
    return;
  }

  if (isPrismaErrorCode(error, "P2025")) {
    console.error("대상 레코드 없음:", error);
    res.status(404).json({
      success: false,
      message: "요청하신 데이터를 찾을 수 없습니다.",
    });
    return;
  }

  console.error("처리되지 않은 서버 에러:", error);
  res.status(500).json({
    success: false,
    message: "서버 오류가 발생했습니다.",
  });
}
