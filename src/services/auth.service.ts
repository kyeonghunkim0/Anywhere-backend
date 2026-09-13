import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../utils/prisma.js";
import { verifyGoogleIdToken } from "../utils/googleAuth.js";
import { verifyAppleIdToken } from "../utils/appleAuth.js";
import { isPrismaErrorCode } from "../utils/prismaError.js";
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from "../utils/errors.js";

/**
 * 소셜 idToken 검증 실패 에러
 * 서명·issuer·audience 불일치, 만료, 형식 오류를 모두 포함합니다.
 * (컨트롤러는 이 에러를 401로 응답합니다)
 */
export class IdTokenVerificationError extends UnauthorizedError {
  constructor() {
    super("auth.idTokenVerificationFailed");
    this.name = "IdTokenVerificationError";
  }
}

/**
 * 토큰 자체가 잘못된 경우(401)인지, 공개키 조회 실패 같은 서버/네트워크 문제(500)인지 구분합니다.
 * 아래 셋만 401로 보고, 나머지는 전부 서버 문제로 간주해 그대로 올려보냅니다.
 * - jsonwebtoken이 던지는 서명·issuer·audience·만료 오류
 * - 각 프로바이더 유틸이 명시적으로 던진 UnauthorizedError
 * - 프로바이더가 발급한 적 없는 kid (위조되었거나 폐기된 토큰)
 */
function isInvalidTokenError(error: unknown): boolean {
  if (error instanceof jwt.JsonWebTokenError) return true;
  if (error instanceof UnauthorizedError) return true;
  return error instanceof Error && error.name === "SigningKeyNotFoundError";
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
      throw new IdTokenVerificationError();
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

interface GuestLoginInput {
  /** 클라이언트가 생성해 저장해 둔 디바이스 UUID */
  deviceId: string;
  nickname?: string;
}

interface GuestUser {
  id: string;
  nickname: string;
  socialType: string;
  totalStamps: number;
  isGuest: boolean;
  guestExpiresAt: Date | null;
}

interface GuestAuthResult {
  token: string;
  user: GuestUser;
  isNewUser: boolean;
}

/**
 * 비회원(게스트) 로그인
 * - deviceId로 기존 게스트 계정을 찾거나 새로 만듭니다.
 * - 로그인할 때마다 만료 시각을 GUEST_EXPIRES_IN_HOURS만큼 뒤로 연장합니다.
 * - JWT 만료도 계정 만료와 동일하게 맞춰서, 토큰이 살아있는 한 계정도 유효하도록 합니다.
 */
export async function loginAsGuest(input: GuestLoginInput): Promise<GuestAuthResult> {
  const { deviceId, nickname } = input;
  const expiresInSeconds = env.GUEST_EXPIRES_IN_HOURS * 3600;
  const guestExpiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  let user = await prisma.user.findUnique({ where: { socialId: deviceId } });
  let isNewUser = false;

  if (!user) {
    // 동시 요청으로 같은 deviceId가 겹치면 한쪽은 unique 제약(P2002)에 걸리므로,
    // 그때는 먼저 생성된 게스트를 다시 읽어 정상 로그인으로 처리합니다.
    try {
      user = await prisma.user.create({
        data: {
          socialType: "guest",
          socialId: deviceId,
          nickname: nickname || `여행자_${Date.now().toString(36)}`,
          totalStamps: 0,
          isGuest: true,
          guestExpiresAt,
        },
      });
      isNewUser = true;
      console.log(`🆕 새 게스트 유저 생성: ${user.nickname}`);
    } catch (error) {
      if (!isPrismaErrorCode(error, "P2002")) throw error;
      user = await prisma.user.findUnique({ where: { socialId: deviceId } });
      if (!user) throw error;
    }
  }

  if (user.socialType !== "guest") {
    // 이미 정회원으로 전환된 deviceId — 게스트로 되돌리지 않고 막습니다.
    throw new ConflictError("auth.deviceAlreadyLinked");
  }

  if (!isNewUser) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { guestExpiresAt },
    });
  }

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: expiresInSeconds });

  return {
    token,
    user: {
      id: user.id,
      nickname: user.nickname,
      socialType: user.socialType,
      totalStamps: user.totalStamps,
      isGuest: user.isGuest,
      guestExpiresAt: user.guestExpiresAt,
    },
    isNewUser,
  };
}

interface UpgradeGuestInput {
  guestUserId: string;
  socialType: "apple" | "google";
  /** google: GIDGoogleUser.idToken.tokenString / apple: ASAuthorizationAppleIDCredential.identityToken */
  idToken: string;
  nickname?: string;
}

/**
 * 게스트 계정을 소셜 로그인 정회원 계정으로 전환합니다.
 * 스탬프·매칭이력 등 기존 데이터는 같은 User row를 그대로 갱신하므로 보존됩니다.
 */
export async function upgradeGuestToSocial(input: UpgradeGuestInput): Promise<AuthResult> {
  const { guestUserId, socialType, idToken, nickname } = input;

  const guestUser = await prisma.user.findUnique({ where: { id: guestUserId } });
  if (!guestUser) throw new NotFoundError("user.notFound");
  if (!guestUser.isGuest) throw new ValidationError("auth.notGuestUser");

  let socialId: string;
  try {
    socialId =
      socialType === "google"
        ? (await verifyGoogleIdToken(idToken)).sub
        : (await verifyAppleIdToken(idToken)).sub;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`${socialType} idToken 검증 실패(게스트 전환):`, detail);
    if (isInvalidTokenError(error)) {
      throw new IdTokenVerificationError();
    }
    throw error;
  }

  const existing = await prisma.user.findUnique({ where: { socialId } });
  if (existing && existing.id !== guestUser.id) {
    // 이 소셜 계정은 이미 다른 유저에 연결되어 있음 — 계정 병합은 지원하지 않습니다.
    throw new ConflictError("auth.socialAccountAlreadyLinked");
  }

  const user = await prisma.user.update({
    where: { id: guestUser.id },
    data: {
      socialType,
      socialId,
      isGuest: false,
      guestExpiresAt: null,
      ...(nickname ? { nickname } : {}),
    },
  });

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
    isNewUser: false,
  };
}

/**
 * 만료된 게스트 계정을 정리합니다.
 * FK 제약을 피하기 위해 연관 데이터(스탬프·매칭이력·뱃지·리뷰)를 먼저 지운 뒤 User row를 삭제합니다.
 * 반환값은 삭제된 게스트 계정 수입니다.
 */
export async function cleanupExpiredGuests(): Promise<number> {
  const expiredGuests = await prisma.user.findMany({
    where: { isGuest: true, guestExpiresAt: { lt: new Date() } },
    select: { id: true },
  });

  if (expiredGuests.length === 0) return 0;

  const ids = expiredGuests.map((guest) => guest.id);

  await prisma.$transaction([
    prisma.userStamp.deleteMany({ where: { userId: { in: ids } } }),
    prisma.matchHistory.deleteMany({ where: { userId: { in: ids } } }),
    prisma.userBadge.deleteMany({ where: { userId: { in: ids } } }),
    prisma.review.deleteMany({ where: { userId: { in: ids } } }),
    prisma.user.deleteMany({ where: { id: { in: ids } } }),
  ]);

  return ids.length;
}
