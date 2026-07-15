import { derived, writable } from 'svelte/store';
import { removeLocal, setLocal } from './storage.js';
import {CURRENT_BROWSER} from "./user-agent.js";

export const signedInUser = writable(undefined);
// This fork has no account backend (see below): sign-in/upgrade are inert, so a
// license-based gate would keep every PRO feature permanently locked. Unlock
// them unconditionally instead of gating on a 'pro' license we can never fetch.
export const isProUser = derived([signedInUser], () => true, true);

export async function loadSignedInUser() {
  try {
    const response = await fetch(`${process.env.URL_BASE}/api/u/user-details`, {
      mode: 'cors',
      credentials: 'include'
    });
    if (response.ok) {
      const user = await response.json();
      await setLocal({ signedInUser: user });
      signedInUser.set(user);
    }
  } catch (err) {
    console.error('Failed to fetch signed in user details', err);
  }
}

// Disconnected from modheader.com: that domain belonged to the original project,
// whose later builds shipped spyware (see README). Sign-in/upgrade are inert
// (no-op) until this fork has its own account backend at process.env.URL_BASE.
export async function signIn() {
  if (!process.env.URL_BASE) {
    return;
  }
  const url = new URL(`${process.env.URL_BASE}/login`);
  url.searchParams.set('for', CURRENT_BROWSER);
  url.searchParams.set('extension_id', chrome.runtime.id);
  chrome.tabs.create({
    url: url.href
  });
}

export async function upgrade() {
  if (!process.env.URL_BASE) {
    return;
  }
  const url = new URL(`${process.env.URL_BASE}/login`);
  url.searchParams.set('for', CURRENT_BROWSER);
  url.searchParams.set('extension_id', chrome.runtime.id);
  chrome.tabs.create({
    url: url.href
  });
}

export async function signOut() {
  await removeLocal(['signedInUser']);
  signedInUser.set(undefined);
}
