/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: test-file */

import { type Dispatch, useState } from 'react'
import { describe, expectTypeOf, it } from 'vitest'
import { createStore, type StoreApi } from 'zustand'
import { createHookBridge } from '../bridge'

describe('createHookBridge type tests', () => {
  it('useCounterStore should return the correct type', () => {
    // 简单计数器 hook 类型测试
    const useCounter = (initial: number) => {
      return {
        count: initial,
        increment: () => {},
        decrement: () => {},
      }
    }

    const { useBridgedStore: useCounterStore } = createHookBridge({
      useStoreLogic: (initial: number) => {
        const { count, increment, decrement } = useCounter(initial)
        return {
          tracked: { count },
          methods: { increment, decrement },
        }
      },
    })

    expectTypeOf(useCounterStore).returns.toExtend<{
      store: {
        use: {
          count: () => number
        }
      }
      increment: () => void
      decrement: () => void
    }>()
    const { store } = useCounterStore()
    expectTypeOf(store).not.toBeAny()
  })

  it('CounterProvider should accept correct props type', () => {
    // 简单计数器 hook 类型测试
    const useCounter = (initial: number) => {
      return {
        count: initial,
        increment: () => {},
        decrement: () => {},
      }
    }

    const { StoreProvider: CounterProvider } = createHookBridge({
      useStoreLogic: (initial: number) => {
        const { count, increment, decrement } = useCounter(initial)
        return {
          tracked: { count },
          methods: { increment, decrement },
        }
      },
    })

    expectTypeOf(CounterProvider).parameter(0).toExtend<{
      logicArgs?: [number]
      children: any
    }>()
  })

  it('useComplexStore should return correct type', () => {
    // 复杂对象 hook 类型测试
    const useComplexHook = (config: { initialCount: number; name: string }) => {
      return {
        count: config.initialCount,
        name: config.name,
        items: [] as string[],
        updateCount: (n: number) => {},
        updateName: (name: string) => {},
        addItem: (item: string) => {},
        reset: () => {},
      }
    }

    const { useBridgedStore: useComplexStore } = createHookBridge({
      useStoreLogic: (config: { initialCount: number; name: string }) => {
        const { count, name, items, updateCount, updateName, addItem, reset } =
          useComplexHook(config)
        return {
          tracked: { count, name, items },
          methods: { updateCount, updateName, addItem, reset },
        }
      },
    })

    expectTypeOf(useComplexStore).returns.toExtend<{
      store: {
        use: {
          count: () => number
          name: () => string
          items: () => string[]
        }
      }
      updateCount: (n: number) => void
      updateName: (name: string) => void
      addItem: (item: string) => void
      reset: () => void
    }>()
  })

  it('ComplexProvider should accept correct props type', () => {
    // 复杂对象 hook 类型测试
    const useComplexHook = (config: { initialCount: number; name: string }) => {
      return {
        count: config.initialCount,
        name: config.name,
        items: [] as string[],
        updateCount: (n: number) => {},
        updateName: (name: string) => {},
        addItem: (item: string) => {},
        reset: () => {},
      }
    }

    const { StoreProvider: ComplexProvider } = createHookBridge({
      useStoreLogic: (config: { initialCount: number; name: string }) => {
        const { count, name, items, updateCount, updateName, addItem, reset } =
          useComplexHook(config)
        return {
          tracked: { count, name, items },
          methods: { updateCount, updateName, addItem, reset },
        }
      },
    })

    expectTypeOf(ComplexProvider).parameter(0).toMatchObjectType<{
      logicArgs?: [{ initialCount: number; name: string }]
    }>()
  })

  it('custom store creation function', () => {
    const useMockCounter = (initialValue: number) => {
      const [count, setCount] = useState(initialValue)
      return { count, setCount }
    }

    type State = Pick<ReturnType<typeof useMockCounter>, 'count'>

    const { useBridgedStore } = createHookBridge({
      useStoreLogic: (initialValue: number) => {
        const { count, setCount } = useMockCounter(initialValue)
        return {
          tracked: { count },
          methods: { setCount },
        }
      },
      createStoreConfig: () => ({
        createStore: (initState) => {
          return createStore<
            State & {
              count1: number
              increment1: () => void
            }
          >((_set) => ({
            ...initState,
            count1: 0,
            increment1: () => _set((state) => ({ count1: state.count1 + 1 })),
          }))
        },
        updateState: (store, state) => {
          store.setState(state)
        },
      }),
    })

    expectTypeOf(useBridgedStore).returns.toMatchObjectType<{
      store: StoreApi<
        State & {
          count1: number
          increment1: () => void
        }
      >
      setCount: Dispatch<React.SetStateAction<number>>
    }>()
  })
})
