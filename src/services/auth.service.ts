import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../utils/prisma.js";
import { verifyGoogleIdToken } from "../utils/googleAuth.js";
import { verifyAppleIdToken } from "../utils/appleAuth.js";
import { isPrismaErrorCode } from "../utils/prismaError.js";

/**
 * 소셜 idToken 검증 실패 에러
 * 서명·issuer·audience 불일치, 만료, 형식 오류를 모두 포함합니다.
 * (컨트롤러는 이 에러를 401로 응답합니다)
 */
export class IdTokenVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdTokenVerificationError";
  }
}

/**
 * 토큰 자체가 잘못된 경우(401)인지, 공개키 조회 실패 같은 서버/네트워크 문제(500)인지 구분합니다.
 * jsonwebtoken은 서명·issuer·audience·만료 오류를 모두 JsonWebTokenError 계열로 던지고,
 * google-auth-library는 평범한 Error를 던지되 네트워크 오류에는 code/response 필드가 붙습니다.
 */
function isInvalidTokenError(error: unknown): boolean {
  if (error instanceof jwt.JsonWebTokenError) return true;
  if (!(error instanceof Error)) return false;

  // 프로바이더가 발급한 적 없는 kid = 위조되었거나 폐기된 토큰이므로 401입니다.
  if (error.name === "SigningKeyNotFoundError") return true;

  // 반면 JWKS 엔드포인트 자체를 못 읽은 경우는 서버 문제이므로 500으로 넘깁니다.
  if (error.name === "JwksError" || error.name === "JwksRateLimitError") return false;
  if (error.message.includes("서명 키를 찾을 수 없습니다")) return false;

  // 네트워크 계층 오류(GaxiosError 등)도 500으로 넘깁니다.
  return !("code" in error || "response" in error);
}

interface LoginInput {
  socialType: "apple" | "google";
  /** google: GIDGoogleUser.idToken.tokenString / apple: ASAuthorizationAppleIDCredential.identityToken */
  idToken: string;
  nickname?: string;
}

interface AuthResult {
  token: string;
  user: {
    id: string;
    nickname: string;
    socialType: string;
    totalStamps: number;
  };
  isNewUser: boolean;
}

/**
 * 소셜 로그인 처리
 * - 기존 유저: JWT 발급
 * - 신규 유저: 회원가입 + JWT 발급
 */
export async function loginWithSocial(input: LoginInput): Promise<AuthResult> {
  const { socialType, idToken, nickname } = input;

  // 클라이언트가 보낸 socialId는 스푸핑 가능하므로 신뢰하지 않고,
  // 각 프로바이더의 공개키로 idToken을 검증해서 나온 sub만 socialId로 사용합니다.
  // 검증 단계의 모든 실패는 IdTokenVerificationError로 감싸서 401로 내려보냅니다.
  let socialId: string;
  try {
    socialId =
      socialType === "google"
        ? (await verifyGoogleIdToken(idToken)).sub
        : (await verifyAppleIdToken(idToken)).sub;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`${socialType} idToken 검증 실패:`, detail);
    if (isInvalidTokenError(error)) {
      throw new IdTokenVerificationError("유효하지 않은 idToken입니다.");
    }
    throw error;
  }

  // 기존 유저 조회
  let user = await prisma.user.findUnique({
    where: { socialId },
  });

  let isNewUser = false;

  if (!user) {
    // 신규 유저 생성
    // 같은 socialId로 요청이 동시에 들어오면 한쪽은 unique 제약(P2002)에 걸리므로,
    // 그때는 먼저 생성된 유저를 다시 읽어 정상 로그인으로 처리합니다.
    try {
      user = await prisma.user.create({
        data: {
          socialType,
          socialId,
          nickname: nickname || `여행자_${Date.now().toString(36)}`,
          totalStamps: 0,
        },
      });
      isNewUser = true;
      console.log(`🆕 새 유저 가입: ${user.nickname} (${socialType})`);
    } catch (error) {
      if (!isPrismaErrorCode(error, "P2002")) throw error;
      user = await prisma.user.findUnique({ where: { socialId } });
      if (!user) throw error;
    }
  }

  // JWT 토큰 생성
  const token = jwt.sign(
    { userId: user.id },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  return {
    token,
    user: {
      id: user.id,
      nickname: user.nickname,
      socialType: user.socialType,
      totalStamps: user.totalStamps,
    },
    isNewUser,
  };
}
