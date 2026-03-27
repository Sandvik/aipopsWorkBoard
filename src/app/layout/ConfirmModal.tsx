import type { ReactNode } from "react";
import { useLocale } from "../i18n";
import { getTextCatalog } from "../i18n/catalog";

type ConfirmModalProps = {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  className?: string;
};

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  showCancel = true,
  onCancel,
  onConfirm,
  className,
}: ConfirmModalProps) {
  const { locale } = useLocale();
  const defaults = getTextCatalog(locale).confirmModal;

  return (
    <div className="confirm-modal-backdrop">
      <div className={`confirm-modal ${className ?? ""}`}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          {showCancel ? (
            <button
              type="button"
              className="secondary-button"
              onClick={onCancel}
            >
              {cancelLabel ?? defaults.cancel}
            </button>
          ) : null}
          <button
            type="button"
            className="primary-button"
            onClick={async () => {
              await onConfirm();
            }}
          >
            {confirmLabel ?? defaults.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
