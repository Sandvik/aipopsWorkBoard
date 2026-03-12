// Hook der samler al workspace-relateret logik:
// - valg og skift af arbejdsmappe
// - refresh af data fra den nuværende mappe
// - håndtering af intro-tur ved første valg.

type WorkspaceHandle = FileSystemDirectoryHandle | null;

type UseWorkspaceArgs = {
  workspace: WorkspaceHandle;
  setWorkspace: (handle: WorkspaceHandle) => void;
  workspaceName: string;
  setWorkspaceName: (name: string) => void;
  selectedProjectSlug: string;
  selectedTaskId: string;
  startTourAfterWorkspace: boolean;
  setShowTour: (show: boolean) => void;
  setTourStep: (step: 1 | 2 | 3) => void;
  runAction: (fn: () => Promise<void>, successMessage?: string) => Promise<void>;
  requireWorkspace: () => Promise<FileSystemDirectoryHandle>;
  loadAllData: (
    handle: FileSystemDirectoryHandle,
    preferredProjectSlug?: string,
    preferredTaskId?: string | null,
  ) => Promise<void>;
  setMessage: (msg: string) => void;
  setConfirmState: (state: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
  } | null) => void;
  persistWorkspaceHandle: (handle: FileSystemDirectoryHandle | null) => Promise<void>;
  pickWorkspaceDirectory: () => Promise<FileSystemDirectoryHandle>;
};

export function useWorkspace({
  workspace,
  setWorkspace,
  workspaceName,
  setWorkspaceName,
  selectedProjectSlug,
  selectedTaskId,
  startTourAfterWorkspace,
  setShowTour,
  setTourStep,
  runAction,
  requireWorkspace,
  loadAllData,
  setMessage,
  setConfirmState,
  persistWorkspaceHandle,
  pickWorkspaceDirectory,
}: UseWorkspaceArgs) {
  const hasWorkspace = Boolean(workspace);

  async function pickWorkspaceAndLoad() {
    await runAction(async () => {
      let handle: FileSystemDirectoryHandle;
      try {
        handle = await pickWorkspaceDirectory();
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        if (caught instanceof Error && caught.message.includes("understøtter ikke mappeadgang")) {
          setConfirmState({
            title: "Din browser mangler mappeadgang",
            message: caught.message,
            confirmLabel: "OK",
            onConfirm: () => {
              setConfirmState(null);
            },
          });
          return;
        }
        throw caught;
      }
      setWorkspace(handle);
      setWorkspaceName(handle.name);
      await persistWorkspaceHandle(handle);
      await loadAllData(handle);
      setMessage("Arbejdsmappe valgt.");
      if (startTourAfterWorkspace) {
        setShowTour(true);
        setTourStep(1);
      }
    });
  }

  async function handleRefreshData() {
    const handle = await requireWorkspace();
    await runAction(
      () => loadAllData(handle, selectedProjectSlug || undefined, selectedTaskId || null),
      "Data opdateret.",
    );
  }

  async function handlePickWorkspace() {
    if (workspace) {
      setConfirmState({
        title: "Skift arbejdsmappe",
        message:
          "Når du skifter arbejdsmappe, ser du kun projekter og opgaver fra den nye mappe. De gamle data bliver liggende i den tidligere mappe.",
        confirmLabel: "Skift arbejdsmappe",
        cancelLabel: "Behold nuværende",
        onConfirm: async () => {
          await pickWorkspaceAndLoad();
          setConfirmState(null);
        },
      });
      return;
    }
    await pickWorkspaceAndLoad();
  }

  return {
    hasWorkspace,
    pickWorkspaceAndLoad,
    handleRefreshData,
    handlePickWorkspace,
  };
}

