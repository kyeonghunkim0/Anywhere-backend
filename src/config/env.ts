import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
  JWT_SECRET: process.env.JWT_SECRET || "fallback-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  TOUR_API_KEY: process.env.TOUR_API_KEY || "",
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

  console.log("✅ 환경변수 로드 완료");
}
