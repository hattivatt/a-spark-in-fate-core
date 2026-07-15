import { MODULE_ID, STATE_SETTING, getDefaultState } from "./constants.js";

function _ensureAllowances(state) {
  if (!state.factAllowances) state.factAllowances = [];
  const existing = new Map(state.factAllowances.map(a => [a.userId, a]));
  let changed = false;
  for (const user of game.users) {
    if (!existing.has(user.id)) {
      existing.set(user.id, { userId: user.id, remaining: 2 });
      changed = true;
    }
  }
  if (changed) {
    state.factAllowances = Array.from(existing.values());
  }
  return state;
}

export function getState() {
  const raw = game.settings.get(MODULE_ID, STATE_SETTING);
  if (!raw || typeof raw !== "object") {
    return getDefaultState();
  }
  const state = foundry.utils.duplicate(raw);
  _ensureAllowances(state);
  return state;
}

export async function setState(nextState) {
  _ensureAllowances(nextState);
  await game.settings.set(MODULE_ID, STATE_SETTING, nextState);
  // Notify all other clients via v13 User.query (CONFIG.queries)
  for (const user of game.users) {
    if (user.id !== game.user.id) {
      user.query(`module.${MODULE_ID}.refresh`, {}, { timeout: 5000 }).catch(() => {});
    }
  }
}

export async function updateState(updater) {
  const current = getState();
  let next = current;
  if (typeof updater === "function") {
    next = updater(foundry.utils.duplicate(current));
  } else if (typeof updater === "object") {
    next = foundry.utils.mergeObject(foundry.utils.duplicate(current), updater, { inplace: false });
  }
  await setState(next);
  return next;
}
