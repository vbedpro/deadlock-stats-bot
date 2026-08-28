const { listPlayers } = require('./store');
const { getPlayerDailyStats } = require('./deadlockApi');
const { formatRank } = require('./ranks');

// Discord renders ANSI color codes inside ```ansi code blocks (desktop/web only;
// mobile clients just show plain text, no color, which degrades fine).
const GREEN = '[32m';
const RED = '[31m';
const RESET = '[0m';

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

  // Rank server members by current rank/subrank (higher = better), ties broken by win count.
  const ranked = results
    .filter((r) => !r.error)
    .sort((a, b) => (b.rank ?? -1) - (a.rank ?? -1) || (b.subrank ?? -1) - (a.subrank ?? -1) || b.wins - a.wins);

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
      lines.push(`${displayName}: stats unavailable (${r.error})`);
      continue;
    }

    const rankName = formatRank(r.rank, r.subrank);
    const standing = standingByAccountId.get(r.accountId);
    const record = `${GREEN}${r.wins}W${RESET}-${RED}${r.losses}L${RESET}`;
    lines.push(`${displayName}: ${rankName}, ${r.gamesPlayed} games, ${record}, #${standing} of ${ranked.length}`);
  }

  const dateStr = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' });
  return `Deadlock Daily Stats — ${dateStr}\n${lines.join('\n')}`;
}

module.exports = { buildDailyReport };
