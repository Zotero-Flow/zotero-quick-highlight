var QuickHighlight = {
  id: "quick-highlight@local.kyh",
  styles: new Set(),
  translationPatch: null,

  patchTranslation() {
    const addon = Zotero.PDFTranslate;
    if (!addon?.data?.alive || !addon.hooks?.onReaderPopupShow) return;
    if (this.translationPatch?.hooks === addon.hooks) return;
    this.restoreTranslation();
    const hooks = addon.hooks;
    const original = hooks.onReaderPopupShow;
    // Popup selections are independent. Keep deliberate concatenation in the sidebar.
    const wrapped = function (...args) {
      const state = addon.data.translate;
      const key = state.concatKey;
      const checkbox = state.concatCheckbox;
      state.concatKey = false;
      state.concatCheckbox = false;
      try {
        return original.apply(this, args);
      } finally {
        state.concatKey = key;
        state.concatCheckbox = checkbox;
      }
    };
    hooks.onReaderPopupShow = wrapped;
    this.translationPatch = { hooks, original, wrapped };
  },

  restoreTranslation() {
    const patch = this.translationPatch;
    if (patch && patch.hooks.onReaderPopupShow === patch.wrapped) {
      patch.hooks.onReaderPopupShow = patch.original;
    }
    this.translationPatch = null;
  },

  render(event) {
    this.patchTranslation();
    const { doc, params, append } = event;
    const popup = doc.querySelector(".selection-popup");
    const colors = [...(popup?.querySelectorAll(":scope > .colors .color-button") || [])];
    if (!popup || !colors.length || !params.annotation?.text) return;
    if (!popup.querySelector(":scope > .tool-toggle .highlight") ||
        !popup.querySelector(":scope > .tool-toggle .underline")) {
      throw new Error("Quick Highlight: Zotero selection tools changed; original popup preserved.");
    }
    if (!doc.getElementById("qh-style")) {
      const style = doc.createElement("style");
      style.id = "qh-style";
      style.textContent = this.css;
      doc.head.append(style);
      this.styles.add(style);
    }
    const selection = JSON.stringify(params.annotation);
    popup.dataset.qhSelection = selection;
    popup.classList.add("qh-popup");
    const menu = doc.createElement("div");
    menu.className = "qh-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "주석 종류와 색상");
    const colorOf = button => button.querySelector("[fill]:not([fill='none'])")?.getAttribute("fill");
    const rememberedColor = Zotero.Prefs.get("quickHighlight.color") || colorOf(colors[0]);
    const rememberedIndex = Math.max(0, colors.findIndex(button => colorOf(button) === rememberedColor));
    for (const [type, label] of [["highlight", "Highlight"], ["underline", "Underline"]]) {
      const row = doc.createElement("div");
      row.className = "qh-row";
      const trigger = doc.createElement("button");
      trigger.type = "button";
      trigger.className = "qh-trigger";
      trigger.setAttribute("role", "menuitem");
      trigger.setAttribute("aria-haspopup", "menu");
      trigger.setAttribute("aria-expanded", "false");
      const dot = doc.createElement("span");
      dot.className = "qh-dot";
      dot.style.backgroundColor = colorOf(colors[rememberedIndex]);
      const name = doc.createElement("span");
      name.textContent = label;
      const arrow = doc.createElement("span");
      arrow.className = "qh-arrow";
      arrow.textContent = "›";
      trigger.append(dot, name, arrow);
      const palette = doc.createElement("div");
      palette.className = "qh-palette";
      palette.setAttribute("role", "menu");
      palette.setAttribute("aria-label", `${label} 색상`);
      const open = () => {
        for (const other of menu.querySelectorAll(".qh-row")) {
          other.classList.toggle("qh-open", other === row);
          other.querySelector(".qh-trigger").setAttribute("aria-expanded", String(other === row));
        }
        row.classList.remove("qh-left");
        const bounds = palette.getBoundingClientRect();
        row.classList.toggle("qh-left", bounds.right > doc.documentElement.clientWidth - 8);
      };
      const applyColor = index => {
        Zotero.Prefs.set("quickHighlight.color", colorOf(colors[index]));
        popup.querySelector(`:scope > .tool-toggle .${type}`).click();
        // React refreshes the native color callback when the annotation type changes.
        doc.defaultView.requestAnimationFrame(() => {
          if (popup.isConnected && popup.dataset.qhSelection === selection) {
            popup.querySelectorAll(":scope > .colors .color-button")[index]?.click();
          }
        });
      };
      colors.forEach((native, index) => {
        const button = doc.createElement("button");
        button.type = "button";
        button.className = "qh-color";
        button.setAttribute("role", "menuitem");
        button.setAttribute("aria-label", `${label}: ${native.title}`);
        const swatch = doc.createElement("span");
        swatch.style.backgroundColor = native.querySelector("[fill]:not([fill='none'])")?.getAttribute("fill");
        button.append(swatch);
        button.addEventListener("click", () => applyColor(index));
        palette.append(button);
      });
      arrow.addEventListener("click", event => {
        event.stopPropagation();
        open();
      });
      trigger.addEventListener("pointerenter", open);
      trigger.addEventListener("focus", open);
      trigger.addEventListener("click", () => applyColor(rememberedIndex));
      trigger.addEventListener("keydown", event => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          open();
          palette.firstElementChild.focus();
        }
      });
      palette.addEventListener("keydown", event => {
        const buttons = [...palette.children];
        const index = buttons.indexOf(doc.activeElement);
        if (["ArrowRight", "ArrowLeft"].includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
          buttons[(index + (event.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length].focus();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          trigger.focus();
          row.classList.remove("qh-open");
          trigger.setAttribute("aria-expanded", "false");
        }
      });
      row.append(trigger, palette);
      menu.append(row);
    }
    menu.addEventListener("pointerleave", () => {
      if (!menu.contains(doc.activeElement)) {
        for (const row of menu.children) {
          row.classList.remove("qh-open");
          row.querySelector(".qh-trigger").setAttribute("aria-expanded", "false");
        }
      }
    });
    append(menu);
  },

  css: `
.selection-popup:has(.qh-menu) { overflow: visible !important; }
.selection-popup:has(.qh-menu) > .colors, .selection-popup:has(.qh-menu) > .tool-toggle { display: none !important; }
.selection-popup:has(.qh-menu) > .custom-sections { display: flex; flex-direction: column; overflow: visible; }
.selection-popup:has(.qh-menu) > .custom-sections > .section:has(.qh-menu) { order: -1; border: 0; padding: 0; margin: 0; }
.selection-popup:has(.qh-menu) > .custom-sections > .section:not(:has(.qh-menu)) { max-height: min(280px, 40vh); overflow-y: auto; }
.qh-menu { min-width: 190px; padding: 1px 0; font: 15px/1.3 -apple-system, sans-serif; color: CanvasText; word-break: keep-all; }
.qh-row { position: relative; }
.qh-trigger { width: 100%; min-height: 28px; padding: 2px 12px; display: flex; align-items: center; gap: 10px; background: transparent; border: 0; border-radius: 5px; color: inherit; text-align: left; cursor: pointer; font: inherit; }
.qh-open > .qh-trigger, .qh-trigger:focus-visible { color: white; background: #3478e5; }
.qh-dot { width: 13px; height: 13px; border-radius: 50%; flex: none; }
.qh-arrow { margin-left: auto; font-size: 20px; line-height: 1; }
.qh-palette { display: none; position: absolute; z-index: 100; left: calc(100% - 1px); top: 0; padding: 4px; gap: 2px; border: 1px solid #8885; border-radius: 8px; background: Canvas; box-shadow: 0 3px 12px #0003; }
.qh-open > .qh-palette { display: flex; }
.qh-left > .qh-palette { left: auto; right: calc(100% - 1px); }
.qh-color { display: grid; place-items: center; width: 30px; height: 30px; padding: 4px; border: 0; background: transparent; border-radius: 5px; cursor: pointer; }
.qh-color > span { width: 19px; height: 19px; border-radius: 50%; box-shadow: inset 0 0 0 1px #0002; }
.qh-color:hover, .qh-color:focus-visible { outline: 2px solid #3478e5; outline-offset: -2px; }
`,

  stop() {
    this.restoreTranslation();
    for (const style of this.styles) {
      const doc = style.ownerDocument;
      for (const menu of doc.querySelectorAll(".qh-menu")) {
        const section = menu.parentElement;
        menu.remove();
        if (section?.classList.contains("section") && !section.childNodes.length) section.remove();
      }
      for (const popup of doc.querySelectorAll(".qh-popup")) {
        popup.classList.remove("qh-popup");
        delete popup.dataset.qhSelection;
      }
      style.remove();
    }
    this.styles.clear();
  }
};

var renderHandler;
async function startup() {
  await Zotero.initializationPromise;
  QuickHighlight.patchTranslation();
  renderHandler = event => QuickHighlight.render(event);
  Zotero.Reader.registerEventListener("renderTextSelectionPopup", renderHandler, QuickHighlight.id);
}
function shutdown() {
  Zotero.Reader.unregisterEventListener("renderTextSelectionPopup", renderHandler);
  QuickHighlight.stop();
}
function install() {}
function uninstall() {}
