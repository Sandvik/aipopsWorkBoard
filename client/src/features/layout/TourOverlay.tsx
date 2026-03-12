// Lille overlay med 3-trins rundtur i appen.
// App styrer selv, hvornår den vises, samt nuværende step.
type TourOverlayProps = {
  tourStep: 1 | 2 | 3;
  onSkip: () => void;
  onNext: () => void;
};

export function TourOverlay({ tourStep, onSkip, onNext }: TourOverlayProps) {
  return (
    <div className="tour-hint">
      <div className="tour-hint-card">
        <p className="tour-hint-title">
          {tourStep === 1 && "Trin 1 af 3 – Projekter"}
          {tourStep === 2 && "Trin 2 af 3 – Opgaver"}
          {tourStep === 3 && "Trin 3 af 3 – Boardet"}
        </p>
        <p className="tour-hint-text">
          {tourStep === 1 &&
            "I venstre side kan du oprette projekter. Start med at lave et projekt til dit arbejde eller et privat projekt."}
          {tourStep === 2 &&
            "Øverst over boardet kan du oprette nye opgaver med titel, projekt og ansvarlig."}
          {tourStep === 3 &&
            "Her på boardet kan du trække opgaver mellem kolonner og klikke på et kort for at se detaljer."}
        </p>
        <div className="tour-hint-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={onSkip}
          >
            Spring over
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={onNext}
          >
            {tourStep === 3 ? "Færdig" : "Næste"}
          </button>
        </div>
      </div>
    </div>
  );
}

