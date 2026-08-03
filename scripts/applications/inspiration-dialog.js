import { applyDialogFrameStyles } from "../utils/dialog-styles.js";

export class InspirationDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["spark-dialog-app"],
    window: { title: "a-spark-in-fate-core.AddInspiration", icon: "fas fa-lightbulb" },
    position: { width: 400 }
  };

  static PARTS = {
    form: {
      template: "modules/a-spark-in-fate-core/templates/dialogs/inspiration-dialog.hbs"
    }
  };

  constructor({ inspiration = null, onSave } = {}) {
    super();
    this.inspiration = inspiration;
    this.onSave = onSave;
  }

  get title() {
    return game.i18n.localize(this.inspiration ? "a-spark-in-fate-core.EditInspiration" : "a-spark-in-fate-core.AddInspiration");
  }

  async _prepareContext(options) {
    return {
      text: this.inspiration?.text || ""
    };
  }

  _onRender(context, options) {
    applyDialogFrameStyles(this);
    const saveBtn = this.element.querySelector("button[data-action='save']");
    const closeBtn = this.element.querySelector("button[data-action='close']");
    saveBtn?.addEventListener("click", async () => {
      const text = this.element.querySelector("textarea[name='text']")?.value?.trim();
      if (!text) {
        ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.TextRequired"));
        return;
      }
      if (this.onSave) await this.onSave({ text });
      this.close();
    });
    closeBtn?.addEventListener("click", () => this.close());
  }
}
