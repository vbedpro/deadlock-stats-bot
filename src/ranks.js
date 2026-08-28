// Deadlock rank tier names, indexed by the `rank` field from
// GET /v1/players/{account_id}/rank (1-11, plus 12 for Eternus).
// Verified against /v1/analytics/badge-distribution, which only ever returns
// badge_level values 11-116 (tens digit 1-11) -- Eternus (12) is leaderboard-only
// and doesn't appear there.
const TIERS = {
  1: 'Obscurus',
  2: 'Initiate',
  3: 'Seeker',
  4: 'Alchemist',
  5: 'Arcanist',
  6: 'Ritualist',
  7: 'Emissary',
  8: 'Archon',
  9: 'Oracle',
  10: 'Phantom',
  11: 'Ascendant',
  12: 'Eternus',
};

function formatRank(rank, subrank) {
  if (rank === null || rank === undefined) return 'Unranked';
  const tierName = TIERS[rank] ?? `Tier${rank}`;
  if (rank >= 12) return tierName; // Eternus: no subrank suffix
  return subrank ? `${tierName} ${subrank}` : tierName;
}

module.exports = { formatRank, TIERS };
