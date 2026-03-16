import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (open) {
      setValue(initialApiKey ?? "");
    }
  }, [open, initialApiKey]);

  if (!open) return null;

  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal ai-settings-modal" role="dialog" aria-modal="true">
        <h2>AI-indstillinger (valgfrit)</h2>
        <p>
          Hvis du vil bruge AI-hjælp til titler og små tekstopgaver, kan du indtaste din egen OpenAI
          API-nøgle her. Nøglen gemmes kun som en fil i din arbejdsmappe og bruges kun, når du selv
          trykker på en AI-knap.
        </p>
        {initialApiKey ? (
          <p className="muted small">
            Der er allerede sat en AI-nøgle op for denne arbejdsmappe. Du kan ændre den herunder eller
            fjerne den helt.
          </p>
        ) : null}
        <label>
          <span className="field-label">Din OpenAI API-nøgle</span>
          <input
            type="password"
            value={value}
            placeholder="sk-..."
            onChange={(event) => setValue(event.target.value)}
            onFocus={(event) => {
              // Markér hele feltet, så det er nemt at overskrive
              event.target.select();
            }}
            autoComplete="off"
          />
        </label>
        <p className="muted small">
          Du kan altid springe dette over nu og tilføje nøglen senere fra &quot;Om AIPOPS
          Workboard&quot;.
        </p>
        <div className="confirm-modal-actions">
          {initialApiKey && onRemove ? (
            <button
              type="button"
              className="ghost-button danger-button"
              onClick={onRemove}
              disabled={busy}
            >
              Fjern AI-nøgle
            </button>
          ) : null}
          <button
            type="button"
            className="secondary-button"
            onClick={onSkip}
            disabled={busy}
          >
            {initialApiKey ? "Luk uden at ændre AI" : "Fortsæt uden AI"}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => onSave(value.trim() || null)}
            disabled={busy}
          >
            {initialApiKey ? "Opdater AI-nøgle" : "Gem nøgle"}
          </button>
        </div>
      </div>
    </div>
  );
}

