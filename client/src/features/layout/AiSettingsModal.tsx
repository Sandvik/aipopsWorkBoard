import { useState } from "react";

type AiSettingsModalProps = {
  open: boolean;
  busy?: boolean;
  initialApiKey: string | null;
  onSave: (apiKey: string | null) => void;
  onSkip: () => void;
};

export function AiSettingsModal({ open, busy, initialApiKey, onSave, onSkip }: AiSettingsModalProps) {
  const [value, setValue] = useState(initialApiKey ?? "");

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
        <label>
          <span className="field-label">Din OpenAI API-nøgle</span>
          <input
            type="password"
            value={value}
            placeholder="sk-..."
            onChange={(event) => setValue(event.target.value)}
            autoComplete="off"
          />
        </label>
        <p className="muted small">
          Du kan altid springe dette over nu og tilføje nøglen senere fra &quot;Om AIPOPS
          Workboard&quot;.
        </p>
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onSkip}
            disabled={busy}
          >
            Fortsæt uden AI
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => onSave(value.trim() || null)}
            disabled={busy}
          >
            Gem nøgle
          </button>
        </div>
      </div>
    </div>
  );
}

