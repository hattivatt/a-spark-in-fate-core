import {
  MODULE_ID,
  STATE_SETTING,
  PERM_MEDIA_SETTING,
  PERM_INSPIRATION_ANY_MEDIA_SETTING,
  PERM_FACTS_SETTING,
  PERM_SPARKS_SETTING,
  PERM_FACES_SETTING,
  PERM_PLACES_SETTING,
  ENABLE_FACES_SETTING,
  ENABLE_PLACES_SETTING,
  FACE_SKILL_RANK_SETTING,
  getDefaultState
} from "./constants.js";

function _roleChoices() {
  return {
    [CONST.USER_ROLES.PLAYER]: game.i18n.localize("a-spark-in-fate-core.RolePlayer"),
    [CONST.USER_ROLES.TRUSTED]: game.i18n.localize("a-spark-in-fate-core.RoleTrustedPlayer"),
    [CONST.USER_ROLES.ASSISTANT]: game.i18n.localize("a-spark-in-fate-core.RoleAssistantGM"),
    [CONST.USER_ROLES.GAMEMASTER]: game.i18n.localize("a-spark-in-fate-core.RoleGamemaster")
  };
}

function _refreshDashboards() {
  for (const app of foundry.applications.instances.values()) {
    if (app.id === "spark-dashboard") app.render(false);
  }
}

function _registerMinRoleSetting(key, nameKey, hint, defaultRole) {
  game.settings.register(MODULE_ID, key, {
    name: nameKey,
    hint,
    scope: "world",
    config: true,
    type: Number,
    choices: _roleChoices(),
    default: defaultRole,
    onChange: _refreshDashboards
  });
}

export function registerSettings() {
  game.settings.register(MODULE_ID, STATE_SETTING, {
    name: "Spark Dashboard State",
    scope: "world",
    config: false,
    type: Object,
    default: getDefaultState()
  });

  _registerMinRoleSetting(
    PERM_MEDIA_SETTING,
    "a-spark-in-fate-core.PermMediaName",
    "a-spark-in-fate-core.PermMediaHint",
    CONST.USER_ROLES.GAMEMASTER
  );

  game.settings.register(MODULE_ID, PERM_INSPIRATION_ANY_MEDIA_SETTING, {
    name: "a-spark-in-fate-core.PermInspirationAnyMediaName",
    hint: "a-spark-in-fate-core.PermInspirationAnyMediaHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: _refreshDashboards
  });

  _registerMinRoleSetting(
    PERM_FACTS_SETTING,
    "a-spark-in-fate-core.PermFactsName",
    "a-spark-in-fate-core.PermFactsHint",
    CONST.USER_ROLES.GAMEMASTER
  );

  _registerMinRoleSetting(
    PERM_SPARKS_SETTING,
    "a-spark-in-fate-core.PermSparksName",
    "a-spark-in-fate-core.PermSparksHint",
    CONST.USER_ROLES.GAMEMASTER
  );

  _registerMinRoleSetting(
    PERM_FACES_SETTING,
    "a-spark-in-fate-core.PermFacesName",
    "a-spark-in-fate-core.PermFacesHint",
    CONST.USER_ROLES.GAMEMASTER
  );

  _registerMinRoleSetting(
    PERM_PLACES_SETTING,
    "a-spark-in-fate-core.PermPlacesName",
    "a-spark-in-fate-core.PermPlacesHint",
    CONST.USER_ROLES.GAMEMASTER
  );

  game.settings.register(MODULE_ID, ENABLE_FACES_SETTING, {
    name: "a-spark-in-fate-core.EnableFacesName",
    hint: "a-spark-in-fate-core.EnableFacesHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: _refreshDashboards
  });

  game.settings.register(MODULE_ID, ENABLE_PLACES_SETTING, {
    name: "a-spark-in-fate-core.EnablePlacesName",
    hint: "a-spark-in-fate-core.EnablePlacesHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: _refreshDashboards
  });

  game.settings.register(MODULE_ID, FACE_SKILL_RANK_SETTING, {
    name: "a-spark-in-fate-core.FaceSkillRankName",
    hint: "a-spark-in-fate-core.FaceSkillRankHint",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 1, max: 8, step: 1 },
    default: 5,
    onChange: _refreshDashboards
  });
}
