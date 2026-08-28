# Deadlock Stats Bot

Posts a daily Discord message listing every opted-in member's Deadlock rank, games played, and Elo (ranked MMR) change over the last 24 hours, at 11:00 AM America/New_York, every day.

## Data source

Uses the free, keyless [deadlock-api.com](https://api.deadlock-api.com) `match-history` endpoint, which returns Valve's actual `ranked_delta` (Elo change) and `ranked_display_badge` (rank) per match — more precise than Statlocker's public API, which only exposes a live `ppScore` snapshot rather than per-match deltas. `src/deadlockApi.js` is the only file that talks to the API; swap it out if you'd rather source rank differently.

The bot supports multiple servers from a single running instance — opted-in players and the report channel are tracked per-server.

## Setup

1. `npm install`
2. Create a Discord application + bot at https://discord.com/developers/applications, enable the **Server Members Intent**.
3. Copy `.env.example` to `.env` and fill in `DISCORD_TOKEN` and `DISCORD_CLIENT_ID`. `DISCORD_GUILD_ID` / `REPORT_CHANNEL_ID` are no longer used — the report destination is set per-server with `/setchannel` instead.
4. `npm run register-commands` — registers commands **globally**, so they work in every server the bot is invited to (can take up to ~1 hour to show up).
5. `npm start`
6. Invite the bot to each server via OAuth2 (scopes: `bot` + `applications.commands`; permissions: Send Messages, Read Message History).
7. In each server, an admin runs `/setchannel` in whichever channel should get the daily report.

## Usage

- `/optin account_id:<your SteamID3>` — opt in for *this* server. Find your account ID via your Deadlock/Steam profile (e.g. from a statlocker.gg or deadlock-api.com profile URL).
- `/optout` — stop appearing in this server's reports.
- `/setchannel` — (admin/Manage Server permission only) sets the channel it's run in as this server's daily report destination. Run it again in a different channel to change it.
- `/deadlockreport` — post the report immediately (useful for testing before 11 AM rolls around).

## Message format

```
Player1: Ritualist 4, 6 games, +85 Elo, #1 of 8
Player2: Archon 2, 3 games, -20 Elo, #2 of 8
```

## Notes / things to verify before relying on this

- **Rank tier names** (`src/ranks.js`) decode Valve's badge number as `tier*10 + subtier`. This is the commonly observed encoding, but wasn't directly confirmed from deadlock-api.com's docs during setup — sanity-check a few known players' ranks against the in-game client and adjust `TIERS` if a name is off.
- **"Games played"** counts every match (any mode) in the last 24h; **Elo delta** only sums `ranked_delta` from ranked matches, so a player who only played unranked will show games > 0 but 0 Elo change.
- Persistence is a flat JSON file (`data/players.json`, keyed per-server) — fine for a handful of servers, swap for a real DB if you outgrow it.
- The bot must stay running continuously (e.g. via `pm2`, a systemd service, or a small VPS) for the 11 AM cron job to fire.
