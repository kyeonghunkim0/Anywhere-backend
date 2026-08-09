import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../utils/prisma.js";
import { verifyGoogleIdToken } from "../utils/googleAuth.js";
import { verifyAppleIdToken } from "../utils/appleAuth.js";

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
  const socialId =
    socialType === "google"
      ? (await verifyGoogleIdToken(idToken)).sub
      : (await verifyAppleIdToken(idToken)).sub;

  // 기존 유저 조회
  let user = await prisma.user.findUnique({
    where: { socialId },
  });

  let isNewUser = false;

  if (!user) {
    // 신규 유저 생성
    isNewUser = true;
    user = await prisma.user.create({
      data: {
        socialType,
        socialId,
        nickname: nickname || `여행자_${Date.now().toString(36)}`,
        totalStamps: 0,
      },
    });
    console.log(`🆕 새 유저 가입: ${user.nickname} (${socialType})`);
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
