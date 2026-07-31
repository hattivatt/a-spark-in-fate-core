import { MODULE_ID, STATE_SETTING, getDefaultState } from "./constants.js";

export function ensureAllowances(state) {
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
  ensureAllowances(state);
  return state;
}

export function broadcastRefresh() {
  game.socket.emit(`module.${MODULE_ID}`, { type: "refresh" });
}

export async function setState(nextState) {
  ensureAllowances(nextState);
  if (game.user.isGM) {
    await game.settings.set(MODULE_ID, STATE_SETTING, nextState);
    broadcastRefresh();
  } else {
    game.socket.emit(`module.${MODULE_ID}`, { type: "setState", nextState });
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
