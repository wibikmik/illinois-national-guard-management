import { ENLISTED_RANKS, WARRANT_RANKS, OFFICER_RANKS, ALL_RANKS, RankCode } from "@shared/schema";

export function getRankDetails(code: RankCode) {
  return ALL_RANKS.find(r => r.code === code);
}

export function getRankName(code: RankCode): string {
  const rank = getRankDetails(code);
  return rank ? `${rank.code} - ${rank.name}` : code;
}

export function getRankLevel(code: RankCode): number {
  const rank = getRankDetails(code);
  return rank?.level || 0;
}

export function getRankCategory(code: RankCode): "Enlisted" | "Warrant" | "Officer" {
  if (ENLISTED_RANKS.find(r => r.code === code)) return "Enlisted";
  if (WARRANT_RANKS.find(r => r.code === code)) return "Warrant";
  return "Officer";
}

export function canPromoteTo(currentRank: RankCode, targetRank: RankCode): boolean {
  const currentLevel = getRankLevel(currentRank);
  const targetLevel = getRankLevel(targetRank);
  return targetLevel === currentLevel + 1;
}

export { ENLISTED_RANKS, WARRANT_RANKS, OFFICER_RANKS, ALL_RANKS };
