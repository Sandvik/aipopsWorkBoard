// Footer med AIPOPS-branding og link til "Om AIPOPS Workboard".
type AppFooterProps = {
  onShowAbout: () => void;
};

export function AppFooter({ onShowAbout }: AppFooterProps) {
  return (
    <footer className="app-footer">
      <div className="app-footer-main">
        <nav className="app-footer-links" aria-label="Footer links">
          <button
            type="button"
            className="app-footer-link"
            onClick={onShowAbout}
          >
            Om AIPOPS Workboard
          </button>
        </nav>
        <div className="app-footer-meta">
          <span className="app-footer-meta-text">
            © {new Date().getFullYear()}{" "}
            <a href="https://www.aipops.com/" target="_blank" rel="noopener noreferrer">
              AIPOPS
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

