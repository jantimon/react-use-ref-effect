import {
  DependencyList,
  useCallback,
  RefCallback,
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
 * A custom hook that merges multiple callback refs into one.
 * @param refs An array of RefCallback<T>
 * @returns A callback that sets the refs
 */
export const useMergeRefs = <T extends unknown>(...refs: RefCallback<T>[]) =>
  useCallback((element: T) => {
    const cleanup = refs
      .map((ref) => ref(element))
      .filter((fn): fn is () => void => typeof fn === 'function');
    if (cleanup.length) {
      return () => {
        cleanup.forEach((fn) => fn());
      };
    }
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
          return element && effect(element);
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
