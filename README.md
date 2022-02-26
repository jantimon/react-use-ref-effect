<div align="center">
  <h1>useRefEffect</h1>
  <br/>
  An `useEffect` hook optimized for `useRef`.
  <br/>
    <a href="https://www.npmjs.com/package/react-use-ref-effect">
      <img src="https://img.shields.io/npm/v/react-use-ref-effect.svg?style=flat-square" />
    </a>
    <a href='https://github.com/jantimon/react-use-ref-effect/workflows/CI?query=workflow%3A"CI"'>
       <img alt="Github Actions" src="https://github.com/jantimon/react-use-ref-effect/workflows/CI/badge.svg?style=flat-square">
    </a>
    <a href="https://bundlephobia.com/result?p=react-use-ref-effect">
      <img src="https://img.shields.io/bundlephobia/minzip/react-use-ref-effect.svg" alt="bundle size">
    </a> 
</div>

---

Executes an effect directly after React attaches a ref to a DOM node.  
Allows cleaning up once React detaches the DOM node from the ref again.
  
- The hook does __not__ triggering additional renderings.
- The hook size is __only 339b__.

# API

## useRefEffect API
Use case: every time you have to react to ref change

- `const ref = useRefEffect(callback)` - would call provided `callback` when ref is changed.

- `const ref = useRefEffect(callback, [])` - would call provided `callback` when ref is changed or a dependency is changed - similar to useEffect.

- `const ref = useRefEffect(() => { return cleanupCallback }, [])` - would call provided `cleanUpcallback` once the component unmounts or if react removes the referenced DOM element 

```js
import { useRefEffect } from 'react-use-ref-effect';

const Component = () => {

  const ref = useRefEffect((element) => {
    console.log('Element', element, 'is now available');
    return () => {
      console.log('Element', element, 'is no longer available');
    }
  }, []);

  return <div ref={ref}>Hello World</div>
}
```

# Motivation

React is delivering two powerful hooks `useRef` and `useEffect` however they don't work properly in combination:

```js
const ref = useRef();
useEffect(() => {
  // do sth with ref.current
}, [ref.current])
```

✅ &nbsp; doesn't trigger additional renderings on mount

🚫 &nbsp; fails to execute the effect for conditionally rendered components  
(e.g. `isOpen && <span ref={ref}>Demo</span>`)

🚫 &nbsp; fails to execute the effect for lazy rendered components  
(e.g. `<LazyComponent><span ref={ref}>Demo</span></LazyComponent>`)

🚫 &nbsp; fails to execute the effect if a child controls the time to mount  
(e.g. `<Slider waitFor={3000}><span ref={ref}>Demo</span></Slider>`)

<br /><br />

By using a pattern from the official [react hooks faq](https://reactjs.org/docs/hooks-faq.html#how-can-i-measure-a-dom-node) `useRefEffect` can be used as a safe replacement:

```js
const ref = useRefEffect((element) => {
  // do sth with element
  return () => {
    // cleanup
  }
}, [])
```
✅ &nbsp; doesn't trigger additional renderings on mount

✅ &nbsp; executes effect and effect cleanup for conditionally and lazy rendered components  
(e.g. `isOpen && <span ref={ref}>Demo</span>`)

✅ &nbsp; executes effect and effect cleanup for lazy rendered components  
(e.g. `<LazyComponent><span ref={ref}>Demo</span></LazyComponent>`)

✅ &nbsp; executes effect and effect cleanup if a child controls the time to mount  
(e.g. `<Slider waitFor={3000}><span ref={ref}>Demo</span></Slider>`)

# Similar packages:
- [use-callback-ref](https://github.com/theKashey/use-callback-ref) - great utils around refs and callbacks

# License
MIT

