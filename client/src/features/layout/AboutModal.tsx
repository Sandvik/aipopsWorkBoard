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
          AIPOPS Workboard er et værktøj til at holde styr på opgaver og projekter. Du vælger selv en mappe på din
          computer (eller et delt drev), og alt data – projekter, opgaver, kommentarer og vedhæftninger – gemmes kun
          der. Der bruges ingen cloud og ingen konto; du har fuld kontrol over dine data.
        </p>
        <p className="about-p">
          Appen kører i browseren og kræver en moderne browser (fx Chrome eller Edge) til valg af mappe. Ved delt mappe
          anbefales det at bruge knappen &quot;Opdater&quot; for at hente andre brugeres ændringer og undgå at flere
          redigerer samme opgave samtidigt.
        </p>
        <p className="about-p">
          Hvis du vil bruge samme board på flere computere, kan du gøre det på en enkel måde:
        </p>
        <ul className="about-list">
          <li>Kopier hele arbejds­mappen (fx med USB eller et delt drev) til den nye computer.</li>
          <li>Åbn AIPOPS Workboard dér og vælg den kopierede mappe som arbejdsmappe.</li>
          <li>Alternativt kan du lægge arbejds­mappen i en synkroniseret mappe som OneDrive, Dropbox eller iCloud.</li>
        </ul>
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

