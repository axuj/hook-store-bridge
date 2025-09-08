export type UseHook<P extends any[], R> = (...args: P) => R

// 上下文类型
export type StoreContextValue<S, A> = {
  store: S
  actions: A
} | null
