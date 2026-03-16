// Footer med AIPOPS-branding og link til "Om AIPOPS Workboard".
type AppFooterProps = {
  onShowAbout: () => void;
  onShowDataHelp: () => void;
};

export function AppFooter({ onShowAbout, onShowDataHelp }: AppFooterProps) {
  return (
    <footer className="app-footer">
      <div className="app-footer-main">
        <div className="app-footer-brand">
          <button
            type="button"
            className="app-footer-link"
            onClick={onShowAbout}
          >
            Om AIPOPS Workboard
          </button>
          <button
            type="button"
            className="app-footer-link"
            onClick={onShowDataHelp}
          >
            Data og flytning
          </button>
        </div>
        <div className="app-footer-right">
          <div className="app-footer-meta">
            <span className="app-footer-meta-text">
              © {new Date().getFullYear()}{" "}
              <a href="https://www.aipops.com/" target="_blank" rel="noopener noreferrer">
                AIPOPS
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

