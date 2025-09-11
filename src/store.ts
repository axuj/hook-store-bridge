import { createStore, type StoreApi } from 'zustand'
import type { WithSelectors } from './util'
import { createSelectors } from './util'

export interface StoreConfig<Store, State> {
  createStore: (initState: State) => Store
  updateState: (store: Store, newState: State) => void
}

export const createDefaultZustandStoreOptions = <
  State extends Record<string, unknown>,
>() => {
  return createDefaultStore<WithSelectors<StoreApi<State>>, State>({
    createStore: (initState) => {
      const store = createStore<State>(() => ({
        ...initState,
      }))
      return createSelectors(store)
    },

    updateState: (store, newState) => {
      store.setState(newState)
    },
  })
}

export function createDefaultStore<Store, State>(
  config: StoreConfig<Store, State>,
) {
  return config
}
