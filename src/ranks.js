// Deadlock ranked_display_badge decoding.
// Valve encodes the badge as (tier * 10 + subtier), tiers 0-11, subtiers 1-6
// (Eternus/tier 11 has no subtier and instead carries a leaderboard number).
// Verify these tier names against your current in-game season if Valve renames tiers.
const TIERS = [
  'Obscurus',
  'Initiate',
  'Seeker',
  'Alchemist',
  'Arcanist',
  'Ritualist',
  'Emissary',
  'Archon',
  'Oracle',
  'Phantom',
  'Ascendant',
  'Eternus',
];

function decodeBadge(badge) {
  if (badge === null || badge === undefined) return 'Unranked';
  const tier = Math.floor(badge / 10);
  const subtier = badge % 10;
  const tierName = TIERS[tier] ?? `Tier${tier}`;
  if (tier >= TIERS.length - 1) return tierName; // Eternus: no subtier suffix
  return subtier > 0 ? `${tierName} ${subtier}` : tierName;
}

module.exports = { decodeBadge, TIERS };
