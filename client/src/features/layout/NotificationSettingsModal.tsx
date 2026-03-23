import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!open) return;
    setEnabled(initialEnabled);
    setReminderMinutes(initialReminderMinutes);
  }, [open, initialEnabled, initialReminderMinutes]);

  if (!open) return null;

  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal" role="dialog" aria-modal="true">
        <h2>Notifikationer</h2>
        <p className="muted small">
          Faa browser-pamindelser for deadlines. Virker mens appen er aaben i browseren.
        </p>
        <label>
          <span className="field-label">Aktiver notifikationer</span>
          <select
            value={enabled ? "on" : "off"}
            onChange={(event) => setEnabled(event.target.value === "on")}
          >
            <option value="on">Ja</option>
            <option value="off">Nej</option>
          </select>
        </label>
        <label>
          <span className="field-label">Pamind mig</span>
          <select
            value={String(reminderMinutes)}
            onChange={(event) => setReminderMinutes(Number(event.target.value) || 30)}
            disabled={!enabled}
          >
            {REMINDER_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutter foer deadline
              </option>
            ))}
          </select>
        </label>
        <div className="confirm-modal-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>
            Luk
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => onSave({ enabled, reminderMinutes })}
            disabled={busy}
          >
            Gem
          </button>
        </div>
      </div>
    </div>
  );
}

