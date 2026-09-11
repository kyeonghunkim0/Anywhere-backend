import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { respondFail } from "./error.middleware.js";

/**
 * 관리자 전용 라우트 보호 미들웨어
 * x-admin-key 헤더가 ADMIN_API_KEY 환경변수와 일치해야 통과합니다.
 * (일반 유저 JWT와는 별개 — 큐레이션 태그 연결처럼 운영자만 건드려야 하는 작업에 사용)
 */
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers["x-admin-key"];

  if (!env.ADMIN_API_KEY || key !== env.ADMIN_API_KEY) {
    respondFail(res, 401, "admin.unauthorized");
    return;
  }

  next();
}
