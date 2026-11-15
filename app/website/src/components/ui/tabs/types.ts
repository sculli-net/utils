


export interface TabContent extends HTMLDivElement {
  value: string;
}

export interface TabTrigger {
  value: string;
  label: string;
}

export interface TabsContext {
  /** ID of the `<dialog>` (DialogContent). */
  id: string;

  triggers: TabTrigger[];
  contents: TabContent[];
}

export interface TabsSelectDetail {
  value: string;
}
