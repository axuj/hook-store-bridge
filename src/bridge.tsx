import type React from 'react'
import { createContext, useContext, useEffect, useRef } from 'react'
import type { StoreApi } from 'zustand'
import type { StoreConfig } from './store'
import { createDefaultZustandStoreOptions } from './store'
import type { StoreContextValue, UseHook } from './types'
import { pick, type WithSelectors } from './util'

interface CreateHookBridgeOptions<
  Params extends unknown[],
  Result extends Record<string, unknown>,
  StateKeys extends keyof Result,
  ActionKeys extends keyof Result,
  StoreApiType,
> {
  useHook: UseHook<Params, Result>
  stateKeys: ReadonlyArray<StateKeys>
  actionKeys?: ReadonlyArray<ActionKeys>
  createStoreConfig?: () => StoreConfig<StoreApiType, Pick<Result, StateKeys>>
}

export function createHookBridge<
  Params extends unknown[],
  Result extends Record<string, unknown>,
  StateKeys extends keyof Result,
  ActionKeys extends keyof Result,
  StoreApiType = WithSelectors<StoreApi<Pick<Result, StateKeys>>>,
>({
  useHook,
  stateKeys,
  actionKeys = [],
  createStoreConfig,
}: CreateHookBridgeOptions<
  Params,
  Result,
  StateKeys,
  ActionKeys,
  StoreApiType
>) {
  type StateType = Pick<Result, StateKeys>
  type ActionsType = Pick<Result, ActionKeys>
  type TypeStoreContextValue = StoreContextValue<StoreApiType, ActionsType>

  const storeConfig = (
    createStoreConfig ??
    (createDefaultZustandStoreOptions as unknown as () => StoreConfig<
      StoreApiType,
      StateType
    >)
  )()

  const StoreContext = createContext<TypeStoreContextValue>(null)

  function StoreProvider({
    hookArgs = [] as unknown as Params,
    children,
  }: {
    hookArgs?: Params
    children: React.ReactNode
  }) {
    const hookValue = useHook(...hookArgs)
    const states = pick(hookValue, stateKeys)

    const storeRef = useRef<TypeStoreContextValue>(null)
    if (storeRef.current === null) {
      storeRef.current = {
        store: storeConfig.createStore(states),
        actions: {} as ActionsType,
      }
    }
    storeRef.current.actions = pick(hookValue, actionKeys)

    const dependencies = Object.values(states)
    useEffect(() => {
      if (storeRef.current) {
        storeConfig.updateState(storeRef.current.store, states)
      }
      // biome-ignore lint/correctness/useExhaustiveDependencies: 只需要监听dependencies
    }, dependencies)

    return (
      <StoreContext.Provider value={storeRef.current}>
        {children}
      </StoreContext.Provider>
    )
  }

  function useAdaptedStore() {
    const context = useContext(StoreContext)
    if (!context) {
      throw new Error(
        '`useAdaptedStore` must be used within a `StoreProvider`.',
      )
    }
    return { store: context.store, ...context.actions }
  }

  return { useAdaptedStore, StoreProvider }
}
