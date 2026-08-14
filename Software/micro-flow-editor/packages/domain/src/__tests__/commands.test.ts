import { describe, expect, it } from "vitest";
import { addCoreBinding, CommandStack, removeCoreBinding, renameProject, setDeviceProfilePackages } from "../commands.js";
import { createEmptyProject } from "../project.js";
import { coreBindingId, projectId } from "../ids.js";
import type { Result } from "../result.js";

function mustOk<T, E>(result: Result<T, E>): T {
  if (!result.ok) throw new Error("expected an ok Result in test fixture setup");
  return result.value;
}

function fixtureProject() {
  const id = mustOk(projectId("cccccccc-0000-4000-8000-000000000001"));
  return createEmptyProject(id, "Initial name");
}

describe("CommandStack", () => {
  it("execute applies the command and updates current", () => {
    const stack = new CommandStack(fixtureProject());
    stack.execute(renameProject("Renamed"));
    expect(stack.current.name).toBe("Renamed");
  });

  it("undo restores the exact previous state, redo restores the exact next state", () => {
    const stack = new CommandStack(fixtureProject());
    const initial = stack.current;

    stack.execute(renameProject("Renamed"));
    const renamed = stack.current;

    const undone = stack.undo();
    expect(undone).toEqual({ ok: true, value: initial });
    expect(stack.current).toEqual(initial);

    const redone = stack.redo();
    expect(redone).toEqual({ ok: true, value: renamed });
    expect(stack.current).toEqual(renamed);
  });

  it("undo/redo reproduce exact state across a mixed sequence of commands on different entities", () => {
    const stack = new CommandStack(fixtureProject());
    const c1 = mustOk(coreBindingId("cccccccc-0000-4000-8000-0000000000c1"));
    const c2 = mustOk(coreBindingId("cccccccc-0000-4000-8000-0000000000c2"));

    const s0 = stack.current; // name="Initial name", no bindings
    stack.execute(renameProject("Step 1"));
    const s1 = stack.current;
    stack.execute(
      addCoreBinding({ bindingId: c1, expectedDeviceId: "d1", connectionProfileId: "p1" }),
    );
    const s2 = stack.current;
    stack.execute(
      addCoreBinding({ bindingId: c2, expectedDeviceId: "d2", connectionProfileId: "p2" }),
    );
    const s3 = stack.current;
    stack.execute(removeCoreBinding(c1));
    const s4 = stack.current;

    expect(s4.coreBindings.map((b) => b.bindingId)).toEqual([c2]);

    // Undo all four commands, one entity kind at a time, in reverse order.
    expect(stack.undo()).toEqual({ ok: true, value: s3 });
    expect(stack.undo()).toEqual({ ok: true, value: s2 });
    expect(stack.undo()).toEqual({ ok: true, value: s1 });
    expect(stack.undo()).toEqual({ ok: true, value: s0 });
    expect(stack.canUndo()).toBe(false);

    // Redo all four back in forward order — every intermediate state matches exactly.
    expect(stack.redo()).toEqual({ ok: true, value: s1 });
    expect(stack.redo()).toEqual({ ok: true, value: s2 });
    expect(stack.redo()).toEqual({ ok: true, value: s3 });
    expect(stack.redo()).toEqual({ ok: true, value: s4 });
    expect(stack.canRedo()).toBe(false);
  });

  it("a new command after undo discards the stale redo history", () => {
    const stack = new CommandStack(fixtureProject());
    stack.execute(renameProject("A"));
    stack.undo();
    stack.execute(renameProject("B"));

    expect(stack.canRedo()).toBe(false);
    expect(stack.current.name).toBe("B");
  });

  it("peekUndoKind/peekRedoKind describe what undo/redo would do, for a tooltip (UX-S010)", () => {
    const stack = new CommandStack(fixtureProject());
    expect(stack.peekUndoKind()).toBeUndefined();
    expect(stack.peekRedoKind()).toBeUndefined();

    stack.execute(renameProject("Renamed"));
    expect(stack.peekUndoKind()).toBe("RenameProject");
    expect(stack.peekRedoKind()).toBeUndefined();

    stack.undo();
    expect(stack.peekUndoKind()).toBeUndefined();
    expect(stack.peekRedoKind()).toBe("RenameProject");
  });

  it("undo/redo fail with a structured error instead of throwing when there is nothing to do", () => {
    const stack = new CommandStack(fixtureProject());
    expect(stack.undo().ok).toBe(false);
    expect(stack.redo().ok).toBe(false);
  });

  it("a rejected command leaves state and history untouched", () => {
    const stack = new CommandStack(fixtureProject());
    const c1 = mustOk(coreBindingId("cccccccc-0000-4000-8000-0000000000c1"));
    stack.execute(
      addCoreBinding({ bindingId: c1, expectedDeviceId: "d1", connectionProfileId: "p1" }),
    );
    const before = stack.current;

    const result = stack.execute(
      addCoreBinding({ bindingId: c1, expectedDeviceId: "d1-dup", connectionProfileId: "p1" }),
    );

    expect(result.ok).toBe(false);
    expect(stack.current).toBe(before);
    expect(stack.canUndo()).toBe(true); // only the one real command from setup
    stack.undo();
    expect(stack.canUndo()).toBe(false);
  });

  it("addCoreBinding/removeCoreBinding keep physicalGraphs/deviceGraphs index-aligned with coreBindings (react-flow-adapter's physicalGraphLens/deviceGraphLens match by array index)", () => {
    const stack = new CommandStack(fixtureProject());
    const c1 = mustOk(coreBindingId("cccccccc-0000-4000-8000-0000000000c1"));
    const c2 = mustOk(coreBindingId("cccccccc-0000-4000-8000-0000000000c2"));

    stack.execute(addCoreBinding({ bindingId: c1, expectedDeviceId: "d1", connectionProfileId: "p1" }));
    stack.execute(addCoreBinding({ bindingId: c2, expectedDeviceId: "d2", connectionProfileId: "p2" }));
    expect(stack.current.physicalGraphs).toHaveLength(2);
    expect(stack.current.deviceGraphs).toHaveLength(2);
    expect(stack.current.physicalGraphs.every((g) => g.layer === "physical-composition" && g.nodes.length === 0)).toBe(true);

    stack.execute(removeCoreBinding(c1));
    expect(stack.current.coreBindings.map((b) => b.bindingId)).toEqual([c2]);
    expect(stack.current.physicalGraphs).toHaveLength(1);
    expect(stack.current.deviceGraphs).toHaveLength(1);
  });

  it("setDeviceProfilePackages replaces the whole list, undo/redo restore it exactly", () => {
    const stack = new CommandStack(fixtureProject());
    expect(stack.current.deviceProfilePackages).toEqual([]);

    stack.execute(setDeviceProfilePackages(["pkg-json-1"]));
    expect(stack.current.deviceProfilePackages).toEqual(["pkg-json-1"]);

    stack.execute(setDeviceProfilePackages(["pkg-json-1", "pkg-json-2"]));
    expect(stack.current.deviceProfilePackages).toEqual(["pkg-json-1", "pkg-json-2"]);

    stack.undo();
    expect(stack.current.deviceProfilePackages).toEqual(["pkg-json-1"]);
  });
});
