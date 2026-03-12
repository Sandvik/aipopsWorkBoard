// Genbrugelig bekræftelsesmodal, drevet af props fra App.
type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
};

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="ghost-button"
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

