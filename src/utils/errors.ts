// ============================================
// 도메인 에러
// ============================================

import { DEFAULT_LOCALE, translate, type MessageKey, type MessageParams } from "../i18n/index.js";

/**
 * 서비스 계층이 던지는 도메인 에러의 기반 클래스입니다.
 * HTTP 상태 코드와 메시지 키를 에러 자신이 들고 있으므로, 응답 경계
 * (respondWithError 등)에서 요청 로케일에 맞춰 메시지를 번역합니다.
 * Error.message에는 로그용으로 기본 로케일(한국어) 문구를 담아 둡니다.
 */
export class AppError extends Error {
  readonly status: number;
  readonly messageKey: MessageKey;
  readonly params?: MessageParams;

  constructor(messageKey: MessageKey, status: number, name: string, params?: MessageParams) {
    super(translate(messageKey, DEFAULT_LOCALE, params));
    this.status = status;
    this.name = name;
    this.messageKey = messageKey;
    this.params = params;
  }
}

/** 400 — 입력값·도메인 규칙 위반 */
export class ValidationError extends AppError {
  constructor(messageKey: MessageKey, params?: MessageParams) {
    super(messageKey, 400, "ValidationError", params);
  }
}

/** 401 — 인증 실패 */
export class UnauthorizedError extends AppError {
  constructor(messageKey: MessageKey, params?: MessageParams) {
    super(messageKey, 401, "UnauthorizedError", params);
  }
}

/** 404 — 리소스 없음 */
export class NotFoundError extends AppError {
  constructor(messageKey: MessageKey, params?: MessageParams) {
    super(messageKey, 404, "NotFoundError", params);
  }
}

/** 409 — 중복·상태 충돌 */
export class ConflictError extends AppError {
  constructor(messageKey: MessageKey, params?: MessageParams) {
    super(messageKey, 409, "ConflictError", params);
  }
}

/** 429 — 요청 횟수 제한 초과 */
export class RateLimitError extends AppError {
  constructor(messageKey: MessageKey, params?: MessageParams) {
    super(messageKey, 429, "RateLimitError", params);
  }
}
