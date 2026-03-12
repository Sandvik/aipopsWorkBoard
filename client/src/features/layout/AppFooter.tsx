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
            AIPOPS Workboard er udviklet af AIPOPS.
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
        <span className="app-footer-meta-text">
          © {new Date().getFullYear()}{" "}
          <a href="https://www.aipops.com/" target="_blank" rel="noopener noreferrer">
            AIPOPS
          </a>
        </span>
      </div>
    </footer>
  );
}

