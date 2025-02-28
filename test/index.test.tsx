import * as React from 'react';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useRefEffect } from '../src';
import { act } from 'react-dom/test-utils';
import { describe, expect, it } from 'vitest';

// Helper function to replace Simulate.click
function simulateClick(element: Element) {
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    button: 0
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
      const ref = useRefEffect(element => {
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
      const ref = useRefEffect(newElement => {
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
      const ref = useRefEffect<HTMLElement>(newElement => {
        elementName = newElement.tagName;
        effectRuns++;
        return () => {
          elementName = '';
          cleanupRuns++;
        };
      }, [counter]);
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
      const ref = useRefEffect<HTMLElement>(newElement => {
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

  it("works in strict mode", () => {
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
      return (
        <button ref={ref}>
          Demo
        </button>
      );
    };

    act(() => {
      createRoot(div).render(<StrictMode><Demo /></StrictMode>);
    });
    expect(cleanupRuns).toBe(1);
    expect(effectRuns).toBe(2);
  });
});