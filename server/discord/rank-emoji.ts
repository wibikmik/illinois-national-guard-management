// Discord rank emoji mapping
// Custom emojis from Illinois National Guard server

export const RANK_EMOJI_MAP: Record<string, string> = {
  // Enlisted Ranks
  "PV1": "<:private:1442213272819339305>",
  "PV2": "<:private:1442213272819339305>",
  "PFC": "<:private_first_class:1442213274027298867>",
  "SPC": "<:specialist:1442213280818008092>",
  "CPL": "<:corporal:1442213243786629371>",
  "SGT": "<:sergeant:1442213276384497775>",
  "SSG": "<:staff_sergeant:1442213282210644220>",
  "SFC": "<:sergeant_first_class:1442213277433204746>",
  "MSG": "<:master_sergeant:1442213271540207616>",
  "1SG": "<:first_sergeant:1442213260685479976>",
  "SGM": "<:sergeant_major:1442213278573920387>",
  "CSM": "<:command_sergeant_major:1442213242385727488>",
  "SMA": "<:sergeant_major_of_the_army:1442213279635214386>",

  // Warrant Officer Ranks
  "WO1": "<:cw1:1442213245296447721>",
  "CW2": "<:cw2:1442213246902866020>",
  "CW3": "<:cw3:1442213248370741399>",
  "CW4": "<:cw4:1442213249918701711>",
  "CW5": "<:cw5:1442213251411873802>",

  // Officer Ranks
  "2LT": "<:second_lieutenant:1442213275046645941>",
  "1LT": "<:first_lieutenant:1442213259548692490>",
  "CPT": "<:captain:1442213239369761031>",
  "MAJ": "<:major:1442213268755058749>",
  "LTC": "<:lieutenant_colonel:1442213265060008089>",
  "COL": "<:colonel:1442213241249071265>",
  "BG": "<:brigadier_general:1442213238606401606>",
  "MG": "<:major_general:1442213270147567752>",
  "LTG": "<:lieutenant_general:1442213267085983895>",
  "GEN": "<:general:1442213262413402253>",
  "GA": "<:general_of_the_army:1442213263772221651>"
};

// MP Logo emoji
export const MP_LOGO_EMOJI = "<:MPlogo:1442214155255025854>";

// Get rank emoji by rank code
export function getRankEmoji(rankCode: string): string {
  return RANK_EMOJI_MAP[rankCode] || "🎖️";
}
