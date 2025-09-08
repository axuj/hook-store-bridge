# **`react-hook-adapter` 开发蓝图**

## 1. 目标

创建一个工厂函数，它接收一个 React Hook 和一个 key 列表，返回一个 Zustand Store Hook 和一个 Provider 组件，用于将原始 Hook 的状态同步到全局 Store 中。

## 2. 核心组件与类型定义

```typescript
// src/index.ts

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { create, useStore as useZustandStore } from 'zustand';
import type { StoreApi } from 'zustand';

// 核心类型
type AnyFunction = (...args: any[]) => any;
type UseHook<T> = (...args: any[]) => T;

// Provider 的 Props 类型
// 使用 Parameters<T> 推断原始 Hook 的参数类型
type ProviderProps<T extends UseHook<any>> = {
  hookArgs?: Parameters<T>;
  children: React.ReactNode;
};

// 工厂函数返回的 Store Hook 类型
type AdaptedStoreHook<T> = <U>(selector: (state: T) => U) => U;

// 上下文类型
type StoreContextValue<T> = StoreApi<T> | null;
```

## 3. `createHookAdapter` 实现细节

这是库的入口和核心。

```typescript
// src/index.ts (continued)

export function createHookAdapter<T extends object>(
  useHook: UseHook<T>,
  // 使用 ReadonlyArray 增强不变性
  stateKeys: ReadonlyArray<keyof T>
) {

  // 1. 创建一个 vanilla Zustand store。初始状态为空对象，由 Provider 首次渲染时填充。
  const store = create<T>(() => ({} as T));

  // 2. 创建 React Context 用于在组件树中传递 store 实例
  const StoreContext = createContext<StoreContextValue<T>>(null);

  // 3. 创建 Provider 组件
  const StoreProvider: React.FC<ProviderProps<typeof useHook>> = ({ hookArgs = [], children }) => {
    // 在 Provider 内部调用原始 Hook
    const hookValue = useHook(...(hookArgs as any));
    const storeRef = useRef(store); // 持有 store 的稳定引用

    useEffect(() => {
      // 从 hook 返回值中，根据 stateKeys 提取需要同步的状态
      const stateToSync: Partial<T> = {};
      for (const key of stateKeys) {
        stateToSync[key] = hookValue[key];
      }

      // 将提取出的状态同步到 Zustand store
      // 第二个参数 `true` 表示完全替换 store 的状态
      storeRef.current.setState(stateToSync, true);

    }, [hookValue]); // 依赖原始 hook 的返回值，当它改变时触发同步
    // 注意：如果 hookValue 每次渲染都返回新对象引用，这里会频繁触发。
    // 优化点：可在 effect 内部进行深比较，仅在值实际改变时才调用 setState。

    return (
      <StoreContext.Provider value={storeRef.current}>
        {children}
      </StoreContext.Provider>
    );
  };

  // 4. 创建消费者 Hook
  const useAdaptedStore: AdaptedStoreHook<T> = (selector) => {
    const storeApi = useContext(StoreContext);
    if (!storeApi) {
      throw new Error('`useAdaptedStore` must be used within a `StoreProvider`.');
    }
    // 使用 zustand 的 useStore 来订阅 store 的变化
    return useZustandStore(storeApi, selector);
  };

  // 5. 返回元组，使用 as const 获得精确的类型推断
  return [useAdaptedStore, StoreProvider] as const;
}
```

## 4. 使用示例代码框架

```typescript
// example/chatStore.ts
import { useChat, type UseChatHelpers } from '@ai-sdk/react';
import { createHookAdapter } from '../src'; // from 'react-hook-adapter'

const chatStateKeys: ReadonlyArray<keyof UseChatHelpers> = [
  'messages',
  'error',
  'input',
  'isLoading',
  'handleInputChange',
  'handleSubmit',
];

export const [useChatStore, ChatStoreProvider] = createHookAdapter(
  useChat,
  chatStateKeys
);

// example/App.tsx
import { ChatStoreProvider } from './chatStore';
import { Chat } from './Chat';

export default function App() {
  return (
    <ChatStoreProvider hookArgs={[{ api: '/api/chat' }]}>
      <Chat />
    </ChatStoreProvider>
  );
}

// example/Chat.tsx
import { useChatStore } from './chatStore';

export function Chat() {
  const messages = useChatStore((state) => state.messages);
  const input = useChatStore((state) => state.input);
  const handleInputChange = useChatStore((state) => state.handleInputChange);
  const handleSubmit = useChatStore((state) => state.handleSubmit);

  // ... JSX rendering
}
```

## 5. 开发与构建

1.  **依赖**:
    *   `dependencies`: (无)
    *   `peerDependencies`: `react`, `zustand`
    *   `devDependencies`: `typescript`, `tsup` (或 `vite`), `@types/react`
2.  **构建命令** (`tsup`):
    *   `tsup src/index.ts --format esm,cjs --dts --external react`
3.  **`package.json` 要点**:
    *   `"main": "./dist/index.js"`
    *   `"module": "./dist/index.mjs"`
    *   `"types": "./dist/index.d.ts"`
    *   `"files": ["dist"]`
