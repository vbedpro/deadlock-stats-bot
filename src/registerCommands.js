require('dotenv').config();
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('optin')
    .setDescription('Opt in to daily Deadlock stat reports')
    .addIntegerOption((opt) =>
      opt.setName('account_id').setDescription('Your Deadlock/Steam account ID (SteamID3)').setRequired(true)
    ),
  new SlashCommandBuilder().setName('optout').setDescription('Opt out of daily Deadlock stat reports'),
  new SlashCommandBuilder().setName('deadlockreport').setDescription('Post the daily Deadlock stats report now'),
  new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('Set this channel as the daily Deadlock report destination (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
].map((c) => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  // Global registration: works in every server the bot is added to, no per-guild
  // config needed. Can take up to ~1 hour to propagate to all servers.
  await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
  console.log('Slash commands registered globally.');
})();
