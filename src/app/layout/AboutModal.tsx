// Modal med tekst om, hvad AIPOPS Workboard er.
import { useStrings } from "../i18n";

type AboutModalProps = {
  show: boolean;
  onClose: () => void;
  onOpenAiSettings?: () => void;
};

export function AboutModal({ show, onClose, onOpenAiSettings }: AboutModalProps) {
  if (!show) return null;

  const { about } = useStrings();

  return (
    <div
      className="about-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="about-title">{about.title}</h2>
        <p className="about-p">
          {about.p1}
        </p>
        <p className="about-p">
          {about.p2}
        </p>
        <p className="about-p">
          {about.p3}
        </p>
        <p className="about-p">
          {about.p4}
        </p>
        <div className="about-actions">
          {onOpenAiSettings ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                onClose();
                onOpenAiSettings();
              }}
            >
              {about.aiSettingsLabel}
            </button>
          ) : null}
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            {about.closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
