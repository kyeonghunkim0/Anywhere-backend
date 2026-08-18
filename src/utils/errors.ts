// ============================================
// 도메인 에러
// ============================================

/**
 * 서비스 계층이 던지는 도메인 에러의 기반 클래스입니다.
 * HTTP 상태 코드를 에러 자신이 들고 있으므로, 컨트롤러는 메시지 문자열을
 * 비교할 필요 없이 instanceof 한 번으로 응답 코드를 결정할 수 있습니다.
 */
export class AppError extends Error {
  readonly status: number;

  constructor(message: string, status: number, name: string) {
    super(message);
    this.status = status;
    this.name = name;
  }
}

/** 400 — 입력값·도메인 규칙 위반 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "ValidationError");
  }
}

/** 401 — 인증 실패 */
export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401, "UnauthorizedError");
  }
}

/** 404 — 리소스 없음 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, "NotFoundError");
  }
}

/** 409 — 중복·상태 충돌 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "ConflictError");
  }
}

/** 429 — 요청 횟수 제한 초과 */
export class RateLimitError extends AppError {
  constructor(message: string) {
    super(message, 429, "RateLimitError");
  }
}
