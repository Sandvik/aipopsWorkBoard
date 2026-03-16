type MorningBriefModalProps = {
  open: boolean;
  brief: string;
  onClose: () => void;
};

export function MorningBriefModal({ open, brief, onClose }: MorningBriefModalProps) {
  if (!open) return null;

  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal morning-brief-modal" role="dialog" aria-modal="true">
        <h2>Brief for dine projekter</h2>
        <p className="muted small">
          Genereret ud fra status på dine aktive projekter og deres opgaver. Brug det som støtte til at
          vælge, hvad du vil starte med i dag.
        </p>
        <div className="morning-brief-body">
          {brief
            .split("\n")
            .filter((line) => line.trim())
            .map((line, index) => {
              let trimmed = line.trim();
              // Fjern simple Markdown-bold (**tekst**) hvis modellen bruger det
              const boldMatch = trimmed.match(/^\*\*(.*)\*\*$/);
              if (boldMatch) {
                trimmed = boldMatch[1].trim();
              }
              const isBullet = trimmed.startsWith("-") || trimmed.startsWith("•");
              const text = isBullet ? trimmed.replace(/^[-•]\s*/, "") : trimmed;
              return isBullet ? (
                <div key={index} className="morning-brief-line bullet">
                  <span className="morning-brief-bullet-dot">•</span>
                  <span>{text}</span>
                </div>
              ) : (
                <p key={index} className="morning-brief-line">
                  {text}
                </p>
              );
            })}
        </div>
        <div className="confirm-modal-actions">
          <button type="button" className="primary-button" onClick={onClose}>
            Luk
          </button>
        </div>
      </div>
    </div>
  );
}

