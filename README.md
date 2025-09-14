# hook-store-bridge

[![NPM version](https://img.shields.io/npm/v/hook-store-bridge.svg)](https://www.npmjs.com/package/hook-store-bridge)
[![License](https://img.shields.io/npm/l/hook-store-bridge.svg)](./LICENSE)

A utility that bridges a React logic hook with a performant state management store (like Zustand), solving state-sharing across components without the performance pitfalls of React Context.

## Features

-   💡 **Explicit & Predictable**: A clear API (`{ tracked, methods }`) that makes data flow easy to reason about.
-   ⚡ **Highly Performant**: Avoids unnecessary re-renders by design, updating components only when the state they subscribe to actually changes.
-   🎯 **Solves Stale Closures**: The core pattern robustly handles stale closures for dependent props and state.
-   🚫 **No More Prop-Drilling**: Share state globally without passing props through dozens of components.
-   🔧 **State Library Agnostic**: Uses Zustand by default but can be configured to work with any state management library.
-   🛡️ **Type-Safe**: Fully written in TypeScript with excellent type inference out of the box.
-   🌐 **SSR Compatible**: Works seamlessly with Server-Side Rendering frameworks like Next.js.

## The Problem

Sharing the logic of a powerful custom hook (e.g., Vercel AI SDK's `useChat`) between distant components is challenging. You typically have two options:

1.  **Prop Drilling**: Leads to verbose, hard-to-maintain code.
2.  **React Context**: A good solution, but it has a major performance drawback. **Any component consuming the Context will re-render whenever *any* value in the Context changes.** For a frequently-updating hook like `useChat`, this causes a cascade of unnecessary re-renders, slowing down your app.

## The Solution

`hook-store-bridge` offers a third way. It "lifts" your hook's logic into an optimized store (like Zustand) that supports granular, selector-based subscriptions. This is achieved through a simple but powerful design pattern.

You structure your hook to return two distinct objects:
-   `tracked`: An object containing all values that should trigger a component re-render when they change.
-   `methods`: An object containing all the functions and actions for the store.

This explicit separation gives you the convenience of global state with the best possible rendering performance. A component that only calls a method from `methods` will **not** re-render when the `tracked` state changes.

## Installation

```bash
npm install hook-store-bridge
# or
yarn add hook-store-bridge
# or
pnpm add hook-store-bridge
```

## Quick Start

Let's create a simple counter store to demonstrate the core concepts.

### 1. Define Your Logic Hook

First, create a custom hook that defines your store's logic. It must return a `{ tracked, methods }` object.

```typescript
// useCounterLogic.ts
import { useState, useMemo, useCallback } from 'react'
import type { StoreLogicResult, UseStoreLogic } from 'hook-store-bridge'

type TrackedState = {
  count: number
}

type Methods = {
  increment: () => void
  decrement: () => void
}

// Implement the hook following the UseStoreLogic signature
export const useCounterLogic: UseStoreLogic<
  [initialValue?: number],
  TrackedState,
  Methods
> = (initialValue = 0) => {
  const [count, setCount] = useState(initialValue)

  // 1. Define your methods using useCallback for stable references.
  const increment = useCallback(() => setCount((c) => c + 1), [])
  const decrement = useCallback(() => setCount((c) => c - 1), [])

  // 2. Return the state and methods in the required structure.
  return {
    tracked: { count },
    methods: { increment, decrement },
  }
}

```

### 2. Create the Bridge

Use `createHookBridge` to create the `StoreProvider` and `useBridgedStore` hook.

```typescript
// counterStore.ts
import { createHookBridge } from 'hook-store-bridge'
import { useCounterLogic } from './useCounterLogic'

export const { useBridgedStore, StoreProvider } = createHookBridge({
  useStoreLogic: useCounterLogic,
})
```

### 3. Provide the Store

Wrap your application or component tree with the `StoreProvider`.

```tsx
// App.tsx
import { StoreProvider } from './counterStore'
import { CounterDisplay, CounterControls } from './MyComponents'

function App() {
  return (
    // You can pass arguments to your logic hook via the `logicArgs` prop.
    <StoreProvider logicArgs={[10]}>
      <h1>Counter</h1>
      <CounterDisplay />
      <CounterControls />
    </StoreProvider>
  )
}
```

### 4. Use the Store in Any Component

Now, any child component can access the store's state and methods.

**`CounterDisplay.tsx` (Subscribes to state)**
This component reads from the `tracked` state and will re-render when `count` changes.

```tsx
import { useBridgedStore } from './counterStore'

export function CounterDisplay() {
  const { store } = useBridgedStore()
  // Use a selector to subscribe ONLY to the `count` state.
  const count = store.use.count()

  return <h2>Count: {count}</h2>
}
```

**`CounterControls.tsx` (Only uses methods)**
This component only calls methods. Because it does not subscribe to any `tracked` state, it **will not re-render** when the count changes, giving you optimal performance.

```tsx
import { useBridgedStore } from './counterStore'

export function CounterControls() {
  // Methods are spread directly onto the hook's return value.
  const { increment, decrement } = useBridgedStore()

  return (
    <div>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </div>
  )
}
```

## The Core Principle: `tracked` vs. `methods`

To avoid stale closure bugs and ensure your components always have the latest logic, you must follow one simple rule:

> **If a method's behavior depends on a changing value (like a prop), that method MUST be included in the `tracked` state object.**

This ensures that when the dependency changes, a new method instance is created, which in turn updates the `tracked` state. This triggers a re-render in consumers, providing them with the fresh method from the latest render.

### Example: A Logger Hook

**Incorrect Usage ❌**
Here, `log` depends on `prefix`, but the `log` method itself is not tracked. If the `prefix` prop changes, components will keep using the old `log` function, which will log with the old `prefix` (a stale closure bug).

```typescript
const useLoggerLogic = ({ prefix }) => {
  const methods = {
    log: (message: string) => console.log(`[${prefix}]: ${message}`),
  }
  return {
    tracked: {}, // The `log` method is missing!
    methods,
  }
}
```

**Correct Usage ✅**
By including the `log` method in the `tracked` state, we guarantee that when `prefix` changes, a new `log` function is created. This updates the Zustand store, causing consumers to re-render and receive the new `log` method with the correct `prefix` in its closure.

```typescript
const useLoggerLogic: UseStoreLogic<{ prefix: string }, { log: (message: string) => void }, {}> = ({ prefix }) => {
  // When `prefix` changes, useCallback creates a new function instance.
  const log = useCallback((message: string) => {
    console.log(`[${prefix}]: ${message}`)
  }, [prefix])

  return {
    tracked: { log }, // Correct! The dependent method is tracked.
    methods: {},
  }
}
```

## API Reference

### `createHookBridge(options)`

The main function to create your store bridge.

-   `options.useStoreLogic`: **(Required)** The hook that defines the store's core logic. This hook can optionally receive arguments and must return an object with `{ tracked, methods }`.
-   `options.createStoreConfig`: (Optional) A function for providing a custom store implementation (e.g., using a different library or adding Zustand middleware).

### `StoreProvider`

A React component that initializes the store and provides it to its children.

-   `props.logicArgs`: (Optional) An array of arguments to be passed to your `useStoreLogic` hook.
-   `props.children`: The component tree that will have access to the store.

### `useBridgedStore()`

A hook for child components to access the store. It returns an object containing:
-   `store`: The Zustand store instance. You can subscribe to state slices with selector hooks (e.g., `store.use.myState()`).
-   All functions from your `methods` object are spread onto the return value for direct access (e.g., `const { myMethod } = useBridgedStore()`).

## Utilities

You can also import utility functions directly from the `util` subpath:

### `createSelectors(store)`

A utility function that adds selector hooks to a Zustand store instance. This allows you to subscribe to specific state slices with `store.use.myState()` syntax.

```typescript
import { createSelectors } from 'hook-store-bridge/util'
import { createStore } from 'zustand'

const store = createStore<{ count: number }>(() => ({ count: 0 }))
const storeWithSelectors = createSelectors(store)

// Now you can use selector hooks
const count = storeWithSelectors.use.count()
```

### `WithSelectors<S>`

A TypeScript utility type that adds selector capabilities to a store type.

```typescript
import type { WithSelectors } from 'hook-store-bridge/util'
import type { StoreApi } from 'zustand'

type MyStore = WithSelectors<StoreApi<{ count: number }>>
```

## Custom Store Configuration

You can override the default Zustand setup by providing a `createStoreConfig` function. This is useful for adding middleware (like Redux DevTools) or integrating a different state library.

See the [source code](src/store.ts) for the default implementation and type definitions.

**Example with Redux DevTools:**

```typescript
import { createHookBridge } from 'hook-store-bridge'
import { createStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createSelectors } from 'hook-store-bridge/util'
import { useMyStoreLogic } from './useMyStoreLogic'

export const { useBridgedStore, StoreProvider } = createHookBridge({
  useStoreLogic: useMyStoreLogic,
  createStoreConfig: () => ({
    createStore: (initState) => {
      const store = createStore<ReturnType<typeof useMyStoreLogic>['tracked']>()(
        devtools(() => initState, { name: 'MyStore' }))
      return createSelectors(store)
    },
    updateState: (store, newState) => {
      store.setState(newState, false, 'hookStateUpdate')
    },
  }),
})
```

## Examples

Check out the [examples](./examples) directory for complete working examples:
-   [Next.js App with `useChat`](./examples/next-app)
-   [React Router App](./examples/react-router-app)

## License

This project is licensed under the ISC License - see the [LICENSE](./LICENSE) file for details.
