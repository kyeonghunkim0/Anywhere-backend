/**
 * Haversine 공식을 사용한 두 GPS 좌표 사이의 거리 계산
 * @param lat1 - 지점 1의 위도
 * @param lng1 - 지점 1의 경도
 * @param lat2 - 지점 2의 위도
 * @param lng2 - 지점 2의 경도
 * @returns 두 지점 사이의 거리 (킬로미터, km)
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 지구 반지름 (km)

  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 두 좌표가 주어진 반경(미터) 이내인지 확인
 * @param lat1 - 지점 1의 위도
 * @param lng1 - 지점 1의 경도
 * @param lat2 - 지점 2의 위도
 * @param lng2 - 지점 2의 경도
 * @param radiusMeters - 허용 반경 (미터, 기본값: 500m)
 * @returns 반경 이내이면 true
 */
export function isWithinRadius(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radiusMeters: number = 500
): boolean {
  const distanceKm = haversineDistance(lat1, lng1, lat2, lng2);
  return distanceKm * 1000 <= radiusMeters;
}
