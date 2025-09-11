import { createStore, type StoreApi } from 'zustand'
import { createSelectors, type WithSelectors } from './util'

export interface StoreConfig<Store, State> {
  createStore: (initState: State) => Store
  updateState: (store: Store, newState: State) => void
}

export const createDefaultZustandStoreOptions = <
  State extends Record<string, unknown>,
>(): StoreConfig<WithSelectors<StoreApi<State>>, State> => ({
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
