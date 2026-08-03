import { applyDialogFrameStyles } from "../utils/dialog-styles.js";

export class QuestionDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["spark-dialog-app"],
    window: { title: "a-spark-in-fate-core.CreateQuestion", icon: "fas fa-question" },
    position: { width: 500 }
  };

  static PARTS = {
    form: {
      template: "modules/a-spark-in-fate-core/templates/dialogs/question-dialog.hbs"
    }
  };

  constructor({ inspirations = [], question = null, onSave } = {}) {
    super();
    this.inspirations = inspirations;
    this.question = question;
    this.onSave = onSave;
  }

  get title() {
    return game.i18n.localize(this.question ? "a-spark-in-fate-core.EditQuestion" : "a-spark-in-fate-core.CreateQuestion");
  }

  async _prepareContext(options) {
    return {
      inspirations: this.inspirations,
      selected1: this.question?.inspirationIds?.[0] || "",
      selected2: this.question?.inspirationIds?.[1] || "",
      text: this.question?.text || ""
    };
  }

  _onRender(context, options) {
    applyDialogFrameStyles(this);
    const saveBtn = this.element.querySelector("button[data-action='save']");
    const closeBtn = this.element.querySelector("button[data-action='close']");
    const select1 = this.element.querySelector("select[name='inspiration1']");
    const select2 = this.element.querySelector("select[name='inspiration2']");

    if (select1 && select2) {
      const sync = () => {
        const val1 = select1.value;
        const val2 = select2.value;
        for (const opt of select1.options) {
          opt.disabled = !!opt.value && opt.value === val2;
        }
        for (const opt of select2.options) {
          opt.disabled = !!opt.value && opt.value === val1;
        }
      };
      select1.addEventListener("change", () => {
        if (select1.value && select1.value === select2.value) select2.value = "";
        sync();
      });
      select2.addEventListener("change", () => {
        if (select2.value && select2.value === select1.value) select1.value = "";
        sync();
      });
      sync();
    }

    saveBtn?.addEventListener("click", async () => {
      const inspiration1 = this.element.querySelector("select[name='inspiration1']")?.value;
      const inspiration2 = this.element.querySelector("select[name='inspiration2']")?.value;
      const text = this.element.querySelector("input[name='text']")?.value?.trim();
      if (!inspiration1 || !inspiration2) {
        ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.TwoInspirationsRequired"));
        return;
      }
      if (inspiration1 === inspiration2) {
        ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.InspirationsMustBeDifferent"));
        return;
      }
      if (!text) {
        ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.TextRequired"));
        return;
      }
      if (this.onSave) await this.onSave({ inspirationIds: [inspiration1, inspiration2], text });
      this.close();
    });
    closeBtn?.addEventListener("click", () => this.close());
  }
}
