const BASE = 'https://api.deadlock-api.com';

async function getMatchHistory(accountId) {
  const res = await fetch(`${BASE}/v1/players/${accountId}/match-history`);
  if (!res.ok) throw new Error(`match-history failed for ${accountId}: ${res.status}`);
  return res.json();
}

async function getCurrentRank(accountId) {
  const res = await fetch(`${BASE}/v1/players/${accountId}/rank`);
  if (!res.ok) throw new Error(`rank failed for ${accountId}: ${res.status}`);
  return res.json(); // { badge, rank, subrank, last_match: {...} }
}

/**
 * Builds the 24h stat block for one account: current rank (rank+subrank,
 * straight from the /rank endpoint -- no badge-decoding involved), and
 * wins/losses over the last 24h. A match is a win when the player's team
 * (player_team) matches the winning team (match_result).
 */
async function getPlayerDailyStats(accountId) {
  const [history, rank] = await Promise.all([getMatchHistory(accountId), getCurrentRank(accountId)]);
  const cutoff = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

  const recent = history.filter((m) => m.start_time >= cutoff);
  const wins = recent.filter((m) => m.match_result === m.player_team).length;
  const losses = recent.length - wins;

  return { accountId, rank: rank?.rank ?? null, subrank: rank?.subrank ?? null, wins, losses, gamesPlayed: recent.length };
}

module.exports = { getMatchHistory, getCurrentRank, getPlayerDailyStats };
