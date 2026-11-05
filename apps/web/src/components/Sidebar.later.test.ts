import { describe, expect, it } from "vite-plus/test";
import * as Schema from "effect/Schema";
import { EnvironmentId, ProjectId, ThreadId } from "@t3tools/contracts";
import { scopedThreadKey, scopeThreadRef } from "@t3tools/client-runtime/environment";
import {
  EMPTY_LATER_STATE,
  SidebarLaterState,
  isThreadForLater,
  moveProjectsForLater,
  moveThreadsForLater,
} from "./Sidebar.later";

const environmentId = EnvironmentId.make("local");
const thread = { environmentId, id: ThreadId.make("one"), projectId: ProjectId.make("project") };
const other = { ...thread, id: ThreadId.make("two") };
const key = scopedThreadKey(scopeThreadRef(environmentId, thread.id));
const decodeLaterState = Schema.decodeSync(Schema.fromJsonString(SidebarLaterState));

describe("For later membership", () => {
  it("keeps a thread parked across activity and persistence until it is explicitly moved out", () => {
    const parked = moveThreadsForLater(EMPTY_LATER_STATE, [key], true);
    const persisted = decodeLaterState(JSON.stringify(parked));
    const updatedThread = { ...thread, updatedAt: "2026-11-06T00:00:00Z" };
    expect(isThreadForLater(persisted, updatedThread)).toBe(true);
    expect(isThreadForLater(persisted, other)).toBe(false);
    expect(isThreadForLater(moveThreadsForLater(persisted, [key], false), thread)).toBe(false);
  });

  it("moves whole projects including future threads, while allowing individual threads out", () => {
    const parked = moveProjectsForLater(EMPTY_LATER_STATE, ["local:project"], [thread], true);
    expect(isThreadForLater(parked, thread)).toBe(true);
    expect(isThreadForLater(parked, other)).toBe(true);
    expect(
      isThreadForLater(parked, { ...thread, environmentId: EnvironmentId.make("remote") }),
    ).toBe(false);
    const oneOut = moveThreadsForLater(parked, [key], false);
    expect(isThreadForLater(oneOut, thread)).toBe(false);
    expect(isThreadForLater(oneOut, other)).toBe(true);
    const allOut = moveProjectsForLater(oneOut, ["local:project"], [thread, other], false);
    expect(isThreadForLater(allOut, other)).toBe(false);
    const parkedAgain = moveProjectsForLater(oneOut, ["local:project"], [thread, other], true);
    expect(isThreadForLater(parkedAgain, thread)).toBe(true);
  });
});
