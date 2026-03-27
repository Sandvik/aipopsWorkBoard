import { useEffect, useState } from "react";
import { useStrings } from "../i18n";

type AiSettingsModalProps = {
  open: boolean;
  busy?: boolean;
  initialApiKey: string | null;
  onSave: (apiKey: string | null) => void;
  onSkip: () => void;
  onRemove?: () => void;
};

export function AiSettingsModal({
  open,
  busy,
  initialApiKey,
  onSave,
  onSkip,
  onRemove,
}: AiSettingsModalProps) {
  const [value, setValue] = useState(initialApiKey ?? "");
  const { aiSettings: t } = useStrings();

  useEffect(() => {
    if (open) {
      setValue(initialApiKey ?? "");
    }
  }, [open, initialApiKey]);

  if (!open) return null;

  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal ai-settings-modal" role="dialog" aria-modal="true">
        <h2>{t.title}</h2>
        <p>{t.intro}</p>
        {initialApiKey ? (
          <p className="muted small">{t.existingNote}</p>
        ) : null}
        <label>
          <span className="field-label">{t.label}</span>
          <input
            type="password"
            value={value}
            placeholder={t.placeholder}
            onChange={(event) => setValue(event.target.value)}
            onFocus={(event) => {
              // Markér hele feltet, så det er nemt at overskrive
              event.target.select();
            }}
            autoComplete="off"
          />
        </label>
        <p className="muted small">
          {t.skipNote}
        </p>
        <div className="confirm-modal-actions">
          {initialApiKey && onRemove ? (
            <button
              type="button"
              className="ghost-button danger-button"
              onClick={onRemove}
              disabled={busy}
              title={t.removeTitle}
            >
              {t.removeLabel}
            </button>
          ) : null}
          <button
            type="button"
            className="secondary-button"
            onClick={onSkip}
            disabled={busy}
            title={initialApiKey ? t.skipTitleWithKey : t.skipTitleNoKey}
          >
            {initialApiKey ? t.skipLabelWithKey : t.skipLabelNoKey}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => onSave(value.trim() || null)}
            disabled={busy}
            title={initialApiKey ? t.saveTitleWithKey : t.saveTitleNoKey}
          >
            {initialApiKey ? t.saveLabelWithKey : t.saveLabelNoKey}
          </button>
        </div>
      </div>
    </div>
  );
}
