// @ts-nocheck
import { describe, expect, it } from "vitest";
import type { TaskRecord } from "../src/types";
import { normalizeTaskFromDisk } from "../src/infrastructure/storage";

// NOTE:
// Denne testfil er tænkt til Vitest.
// Installer dev-deps og kør tests sådan her:
//   npm install -D vitest
//   npx vitest

describe("normalizeTaskFromDisk", () => {
  it("should fill in sensible defaults for missing fields", () => {
    const raw: TaskRecord = {
      id: "task_1",
      title: "Test",
      slug: "test",
      description: "",
      assignee: "",
      deadline: null,
      // @ts-expect-error - bevidst forkert for at teste defaulting
      priority: "Unknown",
      // @ts-expect-error - bevidst forkert for at teste defaulting
      status: "something",
      projectSlug: "proj",
      order: 0,
      // @ts-expect-error - bevidst ufuldstændig for at teste defaulting
      comments: undefined,
      // @ts-expect-error - bevidst ufuldstændig for at teste defaulting
      attachments: undefined,
    };

    const normalized = normalizeTaskFromDisk(raw);

    expect(normalized.status).toBe("todo");
    expect(normalized.priority).toBe("Medium");
    expect(Array.isArray(normalized.comments)).toBe(true);
    expect(Array.isArray(normalized.attachments)).toBe(true);
  });
});
