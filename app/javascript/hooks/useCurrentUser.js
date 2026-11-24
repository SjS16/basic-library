import { useState, useEffect } from "react";

let cachedUser = null;
let settled = false;
let inflight = null;
const listeners = new Set();

function fetchCurrentUser() {
  if (!inflight) {
    inflight = fetch("/me.json")
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((user) => {
        cachedUser = user;
        settled = true;
        listeners.forEach((fn) => fn());
        return user;
      });
  }
  return inflight;
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Returns null while loading (and when signed out), then
// { email_address, owner, borrower_id }. borrower_id is null when the
// account is not linked to a borrower record.
export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState(cachedUser);

  useEffect(() => {
    if (settled) {
      setCurrentUser(cachedUser);
      return;
    }
    const unsubscribe = subscribe(() => setCurrentUser(cachedUser));
    fetchCurrentUser();
    return unsubscribe;
  }, []);

  return currentUser;
}

// True once the who-am-I check has finished, so menus can tell
// "still loading" apart from "definitely signed out".
export function useCurrentUserLoaded() {
  const [loaded, setLoaded] = useState(settled);

  useEffect(() => {
    if (settled) {
      setLoaded(true);
      return;
    }
    const unsubscribe = subscribe(() => setLoaded(true));
    fetchCurrentUser();
    return unsubscribe;
  }, []);

  return loaded;
}
