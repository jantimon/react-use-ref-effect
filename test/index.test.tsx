import * as React from 'react';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useMergeRefs, useRefEffect, useRefEffectWithCurrent } from '../src';
import { act } from 'react';
import { describe, expect, it } from 'vitest';

// Helper function to replace Simulate.click
function simulateClick(element: Element) {
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    button: 0,
  });
  element.dispatchEvent(clickEvent);
}

describe('it', () => {
  it('executes effect on render', () => {
    const div = document.createElement('div');
    let effectRuns = 0;
    const Demo = () => {
      const ref = useRefEffect(() => {
        effectRuns++;
      }, []);
      return <div ref={ref}>Demo</div>;
    };
    expect(effectRuns).toBe(0);
    const root = createRoot(div);
    act(() => root.render(<Demo />));
    act(() => root.unmount());
    expect(effectRuns).toBe(1);
  });

  it('passes in the html element', () => {
    const div = document.createElement('div');
    let effectElement: any = null;
    const Demo = () => {
      const ref = useRefEffect((element) => {
        effectElement = element;
      }, []);
      return (
        <a ref={ref} href="/">
          Demo
        </a>
      );
    };
    const root = createRoot(div);
    act(() => root.render(<Demo />));
    act(() => root.unmount());
    expect(effectElement instanceof HTMLAnchorElement).toBe(true);
  });

  it('executes cleanup on unmount', () => {
    const div = document.createElement('div');
    let cleanupRuns = 0;
    const Demo = () => {
      const ref = useRefEffect(() => {
        return () => {
          cleanupRuns++;
        };
      }, []);
      return <div ref={ref}>Demo</div>;
    };
    const root = createRoot(div);
    act(() => root.render(<Demo />));
    expect(cleanupRuns).toBe(0);
    act(() => root.unmount());
    expect(cleanupRuns).toBe(1);
  });

  it('executes cleanup on unmount', () => {
    const div = document.createElement('div');
    let cleanupRuns = 0;
    const Demo = () => {
      const ref = useRefEffect(() => {
        return () => {
          cleanupRuns++;
        };
      }, []);
      return <div ref={ref}>Demo</div>;
    };
    const root = createRoot(div);
    act(() => root.render(<Demo />));
    expect(cleanupRuns).toBe(0);
    root.render(<React.Fragment />);
    act(() => root.unmount());
    expect(cleanupRuns).toBe(1);
  });

  it('executes effect on dependency change', () => {
    const div = document.createElement('div');
    let effectRuns = 0;
    let cleanupRuns = 0;
    const Demo = () => {
      const [counter, setCounter] = useState(0);
      const ref = useRefEffect(() => {
        effectRuns++;
        return () => {
          cleanupRuns++;
        };
      }, [counter]);
      return (
        <button ref={ref} onClick={() => setCounter(counter + 1)}>
          Demo
        </button>
      );
    };
    const root = createRoot(div);
    act(() => root.render(<Demo />));
    expect(effectRuns).toBe(1);
    expect(cleanupRuns).toBe(0);
    act(() => {
      simulateClick(div.querySelector<HTMLButtonElement>('button')!);
    });
    expect(effectRuns).toBe(2);
    expect(cleanupRuns).toBe(1);
    act(() => root.unmount());
    expect(effectRuns).toBe(2);
    expect(cleanupRuns).toBe(2);
  });

  it('executes effect on dom change', () => {
    const div = document.createElement('div');
    let effectRuns = 0;
    let cleanupRuns = 0;
    let element: any = {};
    const Demo = () => {
      const [counter, setCounter] = useState(0);
      const ref = useRefEffect((newElement) => {
        element = newElement;
        effectRuns++;
        return () => {
          cleanupRuns++;
        };
      }, []);
      return (
        <>
          {counter > 0 && <span ref={ref}>{counter}</span>}
          <button onClick={() => setCounter(counter + 1)}>Demo</button>
        </>
      );
    };
    const root = createRoot(div);
    act(() => root.render(<Demo />));
    expect(effectRuns).toBe(0);
    expect(cleanupRuns).toBe(0);
    act(() => {
      simulateClick(div.querySelector<HTMLButtonElement>('button')!);
    });
    expect(effectRuns).toBe(1);
    expect(cleanupRuns).toBe(0);
    expect(element.tagName).toBe('SPAN');
    act(() => root.unmount());
    expect(effectRuns).toBe(1);
    expect(cleanupRuns).toBe(1);
  });

  it('executes effect on dom or on dependency change', () => {
    const div = document.createElement('div');
    let effectRuns = 0;
    let cleanupRuns = 0;
    let elementName = '';
    const Demo = () => {
      const [counter, setCounter] = useState(0);
      const ref = useRefEffect<HTMLElement>(
        (newElement) => {
          elementName = newElement.tagName;
          effectRuns++;
          return () => {
            elementName = '';
            cleanupRuns++;
          };
        },
        [counter]
      );
      return (
        <>
          {counter > 0 && <span ref={ref}>{counter}</span>}
          <button onClick={() => setCounter(counter + 1)}>Demo</button>
        </>
      );
    };
    const root = createRoot(div);
    act(() => root.render(<Demo />));
    expect(effectRuns).toBe(0);
    expect(cleanupRuns).toBe(0);
    console.log('click');
    act(() => {
      simulateClick(div.querySelector<HTMLButtonElement>('button')!);
    });
    expect(effectRuns).toBe(1);
    expect(elementName).toBe('SPAN');
    expect(cleanupRuns).toBe(0);
    act(() => {
      simulateClick(div.querySelector<HTMLButtonElement>('button')!);
    });
    expect(effectRuns).toBe(2);
    expect(cleanupRuns).toBe(1);
    act(() => root.unmount());
    expect(effectRuns).toBe(2);
    expect(cleanupRuns).toBe(2);
  });

  it('executes effect on ref target change', () => {
    const div = document.createElement('div');
    let elementName: string = '';
    const Demo = () => {
      const [counter, setCounter] = useState(0);
      const ref = useRefEffect<HTMLElement>((newElement) => {
        elementName = newElement.tagName;
        return () => {
          elementName = '';
        };
      }, []);
      return (
        <>
          {counter === 0 ? (
            <h1 ref={ref}>Click the button</h1>
          ) : (
            <span ref={ref}>{counter}</span>
          )}
          <button onClick={() => setCounter(counter + 1)}>Demo</button>
        </>
      );
    };
    expect(elementName).toBe('');
    const root = createRoot(div);
    act(() => root.render(<Demo />));
    expect(elementName).toBe('H1');
    act(() => {
      simulateClick(div.querySelector<HTMLButtonElement>('button')!);
    });
    expect(elementName).toBe('SPAN');
    act(() => root.unmount());
    expect(elementName).toBe('');
  });

  it('works in strict mode', () => {
    const div = document.createElement('div');
    let effectRuns = 0;
    let cleanupRuns = 0;
    const Demo = () => {
      const ref = useRefEffect(() => {
        effectRuns++;
        return () => {
          cleanupRuns++;
        };
      }, []);
      return <button ref={ref}>Demo</button>;
    };

    act(() => {
      createRoot(div).render(
        <StrictMode>
          <Demo />
        </StrictMode>
      );
    });
    expect(cleanupRuns).toBe(1);
    expect(effectRuns).toBe(2);
  });
});

describe('useMergeRefs', () => {
  it('calls all refs with the element', () => {
    const div = document.createElement('div');
    let ref1Called = false;
    let ref2Called = false;
    let ref1Element: any = null;
    let ref2Element: any = null;

    const Demo = () => {
      const ref1 = useRefEffect((element) => {
        ref1Called = true;
        ref1Element = element;
      }, []);

      const ref2 = useRefEffect((element) => {
        ref2Called = true;
        ref2Element = element;
      }, []);

      const mergedRef = useMergeRefs(ref1, ref2);

      return <div ref={mergedRef}>Test</div>;
    };

    const root = createRoot(div);
    act(() => root.render(<Demo />));

    expect(ref1Called).toBe(true);
    expect(ref2Called).toBe(true);
    expect(ref1Element instanceof HTMLDivElement).toBe(true);
    expect(ref2Element instanceof HTMLDivElement).toBe(true);
    expect(ref1Element).toBe(ref2Element); // Both refs should point to the same element

    act(() => root.unmount());
  });

  it('executes cleanup functions from all refs on unmount', () => {
    const div = document.createElement('div');
    let cleanup1Run = false;
    let cleanup2Run = false;

    const Demo = () => {
      const ref1 = useRefEffect(() => {
        return () => {
          cleanup1Run = true;
        };
      }, []);

      const ref2 = useRefEffect(() => {
        return () => {
          cleanup2Run = true;
        };
      }, []);

      const mergedRef = useMergeRefs(ref1, ref2);

      return <div ref={mergedRef}>Test</div>;
    };

    const root = createRoot(div);
    act(() => root.render(<Demo />));

    expect(cleanup1Run).toBe(false);
    expect(cleanup2Run).toBe(false);

    act(() => root.unmount());

    expect(cleanup1Run).toBe(true);
    expect(cleanup2Run).toBe(true);
  });

  it('handles updates to the DOM element', () => {
    const div = document.createElement('div');
    let ref1Elements: any[] = [];
    let ref2Elements: any[] = [];

    const Demo = ({ showSpan = false }) => {
      const ref1 = useRefEffect((element) => {
        ref1Elements.push(element);
      }, []);

      const ref2 = useRefEffect((element) => {
        ref2Elements.push(element);
      }, []);

      const mergedRef = useMergeRefs(ref1, ref2);

      return showSpan ? (
        <span ref={mergedRef}>Test</span>
      ) : (
        <div ref={mergedRef}>Test</div>
      );
    };

    const root = createRoot(div);
    act(() => root.render(<Demo />));

    expect(ref1Elements.length).toBe(1);
    expect(ref2Elements.length).toBe(1);
    expect(ref1Elements[0] instanceof HTMLDivElement).toBe(true);
    expect(ref2Elements[0] instanceof HTMLDivElement).toBe(true);

    // Change the element type to span
    act(() => root.render(<Demo showSpan={true} />));

    expect(ref1Elements.length).toBe(2);
    expect(ref2Elements.length).toBe(2);
    expect(ref1Elements[1] instanceof HTMLSpanElement).toBe(true);
    expect(ref2Elements[1] instanceof HTMLSpanElement).toBe(true);

    act(() => root.unmount());
  });

  it('works with strict mode', () => {
    const div = document.createElement('div');
    let ref1CallCount = 0;
    let ref2CallCount = 0;
    let cleanup1Count = 0;
    let cleanup2Count = 0;

    const Demo = () => {
      const ref1 = useRefEffect(() => {
        ref1CallCount++;
        return () => {
          cleanup1Count++;
        };
      }, []);

      const ref2 = useRefEffect(() => {
        ref2CallCount++;
        return () => {
          cleanup2Count++;
        };
      }, []);

      const mergedRef = useMergeRefs(ref1, ref2);

      return <div ref={mergedRef}>Test</div>;
    };

    act(() => {
      createRoot(div).render(
        <React.StrictMode>
          <Demo />
        </React.StrictMode>
      );
    });

    // In strict mode, effects run twice
    expect(ref1CallCount).toBe(2);
    expect(ref2CallCount).toBe(2);
    expect(cleanup1Count).toBe(1);
    expect(cleanup2Count).toBe(1);
  });

  it('works with useRefEffectWithCurrent', () => {
    const div = document.createElement('div');
    let ref1CallCount = 0;
    let ref2CallCount = 0;
    let cleanup1Count = 0;
    let cleanup2Count = 0;

    const Demo = () => {
      const ref1 = useRefEffectWithCurrent(() => {
        ref1CallCount++;
        return () => {
          cleanup1Count++;
        };
      }, []);

      const ref2 = useRefEffect(() => {
        ref2CallCount++;
        return () => {
          cleanup2Count++;
        };
      }, []);

      const mergedRef = useMergeRefs(ref1, ref2);

      return <div ref={mergedRef}>Test</div>;
    };

    act(() => {
      createRoot(div).render(
        <React.StrictMode>
          <Demo />
        </React.StrictMode>
      );
    });

    // In strict mode, effects run twice
    expect(ref1CallCount).toBe(2);
    expect(ref2CallCount).toBe(2);
    expect(cleanup1Count).toBe(1);
    expect(cleanup2Count).toBe(1);
  });

  it('calls callback refs without cleanup with null on unmount', () => {
    const div = document.createElement('div');
    const calls: Array<HTMLDivElement | null> = [];

    const Demo = () => {
      // Callback ref without cleanup return expects null call on unmount
      const callbackRef = React.useCallback((node: HTMLDivElement | null) => {
        calls.push(node);
      }, []);

      const mergedRef = useMergeRefs(callbackRef);
      return <div ref={mergedRef}>Test</div>;
    };

    const root = createRoot(div);
    act(() => root.render(<Demo />));

    expect(calls.length).toBe(1);
    expect(calls[0] instanceof HTMLDivElement).toBe(true);

    act(() => root.unmount());

    // Callback ref without cleanup should be called with null on unmount
    expect(calls.length).toBe(2);
    expect(calls[1]).toBe(null);
  });

  it('handles callback refs with and without cleanup together', () => {
    const div = document.createElement('div');
    const noCleanupCalls: Array<HTMLDivElement | null> = [];
    let cleanupFnCalled = false;

    const Demo = () => {
      const noCleanupRef = React.useCallback((node: HTMLDivElement | null) => {
        noCleanupCalls.push(node);
      }, []);

      const withCleanupRef = useRefEffect<HTMLDivElement>(() => {
        return () => {
          cleanupFnCalled = true;
        };
      }, []);

      const mergedRef = useMergeRefs(noCleanupRef, withCleanupRef);
      return <div ref={mergedRef}>Test</div>;
    };

    const root = createRoot(div);
    act(() => root.render(<Demo />));

    act(() => root.unmount());

    // Both cleanup mechanisms should work
    expect(noCleanupCalls[1]).toBe(null);
    expect(cleanupFnCalled).toBe(true);
  });

  it('handles empty refs array', () => {
    const div = document.createElement('div');

    const Demo = () => {
      const mergedRef = useMergeRefs();
      return <div ref={mergedRef}>Test</div>;
    };

    const root = createRoot(div);
    // Should not throw
    act(() => root.render(<Demo />));
    act(() => root.unmount());
  });

  it('works with RefObject (useRef)', () => {
    const div = document.createElement('div');
    let refObjectValue: HTMLDivElement | null = null;
    let callbackCalled = false;

    const Demo = () => {
      const refObject = React.useRef<HTMLDivElement>(null);
      const callbackRef = useRefEffect<HTMLDivElement>(() => {
        callbackCalled = true;
      }, []);

      const mergedRef = useMergeRefs(refObject, callbackRef);

      // Capture ref value after render
      React.useEffect(() => {
        refObjectValue = refObject.current;
      });

      return <div ref={mergedRef}>Test</div>;
    };

    const root = createRoot(div);
    act(() => root.render(<Demo />));

    expect(refObjectValue).not.toBe(null);
    expect(callbackCalled).toBe(true);

    act(() => root.unmount());
  });

  it('merges useRef + useCallback (without cleanup) + useCallback (with cleanup)', () => {
    const div = document.createElement('div');

    // Track values for useRef
    let refObject: React.RefObject<HTMLDivElement | null> = { current: null };

    // Track values for useCallback without cleanup
    const callbackWithoutCleanupCalls: Array<HTMLDivElement | null> = [];

    // Track values for useCallback with cleanup
    let callbackWithCleanupElement: HTMLDivElement | null = null;
    let cleanupCalled = false;

    const Demo = () => {
      // 1. useRef (RefObject)
      refObject = React.useRef<HTMLDivElement>(null);

      // 2. useCallback without cleanup (traditional callback ref)
      const callbackWithoutCleanup = React.useCallback(
        (node: HTMLDivElement | null) => {
          callbackWithoutCleanupCalls.push(node);
        },
        []
      );

      // 3. useCallback with cleanup (useRefEffect)
      const callbackWithCleanup = useRefEffect<HTMLDivElement>((element) => {
        callbackWithCleanupElement = element;
        return () => {
          cleanupCalled = true;
        };
      }, []);

      const mergedRef = useMergeRefs(
        refObject,
        callbackWithoutCleanup,
        callbackWithCleanup
      );

      return <div ref={mergedRef}>Test</div>;
    };

    const root = createRoot(div);
    act(() => root.render(<Demo />));

    // After mount: all refs should have the element
    expect(refObject.current instanceof HTMLDivElement).toBe(true);
    expect(callbackWithoutCleanupCalls.length).toBe(1);
    expect(callbackWithoutCleanupCalls[0] instanceof HTMLDivElement).toBe(true);
    expect(callbackWithCleanupElement).not.toBe(null);

    // All should reference the same element
    expect(refObject.current).toBe(callbackWithoutCleanupCalls[0]);
    expect(refObject.current).toBe(callbackWithCleanupElement);

    // Cleanup should not have been called yet
    expect(cleanupCalled).toBe(false);

    act(() => root.unmount());

    // After unmount:
    // - RefObject should be null
    expect(refObject.current).toBe(null);

    // - Callback without cleanup should have been called with null
    expect(callbackWithoutCleanupCalls.length).toBe(2);
    expect(callbackWithoutCleanupCalls[1]).toBe(null);

    // - Callback with cleanup should have had its cleanup function called
    expect(cleanupCalled).toBe(true);
  });

  it('clears RefObject on unmount', () => {
    const div = document.createElement('div');
    let refObject: React.RefObject<HTMLDivElement | null> = { current: null };

    const Demo = () => {
      refObject = React.useRef<HTMLDivElement>(null);
      const mergedRef = useMergeRefs(refObject);
      return <div ref={mergedRef}>Test</div>;
    };

    const root = createRoot(div);
    act(() => root.render(<Demo />));

    expect(refObject.current instanceof HTMLDivElement).toBe(true);

    act(() => root.unmount());

    expect(refObject.current).toBe(null);
  });

  it('handles null refs gracefully', () => {
    const div = document.createElement('div');
    let callbackCalled = false;

    const Demo = () => {
      const callbackRef = useRefEffect<HTMLDivElement>(() => {
        callbackCalled = true;
      }, []);

      const mergedRef = useMergeRefs(null, callbackRef, undefined);
      return <div ref={mergedRef}>Test</div>;
    };

    const root = createRoot(div);
    // Should not throw
    act(() => root.render(<Demo />));

    expect(callbackCalled).toBe(true);

    act(() => root.unmount());
  });

  it('handles conditional refs', () => {
    const div = document.createElement('div');
    let refObjectValue: HTMLDivElement | null = null;

    const Demo = ({ includeRef = false }: { includeRef?: boolean }) => {
      const refObject = React.useRef<HTMLDivElement>(null);
      const conditionalRef = includeRef ? refObject : null;

      const mergedRef = useMergeRefs(conditionalRef);

      React.useEffect(() => {
        refObjectValue = refObject.current;
      });

      return <div ref={mergedRef}>Test</div>;
    };

    const root = createRoot(div);

    // With null ref
    act(() => root.render(<Demo includeRef={false} />));
    expect(refObjectValue).toBe(null);

    // With actual ref
    act(() => root.render(<Demo includeRef={true} />));
    expect(refObjectValue).not.toBe(null);

    act(() => root.unmount());
  });
});

describe('useRefEffectWithCurrent', () => {
  it('maintains current property that references the DOM element', () => {
    const div = document.createElement('div');
    let controlRef: {
      current: HTMLDivElement | null;
    } = {
      current: null,
    };

    const Demo = () => {
      const ref = useRefEffectWithCurrent<HTMLDivElement>((element) => {
        // The effect itself doesn't need to do anything special
      }, []);
      controlRef = ref;
      return <div ref={ref}>Test</div>;
    };

    const root = createRoot(div);
    act(() => root.render(<Demo />));

    // Check that the current property is correctly set
    expect(controlRef.current instanceof HTMLDivElement).toBe(true);

    act(() => root.unmount());

    // Check that current is null after unmount
    expect(controlRef.current).toBe(null);
  });

  it('maintains current property when dependencies change', () => {
    const div = document.createElement('div');
    let effectRuns = 0;
    let controlRef: {
      current: HTMLDivElement | null;
    } = {
      current: null,
    };

    const Demo = () => {
      const [count, setCount] = useState(0);
      const ref = useRefEffectWithCurrent<HTMLDivElement>(
        (element) => {
          effectRuns++;
          // The effect should run on dependency changes
        },
        [count]
      );

      controlRef = ref;

      return (
        <>
          <div ref={ref}>Test {count}</div>
          <button onClick={() => setCount(count + 1)}>Increment</button>
        </>
      );
    };

    const root = createRoot(div);
    act(() => root.render(<Demo />));

    // Initial render
    expect(controlRef.current instanceof HTMLDivElement).toBe(true);
    expect(effectRuns).toBe(1);

    const initialElement = controlRef.current;

    // Update the count dependency
    act(() => {
      simulateClick(div.querySelector<HTMLButtonElement>('button')!);
    });

    // Effect should run again, but current should still reference the same DOM element
    expect(effectRuns).toBe(2);
    expect(controlRef.current).toBe(initialElement);
    expect(controlRef.current instanceof HTMLDivElement).toBe(true);

    act(() => root.unmount());
  });

  it('properly updates current when element changes, not just dependencies', () => {
    const div = document.createElement('div');
    let controlRef = null as {
      current: HTMLDivElement | null;
    } | null;

    const Demo = () => {
      const [showAlt, setShowAlt] = useState(false);
      const [count, setCount] = useState(0);

      // Create ref with dependencies
      const ref = useRefEffectWithCurrent<HTMLElement>(
        (element) => {},
        [count]
      );

      controlRef ||= ref as {
        current: HTMLDivElement | null;
      };

      return (
        <>
          {!showAlt ? (
            <div ref={ref} data-testid="first">
              First Element {count}
            </div>
          ) : (
            <span ref={ref} data-testid="second">
              Second Element {count}
            </span>
          )}
          <button onClick={() => setCount((c) => c + 1)}>Update Count</button>
          <button onClick={() => setShowAlt(true)}>Switch Element</button>
        </>
      );
    };

    const root = createRoot(div);
    act(() => root.render(<Demo />));
    const [updateButton, switchButton] = div.querySelectorAll('button');
    if (!controlRef) {
      throw new Error('controlRef was not set');
    }

    // Initial render
    expect(controlRef.current instanceof HTMLDivElement).toBe(true);
    expect(controlRef.current?.getAttribute('data-testid')).toBe('first');

    // Update dependency but keep same element
    act(() => {
      simulateClick(updateButton);
    });

    // Should still point to the same element after dependency change
    expect(controlRef.current instanceof HTMLDivElement).toBe(true);
    expect(controlRef.current?.getAttribute('data-testid')).toBe('first');

    // Now change the element type
    act(() => {
      simulateClick(switchButton);
    });

    // After element change, current should point to the new element
    expect(controlRef.current instanceof HTMLSpanElement).toBe(true);
    expect(controlRef.current?.getAttribute('data-testid')).toBe('second');

    act(() => root.unmount());
  });

  it('properly resets current when element unounts', () => {
    const div = document.createElement('div');
    let controlRef = null as {
      current: HTMLDivElement | null;
    } | null;

    const Demo = () => {
      const [show, setShow] = useState(true);

      // Create ref with dependencies
      const ref = useRefEffectWithCurrent<HTMLElement>((element) => {}, []);

      controlRef ||= ref as {
        current: HTMLDivElement | null;
      };

      return (
        <>
          {show && (
            <div ref={ref} data-testid="element">
              Element
            </div>
          )}
          <button onClick={() => setShow(false)}>Hide Element</button>
        </>
      );
    };

    const root = createRoot(div);
    act(() => root.render(<Demo />));
    const [hideButton] = div.querySelectorAll('button');
    if (!controlRef) {
      throw new Error('controlRef was not set');
    }

    // Initial render
    expect(controlRef.current instanceof HTMLDivElement).toBe(true);
    expect(controlRef.current?.getAttribute('data-testid')).toBe('element');

    // Update dependency but keep same element
    act(() => {
      simulateClick(hideButton);
    });

    // Should still point to the same element after dependency change
    expect(controlRef.current).toBe(null);

    act(() => root.unmount());
  });
});
