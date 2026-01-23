/*!
Based on react-best-merge-refs by Álvaro Cuesta <alvaro-cuesta@GitHub>
Licensed under the MIT License (MIT), see
http://github.com/alvaro-cuesta/react-best-merge-refs/
*/

import { useRef, type RefCallback, type Ref } from 'react';

/**
 * A type that might or might not contain a value.
 */
type Maybe<T> = { hasValue: true; value: T } | { hasValue: false };

/**
 * A cleanup function returned from a RefCallback.
 */
type CleanupFn = () => void;

/**
 * A React Ref with `null` removed.
 */
type NonNullRef<T> = Exclude<Ref<T>, null>;

/**
 * A NonNullRef with an associated cleanup function that has been stored after
 * assigning to it, or `null` if it has not been assigned yet.
 */
type StoredRef<T> = {
  ref: NonNullRef<T>;
  cleanup: CleanupFn | null;
};

/**
 * Assigns a value to a ref and returns the appropriate cleanup function.
 */
function assignToRef<T>(ref: NonNullRef<T>, value: T): CleanupFn {
  if (typeof ref === 'function') {
    const cleanup = ref(value);
    return typeof cleanup === 'function' ? cleanup : () => ref(null);
  } else {
    ref.current = value;
    return () => {
      ref.current = null;
    };
  }
}

/**
 * Assigns a value to a stored ref, updating its cleanup function.
 */
function assignToStoredRef<T>(storedRef: StoredRef<T>, value: T): void {
  storedRef.cleanup = assignToRef(storedRef.ref, value);
}

/**
 * Runs the cleanup function for a stored ref.
 */
function cleanupStoredRef<T>(storedRef: StoredRef<T>): void {
  storedRef.cleanup?.();
  storedRef.cleanup = null;
}

/**
 * Creates a new StoredRef, optionally initializing it with a value.
 */
function makeStoredRef<T>(
  ref: NonNullRef<T>,
  maybeValue: Maybe<T>
): StoredRef<T> {
  return {
    ref,
    cleanup: maybeValue.hasValue ? assignToRef(ref, maybeValue.value) : null,
  };
}

/**
 * Reconciles the stored refs with the new refs array, only updating refs that changed.
 */
function reconciliateRefs<T>(
  storedRefs: Array<StoredRef<T> | null>,
  refs: Array<NonNullRef<T> | null | undefined>,
  maybeValue: Maybe<T>
): void {
  // Ensure storedRefs array is the right length
  while (storedRefs.length < refs.length) {
    storedRefs.push(null);
  }
  while (storedRefs.length > refs.length) {
    const removed = storedRefs.pop();
    if (removed) cleanupStoredRef(removed);
  }

  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    const storedRef = storedRefs[i];

    // Handle null/undefined refs
    if (ref == null) {
      if (storedRef) {
        cleanupStoredRef(storedRef);
        storedRefs[i] = null;
      }
      continue;
    }

    // No stored ref yet - create one
    if (!storedRef) {
      storedRefs[i] = makeStoredRef(ref, maybeValue);
      continue;
    }

    // Ref is stable - do nothing
    if (storedRef.ref === ref) continue;

    // Same index but different ref - cleanup old and store new
    cleanupStoredRef(storedRef);
    storedRefs[i] = makeStoredRef(ref, maybeValue);
  }
}

/**
 * A custom hook that merges multiple callback refs and ref objects into one.
 *
 * All refs will see updates as if they were the only ref passed to the `ref` prop,
 * completely matching the original React behavior:
 *
 * - Once the DOM node is available each ref will be updated accordingly.
 * - Once the DOM node is removed each ref will be cleaned up.
 * - If a new ref is added and the component already had a DOM node, it will be
 *   initialized accordingly. Other already-existing refs will not be updated.
 * - If a ref is removed it will be cleaned up. Other already-existing refs will
 *   not be cleaned up.
 *
 * @param refs Refs to merge (RefCallback, RefObject, null, or undefined)
 * @returns A callback ref that can be passed to a React `ref` prop
 */
export function useMergeRefs<T>(
  ...refs: Array<RefCallback<T | null> | Ref<T | null> | null | undefined>
): RefCallback<T> {
  const storedRefsRef = useRef<Array<StoredRef<T> | null>>([]);
  const storedMaybeValueRef = useRef<Maybe<T>>({ hasValue: false });

  reconciliateRefs(storedRefsRef.current, refs, storedMaybeValueRef.current);

  // This callback is always stable, ensuring React only calls us on actual element changes
  const callbackRef = useRef<RefCallback<T>>(null);
  callbackRef.current ??= (value: T) => {
    storedMaybeValueRef.current = { hasValue: true, value };

    for (const storedRef of storedRefsRef.current) {
      if (storedRef) assignToStoredRef(storedRef, value);
    }

    return () => {
      storedMaybeValueRef.current = { hasValue: false };

      for (const storedRef of storedRefsRef.current) {
        if (storedRef) cleanupStoredRef(storedRef);
      }
    };
  };

  return callbackRef.current;
}
