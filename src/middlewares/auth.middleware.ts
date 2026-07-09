import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

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
      res.status(401).json({
        success: false,
        message: "인증 토큰이 필요합니다. Authorization 헤더를 확인해주세요.",
      });
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
      res.status(401).json({
        success: false,
        message: "토큰이 만료되었습니다. 다시 로그인해주세요.",
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다.",
    });
  }
}
