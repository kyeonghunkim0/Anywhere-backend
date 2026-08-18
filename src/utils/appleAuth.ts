import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { env } from "../config/env.js";
import { UnauthorizedError } from "./errors.js";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS_URI = "https://appleid.apple.com/auth/keys";

const client = jwksClient({
  jwksUri: APPLE_JWKS_URI,
  cache: true,
  rateLimit: true,
});

function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err || !key) {
        reject(err ?? new Error("Apple 서명 키를 찾을 수 없습니다."));
        return;
      }
      resolve(key.getPublicKey());
    });
  });
}

export interface AppleIdTokenPayload {
  sub: string;
  email?: string;
}

/**
 * 클라이언트가 보낸 Apple identityToken을 Apple 공개키(JWKS)로 검증합니다.
 * 여기서 나온 sub(고유 유저 ID)만 신뢰할 수 있는 socialId입니다 —
 * 클라이언트가 body로 보낸 socialId는 스푸핑 가능하므로 사용하지 않습니다.
 */
export async function verifyAppleIdToken(idToken: string): Promise<AppleIdTokenPayload> {
  const decodedHeader = jwt.decode(idToken, { complete: true });
  const kid = decodedHeader?.header?.kid;
  if (!kid || typeof decodedHeader === "string") {
    throw new UnauthorizedError("유효하지 않은 Apple idToken입니다.");
  }

  const publicKey = await getSigningKey(kid);

  const payload = jwt.verify(idToken, publicKey, {
    algorithms: ["RS256"],
    issuer: APPLE_ISSUER,
    audience: env.APPLE_CLIENT_ID,
  });

  if (typeof payload === "string" || !payload.sub) {
    throw new UnauthorizedError("유효하지 않은 Apple idToken입니다.");
  }

  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
  };
}
