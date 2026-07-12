import cron from "node-cron";
import { env } from "../config/env.js";
import { syncAllPlaces } from "../services/tourapi.service.js";

/**
 * TourAPI 관광지 데이터 배치 동기화 크론잡
 * 기본: 매일 새벽 3시 (SYNC_CRON_SCHEDULE 환경변수로 변경 가능)
 */
export function startSyncPlacesJob(): void {
  const schedule = env.SYNC_CRON_SCHEDULE;

  if (!cron.validate(schedule)) {
    console.error(`❌ 유효하지 않은 크론 스케줄: ${schedule}`);
    return;
  }

  cron.schedule(schedule, async () => {
    console.log(`⏰ [${new Date().toISOString()}] TourAPI 배치 동기화 크론잡 실행`);
    try {
      await syncAllPlaces();
    } catch (error) {
      console.error("❌ 배치 동기화 크론잡 실패:", error);
    }
  });

  console.log(`📅 TourAPI 배치 동기화 크론잡 등록 완료 (스케줄: ${schedule})`);
}
