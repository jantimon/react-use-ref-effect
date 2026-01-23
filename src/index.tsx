import {
  DependencyList,
  useCallback,
  RefCallback,
  RefObject,
  useRef,
  useMemo,
} from 'react';

/**
 * `useRefEffect` returns a RefCallback to be connected with a DOM Node.
 *
 * The returned object will persist for the full lifetime of the component.
 * Accepts a function that contains imperative, possibly effectful code.
 *
 * @param effect Imperative function that can return a cleanup function
 * @param deps Optional array of dependencies which trigger the effect - defaults to []
 */
export const useRefEffect = <T extends unknown>(
  effect: (element: T) => void | (() => void),
  dependencies: DependencyList = []
) =>
  useCallback(
    (element: T) => (element && effect(element)) || (() => {}),
    dependencies
  ) as RefCallback<T>;

/**
 * A custom hook that merges multiple callback refs and ref objects into one.
 * @param refs An array of RefCallback<T>, RefObject<T>, null, or undefined
 * @returns A callback that sets all refs
 */
export const useMergeRefs = <T extends unknown>(
  ...refs: Array<RefCallback<T | null> | RefObject<T | null> | null | undefined>
) =>
  useCallback((element: T) => {
    const cleanups = refs.map((ref) => {
      if (typeof ref === 'function') {
        // Callback ref without cleanup expects null on unmount
        return ref(element) || (() => ref(null));
      } else if (ref) {
        // RefObject - set current and return cleanup
        ref.current = element;
        return () => {
          ref.current = null;
        };
      }
      // null/undefined ref - no-op
      return () => {};
    });
    return () => cleanups.forEach((fn) => fn());
  }, refs) as RefCallback<T>;

/**
 * `useRefEffect` returns a RefCallback to be connected with a DOM Node.
 *
 * The returned object will persist for the full lifetime of the component.
 * Accepts a function that contains imperative, possibly effectful code.
 *
 * @param effect Imperative function that can return a cleanup function
 * @param deps Optional array of dependencies which trigger the effect - defaults to []
 *
 * @returns A RefCallback with a `current` property that holds the last element
 */
export const useRefEffectWithCurrent = <T extends unknown>(
  effect: (element: T) => void | (() => void),
  dependencies: DependencyList = []
) => {
  const currentRef = useRef<T | null>(null);
  return useMemo(
    () =>
      Object.defineProperties(
        (element: T) => {
          currentRef.current = element;
          const cleanup = element && effect(element);
          return () => {
            if (cleanup) {
              cleanup();
            }
            currentRef.current = null;
          };
        },
        {
          current: {
            get: () => currentRef.current,
          },
        }
      ),
    dependencies
  ) as RefCallback<T> & { current: T | null };
};
