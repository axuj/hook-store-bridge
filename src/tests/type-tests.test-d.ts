/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: test-file */

import { type Dispatch, useState } from 'react'
import { describe, expectTypeOf, it } from 'vitest'
import { createStore, type StoreApi } from 'zustand'
import { createHookBridge } from '../bridge'

describe('createHookBridge 类型测试', () => {
  it('useCounterStore 应该返回正确的类型', () => {
    // 简单计数器 hook 类型测试
    const useCounter = (initial: number) => {
      return {
        count: initial,
        increment: () => {},
        decrement: () => {},
      }
    }

    const { useAdaptedStore: useCounterStore } = createHookBridge({
      useHook: useCounter,
      stateKeys: ['count'],
      actionKeys: ['increment', 'decrement'],
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

  it('CounterProvider 应该接受正确的 props 类型', () => {
    // 简单计数器 hook 类型测试
    const useCounter = (initial: number) => {
      return {
        count: initial,
        increment: () => {},
        decrement: () => {},
      }
    }

    const { StoreProvider: CounterProvider } = createHookBridge({
      useHook: useCounter,
      stateKeys: ['count'],
      actionKeys: ['increment', 'decrement'],
    })

    expectTypeOf(CounterProvider).parameter(0).toExtend<{
      hookArgs?: [number]
      children: any
    }>()
  })

  it('useComplexStore 应该返回正确的类型', () => {
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

    const { useAdaptedStore: useComplexStore } = createHookBridge({
      useHook: useComplexHook,
      stateKeys: ['count', 'name', 'items'] as const,
      actionKeys: ['updateCount', 'updateName', 'addItem', 'reset'] as const,
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

  it('ComplexProvider 应该接受正确的 props 类型', () => {
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
      useHook: useComplexHook,
      stateKeys: ['count', 'name', 'items'] as const,
      actionKeys: ['updateCount', 'updateName', 'addItem', 'reset'] as const,
    })

    expectTypeOf(ComplexProvider).parameter(0).toExtend<{
      hookArgs?: [{ initialCount: number; name: string }]
    }>()
  })

  it('自定义创建 store 函数', () => {
    const useMockCounter = (initialValue: number) => {
      const [count, setCount] = useState(initialValue)
      return { count, setCount }
    }

    type State = Pick<ReturnType<typeof useMockCounter>, 'count'> & {
      count1: number
      increment1: () => void
    }

    const { useAdaptedStore } = createHookBridge({
      useHook: useMockCounter,
      stateKeys: ['count'],
      actionKeys: ['setCount'],
      createStoreConfig: () => ({
        createStore: (initState) => {
          return createStore<State>((_set) => ({
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

    expectTypeOf(useAdaptedStore).returns.toExtend<{
      store: StoreApi<State>
      setCount: Dispatch<React.SetStateAction<number>>
    }>()
  })
})
