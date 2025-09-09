import type React from 'react'
import { createContext, useContext, useEffect, useRef } from 'react'
import { createStore, type StoreApi } from 'zustand'
import type { StoreContextValue, UseHook } from './types'
import { createSelectors, pick, type WithSelectors } from './util'

function createStoreFunc<T>(initState: T): StoreApi<T> {
  return createStore<T>()(() => ({
    ...initState,
  }))
}

// 调整泛型参数顺序，将 T 移到前面以便更好地推导
export function createHookAdapter<
  P extends any[],
  R extends object,
  SK extends keyof R,
  AK extends keyof R,
>(
  useHook: UseHook<P, R>,
  stateKeys: ReadonlyArray<SK>,
  actionKeys: ReadonlyArray<AK>,
) {
  type StateType = Pick<R, SK>
  type ActionsType = Pick<R, AK>
  type StoreApiType = StoreApi<StateType>
  type TypeStoreContextValue = StoreContextValue<StoreApiType, ActionsType>
  const StoreContext = createContext<TypeStoreContextValue>(null)

  function StoreProvider({
    hookArgs,
    children,
  }: {
    hookArgs: P
    children: React.ReactNode
  }) {
    const hookValue = useHook(...(hookArgs as any))
    const states = pick(hookValue, stateKeys)
    const dependencies = Object.values(states)

    const storeRef = useRef<TypeStoreContextValue>(null)
    if (storeRef.current === null) {
      storeRef.current = {
        store: createStoreFunc(states),
        actions: {} as ActionsType,
      }
    }

    storeRef.current.actions = pick(hookValue, actionKeys)

    // biome-ignore lint/correctness/useExhaustiveDependencies: 只需要监听dependencies
    useEffect(() => {
      storeRef.current?.store.setState(states)
    }, [...dependencies])

    return (
      <StoreContext.Provider value={storeRef.current}>
        {children}
      </StoreContext.Provider>
    )
  }

  function useAdaptedStore(): {
    store: WithSelectors<StoreApiType>
  } & ActionsType
  function useAdaptedStore() {
    const context = useContext(StoreContext)
    if (!context) {
      throw new Error(
        '`useAdaptedStore` must be used within a `StoreProvider`.',
      )
    }
    const store = createSelectors(context.store)
    return { store, ...context.actions }
  }

  return [useAdaptedStore, StoreProvider] as const
}
