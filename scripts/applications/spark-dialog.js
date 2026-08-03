import { applyDialogFrameStyles } from "../utils/dialog-styles.js";

export class SparkDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["spark-dialog-app"],
    window: { title: "a-spark-in-fate-core.CreateSpark", icon: "fas fa-fire", resizable: true },
    position: { width: 1200, height: 800 }
  };

  static PARTS = {
    form: {
      template: "modules/a-spark-in-fate-core/templates/dialogs/spark-dialog.hbs"
    }
  };

  constructor({ facts = [], spark = null, onSave } = {}) {
    super();
    this.facts = facts;
    this.spark = spark;
    this.onSave = onSave;

    // Auto-size the window to roughly fit the fact list, so the dialog
    // opens compact for a few facts and grows for many (clamped to screen).
    const baseHeight = 265;   // text field + list label + buttons + header + padding
    const rowHeight = 46;     // one fact row
    const linesOf = (f) => (f.text ? Math.max(1, Math.ceil(f.text.length / 80)) : 1);
    const est = baseHeight + facts.reduce((sum, f) => sum + rowHeight * linesOf(f), 0);
    const minHeight = 340;
    const maxHeight = Math.floor((window.innerHeight || 800) * 0.92);
    this.position.height = Math.max(minHeight, Math.min(est, maxHeight));
  }

  get title() {
    return game.i18n.localize(this.spark ? "a-spark-in-fate-core.EditSpark" : "a-spark-in-fate-core.CreateSpark");
  }

  async _prepareContext(options) {
    const selectedIds = new Set(this.spark?.factIds || []);
    return {
      text: this.spark?.text || "",
      facts: this.facts.map(f => ({ ...f, checked: selectedIds.has(f.id) }))
    };
  }

  _onRender(context, options) {
    applyDialogFrameStyles(this);
    const saveBtn = this.element.querySelector("button[data-action='save']");
    const closeBtn = this.element.querySelector("button[data-action='close']");
    saveBtn?.addEventListener("click", async () => {
      const text = this.element.querySelector("input[name='text']")?.value?.trim();
      const checkboxes = this.element.querySelectorAll("input[name='factIds']:checked");
      const factIds = Array.from(checkboxes).map(cb => cb.value);
      if (factIds.length === 0) {
        ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.SelectAtLeastOneFact"));
        return;
      }
      if (!text) {
        ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.TextRequired"));
        return;
      }
      if (this.onSave) await this.onSave({ text, factIds });
      this.close();
    });
    closeBtn?.addEventListener("click", () => this.close());
  }
}
