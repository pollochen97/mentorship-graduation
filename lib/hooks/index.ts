// Data hooks for the frontend (#4). They work against the real API or, with NEXT_PUBLIC_USE_MOCK=1,
// against fake data and fake live events (see lib/mock). Try them at /dev/live.
// Only the projector subscribes to Realtime (spec 3.5): pass `{ live: isProjector }` to useNotes and
// useSettings, and mount useDanmakuStream only on the projector. Without it nothing opens a connection.
export { useDanmakuStream } from "./useDanmakuStream";
export { useNotes } from "./useNotes";
export { useSettings } from "./useSettings";
