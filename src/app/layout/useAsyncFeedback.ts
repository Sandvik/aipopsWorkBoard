// Hook til at håndtere busy/error/message-tilstand omkring asynkrone handlinger.
// Giver et fælles runAction-mønster, så UI kan være simpelt.
import { useState } from "react";

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
      setError(caught instanceof Error ? caught.message : "Noget gik galt.");
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

