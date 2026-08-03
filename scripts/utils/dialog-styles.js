/**
 * Applies the spark-dashboard theme to the dialog's outer window frame.
 * Inline styles are used to reliably override Foundry's dark-theme CSS cascade.
 * Call this in every dialog's _onRender(context, options).
 * @param {ApplicationV2} app — the application instance (this)
 */
export function applyDialogFrameStyles(app) {
  const frame = app.element;
  if (!frame) return;

  // ── outer frame: warm brown, slightly darker than the window background ──
  frame.classList.add("spark-dialog-app");
  frame.style.setProperty("background-color", "#d4c5b0", "important");
  frame.style.setProperty("border", "1px solid #d4c5b0", "important");
  frame.style.setProperty("box-shadow", "none", "important");
  frame.style.setProperty("outline", "none", "important");

  // Also style parent in case the border is on a wrapper
  const parent = frame.parentElement;
  if (parent) {
    parent.style.setProperty("background-color", "#d4c5b0", "important");
    parent.style.setProperty("border-color", "#d4c5b0", "important");
    parent.style.setProperty("outline", "none", "important");
    parent.style.setProperty("box-shadow", "none", "important");
  }
}
