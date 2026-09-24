import { applyDialogFrameStyles } from "../utils/dialog-styles.js";
import { openImagePicker } from "../utils/image-field.js";

export class FaceDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["spark-dialog-app"],
    window: { title: "a-spark-in-fate-core.AddFace", icon: "fas fa-user" },
    position: { width: 400 },
    actions: {
      pickImage: function(_event, target) {
        const input = target?.closest(".spark-file-row")?.querySelector("input");
        if (input) openImagePicker(input);
      }
    }
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
      trouble: this.face?.trouble || "",
      canUpload: game.user.can("FILES_UPLOAD")
    };
  }

  _onRender(context, options) {
    applyDialogFrameStyles(this);
    const saveBtn = this.element.querySelector("button[data-action='save']");
    const closeBtn = this.element.querySelector("button[data-action='close']");
    saveBtn?.addEventListener("click", async () => {
      const name = this.element.querySelector("input[name='name']")?.value?.trim();
      const mainSkill = this.element.querySelector("select[name='mainSkill']")?.value || undefined;
      const description = this.element.querySelector("textarea[name='description']")?.value?.trim() || undefined;
      const portrait = this.element.querySelector("input[name='portrait']")?.value?.trim() || undefined;
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
