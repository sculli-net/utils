import type { DialogCloseDetail } from "./types";

const supportsCommands = "commandForElement" in HTMLButtonElement.prototype;
const supportsClosedBy = "closedBy" in HTMLDialogElement.prototype;

/**
 * `<dialog-root>`: rendered by Dialog.astro. Connects its parts (found by `data-slot`) at runtime:
 * - gives the `<dialog>`, title and description their IDs and aria links if they don't have them yet
 * - points every trigger / close button at the dialog (`commandForElement`, or a click fallback)
 * - shows the optional overlay (`data-slot="dialog-portal"`) in the top layer just before the dialog
 * - falls back to a backdrop-click listener where `closedby="any"` isn't supported
 * - dispatches a bubbling `dialog:close` event with the dialog's `returnValue`
 */
export class DialogRoot extends HTMLElement {
  #abort?: AbortController;

  get dialog(): HTMLDialogElement | null {
    return this.#own<HTMLDialogElement>('[data-slot="dialog-content"]')[0] ?? null;
  }

  get returnValue(): string {
    return this.dialog?.returnValue ?? "";
  }

  open() {
    const dialog = this.dialog;
    if (!dialog || dialog.open) return;
    this.#beforeOpen();
    dialog.showModal();
  }

  close(returnValue?: string) {
    this.dialog?.close(returnValue);
  }

  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController();
    const { signal } = this.#abort;

    const dialog = this.dialog;
    if (!dialog) return;
    dialog.id ||= this.dataset.dialogId ?? "";

    this.#link('[data-slot="dialog-title"]', `${dialog.id}-title`, "aria-labelledby");
    this.#link('[data-slot="dialog-description"]', `${dialog.id}-description`, "aria-describedby");

    for (const trigger of this.#own<HTMLButtonElement>('[data-slot="dialog-trigger"]')) {
      trigger.setAttribute("aria-haspopup", "dialog");
      if (supportsCommands) trigger.commandForElement ??= dialog;
      else trigger.addEventListener("click", () => this.open(), { signal });
    }

    for (const button of this.#own<HTMLButtonElement>('[data-slot="dialog-close"]')) {
      if (supportsCommands) button.commandForElement ??= dialog;
      else button.addEventListener("click", () => this.close(button.value), { signal });
    }

    // Native trigger: `command` fires on the dialog before it opens. `beforetoggle` also covers
    // `showModal()` called from elsewhere. Both are safe to run twice.
    dialog.addEventListener(
      "command",
      (event) => {
        if ((event as CommandEvent).command === "show-modal" && !dialog.open) this.#beforeOpen();
      },
      { signal },
    );
    dialog.addEventListener(
      "beforetoggle",
      (event) => {
        if (event.newState === "open") this.#showOverlay();
        else this.#hideOverlay();
      },
      { signal },
    );

    dialog.addEventListener(
      "close",
      () => {
        this.#hideOverlay();
        this.dispatchEvent(
          new CustomEvent<DialogCloseDetail>("dialog:close", {
            detail: { returnValue: dialog.returnValue, id: dialog.id },
            bubbles: true,
          }),
        );
      },
      { signal },
    );

    if (!supportsClosedBy && dialog.getAttribute("closedby") === "any") {
      // Backdrop clicks target the <dialog> itself, so check the click landed outside its box.
      dialog.addEventListener(
        "click",
        (event) => {
          if (event.target !== dialog) return;
          const r = dialog.getBoundingClientRect();
          const inside =
            event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
          if (!inside) dialog.close();
        },
        { signal },
      );
    }
  }

  disconnectedCallback() {
    this.#abort?.abort();
  }

  /** Moving the element (`moveBefore()`) keeps its listeners: don't disconnect and reconnect. */
  connectedMoveCallback() {}

  #beforeOpen() {
    const dialog = this.dialog;
    if (dialog) dialog.returnValue = ""; // Esc doesn't reset it, so clear it on every open
    this.#showOverlay();
  }

  /** The overlay must enter the top layer before the dialog so it sits underneath it. */
  #showOverlay() {
    const overlay = this.#own<HTMLElement>('[data-slot="dialog-portal"]')[0];
    if (overlay && !overlay.matches(":popover-open")) overlay.showPopover();
  }

  #hideOverlay() {
    const overlay = this.#own<HTMLElement>('[data-slot="dialog-portal"]')[0];
    if (overlay?.matches(":popover-open")) overlay.hidePopover();
  }

  #link(selector: string, fallbackId: string, ariaAttribute: string) {
    const dialog = this.dialog;
    const el = this.#own(selector)[0];
    if (!dialog || !el) return;
    el.id ||= fallbackId;
    if (!dialog.hasAttribute(ariaAttribute)) dialog.setAttribute(ariaAttribute, el.id);
  }

  /** Parts that belong to this root, skipping those of a nested `<dialog-root>`. */
  #own<T extends Element = Element>(selector: string): T[] {
    return [...this.querySelectorAll<T>(selector)].filter((el) => el.closest("dialog-root") === this);
  }
}

if (!customElements.get("dialog-root")) customElements.define("dialog-root", DialogRoot);

declare global {
  interface HTMLElementTagNameMap {
    "dialog-root": DialogRoot;
  }
  interface HTMLElementEventMap {
    "dialog:close": CustomEvent<DialogCloseDetail>;
  }
}
