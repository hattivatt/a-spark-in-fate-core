# AGENTS.md

Foundry VTT module: collaborative "A Spark in Fate Core" setting-creation dashboard. Plain ES modules loaded by Foundry — **no package.json, no build, no tests, no lint config**. Verification is manual: run inside a Foundry v13/v14 world with the `fate-core-official` system installed. Don't add JS tooling unless asked.

## Structure & entrypoint

- `module.json` — manifest; entry is `scripts/main.js` (registers settings, Handlebars helpers, scene control button, `CONFIG.queries` handler).
- `scripts/applications/dashboard-app.js` — single main app `SparkDashboardApp` (ApplicationV2 + HandlebarsApplicationMixin, v13+ API); sibling files are dialog apps, one per entity.
- `templates/` mirrors `scripts/applications/` (one `.hbs` per dialog plus `dashboard.hbs`).
- Public API exposed on `game.sparkDashboard` (`open()`, GM-only `reset()`).

## State architecture (read before editing data flow)

- Entire dashboard state lives in **one world-scope setting** (`game.settings` key `"state"`). The schema and its `version` field are defined in `getDefaultState()` in `scripts/constants.js`.
- Mutations must go through `getState`/`updateState`/`setState` in `scripts/state.js`. `setState` writes the world-scope setting and broadcasts a live-refresh via `game.socket`. Non-GMs cannot write world settings directly, so `setState` sends a socket request to the GM, who applies the update and re-broadcasts the refresh — writing the setting directly breaks cross-client sync.
- Permission rules live in `scripts/permissions.js`. Add-permissions (media/inspirations, questions/facts, sparks, faces, places) are configurable world settings (registered in `scripts/settings.js`, keys in `scripts/constants.js`) storing a **minimum Foundry user role** — check via `game.user.role >= setting`. Defaults are all `Gamemaster` (module is GM-only by default). Edit/delete, genre, campaign title, issues, world aspects, and actor creation remain GM-only (`isGM()` = Gamemaster + Assistant).
- Extra rules beyond the role check: players may add only 1 media item; the "inspirations on others' media" checkbox (`permInspirationAnyMedia`) doesn't affect GM/Assistant; non-GM may add a question only if they set the last fact (`state.lastFactSetByUserId`) and have not already asked the current question (`state.lastQuestionByUserId`); their fact dialog hides the user picker (`lockUser`). Fact setting spends per-user `factAllowances` (default 2, auto-seeded per user in `_ensureAllowances`) and clears `lastQuestionByUserId`, giving the right to ask again.
- Players can edit faces and places they created (`createdByUserId`), but only GM/Assistant can delete them or create/update actors from faces.
- Deleting the **last** question or the **last** fact on the Genre & Facts tab undoes the turn/fact spend: `lastFactSetByUserId` returns to the question asker, `lastQuestionByUserId` is adjusted, and the fact setter's `factAllowances` entry is refunded by 1.

## fate-core-official integration

`scripts/fate-core-adapter.js` reaches into the system's internals, not stable APIs:

- Global `fcoConstants` (`wd()`, `gkfn`, `tob64`, `gbn`) — guard for it being undefined (see `getFateCoreWorldDataItem`).
- System settings `fate-core-official.gameAspects` and `default_actor_permission`; actor type is `"fate-core-official"`.
- After writing `gameAspects`, emit `game.socket.emit("system.fate-core-official", { render: true })` so system UI updates.

## Compatibility

Target is Foundry v13–v14 (`module.json` compatibility). Keep the existing v13/v14 shims intact: scene-control `tools` may be Map/Array/plain object (`main.js`), icons use explicit `fa-solid` prefix.

## Localization

Every UI string key lives under the root object `"a-spark-in-fate-core"` in **both** `lang/en.json` and `lang/ru.json`. The key sets are currently identical — when adding/renaming a key, update both files.

## Release

- Releases are tag-triggered (`.github/workflows/release.yml`). The workflow fails unless `module.json` `version` matches the tag **and** `manifest`/`download` URLs contain that version — bump all three together before tagging.
- When releasing: set the version the user asked for (semver if unspecified) and update it in `module.json` in all three places — `version` field plus the version inside both `manifest` and `download` URLs.
- The release zip excludes `.git`, `.github`, `AGENTS.md`, and `img/`; don't rely on those paths at runtime.
