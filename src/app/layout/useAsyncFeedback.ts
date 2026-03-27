import { useState } from "react";
import { getStoredTextCatalog } from "../i18n/catalog";

export function useAsyncFeedback() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function runAction(action: () => Promise<void>, successMessage?: string) {
    try {
      setBusy(true);
      setError("");
      await action();
      if (successMessage) setMessage(successMessage);
    } catch (caught) {
      const fallback = getStoredTextCatalog().asyncFeedback.fallbackError;
      setError(caught instanceof Error ? caught.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    error,
    message,
    setError,
    setMessage,
    runAction,
  };
}
