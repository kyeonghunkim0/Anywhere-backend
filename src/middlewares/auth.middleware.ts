import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { respondFail } from "./error.middleware.js";

// Express Request에 user 정보를 추가하기 위한 타입 확장
export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT 인증 미들웨어
 * Authorization 헤더에서 Bearer 토큰을 추출하여 검증
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      respondFail(res, 401, "auth.tokenRequired");
      return;
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      respondFail(res, 401, "auth.tokenExpired");
      return;
    }

    respondFail(res, 401, "auth.tokenInvalid");
  }
}
