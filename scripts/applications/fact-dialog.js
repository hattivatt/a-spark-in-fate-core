import { applyDialogFrameStyles } from "../utils/dialog-styles.js";

export class FactDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["spark-dialog-app"],
    window: { title: "a-spark-in-fate-core.SetFact", icon: "fas fa-check-circle" },
    position: { width: 400 }
  };

  static PARTS = {
    form: {
      template: "modules/a-spark-in-fate-core/templates/dialogs/fact-dialog.hbs"
    }
  };

  constructor({ users = [], fact = null, lockUser = false, onSave } = {}) {
    super();
    this.users = users;
    this.fact = fact;
    this.lockUser = lockUser;
    this.onSave = onSave;
  }

  get title() {
    return game.i18n.localize(this.fact ? "a-spark-in-fate-core.EditFact" : "a-spark-in-fate-core.SetFact");
  }

  async _prepareContext(options) {
    return {
      users: this.users,
      selectedUserId: this.users[0]?.id || "",
      lockUser: this.lockUser,
      lockedUser: this.users[0] || null,
      text: this.fact?.text || ""
    };
  }

  _onRender(context, options) {
    applyDialogFrameStyles(this);
    const saveBtn = this.element.querySelector("button[data-action='save']");
    const closeBtn = this.element.querySelector("button[data-action='close']");
    saveBtn?.addEventListener("click", async () => {
      const userId = this.element.querySelector("[name='userId']")?.value;
      const text = this.element.querySelector("input[name='text']")?.value?.trim();
      if (!text) {
        ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.TextRequired"));
        return;
      }
      if (this.onSave) await this.onSave({ text, userId });
      this.close();
    });
    closeBtn?.addEventListener("click", () => this.close());
  }
}
