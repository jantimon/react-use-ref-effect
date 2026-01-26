/*
 * Based on react-best-merge-refs by Álvaro Cuesta <alvaro-cuesta@GitHub>
 * Licensed under the MIT License (MIT), see
 * http://github.com/alvaro-cuesta/react-best-merge-refs/
 */
import { useRef, type RefCallback, type Ref } from 'react';

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
  ref_: NonNullRef<T>;
  cleanup_: CleanupFn | null;
};

/**
 * Assigns a value to a ref and returns the appropriate cleanup function.
 */
const assignToRef = <T>(ref: NonNullRef<T>, value: T): CleanupFn => {
  if (typeof ref === 'function') {
    const cleanup = ref(value);
    return typeof cleanup === 'function' ? cleanup : () => ref(null);
  } else {
    ref.current = value;
    return () => {
      ref.current = null;
    };
  }
};

/**
 * Runs the cleanup function for a stored ref.
 */
const cleanupStoredRef = <T>(storedRef: StoredRef<T>): void => {
  storedRef.cleanup_?.();
  storedRef.cleanup_ = null;
};

/**
 * Tuple containing a reconciliator function and a stable callback ref.
 */
type MergedCallbackRef<T> = readonly [
  (refs: Array<NonNullRef<T> | null | undefined>) => void,
  RefCallback<T>,
];

/**
 * Creates a merged callback ref with encapsulated state.
 */
const createMergedCallbackRef = <T>(): MergedCallbackRef<T> => {
  const storedRefs: Array<StoredRef<T> | null | undefined> = [];
  /** use a unique symbol to represent not mounted state */
  const NOT_MOUNTED_SYMBOL = {} as unknown as symbol;
  /**
   * Tracks whether the callback ref has been called with a DOM node.
   *
   * Reconciliation runs on every render, including the first render before
   * React calls the callback ref. Without this flag, newly added refs would
   * be assigned an uninitialized value. It also prevents assigning stale
   * values to refs added after unmount.
   */
  let currentValue: T | typeof NOT_MOUNTED_SYMBOL = NOT_MOUNTED_SYMBOL;

  return [
    /**
     * Reconciles stored refs with current refs passed to useMergeRefs
     *
     * This function runs on each render to ensure that:
     * - New refs are initialized with the current value (if any)
     * - Removed refs are cleaned up
     * - Changed refs are cleaned up and re-initialized
     * - Reordered refs are tracked independently
     */
    (refs: Array<NonNullRef<T> | null | undefined>) => {
      const refCount = refs.length;
      for (let i = 0; i < Math.max(refCount, storedRefs.length); i++) {
        const latestRef = refs[i];
        const storedRef = storedRefs[i];
        if (
          // Handle null/undefined refs -> cleanup if needed and unset
          !latestRef ||
          // The ref has not been set yet -> assign
          !storedRef ||
          // Ref is NOT stable -> cleanup and re-assign
          storedRef.ref_ !== latestRef
        ) {
          if (storedRef) {
            cleanupStoredRef(storedRef);
          }
          storedRefs[i] = latestRef && {
            ref_: latestRef,
            cleanup_:
              currentValue !== NOT_MOUNTED_SYMBOL
                ? // Assign only if mounted to avoid assigning stale values
                  // as other currentValue might be uninitialized
                  assignToRef(latestRef, currentValue)
                : null,
          };
        }
      }
      // Clean up any excess stored refs
      storedRefs.length = refCount;
    },
    /** The actual ref - a stable callback ref to return from the hook
     *
     * This function is called by React when the ref is attached or detached
     *
     * This happens when:
     * - The component mounts (with the DOM node)
     * - The component node changes e.g. the ref is moved to another element
     *
     * It returns a cleanup which for React 19+ is called when:
     * - The component unmounts
     * - The ref is detached from the DOM node (e.g. moved to another element)
     */
    (value: T) => {
      currentValue = value;
      for (const storedRef of storedRefs) {
        if (storedRef) {
          storedRef.cleanup_ = storedRef && assignToRef(storedRef.ref_, value);
        }
      }
      return () => {
        currentValue = NOT_MOUNTED_SYMBOL;
        for (const storedRef of storedRefs) {
          if (storedRef) cleanupStoredRef(storedRef);
        }
      };
    },
  ];
};

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
export const useMergeRefs = <T>(
  ...refs: Array<RefCallback<T | null> | Ref<T | null> | null | undefined>
): RefCallback<T> => {
  const ref = useRef<MergedCallbackRef<T> | null>(null);
  const [reconciliate, callbackRef] = (ref.current ??=
    createMergedCallbackRef<T>());
  /**
   * Reconcile on every render to handle:
   * - Refs added: new refs get initialized with current value (if mounted)
   * - Refs removed: old refs get cleaned up
   * - Refs changed: old ref cleaned up, new ref initialized
   * - Refs reordered: each position is tracked independently
   * - Array length changes: shrinking cleans up removed positions
   */
  reconciliate(refs);
  return callbackRef;
};
