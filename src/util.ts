import type { StoreApi } from 'zustand'
import { useStore } from 'zustand/react'

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never

// 1. 这是暴露给外部的、公开的函数签名。
//    它告诉调用者，函数会返回一个展开后的、漂亮的类型。
// export function pick<T extends object, K extends keyof T>(
//   obj: T,
//   keys: readonly K[],
// ): Expand<Pick<T, K>>

// 2. 这是函数的具体实现签名，它对外部是不可见的。
//    我们在这里使用 Pick<T, K>，因为它最贴近实现逻辑。
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>

  keys.forEach((key) => {
    if (obj && Object.hasOwn(obj, key)) {
      result[key] = obj[key]
    }
  })

  // 在实现中，我们返回 Pick<T, K>，完全不需要任何 hack 或断言！
  return result
}

export type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

export const createSelectors = <S extends StoreApi<object>>(_store: S) => {
  const store = _store as WithSelectors<typeof _store>
  store.use = {}
  for (const k of Object.keys(store.getState())) {
    ;(store.use as any)[k] = () =>
      useStore(_store, (s) => s[k as keyof typeof s])
  }

  return store
}
