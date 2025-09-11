import { createHookBridge } from 'hook-store-bridge'
import { useCounts } from './useCount'

export const { useAdaptedStore, StoreProvider } = createHookBridge({
  useHook: useCounts,
  stateKeys: ['count', 'count1', 'count2', 'count3'],
  actionKeys: ['setCount', 'setCount1', 'setCount2', 'setCount3'],
})
