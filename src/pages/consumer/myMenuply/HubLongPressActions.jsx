/**
 * Long-press action cluster — Edit and Delete shown together; user picks one.
 */

import * as s from "./myMenuplyStyles.js";

export default function HubLongPressActions({
  open = false,
  onEdit = null,
  onDelete = null,
  editLabel = "Edit",
  deleteLabel = "Delete",
  editBusy = false,
  deleteBusy = false,
  editAriaLabel = null,
  deleteAriaLabel = null,
  testIdPrefix = "hub-card",
  onDismiss = null,
}) {
  if (!open) return null;
  const hasEdit = typeof onEdit === "function";
  const hasDelete = typeof onDelete === "function";
  if (!hasEdit && !hasDelete) return null;

  function run(e, fn, busy) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    onDismiss?.();
    fn?.();
  }

  return (
    <div
      style={s.hubLongPressActions}
      data-testid={`${testIdPrefix}-actions`}
      role="group"
      aria-label="Edit or delete"
    >
      {hasEdit ? (
        <button
          type="button"
          style={s.hubLongPressEdit}
          data-testid={`${testIdPrefix}-edit`}
          aria-label={editAriaLabel || editLabel}
          disabled={editBusy}
          onClick={(e) => run(e, onEdit, editBusy)}
        >
          {editLabel}
        </button>
      ) : null}
      {hasDelete ? (
        <button
          type="button"
          style={s.hubLongPressDelete}
          data-testid={`${testIdPrefix}-delete`}
          aria-label={deleteAriaLabel || deleteLabel}
          disabled={deleteBusy}
          onClick={(e) => run(e, onDelete, deleteBusy)}
        >
          {deleteLabel}
        </button>
      ) : null}
    </div>
  );
}
