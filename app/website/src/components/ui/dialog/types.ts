/**
 * IDs the Dialog root creates and hands to a function child, so the parts can be linked at render time
 * (the trigger then opens the dialog without JS, through `commandfor`).
 *
 * ```astro
 * <Dialog>
 *   {(ctx: DialogContext) => (
 *     <>
 *       <DialogTrigger for={ctx.id}>Open</DialogTrigger>
 *       <DialogContent id={ctx.id} aria-labelledby={ctx.titleId}>
 *         <DialogHeader slot="header" title="Delete file?" titleId={ctx.titleId} />
 *       </DialogContent>
 *     </>
 *   )}
 * </Dialog>
 * ```
 *
 * Without a function child the `<dialog-root>` element applies the same IDs when it connects.
 */
export interface DialogContext {
  /** ID of the `<dialog>` (DialogContent). */
  id: string;
  /** ID of the title rendered by DialogHeader. */
  titleId: string;
  /** ID of the description rendered by DialogHeader. */
  descriptionId: string;
}

export interface DialogCloseDetail {
  /** The `<dialog>`'s `returnValue`: the `value` of the button that closed it, or `""`. */
  returnValue: string;
  id: string;
}
