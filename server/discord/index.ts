import {
  Client,
  GatewayIntentBits,
  Events,
  TextChannel,
  Interaction,
  MessageComponentInteraction
} from "discord.js";
import { getDiscordConfig } from "./config";
import {
  createMainFAQMenu,
  createRanksFAQEmbed,
  createHistoryFAQEmbed,
  createRecruitmentFAQEmbed,
  getRankDetailsEmbed
} from "./faq-embeds";
import { storage } from "../storage";

let discordClient: Client | null = null;

// Initialize and start Discord bot
export async function startDiscordBot() {
  try {
    const config = getDiscordConfig();

    // Create Discord client
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    // Bot ready event
    client.once(Events.ClientReady, async (readyClient) => {
      console.log(`✅ Discord bot zalogowany jako ${readyClient.user.tag}`);
      console.log(`🎯 Połączony z serwerem: ${config.guildId}`);

      // Post FAQ to channel if configured
      if (config.faqChannelId) {
        await postFAQToChannel(readyClient, config.faqChannelId);
      } else {
        console.log("⚠️  DISCORD_FAQ_CHANNEL_ID nie ustawione - FAQ nie zostanie automatycznie opublikowane");
      }

      // Sync ranks with Discord roles (optional future feature)
      // await syncRanksWithDiscord(readyClient, config.guildId);
    });

    // Handle button and select menu interactions
    client.on(Events.InteractionCreate, async (interaction: Interaction) => {
      if (!interaction.isMessageComponent()) return;

      const componentInteraction = interaction as MessageComponentInteraction;

      try {
        // Handle select menu
        if (componentInteraction.isStringSelectMenu()) {
          const selectedValue = componentInteraction.values[0];

          if (componentInteraction.customId === "rank_category") {
            const response = getRankDetailsEmbed(selectedValue);
            await componentInteraction.update(response);
          }
        }

        // Handle buttons
        if (componentInteraction.isButton()) {
          const buttonId = componentInteraction.customId;

          switch (buttonId) {
            case "faq_ranks":
              const ranksMenu = createRanksFAQEmbed();
              await componentInteraction.update(ranksMenu);
              break;

            case "faq_history":
              const historyEmbed = createHistoryFAQEmbed();
              await componentInteraction.update(historyEmbed);
              break;

            case "faq_recruitment":
              const recruitmentEmbed = createRecruitmentFAQEmbed();
              await componentInteraction.update(recruitmentEmbed);
              break;

            case "back_to_ranks":
              const backToRanks = createRanksFAQEmbed();
              await componentInteraction.update(backToRanks);
              break;

            case "back_to_main_faq":
              const mainMenu = createMainFAQMenu();
              await componentInteraction.update(mainMenu);
              break;

            default:
              console.log(`Unknown button interaction: ${buttonId}`);
          }
        }
      } catch (error) {
        console.error("Error handling interaction:", error);
        
        if (!componentInteraction.replied && !componentInteraction.deferred) {
          await componentInteraction.reply({
            content: "Wystąpił błąd podczas przetwarzania interakcji.",
            ephemeral: true,
          });
        }
      }
    });

    // Error handling
    client.on(Events.Error, (error) => {
      console.error("Discord client error:", error);
    });

    // Login to Discord
    await client.login(config.token);
    discordClient = client;

    return client;
  } catch (error) {
    console.error("Failed to start Discord bot:", error);
    throw error;
  }
}

// Post FAQ menu to a specific channel
async function postFAQToChannel(client: Client, channelId: string) {
  try {
    const channel = await client.channels.fetch(channelId);

    if (!channel || !(channel instanceof TextChannel)) {
      console.error(`Channel ${channelId} nie jest kanałem tekstowym`);
      return;
    }

    const faqMenu = createMainFAQMenu();

    // Check if FAQ message already exists (optional: store message ID in config)
    const messages = await channel.messages.fetch({ limit: 10 });
    const existingFAQ = messages.find(
      (msg) =>
        msg.author.id === client.user?.id &&
        msg.embeds.length > 0 &&
        msg.embeds[0].title?.includes("FAQ")
    );

    if (existingFAQ) {
      // Update existing message
      await existingFAQ.edit(faqMenu);
      console.log(`✅ Zaktualizowano FAQ w kanale: ${channel.name}`);
    } else {
      // Send new message
      await channel.send(faqMenu);
      console.log(`✅ Wysłano FAQ do kanału: ${channel.name}`);
    }
  } catch (error) {
    console.error("Error posting FAQ to channel:", error);
  }
}

// Sync Discord roles with rank system (future feature)
async function syncRanksWithDiscord(client: Client, guildId: string) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const users = await storage.getAllUsers();

    console.log(`🔄 Synchronizacja ${users.length} użytkowników z Discord...`);

    for (const user of users) {
      if (!user.discordId) continue;

      try {
        const member = await guild.members.fetch(user.discordId);
        
        // Here you could:
        // 1. Update Discord nickname with rank
        // 2. Assign Discord roles based on rank
        // 3. Sync other data
        
        // Example: Update nickname
        const displayName = `[${user.rank}] ${user.firstName} ${user.lastName}`;
        if (member.nickname !== displayName) {
          // await member.setNickname(displayName);
          console.log(`Updated nickname for ${user.username}`);
        }
      } catch (error) {
        console.log(`Could not sync user ${user.username}: ${error}`);
      }
    }

    console.log("✅ Synchronizacja zakończona");
  } catch (error) {
    console.error("Error syncing ranks with Discord:", error);
  }
}

// Stop Discord bot
export async function stopDiscordBot() {
  if (discordClient) {
    discordClient.destroy();
    discordClient = null;
    console.log("🛑 Discord bot zatrzymany");
  }
}

// Get Discord client instance
export function getDiscordClient(): Client | null {
  return discordClient;
}
