/**
 * firebase.ts — offline-only stub
 * Firebase SDK is NOT included in the bundle.
 * All exports are null / no-op stubs so that the rest of the codebase
 * (which guards on IS_FIREBASE_ENABLED) compiles without changes.
 */

/** Always false in this offline-only build — no Firebase SDK is loaded. */
export const IS_FIREBASE_ENABLED = false as const;

// ─── Null stubs — referenced by legacy imports but never called at runtime ──

export const app    = null;
export const auth   = null;
export const db     = null;
export const storage = null;

export const signInWithGoogle = async (): Promise<never> => {
  throw new Error('Firebase is disabled in offline build.');
};

export const signOut = async (): Promise<void> => {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onAuthStateChanged = (_a: null, _cb: any): (() => void) => () => {};

export const getFirebaseMessaging = async () => null;
