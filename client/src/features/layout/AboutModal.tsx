// Modal med tekst om, hvad AIPOPS Workboard er.
type AboutModalProps = {
  show: boolean;
  onClose: () => void;
  onOpenAiSettings?: () => void;
};

export function AboutModal({ show, onClose, onOpenAiSettings }: AboutModalProps) {
  if (!show) return null;

  return (
    <div
      className="about-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="about-title">Om AIPOPS Workboard</h2>
        <p className="about-p">
          AIPOPS Workboard er til dig, der får arbejde ind via mail og chats – ikke via flotte
          Gantt-diagrammer. Det er et lille board, hvor du kan samle projekter og opgaver ét sted,
          så du slipper for at lede efter ting i indbakken.
        </p>
        <p className="about-p">
          Du vælger selv en arbejdsmappe på din computer (eller et delt drev), og alt data –
          projekter, opgaver, kommentarer og vedhæftninger – gemmes kun der. Ingen cloud, ingen
          konto; du har fuld kontrol over dine data og kan flytte mappen, hvis du får ny computer.
        </p>
        <p className="about-p">
          Appen kører i browseren og bruger filsystem-API&apos;en til at vælge en arbejdsmappe. Det
          betyder, at du skal bruge en moderne browser (fx Chrome eller Edge), og at det er en god
          idé at klikke på &quot;Opdater&quot; indimellem, hvis flere deler den samme mappe – så
          alle ser de samme ændringer.
        </p>
        <p className="about-p">
          Hvis du har lyst, kan du også tilføje din egen OpenAI API-nøgle. Så kan AIPOPS hjælpe med
          at foreslå titler, beskrivelser og delopgaver ud fra dine mails og noter. AI-delen er helt
          valgfri: dine opgaver ligger stadig som almindelige filer i din arbejdsmappe, og du
          godkender altid selv, hvad der oprettes.
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
              AI-indstillinger
            </button>
          ) : null}
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Luk
          </button>
        </div>
      </div>
    </div>
  );
}

