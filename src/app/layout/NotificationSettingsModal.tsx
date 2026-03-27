import { useEffect, useState } from "react";
import { useLocale } from "../i18n";
import { getTextCatalog } from "../i18n/catalog";

type NotificationSettingsModalProps = {
  open: boolean;
  busy?: boolean;
  initialEnabled: boolean;
  initialReminderMinutes: number;
  onClose: () => void;
  onSave: (next: { enabled: boolean; reminderMinutes: number }) => void;
};

const REMINDER_OPTIONS = [5, 15, 30, 60];

export function NotificationSettingsModal({
  open,
  busy,
  initialEnabled,
  initialReminderMinutes,
  onClose,
  onSave,
}: NotificationSettingsModalProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [reminderMinutes, setReminderMinutes] = useState(initialReminderMinutes);
  const { locale } = useLocale();
  const t = getTextCatalog(locale).notificationSettings;

  useEffect(() => {
    if (!open) return;
    setEnabled(initialEnabled);
    setReminderMinutes(initialReminderMinutes);
  }, [open, initialEnabled, initialReminderMinutes]);

  if (!open) return null;

  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal" role="dialog" aria-modal="true">
        <h2>{t.title}</h2>
        <p className="muted small">{t.intro}</p>
        <label>
          <span className="field-label">{t.enabledLabel}</span>
          <select
            value={enabled ? "on" : "off"}
            onChange={(event) => setEnabled(event.target.value === "on")}
          >
            <option value="on">{t.yes}</option>
            <option value="off">{t.no}</option>
          </select>
        </label>
        <label>
          <span className="field-label">{t.remindLabel}</span>
          <select
            value={String(reminderMinutes)}
            onChange={(event) => setReminderMinutes(Number(event.target.value) || 30)}
            disabled={!enabled}
          >
            {REMINDER_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {t.minutesBefore.replace("{count}", String(minutes))}
              </option>
            ))}
          </select>
        </label>
        <div className="confirm-modal-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>
            {t.close}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => onSave({ enabled, reminderMinutes })}
            disabled={busy}
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
