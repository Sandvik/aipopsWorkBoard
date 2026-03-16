import type { ReactNode } from "react";

// Genbrugelig bekræftelsesmodal, drevet af props fra App.
type ConfirmModalProps = {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  className?: string;
};

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onCancel,
  onConfirm,
  className,
}: ConfirmModalProps) {
  return (
    <div className="confirm-modal-backdrop">
      <div className={`confirm-modal ${className ?? ""}`}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
          >
            {cancelLabel ?? "Annuller"}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={async () => {
              await onConfirm();
            }}
          >
            {confirmLabel ?? "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}

