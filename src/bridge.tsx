import type React from 'react'
import { createContext, useContext, useEffect, useRef } from 'react'
import type { StoreApi } from 'zustand'
import type { StoreConfig } from './store'
import { createDefaultZustandStoreOptions } from './store'
import type { WithSelectors } from './util'

/**
 * The return type for the store's logic hook.
 * It strictly separates tracked state from methods.
 */
export type StoreLogicResult<StateType, MethodsType> = {
  /**
   * An object containing all values that should trigger a re-render when they change.
   * If a method's behavior depends on a prop, that prop must be included here
   * to ensure consumers receive the updated method.
   */
  tracked: StateType
  /**
   * An object containing all the functions (actions, commands, etc.) for the store.
   * These do not trigger re-renders directly.
   */
  methods: MethodsType
}

/**
 * The signature for the hook that defines the store's core logic.
 */
export type UseStoreLogic<Params extends unknown[], StateType, MethodsType> = (
  ...params: Params
) => StoreLogicResult<StateType, MethodsType>

export interface CreateHookBridgeOptions<
  Params extends unknown[],
  StateType extends Record<string, unknown>,
  MethodsType extends Record<string, unknown>,
  StoreApiType,
> {
  /**
   * The hook that defines the store's state and methods.
   * This is the single source of truth for the store's logic.
   */
  useStoreLogic: UseStoreLogic<Params, StateType, MethodsType>
  createStoreConfig?: () => StoreConfig<StoreApiType, StateType>
}

export function createHookBridge<
  Params extends unknown[],
  StateType extends Record<string, unknown>,
  MethodsType extends Record<string, unknown>,
  StoreApiType = WithSelectors<StoreApi<StateType>>,
>({
  useStoreLogic,
  createStoreConfig,
}: CreateHookBridgeOptions<Params, StateType, MethodsType, StoreApiType>) {
  type TypeStoreContextValue = {
    store: StoreApiType
    methods: MethodsType
  }

  const storeConfig = (
    createStoreConfig ??
    (createDefaultZustandStoreOptions as unknown as () => StoreConfig<
      StoreApiType,
      StateType
    >)
  )()

  const StoreContext = createContext<TypeStoreContextValue | null>(null)

  function StoreProvider({
    logicArgs = [] as unknown[] as Params,
    children,
  }: {
    logicArgs?: Params
    children: React.ReactNode
  }) {
    const { tracked: trackedState, methods } = useStoreLogic(...logicArgs)

    const storeRef = useRef<TypeStoreContextValue | null>(null)
    if (storeRef.current === null) {
      storeRef.current = {
        store: storeConfig.createStore(trackedState),
        methods,
      }
    } else {
      storeRef.current.methods = methods
    }

    // This effect synchronizes the tracked state from the hook to the Zustand store.
    // The dependency array ensures this only runs when the tracked state actually changes.
    // This is the mechanism that triggers consumer re-renders.
    const dependencies = Object.values(trackedState)
    useEffect(() => {
      if (storeRef.current) {
        storeConfig.updateState(storeRef.current.store, trackedState)
      }
      // biome-ignore lint/correctness/useExhaustiveDependencies: We are intentionally tracking the state values.
    }, dependencies)

    return (
      <StoreContext.Provider value={storeRef.current}>
        {children}
      </StoreContext.Provider>
    )
  }

  function useBridgedStore() {
    const context = useContext(StoreContext)
    if (!context) {
      throw new Error(
        '`useBridgedStore` must be used within a `StoreProvider`.',
      )
    }
    // Consumers get the store instance and all the latest methods.
    // Re-renders are driven by subscribing to the store, not by context changes.
    return { store: context.store, ...context.methods }
  }

  return { useBridgedStore, StoreProvider }
}
