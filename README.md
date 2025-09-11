# hook-store-bridge

[![NPM version](https://img.shields.io/npm/v/hook-store-bridge.svg)](https://www.npmjs.com/package/hook-store-bridge)
[![License](https://img.shields.io/npm/l/hook-store-bridge.svg)](./LICENSE)

A utility library that bridges React hook state with state management libraries like Zustand, providing an alternative to Context and prop drilling for sharing state across components. Particularly useful for complex hooks like Vercel AI SDK's `useChat`.

## Features

-   🔄 **State Synchronization**: Automatically syncs React hook state with external state management libraries.
-   📦 **Lightweight**: Minimal overhead with a tiny API surface.
-   🔧 **Flexible**: Works with various state management solutions, with built-in support for Zustand.
-   🎯 **Easy Integration**: A drop-in solution for existing React hooks.
-   ⚡ **Performant**: Efficient updates with smart dependency tracking to prevent unnecessary re-renders.
-   🛡️ **Type Safety**: Full TypeScript support with comprehensive type inference.
-   🚫 **Prop-Drilling Solution**: Eliminates the need for prop drilling while avoiding the performance pitfalls of Context.
-   🌐 **SSR Support**: Full compatibility with Server-Side Rendering frameworks like Next.js and React Router.

## Why hook-store-bridge?

In React, we often use powerful custom hooks to encapsulate complex logic (e.g., data fetching, state machines). But when multiple distant components need to share the state of that single hook, we typically face two choices:

1.  **Prop Drilling**: Passing state and methods down through multiple layers of props. This quickly becomes verbose and difficult to maintain.
2.  **React Context**: Placing the hook's state and methods into a Context Provider. While a good solution, it has a major performance drawback: **any component consuming the Context will re-render whenever *any* state value in the hook updates**. For a hook like `useChat`, where state changes frequently (e.g., the `input` state updates on every keystroke), this leads to a massive number of unnecessary re-renders.

`hook-store-bridge` solves this by combining the power of hooks with a state management library that supports granular subscriptions (like Zustand). It "lifts" the hook's state into a global store while allowing components to **subscribe only to the state slices they actually care about**.

-   The `ChatMessages` component only cares about `messages`, so it will only re-render when `messages` changes.
-   The `ChatInput` component only cares about `input` and `handleInputChange`; it won't re-render when the `messages` array is updated.

This gives you the convenience of global state with the best possible rendering performance.

## Installation

```bash
npm install hook-store-bridge
# or
yarn add hook-store-bridge
# or
pnpm add hook-store-bridge
```

## Quick Start with Vercel AI SDK's useChat

### 1. Create a bridge for your hook

```typescript
// chatStoreBridge.ts
import { createHookBridge } from 'hook-store-bridge'
import { useChat } from 'ai/react'
import { useState } from 'react'

// Let's say we extend useChat with custom functionality
function useMyChat() {
  const [model, setModel] = useState('gpt-4')
  // Return all state and methods
  return { ...useChat(), model, setModel }
}

export const { useAdaptedStore, StoreProvider } = createHookBridge({
  useHook: useMyChat,
  // Key: Explicitly define what's "state" and what's an "action"
  stateKeys: ['messages', 'input', 'isLoading', 'error', 'model', 'status'],
  actionKeys: ['handleSubmit', 'handleInputChange', 'stop', 'setModel', 'reload', 'append'],
})
```

**What's happening?**
`createHookBridge` takes your custom hook (`useMyChat`). Using `stateKeys` and `actionKeys`, it intelligently separates the return values into "state" and "actions." It then creates a Zustand store internally to hold all the state and returns two core pieces:
*   `StoreProvider`: A provider component that must wrap your application's root.
*   `useAdaptedStore`: A new hook to access the state and actions from any child component.

### 2. Wrap your component tree with the provider

```tsx
// App.tsx
import { StoreProvider } from './chatStoreBridge'
import YourComponents from './YourComponents' // A parent component for all your chat UI

function App() {
  return (
    <StoreProvider>
      <YourComponents />
    </StoreProvider>
  )
}
```

### 3. Access the shared state in any component

```tsx
// ChatMessages.tsx
import { useAdaptedStore } from './chatStoreBridge'

function ChatMessages() {
  const { store } = useAdaptedStore()
  // Precisely subscribe to the `messages` state with a selector hook
  const messages = store.use.messages()
  
  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          <strong>{message.role}:</strong> {message.content}
        </div>
      ))}
    </div>
  )
}
```

**Performance Tip**:
Notice the `const messages = store.use.messages()` syntax. This is not a plain property access! Every function under `store.use` is an individual selector hook. By using this, the `ChatMessages` component is telling `hook-store-bridge`: "I am only interested in changes to `messages`." As a result, this component **will not** re-render when the user types (`input` state changes) or when the `isLoading` status changes.

```tsx
// ModelSelector.tsx
import { useAdaptedStore } from './chatStoreBridge'

function ModelSelector() {
  // Actions (setModel) can be destructured directly.
  // State (model) is accessed via a selector hook for performance.
  const { store, setModel } = useAdaptedStore()
  const model = store.use.model()
  
  return (
    <select value={model} onChange={(e) => setModel(e.target.value)}>
      <option value="gpt-4">GPT-4</option>
      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
    </select>
  )
}
```


## API

### `createHookBridge(options)`

The core function used to create the bridge.

**`options` Argument**:

-   `useHook`: `() => T`
    -   **Required**. The React hook you want to bridge. It should return an object containing state values and action functions.
-   `stateKeys`: `(keyof T)[]`
    -   **Required**. An array of strings specifying which keys from the `useHook` return object are "state". These values will be placed in the store.
-   `actionKeys`: `(keyof T)[]`
    -   **Required**. An array of strings specifying which keys from the `useHook` return object are "actions" or functions. These can be called directly to modify the state.
-   `createStoreConfig`: `() => { createStore, updateState }`
    -   **Optional**. A function for customizing the underlying store's creation and update logic. Useful for advanced cases like integrating a different state library or adding Zustand middleware.

## Custom Store Configuration

By default, `hook-store-bridge` uses Zustand as its underlying state management library. However, you can fully customize this behavior by providing your own store configuration via the `createStoreConfig` option.

### Default Store Configuration

The library provides a default store configuration that you can use as a reference for creating your own:

```typescript
import { createStore, type StoreApi } from 'zustand'
import { createSelectors, type WithSelectors } from './util'
 // internal utilitie

export const createDefaultZustandStoreOptions = <
  State extends Record<string, unknown>,
>(): StoreConfig<WithSelectors<StoreApi<State>>, State> => ({
  createStore: (initState) => {
    const store = createStore<State>(() => ({
      ...initState,
    }))
    // createSelectors enhances the store to support the store.use.myState() syntax
    return createSelectors(store)
  },

  updateState: (store, newState) => {
    store.setState(newState)
  },
})
```

### Creating a Custom Store

To use a custom store, you need to provide a `createStoreConfig` function that returns an object with two methods:

1.  `createStore(initState)`: Creates a new store instance with the initial state.
2.  `updateState(store, newState)`: Updates the store with new state values.

Here is an example of implementing a custom store configuration:

```typescript
import { createHookBridge } from 'hook-store-bridge'
import { useChat } from 'ai/react'
import { createStore } from 'zustand'
import { createSelectors } from './utils' // Assume you have a custom selector utility

function useMyChat() {
  const [model, setModel] = useState('gpt-4')
  return { ...useChat(), model, setModel }
}

export const { useAdaptedStore, StoreProvider } = createHookBridge({
  useHook: useMyChat,
  stateKeys: ['messages', 'input', 'isLoading', 'error', 'model'],
  actionKeys: ['handleSubmit', 'handleInputChange', 'stop', 'setModel'],
  
  // Custom store configuration
  createStoreConfig: () => ({
    createStore: (initState) => {
      // Create your custom store with the initial state
      const store = createStore((set) => ({
        ...initState,
        // Add additional custom state properties
        customProperty: 'initialValue',
        // Add custom actions
        customAction: () => set({ customProperty: 'updatedValue' })
      }))
      
      // Add any store enhancements (e.g., selectors, middleware)
      return createSelectors(store)
    },
    
    updateState: (store, newState) => {
      // Define how to update your store with new state
      store.setState(newState)
    }
  })
})
```

### Use Cases for Custom Store

Custom store configurations are useful when you need to:

1.  Add additional state properties not present in the original hook.
2.  Implement custom store enhancements or middleware (e.g., Redux DevTools, persistence).
3.  Use a different state management library other than Zustand.
4.  Add custom selectors or computed properties.

### Working with the Custom Store

Once you've created a bridge with a custom store configuration, you can access your custom properties and actions just like the original hook properties:

```tsx
import { useAdaptedStore } from './chatStoreBridge'

function MyComponent() {
  const { store } = useAdaptedStore()
  
  // Access custom state properties
  const customProperty = store.use.customProperty()
  const customAction = store.use.customAction()
  
  return (
    <div>
      <p>Custom property: {customProperty}</p>
      <button onClick={customAction}>Update Custom Property</button>
    </div>
  )
}
```

## Examples

Check out the [examples](./examples) directory for complete working examples:
- [Next.js App](./examples/next-app)
- [React Router App](./examples/react-router-app)
