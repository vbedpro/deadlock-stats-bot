const { listPlayers } = require('./store');
const { getPlayerDailyStats } = require('./deadlockApi');
const { decodeBadge } = require('./ranks');

function formatDelta(n) {
  if (n > 0) return `+${n}`;
  return `${n}`; // 0 or negative already carries its sign
}

async function buildDailyReport(guild) {
  const players = listPlayers(guild.id);
  if (players.length === 0) {
    return 'No opted-in members yet. Use `/optin` to add your Deadlock account.';
  }

  const results = [];
  for (const p of players) {
    try {
      const stats = await getPlayerDailyStats(p.accountId);
      results.push({ ...p, ...stats });
    } catch (err) {
      results.push({ ...p, error: err.message });
    }
  }

  // Rank server members by current badge (higher badge = higher rank), ties broken by 24h elo gain.
  const ranked = results
    .filter((r) => !r.error)
    .sort((a, b) => (b.currentBadge ?? -1) - (a.currentBadge ?? -1) || b.eloDelta - a.eloDelta);

  const standingByAccountId = new Map(ranked.map((r, i) => [r.accountId, i + 1]));

  const lines = [];
  for (const r of results) {
    let displayName = r.discordTag;
    try {
      const member = await guild.members.fetch(r.discordId);
      displayName = member.displayName;
    } catch {
      /* fall back to stored tag if the member left the server */
    }

    if (r.error) {
      lines.push(`**${displayName}**: stats unavailable (${r.error})`);
      continue;
    }

    const rankName = decodeBadge(r.currentBadge);
    const standing = standingByAccountId.get(r.accountId);
    lines.push(
      `**${displayName}**: ${rankName}, ${r.gamesPlayed} games, ${formatDelta(r.eloDelta)} Elo, #${standing} of ${ranked.length}`
    );
  }

  const dateStr = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' });
  return `**Deadlock Daily Stats — ${dateStr}**\n${lines.join('\n')}`;
}

module.exports = { buildDailyReport };
