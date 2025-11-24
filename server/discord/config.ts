// Discord bot configuration

export interface DiscordBotConfig {
  token: string;
  guildId: string;
  faqChannelId?: string;
  clientId?: string;
}

export function getDiscordConfig(): DiscordBotConfig {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID || "1442044188089651285";
  const faqChannelId = process.env.DISCORD_FAQ_CHANNEL_ID;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token) {
    throw new Error("DISCORD_BOT_TOKEN is required in environment variables");
  }

  return {
    token,
    guildId,
    faqChannelId,
    clientId
  };
}
