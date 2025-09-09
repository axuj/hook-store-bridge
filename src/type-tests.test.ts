/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: test-file */
import { expectTypeOf, test } from 'vitest'
import { createHookAdapter } from './adapter'

// 简单计数器 hook 类型测试
const useCounter = (initial: number) => {
  return {
    count: initial,
    increment: () => {},
    decrement: () => {},
  }
}

const [useCounterStore, CounterProvider] = createHookAdapter(
  useCounter,
  ['count'] as const,
  ['increment', 'decrement'] as const,
)

test('useCounterStore 应该返回正确的类型', () => {
  expectTypeOf(useCounterStore).returns.toExtend<{
    store: {
      use: {
        count: () => number
      }
    }
    increment: () => void
    decrement: () => void
  }>()
})

test('CounterProvider 应该接受正确的 props 类型', () => {
  expectTypeOf(CounterProvider).parameter(0).toExtend<{
    hookArgs: [number]
    children: any
  }>()
})

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

const [useComplexStore, ComplexProvider] = createHookAdapter(
  useComplexHook,
  ['count', 'name', 'items'] as const,
  ['updateCount', 'updateName', 'addItem', 'reset'] as const,
)

test('useComplexStore 应该返回正确的类型', () => {
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

test('ComplexProvider 应该接受正确的 props 类型', () => {
  expectTypeOf(ComplexProvider).parameter(0).toExtend<{
    hookArgs: [{ initialCount: number; name: string }]
    children: any
  }>()
})
