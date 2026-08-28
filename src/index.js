require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const { optIn, optOut, setReportChannel, listGuildIdsWithReportChannel } = require('./store');
const { buildDailyReport } = require('./report');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

function chunkMessage(text) {
  // Discord messages cap at 2000 chars; split on lines if the report is long.
  const chunks = [];
  let current = '';
  for (const line of text.split('\n')) {
    if ((current + '\n' + line).length > 1900) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function postDailyReportForGuild(guildId, reportChannelId) {
  const guild = await client.guilds.fetch(guildId);
  const channel = await client.channels.fetch(reportChannelId);
  const report = await buildDailyReport(guild);
  for (const chunk of chunkMessage(report)) await channel.send(chunk);
}

async function postDailyReports() {
  for (const { guildId, reportChannelId } of listGuildIdsWithReportChannel()) {
    try {
      await postDailyReportForGuild(guildId, reportChannelId);
    } catch (err) {
      console.error(`Daily report failed for guild ${guildId}:`, err);
    }
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}, in ${client.guilds.cache.size} server(s)`);
  // 11:00 AM America/New_York daily; node-cron handles the EST/EDT offset via the timezone option.
  cron.schedule('0 11 * * *', () => postDailyReports(), { timezone: 'America/New_York' });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const guildId = interaction.guildId;

  if (interaction.commandName === 'optin') {
    const accountId = interaction.options.getInteger('account_id', true);
    optIn(guildId, interaction.user.id, interaction.user.tag, accountId);
    await interaction.reply({ content: `Opted in with account ID ${accountId}. You'll appear in this server's daily report.`, ephemeral: true });
  }

  if (interaction.commandName === 'optout') {
    optOut(guildId, interaction.user.id);
    await interaction.reply({ content: 'Opted out of daily reports.', ephemeral: true });
  }

  if (interaction.commandName === 'setchannel') {
    setReportChannel(guildId, interaction.channelId);
    await interaction.reply({ content: `This channel is now the daily Deadlock report destination for this server.`, ephemeral: true });
  }

  if (interaction.commandName === 'deadlockreport') {
    await interaction.deferReply();
    try {
      const report = await buildDailyReport(interaction.guild);
      const [first, ...rest] = chunkMessage(report);
      await interaction.editReply(first);
      for (const chunk of rest) await interaction.followUp(chunk);
    } catch (err) {
      await interaction.editReply(`Failed to build report: ${err.message}`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
