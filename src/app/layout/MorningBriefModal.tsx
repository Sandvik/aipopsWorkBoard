import { useLocale } from "../i18n";
import { getTextCatalog } from "../i18n/catalog";

type MorningBriefModalProps = {
  open: boolean;
  brief: string;
  onClose: () => void;
};

const mojibakeReplacements: Array<[string, string]> = [
  ["pÃ¥", "på"],
  ["stÃ¸tte", "støtte"],
  ["vÃ¦lge", "vælge"],
];

function normalizeDisplayText(value: string): string {
  return mojibakeReplacements.reduce(
    (text, [broken, fixed]) => text.replaceAll(broken, fixed),
    value,
  );
}

export function MorningBriefModal({ open, brief, onClose }: MorningBriefModalProps) {
  const { locale } = useLocale();
  const t = getTextCatalog(locale).morningBriefModal;

  if (!open) return null;

  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal morning-brief-modal" role="dialog" aria-modal="true">
        <h2>{t.title}</h2>
        <p className="muted small">{normalizeDisplayText(t.intro)}</p>
        <div className="morning-brief-body">
          {brief
            .split("\n")
            .filter((line) => line.trim())
            .map((line, index) => {
              let trimmed = line.trim();
              const boldMatch = trimmed.match(/^\*\*(.*)\*\*$/);
              if (boldMatch) {
                trimmed = boldMatch[1].trim();
              }
              const isBullet = trimmed.startsWith("-") || trimmed.startsWith("?");
              const lineText = normalizeDisplayText(
                isBullet ? trimmed.replace(/^[-?]\s*/, "") : trimmed,
              );
              return isBullet ? (
                <div key={index} className="morning-brief-line bullet">
                  <span className="morning-brief-bullet-dot" aria-hidden="true" />
                  <span>{lineText}</span>
                </div>
              ) : (
                <p key={index} className="morning-brief-line">
                  {lineText}
                </p>
              );
            })}
        </div>
        <div className="confirm-modal-actions">
          <button type="button" className="primary-button" onClick={onClose}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
