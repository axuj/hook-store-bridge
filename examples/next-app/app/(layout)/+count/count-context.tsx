import { createContext, type ReactNode, useContext } from 'react'
import { useCounts } from './useCount'

type CountsContextType = ReturnType<typeof useCounts>

// 创建Context
const CountsContext = createContext<CountsContextType | undefined>(undefined)

// 创建Provider组件
export function CountsProvider({ children }: { children: ReactNode }) {
  const counts = useCounts()
  return (
    <CountsContext.Provider value={counts}>{children}</CountsContext.Provider>
  )
}

// 创建自定义hook用于访问Context
export function useContextCounts() {
  const context = useContext(CountsContext)
  if (context === undefined) {
    throw new Error('useCounts must be used within a CountsProvider')
  }
  return context
}
