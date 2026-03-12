// Footer med AIPOPS-branding og link til "Om AIPOPS Workboard".
type AppFooterProps = {
  onShowAbout: () => void;
};

export function AppFooter({ onShowAbout }: AppFooterProps) {
  return (
    <footer className="app-footer">
      <div className="app-footer-main">
        <div className="app-footer-brand">
          <span className="app-footer-brand-line">
            AIPOPS Workboard er designet og udviklet af AIPOPS.
          </span>
          <span className="app-footer-note">
            Arbejder direkte på dine lokale filer – ingen cloud-konto eller login.
          </span>
        </div>
        <nav className="app-footer-links" aria-label="Footer links">
          <button
            type="button"
            className="app-footer-link"
            onClick={onShowAbout}
          >
            Om AIPOPS Workboard
          </button>
        </nav>
      </div>
      <div className="app-footer-meta">
        <span className="app-footer-meta-text">© {new Date().getFullYear()} AIPOPS</span>
      </div>
    </footer>
  );
}

