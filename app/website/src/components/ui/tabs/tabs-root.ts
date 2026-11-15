import type { TabsSelectDetail } from "./types";

export class TabsRoot extends HTMLElement {
  #abort?: AbortController;

  get list(): HTMLDivElement {
    return this.#own<HTMLDivElement>('[data-slot="tabs-list"]')[0] ?? null;
  }

  get triggers(): HTMLButtonElement[] {
    if (!this.list) return []
    return this.#own<HTMLButtonElement>('[data-slot="tabs-trigger"]', this.list);
  }

  get contents(): HTMLDivElement[] {
    return this.#own<HTMLDivElement>('[data-slot="tabs-content"]');
  }

  select(value: string) {
    const triggers = this.triggers;
    if (!triggers.length) return;

    for (const trigger of triggers) {
      if (trigger.value === value) {
        trigger.setAttribute("aria-selected", "true");
        trigger.setAttribute("data-active", "true");
      } else {
        trigger.setAttribute("aria-selected", "false");
        trigger.removeAttribute("data-active");
      }
    }

    const contents = this.contents;
    if (!contents.length) return;

    for (const content of contents) {
      if (content.dataset.tabsValue === value) {
        content.style.removeProperty("display");
      } else {
        content.style.setProperty("display", "none");
      }
    }
  }

  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController();
    const { signal } = this.#abort;

    const triggers = this.triggers;
    if (!triggers?.length) return;
    
    for (const trigger of triggers) {
      trigger.setAttribute("role", "tab");
      trigger.addEventListener("click", () => this.select(trigger.value), { signal });
    }

    const contents = this.contents;
    if (!contents.length) return;

    for (const content of contents) {
      const triggerValue = triggers.find((trigger) => trigger.value === content.dataset.tabsValue)?.value;
      content.setAttribute("role", "tabpanel");
      content.setAttribute("aria-labelledby", triggerValue ?? content.id);
    }

    const defaultValue = this.getAttribute("defaultValue") || triggers[0]?.value;
    if (defaultValue) this.select(defaultValue);

    const hiddenStyle = document.getElementById("tabs-hidden-style");
    if (hiddenStyle) hiddenStyle.remove();

  }

  disconnectedCallback() {
    this.#abort?.abort();
  }

  /** Moving the element (`moveBefore()`) keeps its listeners: don't disconnect and reconnect. */
  connectedMoveCallback() {}

  
  #own<T extends Element = Element>(selector: string, parent?: Element): T[] {
    if (parent) return [...parent.querySelectorAll<T>(selector)].filter((el) => el.closest("tabs-root") === this);
    return [...this.querySelectorAll<T>(selector)].filter((el) => el.closest("tabs-root") === this);
  }
}

if (!customElements.get("tabs-root")) customElements.define("tabs-root", TabsRoot);

declare global {
  interface HTMLElementTagNameMap {
    "tabs-root": TabsRoot;
  }
  interface HTMLElementEventMap {
    "tabs:select": CustomEvent<TabsSelectDetail>;
  }
}
