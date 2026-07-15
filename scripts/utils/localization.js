export function localize(key, data = {}) {
  return game.i18n.localize(key) || key;
}

export function format(key, data = {}) {
  return game.i18n.format(key, data) || key;
}
