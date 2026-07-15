export class PlaceDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    window: { title: "a-spark-in-fate-core.AddPlace", icon: "fas fa-map-marker-alt" },
    position: { width: 400 }
  };

  static PARTS = {
    form: {
      template: "modules/a-spark-in-fate-core/templates/dialogs/place-dialog.hbs"
    }
  };

  constructor({ sparks = [], place = null, onSave } = {}) {
    super();
    this.sparks = sparks;
    this.place = place;
    this.onSave = onSave;
  }

  get title() {
    return game.i18n.localize(this.place ? "a-spark-in-fate-core.EditPlace" : "a-spark-in-fate-core.AddPlace");
  }

  async _prepareContext(options) {
    return {
      sparks: this.sparks,
      selectedSparkId: this.place?.sparkId || "",
      name: this.place?.name || "",
      aspect: this.place?.aspect || "",
      image: this.place?.image || ""
    };
  }

  _onRender(context, options) {
    const saveBtn = this.element.querySelector("button[data-action='save']");
    const closeBtn = this.element.querySelector("button[data-action='close']");
    saveBtn?.addEventListener("click", async () => {
      const sparkId = this.element.querySelector("select[name='sparkId']")?.value;
      const name = this.element.querySelector("input[name='name']")?.value?.trim();
      const aspect = this.element.querySelector("input[name='aspect']")?.value?.trim();
      const imageEl = this.element.querySelector("file-picker[name='image']");
      const image = imageEl ? (imageEl.value || undefined) : undefined;
      if (!sparkId) {
        ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.SparkRequired"));
        return;
      }
      if (!name) {
        ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.NameRequired"));
        return;
      }
      if (!aspect) {
        ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.AspectRequired"));
        return;
      }
      if (this.onSave) await this.onSave({ sparkId, name, aspect, image: image || undefined });
      this.close();
    });
    closeBtn?.addEventListener("click", () => this.close());
  }
}
