import { MODULE_ID, STATE_SETTING, getDefaultState } from "./constants.js";

export function registerSettings() {
  game.settings.register(MODULE_ID, STATE_SETTING, {
    name: "Spark Dashboard State",
    scope: "world",
    config: false,
    type: Object,
    default: getDefaultState()
  });
}
