import { useEffect, useMemo, useState } from "react";
import type { NoteRecord } from "../../types";
import { useLocale, useStrings } from "../../i18n";

type NotesModalProps = {
  open: boolean;
  busy?: boolean;
  saving?: boolean;
  notes: NoteRecord[];
  onClose: () => void;
  onChangeNotes: (notes: NoteRecord[]) => void;
};

const NOTE_COLORS: NoteRecord["color"][] = ["yellow", "orange", "green", "blue", "pink", "gray"];

function sortNotes(notes: NoteRecord[]) {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function formatUpdatedAt(value: string, locale: "da" | "en") {
  try {
    return new Date(value).toLocaleString(locale === "da" ? "da-DK" : "en-US");
  } catch {
    return value;
  }
}

export function NotesModal({ open, busy, saving, notes, onClose, onChangeNotes }: NotesModalProps) {
  const { locale } = useLocale();
  const { notes: t } = useStrings();

  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setActiveId((current) => {
      if (current && notes.some((n) => n.id === current)) return current;
      return notes[0]?.id ?? null;
    });
  }, [open, notes]);

  const sorted = useMemo(() => sortNotes(notes), [notes]);
  const active = useMemo(() => sorted.find((n) => n.id === activeId) ?? null, [sorted, activeId]);

  if (!open) return null;

  return (
    <div className="confirm-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="confirm-modal notes-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row between">
          <h2 className="notes-title">{t.title}</h2>
          <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>
            {t.closeLabel}
          </button>
        </div>

        <p className="muted small">{t.subtitle}</p>

        <div className="notes-toolbar">
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              const now = new Date().toISOString();
              const created: NoteRecord = {
                id: `note_${crypto.randomUUID().slice(0, 8)}`,
                title: "",
                body: "",
                color: "yellow",
                pinned: false,
                createdAt: now,
                updatedAt: now,
              };
              onChangeNotes([created, ...notes]);
              setActiveId(created.id);
            }}
            disabled={busy}
            title={t.newNoteTitle}
          >
            {t.newNoteLabel}
          </button>
          <div className="notes-status muted small" aria-live="polite">
            {saving ? t.savingLabel : notes.length ? t.savedLabel : t.emptyLabel}
          </div>
        </div>

        <div className="notes-layout">
          <div className="notes-list" role="listbox" aria-label={t.listAriaLabel}>
            {sorted.map((note) => (
              <button
                key={note.id}
                type="button"
                className={`notes-list-item ${
                  note.id === activeId ? "notes-list-item-active" : ""
                }`}
                onClick={() => setActiveId(note.id)}
                disabled={busy}
              >
                <div className="notes-list-item-top">
                  <span
                    className={`notes-color-dot notes-color-${note.color}`}
                    aria-hidden="true"
                  />
                  <strong className="notes-list-item-title">
                    {note.title.trim() || t.untitledLabel}
                  </strong>
                  {note.pinned ? <span className="notes-pin" title={t.pinnedTitle}>📌</span> : null}
                </div>
                <div className="notes-list-item-meta">
                  {formatUpdatedAt(note.updatedAt, locale)}
                </div>
              </button>
            ))}
            {!sorted.length ? <div className="muted small">{t.emptyListHint}</div> : null}
          </div>

          {active ? (
            <div className="notes-editor">
              <div className={`notes-topbar notes-color-${active.color}`} aria-hidden="true" />
              <div className="row between tight">
                <div className="row tight">
                  <button
                    type="button"
                    className="ghost-button small-button"
                    onClick={() => {
                      onChangeNotes(
                        notes.map((n) =>
                          n.id === active.id
                            ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() }
                            : n,
                        ),
                      );
                    }}
                    disabled={busy}
                    title={active.pinned ? t.unpinTitle : t.pinTitle}
                  >
                    {active.pinned ? t.unpinLabel : t.pinLabel}
                  </button>

                  <label className="notes-color-picker" aria-label={t.colorLabel}>
                    <span className="visually-hidden">{t.colorLabel}</span>
                    <select
                      value={active.color}
                      onChange={(e) => {
                        const next = e.target.value as NoteRecord["color"];
                        onChangeNotes(
                          notes.map((n) =>
                            n.id === active.id
                              ? { ...n, color: next, updatedAt: new Date().toISOString() }
                              : n,
                          ),
                        );
                      }}
                      disabled={busy}
                    >
                      {NOTE_COLORS.map((c) => (
                        <option key={c} value={c}>
                          {t.colorNames[c]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <button
                  type="button"
                  className="ghost-button danger-button small-button"
                  onClick={() => {
                    const next = notes.filter((n) => n.id !== active.id);
                    onChangeNotes(next);
                    setActiveId(next[0]?.id ?? null);
                  }}
                  disabled={busy}
                  title={t.deleteTitle}
                >
                  {t.deleteLabel}
                </button>
              </div>

              <label>
                <span className="field-label">{t.noteTitleLabel}</span>
                <input
                  value={active.title}
                  onChange={(e) => {
                    const nextTitle = e.target.value;
                    onChangeNotes(
                      notes.map((n) =>
                        n.id === active.id
                          ? { ...n, title: nextTitle, updatedAt: new Date().toISOString() }
                          : n,
                      ),
                    );
                  }}
                  disabled={busy}
                  placeholder={t.noteTitlePlaceholder}
                />
              </label>

              <label>
                <span className="field-label">{t.noteBodyLabel}</span>
                <textarea
                  rows={6}
                  value={active.body}
                  onChange={(e) => {
                    const nextBody = e.target.value;
                    onChangeNotes(
                      notes.map((n) =>
                        n.id === active.id
                          ? { ...n, body: nextBody, updatedAt: new Date().toISOString() }
                          : n,
                      ),
                    );
                  }}
                  disabled={busy}
                  placeholder={t.noteBodyPlaceholder}
                />
              </label>
            </div>
          ) : (
            <div className="notes-editor notes-editor-empty muted small">{t.emptyEditorHint}</div>
          )}
        </div>
      </div>
    </div>
  );
}

