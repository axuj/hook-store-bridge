import { useState } from 'react'

export function useCounts() {
  const [count, setCount] = useState(0)
  const [count1, setCount1] = useState(0)
  const [count2, setCount2] = useState(0)
  const [count3, setCount3] = useState(0)
  return {
    count,
    setCount,
    count1,
    setCount1,
    count2,
    setCount2,
    count3,
    setCount3,
  }
}
