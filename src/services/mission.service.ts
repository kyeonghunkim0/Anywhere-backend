import { prisma } from "../utils/prisma.js";
import { isWithinRadius } from "../utils/haversine.js";

interface CheckInInput {
  userId: string;
  placeId: string;
  userLat: number;
  userLng: number;
}

interface CheckInResult {
  success: boolean;
  message: string;
  stamp?: {
    id: string;
    placeName: string;
    regionName: string;
    checkedInAt: Date;
    totalStamps: number;
  };
}

/**
 * 체크인 (방문 인증) 처리
 * 1. 목적지 좌표를 DB에서 조회
 * 2. 현재 GPS와 목적지 GPS를 Haversine 공식으로 거리 계산
 * 3. 반경 500m 이내일 경우에만 체크인 성공
 * 4. UserStamp INSERT + 유저 도장 카운트 +1
 */
export async function checkIn(input: CheckInInput): Promise<CheckInResult> {
  const { userId, placeId, userLat, userLng } = input;

  // 1. 대상 장소 조회
  const place = await prisma.place.findUnique({
    where: { id: placeId },
    include: { region: true },
  });

  if (!place) {
    return {
      success: false,
      message: "존재하지 않는 관광지입니다.",
    };
  }

  // 2. GPS 거리 검증 (반경 500m)
  const withinRange = isWithinRadius(userLat, userLng, place.mapY, place.mapX, 500);

  if (!withinRange) {
    return {
      success: false,
      message: "현재 위치가 목적지에서 500m 이상 떨어져 있습니다. 더 가까이 이동해주세요!",
    };
  }

  // 3. 중복 체크인 방지 (같은 장소에 오늘 이미 체크인했는지 확인)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingStamp = await prisma.userStamp.findFirst({
    where: {
      userId,
      placeId,
      checkedInAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  if (existingStamp) {
    return {
      success: false,
      message: "오늘 이미 이 장소에 체크인하셨습니다. 내일 다시 방문해주세요!",
    };
  }

  // 4. 트랜잭션으로 도장 기록 + 카운트 업데이트
  const [stamp, updatedUser] = await prisma.$transaction([
    prisma.userStamp.create({
      data: {
        userId,
        placeId,
        regionId: place.regionId,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { totalStamps: { increment: 1 } },
    }),
  ]);

  return {
    success: true,
    message: `🎉 ${place.name} 방문 인증 완료! 도장을 획득했습니다!`,
    stamp: {
      id: stamp.id,
      placeName: place.name,
      regionName: `${place.region.sidoName} ${place.region.sigunguName}`,
      checkedInAt: stamp.checkedInAt,
      totalStamps: updatedUser.totalStamps,
    },
  };
}
