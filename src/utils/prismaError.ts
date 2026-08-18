// ============================================
// Prisma 에러 판별
// ============================================

/**
 * Prisma가 던지는 알려진 요청 에러인지 코드로 확인합니다.
 * 생성된 클라이언트가 ESM이라 에러 클래스를 런타임 import하지 않고 구조로만 판별합니다.
 * - P2002: unique 제약 위반 (중복 생성)
 * - P2025: 대상 레코드 없음 (update/delete 실패)
 */
export function isPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as Error & { code?: unknown }).code === code
  );
}
