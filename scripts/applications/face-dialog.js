export class FaceDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    window: { title: "a-spark-in-fate-core.AddFace", icon: "fas fa-user" },
    position: { width: 400 }
  };

  static PARTS = {
    form: {
      template: "modules/a-spark-in-fate-core/templates/dialogs/face-dialog.hbs"
    }
  };

  constructor({ skills = [], face = null, onSave } = {}) {
    super();
    this.skills = skills;
    this.face = face;
    this.onSave = onSave;
  }

  get title() {
    return game.i18n.localize(this.face ? "a-spark-in-fate-core.EditFace" : "a-spark-in-fate-core.AddFace");
  }

  async _prepareContext(options) {
    return {
      skills: this.skills,
      name: this.face?.name || "",
      mainSkill: this.face?.mainSkill || "",
      description: this.face?.description || "",
      portrait: this.face?.portrait || "",
      aspect: this.face?.aspect || "",
      trouble: this.face?.trouble || ""
    };
  }

  _onRender(context, options) {
    const saveBtn = this.element.querySelector("button[data-action='save']");
    const closeBtn = this.element.querySelector("button[data-action='close']");
    saveBtn?.addEventListener("click", async () => {
      const name = this.element.querySelector("input[name='name']")?.value?.trim();
      const mainSkill = this.element.querySelector("select[name='mainSkill']")?.value || undefined;
      const description = this.element.querySelector("textarea[name='description']")?.value?.trim() || undefined;
      const portraitEl = this.element.querySelector("file-picker[name='portrait']");
      const portrait = portraitEl ? (portraitEl.value || undefined) : undefined;
      const aspect = this.element.querySelector("input[name='aspect']")?.value?.trim() || undefined;
      const trouble = this.element.querySelector("input[name='trouble']")?.value?.trim() || undefined;
      if (!name) {
        ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.NameRequired"));
        return;
      }
      if (this.onSave) await this.onSave({ name, mainSkill, description, portrait, aspect, trouble });
      this.close();
    });
    closeBtn?.addEventListener("click", () => this.close());
  }
}
