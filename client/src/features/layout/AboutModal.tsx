// Modal med tekst om, hvad AIPOPS Workboard er.
type AboutModalProps = {
  show: boolean;
  onClose: () => void;
};

export function AboutModal({ show, onClose }: AboutModalProps) {
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
          Appen kører i browseren og kræver en Chromium-baseret browser (Chrome, Edge m.fl.) til valg af mappe. Ved delt
          mappe anbefales det at bruge knappen &quot;Opdater&quot; for at hente andre brugeres ændringer og undgå at flere
          redigerer samme opgave samtidigt.
        </p>
        <button
          type="button"
          className="primary-button"
          onClick={onClose}
        >
          Luk
        </button>
      </div>
    </div>
  );
}

