export class SparkDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    window: { title: "a-spark-in-fate-core.CreateSpark", icon: "fas fa-fire" },
    position: { width: 500 }
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
