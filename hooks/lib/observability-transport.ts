// observability-transport.ts -- push hook state/events to external dashboard targets
//
// STATUS: compatibility shim (2026-08-19). No dashboard/transport target is
// configured yet -- this module was referenced by PromptProcessing.hook.ts,
// ISASync.hook.ts, KVSync.hook.ts and ToolActivityTracker.hook.ts but never
// created, which crashed those hooks on every invocation with "Cannot find
// module" errors. Both functions are safe no-ops until a real transport
// (e.g. the Pulse dashboard at PAI/PULSE/) is wired up to consume them.

export async function pushEventsToTargets(): Promise<void> {
  // no-op: no observability transport configured yet
}

export async function pushStateToTargets(): Promise<void> {
  // no-op: no observability transport configured yet
}
