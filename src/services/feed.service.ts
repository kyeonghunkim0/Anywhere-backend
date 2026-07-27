import { prisma } from "../utils/prisma.js";

interface FeedItem {
  id: string;
  nickname: string;
  sidoName: string;
  sigunguName: string;
  placeName: string;
  isDepopulated: boolean;
  checkedInAt: Date;
  message: string;
}

interface FeedResult {
  items: FeedItem[];
  totalCount: number;
}

/**
 * 최근 체크인 활동 피드 조회
 * 홈 화면 상단 실시간 방문 알림 티커용
 * "방금 닉네임님이 부천시 도장을 획득했습니다!"
 */
export async function getRecentFeed(limit: number = 20): Promise<FeedResult> {
  const recentStamps = await prisma.userStamp.findMany({
    orderBy: { checkedInAt: "desc" },
    take: limit,
    include: {
      user: {
        select: { nickname: true },
      },
      place: {
        select: { name: true },
      },
      region: {
        select: {
          sidoName: true,
          sigunguName: true,
          isDepopulated: true,
        },
      },
    },
  });

  const totalCount = await prisma.userStamp.count();

  const items: FeedItem[] = recentStamps.map((stamp) => {
    const regionLabel = `${stamp.region.sidoName} ${stamp.region.sigunguName}`;
    const depopulatedEmoji = stamp.region.isDepopulated ? "🌟 " : "";

    return {
      id: stamp.id,
      nickname: stamp.user.nickname,
      sidoName: stamp.region.sidoName,
      sigunguName: stamp.region.sigunguName,
      placeName: stamp.place.name,
      isDepopulated: stamp.region.isDepopulated,
      checkedInAt: stamp.checkedInAt,
      message: `${depopulatedEmoji}${stamp.user.nickname}님이 ${regionLabel} 도장을 획득했습니다!`,
    };
  });

  return { items, totalCount };
}
