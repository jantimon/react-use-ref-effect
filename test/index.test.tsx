import * as React from 'react';
import { useState } from 'react';
import * as ReactDOM from 'react-dom';
import { useRefEffect } from '../src';
import { act, Simulate } from 'react-dom/test-utils';

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
    ReactDOM.render(<Demo />, div);
    ReactDOM.unmountComponentAtNode(div);
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
    ReactDOM.render(<Demo />, div);
    ReactDOM.unmountComponentAtNode(div);
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
    ReactDOM.render(<Demo />, div);
    expect(cleanupRuns).toBe(0);
    ReactDOM.unmountComponentAtNode(div);
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
    ReactDOM.render(<Demo />, div);
    expect(cleanupRuns).toBe(0);
    ReactDOM.render(<React.Fragment />, div);
    ReactDOM.unmountComponentAtNode(div);
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
    ReactDOM.render(<Demo />, div);
    expect(effectRuns).toBe(1);
    expect(cleanupRuns).toBe(0);
    act(() => {
      Simulate.click(div.querySelector<HTMLButtonElement>('button')!);
    });
    expect(effectRuns).toBe(2);
    expect(cleanupRuns).toBe(1);
    ReactDOM.unmountComponentAtNode(div);
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
    ReactDOM.render(<Demo />, div);
    expect(effectRuns).toBe(0);
    expect(cleanupRuns).toBe(0);
    act(() => {
      Simulate.click(div.querySelector<HTMLButtonElement>('button')!);
    });
    expect(effectRuns).toBe(1);
    expect(cleanupRuns).toBe(0);
    expect(element.tagName).toBe('SPAN');
    ReactDOM.unmountComponentAtNode(div);
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
    ReactDOM.render(<Demo />, div);
    expect(effectRuns).toBe(0);
    expect(cleanupRuns).toBe(0);
    console.log('click');
    act(() => {
      Simulate.click(div.querySelector<HTMLButtonElement>('button')!);
    });
    expect(effectRuns).toBe(1);
    expect(elementName).toBe('SPAN');
    expect(cleanupRuns).toBe(0);
    act(() => {
      Simulate.click(div.querySelector<HTMLButtonElement>('button')!);
    });
    expect(effectRuns).toBe(2);
    expect(cleanupRuns).toBe(1);
    ReactDOM.unmountComponentAtNode(div);
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
    ReactDOM.render(<Demo />, div);
    expect(elementName).toBe('H1');
    act(() => {
      Simulate.click(div.querySelector<HTMLButtonElement>('button')!);
    });
    expect(elementName).toBe('SPAN');
    ReactDOM.unmountComponentAtNode(div);
    expect(elementName).toBe('');
  });

  it('executes effect on manual setting', () => {
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
        <button onClick={() => { ref.current = div }}>
          Demo
        </button>
      );
    };
    ReactDOM.render(<Demo />, div);
    expect(effectRuns).toBe(0);
    expect(cleanupRuns).toBe(0);
    act(() => {
      Simulate.click(div.querySelector<HTMLButtonElement>('button')!);
    });
    expect(effectRuns).toBe(1);
    expect(cleanupRuns).toBe(0);
    ReactDOM.render(<React.Fragment />, div)
    ReactDOM.unmountComponentAtNode(div);
    expect(effectRuns).toBe(1);
    expect(cleanupRuns).toBe(1);
  });

});
