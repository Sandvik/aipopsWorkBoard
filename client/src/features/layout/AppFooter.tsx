// Footer med AIPOPS-branding og link til "Om AIPOPS Workboard".
import { useStrings, useLocale } from "../../i18n";

type AppFooterProps = {
  onShowAbout: () => void;
  onShowDataHelp: () => void;
};

export function AppFooter({ onShowAbout, onShowDataHelp }: AppFooterProps) {
  const { footer } = useStrings();
  const { locale, setLocale } = useLocale();
  return (
    <footer className="app-footer">
      <div className="app-footer-main">
        <div className="app-footer-brand">
          <button
            type="button"
            className="app-footer-link"
            onClick={onShowAbout}
            title={footer.aboutTooltip}
          >
            {footer.aboutLink}
          </button>
          <button
            type="button"
            className="app-footer-link"
            onClick={onShowDataHelp}
            title={footer.dataTooltip}
          >
            {footer.dataLink}
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
          <div className="app-footer-meta">
            <button
              type="button"
              className="app-footer-link"
              onClick={() => setLocale("da")}
              aria-pressed={locale === "da"}
            >
              DA
            </button>
            <span style={{ opacity: 0.5, paddingInline: "0.25rem" }}>/</span>
            <button
              type="button"
              className="app-footer-link"
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

