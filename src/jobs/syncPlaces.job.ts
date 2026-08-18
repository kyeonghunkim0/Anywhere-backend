import cron from "node-cron";
import { env } from "../config/env.js";
import { syncAllPlaces, type SyncResult } from "../services/tourapi.service.js";

/** 실패 지역 비율이 이 값을 넘으면 경고 수준을 올립니다. */
const FAILURE_ALERT_THRESHOLD = 0.1;

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
      const result = await syncAllPlaces();
      reportSyncResult(result);
    } catch (error) {
      console.error("🚨 배치 동기화 크론잡이 통째로 실패했습니다:", error);
    }
  });

  console.log(`📅 TourAPI 배치 동기화 크론잡 등록 완료 (스케줄: ${schedule})`);
}

/**
 * 동기화 결과를 등급별로 로그에 남깁니다.
 * 실패 지역이 전체의 10%를 넘으면 🚨 로 표시해 로그 모니터링에서 눈에 띄게 합니다.
 * (별도 알림 채널이 붙으면 이 함수에서 호출하면 됩니다)
 */
function reportSyncResult(result: SyncResult): void {
  const { totalRegions, failedRegions } = result;
  if (totalRegions === 0 || failedRegions.length === 0) return;

  const failureRate = failedRegions.length / totalRegions;
  const level = failureRate > FAILURE_ALERT_THRESHOLD ? "🚨" : "⚠️";

  console.error(
    `${level} TourAPI 동기화 실패 지역 ${failedRegions.length}/${totalRegions}개 ` +
      `(${(failureRate * 100).toFixed(1)}%): ${failedRegions.join(", ")}`
  );
}
