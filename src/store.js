const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'players.json');

function load() {
  if (!fs.existsSync(DATA_FILE)) return { guilds: {} };
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!data.guilds) data.guilds = {}; // migrate from the old single-server shape
  return data;
}

function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function guildBucket(data, guildId) {
  if (!data.guilds[guildId]) data.guilds[guildId] = { players: {}, reportChannelId: null };
  return data.guilds[guildId];
}

function optIn(guildId, discordId, discordTag, accountId) {
  const data = load();
  const bucket = guildBucket(data, guildId);
  bucket.players[discordId] = { discordId, discordTag, accountId, optedInAt: new Date().toISOString() };
  save(data);
}

function optOut(guildId, discordId) {
  const data = load();
  const bucket = guildBucket(data, guildId);
  delete bucket.players[discordId];
  save(data);
}

function listPlayers(guildId) {
  const data = load();
  return Object.values(guildBucket(data, guildId).players);
}

function setReportChannel(guildId, channelId) {
  const data = load();
  guildBucket(data, guildId).reportChannelId = channelId;
  save(data);
}

function listGuildIdsWithReportChannel() {
  const data = load();
  return Object.entries(data.guilds)
    .filter(([, bucket]) => bucket.reportChannelId)
    .map(([guildId, bucket]) => ({ guildId, reportChannelId: bucket.reportChannelId }));
}

module.exports = { optIn, optOut, listPlayers, setReportChannel, listGuildIdsWithReportChannel };
