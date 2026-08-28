const BASE = 'https://api.deadlock-api.com';

async function getMatchHistory(accountId) {
  const res = await fetch(`${BASE}/v1/players/${accountId}/match-history`);
  if (!res.ok) throw new Error(`match-history failed for ${accountId}: ${res.status}`);
  return res.json();
}

async function getCurrentRank(accountId) {
  const res = await fetch(`${BASE}/v1/players/${accountId}/rank`);
  if (!res.ok) return null;
  return res.json();
}

/**
 * Builds the 24h stat block for one account: current rank badge, elo delta
 * since 24h ago, and games played in that window.
 */
async function getPlayerDailyStats(accountId) {
  const history = await getMatchHistory(accountId);
  const cutoff = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

  const sorted = [...history].sort((a, b) => b.start_time - a.start_time);
  const recent = sorted.filter((m) => m.start_time >= cutoff);

  const eloDelta = recent.reduce((sum, m) => sum + (m.ranked_delta ?? 0), 0);
  const gamesPlayed = recent.length;

  // Current rank: latest match with a badge, falling back to the /rank endpoint.
  let currentBadge = sorted.find((m) => m.ranked_display_badge !== null)?.ranked_display_badge ?? null;
  if (currentBadge === null) {
    const rank = await getCurrentRank(accountId);
    currentBadge = rank?.rank ?? rank?.ranked_display_badge ?? null;
  }

  return { accountId, currentBadge, eloDelta, gamesPlayed };
}

module.exports = { getMatchHistory, getCurrentRank, getPlayerDailyStats };
