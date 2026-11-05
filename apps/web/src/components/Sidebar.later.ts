import * as Schema from "effect/Schema";
import { scopedThreadKey, scopeThreadRef } from "@t3tools/client-runtime/environment";
import type { SidebarThreadSummary } from "../types";

export const SidebarLaterState = Schema.Struct({
  projects: Schema.Array(Schema.String),
  threads: Schema.Record(Schema.String, Schema.Boolean),
});
export type SidebarLaterState = typeof SidebarLaterState.Type;
export const EMPTY_LATER_STATE: SidebarLaterState = { projects: [], threads: {} };
export const SIDEBAR_PROJECT_DRAG_TYPE = "application/x-t3-sidebar-project";

type LaterThread = Pick<SidebarThreadSummary, "environmentId" | "id" | "projectId">;

export function isThreadForLater(state: SidebarLaterState, thread: LaterThread): boolean {
  const key = scopedThreadKey(scopeThreadRef(thread.environmentId, thread.id));
  return (
    state.threads[key] ?? state.projects.includes(`${thread.environmentId}:${thread.projectId}`)
  );
}

export function moveThreadsForLater(
  state: SidebarLaterState,
  keys: readonly string[],
  later: boolean,
): SidebarLaterState {
  const threads = { ...state.threads };
  for (const key of keys) threads[key] = later;
  return { ...state, threads };
}

export function moveProjectsForLater(
  state: SidebarLaterState,
  projectKeys: readonly string[],
  projectThreads: readonly LaterThread[],
  later: boolean,
): SidebarLaterState {
  const projects = new Set(state.projects);
  for (const key of projectKeys) {
    if (later) projects.add(key);
    else projects.delete(key);
  }
  const threads = { ...state.threads };
  // A whole-project move resets its per-thread exceptions, including explicit moves back out.
  for (const thread of projectThreads) {
    if (projectKeys.includes(`${thread.environmentId}:${thread.projectId}`)) {
      delete threads[scopedThreadKey(scopeThreadRef(thread.environmentId, thread.id))];
    }
  }
  return { projects: [...projects], threads };
}
