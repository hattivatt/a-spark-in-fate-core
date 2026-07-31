export class MediaDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    window: { title: "a-spark-in-fate-core.AddMedia", icon: "fas fa-film" },
    position: { width: 400 }
  };

  static PARTS = {
    form: {
      template: "modules/a-spark-in-fate-core/templates/dialogs/media-dialog.hbs"
    }
  };

  constructor({ users = [], media = null, lockUser = false, onSave } = {}) {
    super();
    this.users = users;
    this.media = media;
    this.lockUser = lockUser;
    this.onSave = onSave;
  }

  get title() {
    return game.i18n.localize(this.media ? "a-spark-in-fate-core.EditMedia" : "a-spark-in-fate-core.AddMedia");
  }

  async _prepareContext(options) {
    return {
      users: this.users,
      selectedUserId: this.media?.createdByUserId || this.users[0]?.id || "",
      lockUser: this.lockUser,
      lockedUser: this.users[0] || null,
      title: this.media?.title || "",
      image: this.media?.image || "",
      description: this.media?.description || ""
    };
  }

  _onRender(context, options) {
    const saveBtn = this.element.querySelector("button[data-action='save']");
    const closeBtn = this.element.querySelector("button[data-action='close']");
    saveBtn?.addEventListener("click", async () => {
      const title = this.element.querySelector("input[name='title']")?.value?.trim();
      const userId = this.element.querySelector("[name='userId']")?.value;
      const image = this.element.querySelector("input[name='image']")?.value?.trim();
      const description = this.element.querySelector("textarea[name='description']")?.value?.trim();
      if (!title) {
        ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.TitleRequired"));
        return;
      }
      if (this.onSave) await this.onSave({ title, userId, image: image || undefined, description: description || undefined });
      this.close();
    });
    closeBtn?.addEventListener("click", () => this.close());
  }
}
