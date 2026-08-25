import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",

  // OCI 관리형 PostgreSQL은 TLS 연결을 요구합니다.
  // DATABASE_SSL=true 로 켜고, OCI 콘솔에서 받은 CA 인증서 경로를 DATABASE_CA_CERT에 지정하세요.
  DATABASE_SSL: process.env.DATABASE_SSL === "true",
  DATABASE_CA_CERT: process.env.DATABASE_CA_CERT || "",
  JWT_SECRET: process.env.JWT_SECRET || "fallback-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  TOUR_API_KEY: process.env.TOUR_API_KEY || "",
  // 관광사진갤러리(PhotoGalleryService1)용 인증키.
  // 별도로 발급받지 않았다면 TOUR_API_KEY를 그대로 사용합니다.
  PHOTO_API_KEY: process.env.PHOTO_API_KEY || process.env.TOUR_API_KEY || "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID || "",
  SYNC_CRON_SCHEDULE: process.env.SYNC_CRON_SCHEDULE || "0 3 * * *",

  // 앱 정보 (최초 실행 시 클라이언트 버전/점검 상태 확인용)
  APP_LATEST_VERSION: process.env.APP_LATEST_VERSION || "1.0.0",
  APP_MIN_VERSION: process.env.APP_MIN_VERSION || "1.0.0", // 이 버전 미만은 강제 업데이트
  MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === "true",
  MAINTENANCE_MESSAGE:
    process.env.MAINTENANCE_MESSAGE || "서비스 점검 중입니다. 잠시 후 다시 이용해주세요.",
} as const;

// 필수 환경변수 검증
export function validateEnv(): void {
  const required: (keyof typeof env)[] = ["JWT_SECRET", "GOOGLE_CLIENT_ID", "APPLE_CLIENT_ID"];

  for (const key of required) {
    if (!env[key]) {
      throw new Error(`❌ 환경변수 ${key}가 설정되지 않았습니다. .env 파일을 확인해주세요.`);
    }
  }

  // 운영 환경에서는 기본값(fallback-secret)을 그대로 쓰지 못하게 막습니다.
  if (env.NODE_ENV === "production") {
    if (env.JWT_SECRET === "fallback-secret") {
      throw new Error("❌ 운영 환경에서 기본 JWT_SECRET을 사용할 수 없습니다.");
    }
    if (!env.DATABASE_URL.startsWith("postgres")) {
      throw new Error("❌ 운영 환경의 DATABASE_URL은 PostgreSQL 접속 문자열이어야 합니다.");
    }
    if (env.DATABASE_SSL && !env.DATABASE_CA_CERT) {
      throw new Error("❌ DATABASE_SSL=true이면 DATABASE_CA_CERT 경로가 필요합니다.");
    }
  }

  console.log("✅ 환경변수 로드 완료");
}
