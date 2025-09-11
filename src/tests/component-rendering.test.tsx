import { render, screen } from '@testing-library/react'
import { act, useEffect, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { createHookBridge } from '../bridge'

describe('Component Rendering and State Updates', () => {
  it('should render components with correct initial state and update independently', () => {
    let readerList: string[] = []
    function reader(componentName: string) {
      readerList.push(componentName)
    }
    function reloadReaderList() {
      readerList = []
    }
    // 创建一个简单的计数器 hook
    const useCounter = ({
      count1InitialValue,
      count2InitialValue,
      count3InitialValue,
      count4InitialValue,
    }: {
      count1InitialValue: number
      count2InitialValue: number
      count3InitialValue: number
      count4InitialValue: number
    }) => {
      const [count1, setCount1] = useState(count1InitialValue)
      const [count2, setCount2] = useState(count2InitialValue)
      const [count3, setCount3] = useState(count3InitialValue)
      const [count4, setCount4] = useState(count4InitialValue)
      return {
        count1,
        count2,
        count3,
        count4,
        setCount1,
        setCount2,
        setCount3,
        setCount4,
      }
    }

    // 使用 createHookBridge 创建适配器
    const { useAdaptedStore, StoreProvider } = createHookBridge({
      useHook: useCounter,
      stateKeys: ['count1', 'count2', 'count3', 'count4'],
      actionKeys: ['setCount1', 'setCount2', 'setCount3', 'setCount4'],
    })

    function CountComponent({
      count,
      setCount,
      componentName,
    }: {
      count: number
      setCount: (c: number) => void
      componentName: string
    }) {
      useEffect(() => {
        reader(componentName)
      })
      return (
        <div>
          <span data-testid={`${componentName}-count-value`}>
            Count: {count}
          </span>
          <button
            data-testid={`${componentName}-button`}
            type='button'
            onClick={() => setCount(count + 1)}
          >
            Increment
          </button>
        </div>
      )
    }

    function CountComponent1() {
      const { store, setCount1 } = useAdaptedStore()
      const count = store.use.count1()
      return (
        <CountComponent
          count={count}
          setCount={setCount1}
          componentName='CountComponent1'
        />
      )
    }

    function CountComponent2() {
      const { store, setCount2 } = useAdaptedStore()
      const count = store.use.count2()
      return (
        <CountComponent
          count={count}
          setCount={setCount2}
          componentName='CountComponent2'
        />
      )
    }
    function CountComponent3() {
      const { store } = useAdaptedStore()
      const count = store.use.count3()
      function setCount3(c: number) {
        store.setState({ count3: c })
      }
      return (
        <CountComponent
          count={count}
          setCount={setCount3}
          componentName='CountComponent3'
        />
      )
    }

    function CountComponent4() {
      const { store, setCount4 } = useAdaptedStore()
      const count = store.use.count2()
      return (
        <CountComponent
          count={count}
          setCount={setCount4}
          componentName='CountComponent4'
        />
      )
    }

    function TestComponent() {
      return (
        <>
          <CountComponent1 />
          <CountComponent2 />
          <CountComponent3 />
          <CountComponent4 />
        </>
      )
    }

    // 渲染组件
    render(
      <StoreProvider
        hookArgs={[
          {
            count1InitialValue: 1,
            count2InitialValue: 2,
            count3InitialValue: 3,
            count4InitialValue: 4,
          },
        ]}
      >
        <TestComponent />
      </StoreProvider>,
    )

    function getComponentCount(id: number) {
      return screen.getByTestId(`CountComponent${id}-count-value`).textContent
    }

    //初始状态
    for (let i = 1; i < 4; i++) {
      expect(getComponentCount(i)).toBe(`Count: ${i}`)
    }
    expect(getComponentCount(4)).toBe(`Count: 2`)

    reloadReaderList()
    act(() => {
      screen.getByTestId('CountComponent1-button').click()
    })
    expect(readerList).toEqual(['CountComponent1'])

    reloadReaderList()
    act(() => {
      screen.getByTestId('CountComponent2-button').click()
    })
    expect(readerList.sort()).toEqual(['CountComponent2', 'CountComponent4'])

    reloadReaderList()
    act(() => {
      screen.getByTestId('CountComponent3-button').click()
    })
    expect(readerList).toEqual(['CountComponent3'])

    reloadReaderList()
    act(() => {
      screen.getByTestId('CountComponent4-button').click()
    })
    expect(readerList).toEqual([])

    expect(getComponentCount(1)).toBe(`Count: 2`)
    expect(getComponentCount(2)).toBe(`Count: 3`)
    expect(getComponentCount(3)).toBe(`Count: 4`)
    expect(getComponentCount(4)).toBe(`Count: 3`)
  })
})
