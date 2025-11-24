import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from "discord.js";
import { ALL_RANKS } from "@shared/schema";
import { getRankEmoji, MP_LOGO_EMOJI } from "./rank-emoji";

// Ranks FAQ Embed with interactive select menu
export function createRanksFAQEmbed() {
  const embed = new EmbedBuilder()
    .setColor(0x4A5D23) // Military green
    .setTitle(`${MP_LOGO_EMOJI} Stopnie Wojskowe - US Army`)
    .setDescription(
      "**Illinois National Guard** używa systemu stopni Armii Stanów Zjednoczonych.\n\n" +
      "Wybierz kategorię poniżej, aby zobaczyć szczegóły:"
    )
    .addFields(
      { 
        name: "👥 Szeregowi (Enlisted)", 
        value: "Od Private (PV1) do Sergeant Major of the Army (SMA)", 
        inline: false 
      },
      { 
        name: "⚔️ Warrant Officers", 
        value: "Od Warrant Officer 1 (WO1) do Chief Warrant Officer 5 (CW5)", 
        inline: false 
      },
      { 
        name: "⭐ Oficerowie (Officers)", 
        value: "Od Second Lieutenant (2LT) do General of the Army (GA)", 
        inline: false 
      }
    )
    .setFooter({ text: "Illinois National Guard" })
    .setTimestamp();

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("rank_category")
    .setPlaceholder("Wybierz kategorię stopni")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Szeregowi (Enlisted)")
        .setDescription("PV1, PFC, SPC, SGT, SSG, SFC, MSG, 1SG, SGM, CSM, SMA")
        .setValue("enlisted")
        .setEmoji("👥"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Warrant Officers")
        .setDescription("WO1, CW2, CW3, CW4, CW5")
        .setValue("warrant")
        .setEmoji("⚔️"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Oficerowie (Officers)")
        .setDescription("2LT, 1LT, CPT, MAJ, LTC, COL, BG, MG, LTG, GEN, GA")
        .setValue("officer")
        .setEmoji("⭐")
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  return { embeds: [embed], components: [row] };
}

// Get detailed ranks by category
export function getRankDetailsEmbed(category: string) {
  let ranks: typeof ALL_RANKS = [];
  let title = "";
  let color = 0x4A5D23;

  switch (category) {
    case "enlisted":
      ranks = ALL_RANKS.filter(r => r.level <= 10);
      title = "👥 Szeregowi (Enlisted Ranks)";
      color = 0x8B4513; // Brown
      break;
    case "warrant":
      ranks = ALL_RANKS.filter(r => r.level >= 11 && r.level <= 15);
      title = "⚔️ Warrant Officers";
      color = 0x4682B4; // Steel blue
      break;
    case "officer":
      ranks = ALL_RANKS.filter(r => r.level >= 16);
      title = "⭐ Oficerowie (Officer Ranks)";
      color = 0xFFD700; // Gold
      break;
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription("Szczegółowe informacje o stopniach wojskowych:")
    .setTimestamp();

  for (const rank of ranks) {
    const emoji = getRankEmoji(rank.code);
    embed.addFields({
      name: `${emoji} ${rank.code} - ${rank.name}`,
      value: `Poziom: ${rank.level}`,
      inline: true
    });
  }

  const backButton = new ButtonBuilder()
    .setCustomId("back_to_ranks")
    .setLabel("Powrót")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("⬅️");

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton);

  return { embeds: [embed], components: [row] };
}

// Illinois National Guard History Embed
export function createHistoryFAQEmbed() {
  const embed = new EmbedBuilder()
    .setColor(0x0033A0) // Illinois blue
    .setTitle(`${MP_LOGO_EMOJI} Historia Illinois National Guard`)
    .setDescription(
      "**Illinois National Guard** to jedna z najstarszych i najbardziej zasłużonych formacji Gwardii Narodowej w Stanach Zjednoczonych."
    )
    .addFields(
      {
        name: "📅 Założenie",
        value: "Illinois National Guard został założony w **1877 roku**, choć jego korzenie sięgają wojny o niepodległość.",
        inline: false
      },
      {
        name: "🎖️ Główne Konflikty",
        value: 
          "• **I Wojna Światowa** (1917-1918)\n" +
          "• **II Wojna Światowa** (1941-1945)\n" +
          "• **Wojna w Korei** (1950-1953)\n" +
          "• **Wojna w Wietnamie** (1955-1975)\n" +
          "• **Operacja Desert Storm** (1991)\n" +
          "• **Wojna w Iraku** (2003-2011)\n" +
          "• **Wojna w Afganistanie** (2001-2021)",
        inline: false
      },
      {
        name: "🏛️ Misja",
        value: 
          "Illinois National Guard służy **podwójnej misji**:\n" +
          "1. Wsparcie federalne - pomoc armii USA\n" +
          "2. Wsparcie stanowe - pomoc w sytuacjach kryzysowych w Illinois",
        inline: false
      },
      {
        name: "👥 Skład",
        value: "Ponad **13,000** żołnierzy i lotników służy w Illinois Army i Air National Guard.",
        inline: false
      },
      {
        name: "🔗 Więcej Informacji",
        value: "[Oficjalna strona Illinois National Guard](https://il.ng.mil/)",
        inline: false
      }
    )
    .setFooter({ text: "Illinois National Guard - Służba od 1877 roku" })
    .setTimestamp();

  const backButton = new ButtonBuilder()
    .setCustomId("back_to_main_faq")
    .setLabel("Powrót do menu głównego")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("⬅️");

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton);

  return { embeds: [embed], components: [row] };
}

// Recruitment FAQ Embed
export function createRecruitmentFAQEmbed() {
  const embed = new EmbedBuilder()
    .setColor(0x006B3F) // Military green
    .setTitle(`${MP_LOGO_EMOJI} Jak Dołączyć do Illinois National Guard?`)
    .setDescription(
      "Zainteresowany służbą w **Illinois National Guard**? Oto najważniejsze informacje:"
    )
    .addFields(
      {
        name: "✅ Wymagania Podstawowe",
        value: 
          "• Wiek: **17-35 lat** (z zgodą rodzica dla 17-latków)\n" +
          "• Obywatelstwo USA lub zielona karta\n" +
          "• Dyplom szkoły średniej lub GED\n" +
          "• Zdanie testu ASVAB\n" +
          "• Spełnienie standardów medycznych i fizycznych",
        inline: false
      },
      {
        name: "💰 Korzyści",
        value: 
          "• **Wynagrodzenie** za szkolenie i służbę\n" +
          "• **Pomoc edukacyjna** - pokrycie czesnego\n" +
          "• **Ubezpieczenie zdrowotne**\n" +
          "• **Szkolenia zawodowe**\n" +
          "• **Plany emerytalne**\n" +
          "• **Doświadczenie przywódcze**",
        inline: false
      },
      {
        name: "📋 Proces Rekrutacji",
        value: 
          "1️⃣ Rozmowa z rekruterem\n" +
          "2️⃣ Test ASVAB (Armed Services Vocational Aptitude Battery)\n" +
          "3️⃣ Badanie medyczne\n" +
          "4️⃣ Złożenie przysięgi\n" +
          "5️⃣ Basic Combat Training (BCT)\n" +
          "6️⃣ Advanced Individual Training (AIT)",
        inline: false
      },
      {
        name: "⏱️ Zobowiązanie Czasowe",
        value: 
          "• **1 weekend w miesiącu** (sobota-niedziela)\n" +
          "• **2 tygodnie rocznie** (szkolenie letnie)\n" +
          "• Możliwość dodatkowych zadań i misji",
        inline: false
      },
      {
        name: "📞 Kontakt",
        value: 
          "**Oficjalna strona rekrutacji:**\n" +
          "[National Guard Recruitment](https://www.nationalguard.com/)\n\n" +
          "**Illinois National Guard:**\n" +
          "[il.ng.mil](https://il.ng.mil/)",
        inline: false
      }
    )
    .setFooter({ text: "Illinois National Guard - Twoja służba zaczyna się tutaj" })
    .setTimestamp();

  const applyButton = new ButtonBuilder()
    .setLabel("Aplikuj Online")
    .setStyle(ButtonStyle.Link)
    .setURL("https://www.nationalguard.com/select-your-state")
    .setEmoji("📝");

  const backButton = new ButtonBuilder()
    .setCustomId("back_to_main_faq")
    .setLabel("Powrót")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("⬅️");

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(applyButton, backButton);

  return { embeds: [embed], components: [row] };
}

// Main FAQ Menu
export function createMainFAQMenu() {
  const embed = new EmbedBuilder()
    .setColor(0x4A5D23)
    .setTitle(`${MP_LOGO_EMOJI} FAQ - Illinois National Guard`)
    .setDescription(
      "Witaj w centrum informacyjnym **Illinois National Guard**!\n\n" +
      "Wybierz temat, aby dowiedzieć się więcej:"
    )
    .addFields(
      {
        name: "🎖️ Stopnie Wojskowe",
        value: "Poznaj hierarchię stopni US Army",
        inline: true
      },
      {
        name: "📚 Historia",
        value: "Historia Illinois National Guard",
        inline: true
      },
      {
        name: "📝 Rekrutacja",
        value: "Jak dołączyć do formacji",
        inline: true
      }
    )
    .setFooter({ text: "Illinois National Guard" })
    .setTimestamp();

  const ranksButton = new ButtonBuilder()
    .setCustomId("faq_ranks")
    .setLabel("Stopnie Wojskowe")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("🎖️");

  const historyButton = new ButtonBuilder()
    .setCustomId("faq_history")
    .setLabel("Historia")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("📚");

  const recruitmentButton = new ButtonBuilder()
    .setCustomId("faq_recruitment")
    .setLabel("Rekrutacja")
    .setStyle(ButtonStyle.Success)
    .setEmoji("📝");

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    ranksButton,
    historyButton,
    recruitmentButton
  );

  return { embeds: [embed], components: [row] };
}
