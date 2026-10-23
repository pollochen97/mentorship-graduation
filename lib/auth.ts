"use client";
// The guestbook's Google sign-in (#55). Only ENG members on the whitelist may write notes; everyone can
// still read them. One state for the whole page, shared by every guestbook's pad:
//   const { member, signIn, signOut, recheck } = useMember();
// Sign-in leaves the site for Google and comes back through /auth/callback, which returns to the
// page the reader was on. In mock mode the state is fake and set with __mock.auth() (lib/mock).
import type { Session } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { fetchMe } from "./api";
import { mockAuth, USE_MOCK, type MockAuth } from "./mock";
import { supabaseAuth } from "./supabase/browser";

/**
 * Whether a signed-in address is on the whitelist: being asked, yes, no, or the question failed (so
 * still unknown). Only "allowed" gets the form; the server checks again on every note anyway.
 */
export type Access = "checking" | "allowed" | "denied" | "error";

export type Member =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; email: string; name: string; access: Access };

/** Where /auth/callback sends the reader back to: the book page they signed in from. */
export const RETURN_KEY = "guestbook-auth-return";

const sailor = { status: "signedIn", email: "sailor@gmail.com", name: "測試學員" } as const;
const MOCK_MEMBERS = {
  none: { status: "signedOut" },
  checking: { ...sailor, access: "checking" },
  error: { ...sailor, access: "error" },
  denied: { status: "signedIn", email: "someone@gmail.com", name: "路人", access: "denied" },
  allowed: { ...sailor, access: "allowed" },
} as const satisfies Record<MockAuth, Member>;

let member: Member = { status: "loading" };
let userId: string | null = null;
const listeners = new Set<() => void>();
let started = false;

function set(next: Member) {
  member = next;
  listeners.forEach((listener) => listener());
}

/** Asks the server whether the session's address is on the whitelist. */
async function check(session: Session) {
  const r = await fetchMe(session.access_token);
  if (userId !== session.user.id) return; // signed out or switched in the meantime
  if (!r.ok && r.error.code === "unauthorized") {
    await supabaseAuth()?.auth.signOut({ scope: "local" });
    return;
  }
  if (member.status !== "signedIn") return;
  set({ ...member, access: !r.ok ? "error" : r.data.allowed ? "allowed" : "denied" });
}

function apply(session: Session | null) {
  if (!session) {
    userId = null;
    set({ status: "signedOut" });
    return;
  }
  // Token refreshes land here too: same user, nothing new to ask.
  if (userId === session.user.id) return;
  userId = session.user.id;
  const meta = session.user.user_metadata as { full_name?: string; name?: string };
  const email = session.user.email ?? "";
  set({
    status: "signedIn",
    email,
    name: meta.full_name || meta.name || email.split("@")[0],
    access: "checking",
  });
  // Not awaited inside onAuthStateChange: calling Supabase from its callback can deadlock.
  setTimeout(() => void check(session));
}

function start() {
  if (started) return;
  started = true;
  if (USE_MOCK) {
    const sync = () => set(MOCK_MEMBERS[mockAuth.get()]);
    mockAuth.subscribe(sync);
    sync();
    return;
  }
  const supabase = supabaseAuth();
  if (!supabase) return set({ status: "signedOut" });
  // Fires INITIAL_SESSION right away with the stored session, then on every sign-in and sign-out.
  supabase.auth.onAuthStateChange((_event, session) => apply(session));
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const SERVER_MEMBER: Member = { status: "loading" };

/** Leaves for Google's sign-in, asking which account to use, and comes back to this page. */
async function signIn() {
  if (USE_MOCK) return mockAuth.set("allowed");
  const supabase = supabaseAuth();
  if (!supabase) return;
  try {
    sessionStorage.setItem(RETURN_KEY, location.hash);
  } catch {
    // Without storage the reader comes back to the cover instead.
  }
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${location.origin}/auth/callback`,
      queryParams: { prompt: "select_account" },
    },
  });
}

/** Signs out on this browser only. */
async function signOut() {
  if (USE_MOCK) return mockAuth.set("none");
  await supabaseAuth()?.auth.signOut({ scope: "local" });
}

/** Asks again whether the account may write: after asking failed, or the server said it may not. */
async function recheck() {
  if (USE_MOCK) {
    if (mockAuth.get() === "error") mockAuth.set("allowed");
    return;
  }
  const { data } = (await supabaseAuth()?.auth.getSession()) ?? { data: { session: null } };
  if (!data.session) return apply(null);
  if (member.status === "signedIn") set({ ...member, access: "checking" });
  await check(data.session);
}

export function useMember() {
  const current = useSyncExternalStore(
    subscribe,
    () => member,
    () => SERVER_MEMBER,
  );
  return { member: current, signIn, signOut, recheck };
}
