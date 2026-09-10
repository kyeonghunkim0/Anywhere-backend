import { Request, Response, NextFunction } from "express";
import { resolveLocale, DEFAULT_LOCALE, type Locale } from "../i18n/index.js";

// ============================================
// 로케일 미들웨어
// ============================================
// Accept-Language 헤더를 지원 로케일(ko/en/ja/zh) 중 하나로 해석해 req.locale에 심습니다.
// 라우트보다 먼저 등록되므로 이후 모든 핸들러·미들웨어에서 req.locale을 신뢰할 수 있습니다.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      locale: Locale;
    }
  }
}

export function localeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.locale = resolveLocale(req.headers["accept-language"]);
  next();
}

/** req가 없거나 미들웨어를 거치지 않은 경우까지 감안한 안전한 로케일 추출기 */
export function getLocale(req?: Request): Locale {
  return req?.locale ?? DEFAULT_LOCALE;
}
