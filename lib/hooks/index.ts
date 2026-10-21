// Data hooks for the frontend (#4). They work against the real API or, with NEXT_PUBLIC_USE_MOCK=1,
// against fake data and fake live events (see lib/mock). Try them at /dev/live.
export { useDanmakuStream } from "./useDanmakuStream";
export { useNotes } from "./useNotes";
export { useSettings } from "./useSettings";
