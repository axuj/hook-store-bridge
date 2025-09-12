import { createHookBridge } from 'hook-store-bridge'
import { useCounts } from './useCount'

export const { useBridgedStore, StoreProvider } = createHookBridge({
  useStoreLogic: () => {
    const {
      count,
      setCount,
      count1,
      setCount1,
      count2,
      setCount2,
      count3,
      setCount3,
    } = useCounts()

    return {
      tracked: {
        count,
        count1,
        count2,
        count3,
      },
      methods: {
        setCount,
        setCount1,
        setCount2,
        setCount3,
      },
    }
  },
})
