// ===================================
// 위치 좌표 쿼리 파싱 / 거리 반올림
// ===================================

import { haversineDistance } from "./haversine.js";

export interface Coords {
  lat: number;
  lng: number;
}

/**
 * 쿼리스트링의 lat/lng 쌍을 파싱한다.
 * - 둘 다 없으면 undefined (거리 계산 생략)
 * - 하나만 있거나 숫자 범위를 벗어나면 null (잘못된 입력 → 컨트롤러가 400 처리)
 */
export function parseCoords(
  rawLat: unknown,
  rawLng: unknown
): Coords | null | undefined {
  if (rawLat === undefined && rawLng === undefined) return undefined;
  if (rawLat === undefined || rawLng === undefined) return null;

  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

/** 소수 첫째 자리까지 반올림한 거리(km). match.service.ts와 동일한 표기. */
export function roundDistanceKm(km: number): number {
  return Math.round(km * 10) / 10;
}

/**
 * 사용자 좌표와 장소 좌표(mapY=위도, mapX=경도)로 거리(km)를 낸다.
 * 좌표가 없으면 null.
 */
export function distanceToPlace(
  coords: Coords | null | undefined,
  mapY: number,
  mapX: number
): number | null {
  if (!coords) return null;
  return roundDistanceKm(haversineDistance(coords.lat, coords.lng, mapY, mapX));
}
