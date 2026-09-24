/**
 * Opens the core FilePicker for an image path input and writes the chosen path back.
 * Mirrors the core DocumentSheetV2 editImage flow (type + current + callback).
 * Warns and bails out when the user lacks the FILES_BROWSE permission.
 * @param {HTMLInputElement|null} input — the text input holding the image path
 */
export function openImagePicker(input) {
  if (!game.user.can("FILES_BROWSE")) {
    ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.BrowsePermissionRequired"));
    return;
  }
  const FP = foundry.applications.apps.FilePicker?.implementation;
  if (!FP) {
    console.warn("a-spark-in-fate-core | FilePicker implementation is not available");
    return;
  }
  new FP({
    type: "image",
    current: input?.value || "",
    callback: (path) => {
      if (path && input) input.value = path;
    }
  }).render(true);
}
