import { registerSettings } from "./settings.js";
import { MODULE_ID, STATE_SETTING, getDefaultState } from "./constants.js";
import { getState, updateState, setState, ensureAllowances, broadcastRefresh } from "./state.js";
import { SparkDashboardApp } from "./applications/dashboard-app.js";

function registerHelpers() {
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("or", (...args) => args.slice(0, -1).some(Boolean));
  Handlebars.registerHelper("concat", (...args) => args.slice(0, -1).join(""));
}

function openDashboard() {
  const existing = [...foundry.applications.instances.values()].find(
    app => app instanceof SparkDashboardApp
  );
  if (existing) {
    existing.render(true);
    existing.bringToFront?.();
  } else {
    new SparkDashboardApp().render(true);
  }
}

function addSceneControlButton(controls) {
  // Find the token control group; v13 may pass controls as Map, Set, Array, or plain object
  let tokenControl = controls.tokens || controls.token;
  if (!tokenControl) {
    const values = Array.isArray(controls) ? controls : Object.values(controls);
    tokenControl = values.find(c => c?.name === "token" || c?.name === "tokens");
  }
  if (!tokenControl || !tokenControl.tools) return;

  const toolDef = {
    name: "spark-dashboard",
    title: game.i18n.localize("a-spark-in-fate-core.OpenDashboard"),
    // Use the explicit Font Awesome 6+ style prefix for compatibility with both v13 and v14.
    icon: "fa-solid fa-fire",
    onChange: (event, active) => {
      if (active) openDashboard();
    },
    button: true
  };

  if (tokenControl.tools instanceof Map) {
    tokenControl.tools.set("spark-dashboard", toolDef);
  } else if (Array.isArray(tokenControl.tools)) {
    tokenControl.tools.push(toolDef);
  } else {
    tokenControl.tools["spark-dashboard"] = toolDef;
  }
}

function renderDashboards() {
  for (const app of foundry.applications.instances.values()) {
    if (app instanceof SparkDashboardApp) {
      app.render(false);
    }
  }
}

Hooks.once("init", () => {
  registerHelpers();
  registerSettings();
});

Hooks.once("ready", async () => {
  // Cross-client refresh and state-update requests
  game.socket.on(`module.${MODULE_ID}`, async (data) => {
    if (!data) return;
    if (data.type === "refresh") {
      renderDashboards();
    } else if (data.type === "setState" && game.user.isGM) {
      const nextState = data.nextState;
      if (nextState) {
        ensureAllowances(nextState);
        await game.settings.set(MODULE_ID, STATE_SETTING, nextState);
        renderDashboards();
        broadcastRefresh();
      }
    }
  });

  // Ensure allowances are persisted on first load
  const state = getState();
  if (!state.factAllowances || state.factAllowances.length === 0) {
    await updateState(s => s);
  }

  // Expose API for macros / console
  game.sparkDashboard = {
    SparkDashboardApp,
    open: openDashboard,
    async reset() {
      if (!game.user.isGM) {
        ui.notifications.warn("Only GM can reset the dashboard state.");
        return;
      }
      const defaults = getDefaultState();
      await setState(defaults);
      ui.notifications.info("Spark Dashboard state has been reset.");
    }
  };
});

Hooks.on("getSceneControlButtons", addSceneControlButton);
