import { useEffect, useState } from "react";
import type { SplitTaskSuggestion } from "../../infrastructure/aiClient";
import { useLocale } from "../../app/i18n";
import { getTextCatalog } from "../../app/i18n/catalog";

type SplitTasksModalProps = {
  open: boolean;
  suggestions: SplitTaskSuggestion[];
  canMarkOriginalDone?: boolean;
  onConfirm: (selected: SplitTaskSuggestion[], options: { markOriginalDone: boolean }) => void;
  onCancel: () => void;
};

export function SplitTasksModal({
  open,
  suggestions,
  canMarkOriginalDone = false,
  onConfirm,
  onCancel,
}: SplitTasksModalProps) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [markOriginalDone, setMarkOriginalDone] = useState(false);
  const { locale } = useLocale();
  const t = getTextCatalog(locale).splitTasks;

  useEffect(() => {
    if (open) {
      setSelected(new Set(suggestions.map((_, index) => index)));
      setMarkOriginalDone(false);
    }
  }, [open, suggestions]);

  if (!open) return null;

  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal split-tasks-modal" role="dialog" aria-modal="true">
        <h2>{t.title}</h2>
        <p className="muted small">{t.intro}</p>
        <div className="split-tasks-list">
          {suggestions.map((item, index) => {
            const checked = selected.has(index);
            return (
              <label key={index} className="split-task-item">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (event.target.checked) next.add(index);
                      else next.delete(index);
                      return next;
                    });
                  }}
                />
                <div className="split-task-content">
                  <p className="split-task-title">{item.title}</p>
                  <p className="split-task-description muted small">{item.description}</p>
                </div>
              </label>
            );
          })}
        </div>
        {canMarkOriginalDone ? (
          <label className="split-task-original-option">
            <input
              type="checkbox"
              checked={markOriginalDone}
              onChange={(event) => setMarkOriginalDone(event.target.checked)}
            />
            <span>{t.markOriginal}</span>
          </label>
        ) : null}
        <div className="confirm-modal-actions">
          <button type="button" className="ghost-button" onClick={onCancel}>
            {t.cancel}
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!selected.size}
            onClick={() =>
              onConfirm(
                suggestions.filter((_, index) => selected.has(index)),
                { markOriginalDone },
              )
            }
          >
            {t.confirm}
          </button>
        </div>
        <p className="muted tiny">
          {t.footer}
          {canMarkOriginalDone ? ` ${t.footerMarkOriginal}` : ""}
        </p>
      </div>
    </div>
  );
}
