export class ConfirmDeleteDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    window: { title: "a-spark-in-fate-core.ConfirmDelete", icon: "fas fa-trash" },
    position: { width: 400 }
  };

  static PARTS = {
    form: {
      template: "modules/a-spark-in-fate-core/templates/dialogs/confirm-delete-dialog.hbs"
    }
  };

  constructor({ message, onConfirm } = {}) {
    super();
    this.message = message;
    this.onConfirm = onConfirm;
  }

  async _prepareContext(options) {
    return {
      message: this.message
    };
  }

  _onRender(context, options) {
    const confirmBtn = this.element.querySelector("button[data-action='confirm']");
    const closeBtn = this.element.querySelector("button[data-action='close']");
    confirmBtn?.addEventListener("click", async () => {
      if (this.onConfirm) await this.onConfirm();
      this.close();
    });
    closeBtn?.addEventListener("click", () => this.close());
  }
}
