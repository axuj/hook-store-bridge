import { render, renderHook, screen } from '@testing-library/react'
import { act, useCallback, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { createStore, useStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createHookBridge } from '../bridge'

describe('createHookBridge', () => {
  it('should throw an error if useAdaptedStore is used without a Provider', () => {
    const useMockHook = () => ({ value: 123 })
    const { useBridgedStore } = createHookBridge({
      useStoreLogic: () => ({
        tracked: { ...useMockHook() },
      }),
    })

    expect(() => {
      renderHook(() => useBridgedStore())
    }).toThrow('`useBridgedStore` must be used within a `StoreProvider`.')
  })

  it('should provide state and actions correctly when used with a Provider', async () => {
    const useMockCounter = (initialValue: number) => {
      const [count, setCount] = useState(initialValue)
      return { count, setCount }
    }
    const { useBridgedStore, StoreProvider } = createHookBridge({
      useStoreLogic: (initialValue: number) => {
        const { count, setCount } = useMockCounter(initialValue)
        return {
          tracked: { count },
          methods: { setCount },
        }
      },
    })
    const TestComponent = () => {
      const { store, setCount } = useBridgedStore()
      const count = store.use.count()
      return (
        <div>
          <span>Count: {count}</span>
          <button type='button' onClick={() => setCount((count) => count + 1)}>
            Increment
          </button>
        </div>
      )
    }
    render(
      <StoreProvider logicArgs={[5]}>
        <TestComponent />
      </StoreProvider>,
    )

    const countElement = screen.getByText(/Count:/)

    expect(countElement.textContent).toBe('Count: 5')
    const button = screen.getByText('Increment')

    act(() => {
      button.click()
    })
    expect(countElement.textContent).toBe('Count: 6')
  })

  it('复杂入参', () => {
    const useMockHook = (
      obj1: { count: number },
      obj2: { count: number },
      test: boolean = false,
    ) => ({
      obj1,
      obj2,
      test,
    })

    const { useBridgedStore, StoreProvider } = createHookBridge({
      useStoreLogic: (
        obj1Initialize: { count: number },
        obj2Initialize: { count: number },
        test: boolean = false,
      ) => {
        const { obj1, test: testVal } = useMockHook(
          obj1Initialize,
          obj2Initialize,
          test,
        )
        return {
          tracked: { obj1, test: testVal },
          methods: {},
        }
      },
    })
    const TestComponent = () => {
      const { store } = useBridgedStore()
      const test = store.use.test()
      const obj1 = store.use.obj1().count
      return (
        <div>
          <span>Test: {String(test)}</span>
          <span>Obj1 count: {obj1}</span>
        </div>
      )
    }
    render(
      <StoreProvider logicArgs={[{ count: 5 }, { count: 10 }]}>
        <TestComponent />
      </StoreProvider>,
    )

    const testElement = screen.getByText(/Test:/)
    const obj1Element = screen.getByText(/Obj1 count:/)

    expect(testElement.textContent).toBe('Test: false')
    expect(obj1Element.textContent).toBe('Obj1 count: 5')
  })

  it('不需要参数', () => {
    const useMockHook = () => {
      return {
        test: true,
      }
    }

    const { useBridgedStore, StoreProvider } = createHookBridge({
      useStoreLogic: () => {
        const { test } = useMockHook()
        return {
          tracked: { test },
          methods: {},
        }
      },
    })
    const TestComponent = () => {
      const { store } = useBridgedStore()
      const test = store.use.test()
      return (
        <div>
          <span>Test: {String(test)}</span>
        </div>
      )
    }
    render(
      <StoreProvider>
        <TestComponent />
      </StoreProvider>,
    )
    const testElement = screen.getByText(/Test:/)
    expect(testElement.textContent).toBe('Test: true')
  })

  it('action改变', () => {
    const useMockHook = (initialValue: number) => {
      const [count, setCount] = useState(initialValue)
      const increment = useCallback(() => {
        setCount(count + 1)
      }, [count])
      return { count, setCount, increment }
    }

    const { useBridgedStore, StoreProvider } = createHookBridge({
      useStoreLogic: (initialValue: number) => {
        const { count, setCount, increment } = useMockHook(initialValue)
        return {
          tracked: { count },
          methods: { setCount, increment },
        }
      },
    })
    const TestComponent = () => {
      const { store, increment } = useBridgedStore()
      const count = store.use.count()
      return (
        <div>
          <span>Count: {count}</span>
          <button type='button' onClick={() => increment()}>
            Increment
          </button>
        </div>
      )
    }
    render(
      <StoreProvider logicArgs={[5]}>
        <TestComponent />
      </StoreProvider>,
    )

    const countElement = screen.getByText(/Count:/)

    expect(countElement.textContent).toBe('Count: 5')
    const button = screen.getByText('Increment')

    act(() => {
      button.click()
    })
    act(() => {
      button.click()
    })
    expect(countElement.textContent).toBe('Count: 7')
  })

  it('should update state when StoreProvider args change with React state', () => {
    const useMockHook = (initialValue: number) => {
      return { count: initialValue + 1 }
    }

    const { useBridgedStore, StoreProvider } = createHookBridge({
      useStoreLogic: (initialValue: number) => {
        const { count } = useMockHook(initialValue)
        return {
          tracked: { count },
          methods: {},
        }
      },
    })

    const TestComponent = ({ initialValue }: { initialValue: number }) => {
      const { store } = useBridgedStore()
      const count = store.use.count()
      return (
        <div>
          <span>Count: {count}</span>
          <span>InitialValue: {initialValue}</span>
        </div>
      )
    }

    const ParentComponent = () => {
      const [initialValue, setInitialValue] = useState(5)

      return (
        <>
          <button type='button' onClick={() => setInitialValue(10)}>
            Change Initial Value
          </button>
          <StoreProvider logicArgs={[initialValue]}>
            <TestComponent initialValue={initialValue} />
          </StoreProvider>
        </>
      )
    }

    render(<ParentComponent />)

    expect(screen.getByText(/Count:/).textContent).toBe('Count: 6')
    expect(screen.getByText(/InitialValue:/).textContent).toBe(
      'InitialValue: 5',
    )

    // 点击按钮改变初始值
    act(() => {
      screen.getByText('Change Initial Value').click()
    })

    // 验证状态是否更新
    expect(screen.getByText(/Count:/).textContent).toBe('Count: 11')
    expect(screen.getByText(/InitialValue:/).textContent).toBe(
      'InitialValue: 10',
    )
  })

  it('自定义store', () => {
    const useMockCounter = (initialValue: number) => {
      const [count, setCount] = useState(initialValue)
      return { count, setCount }
    }

    type State = Pick<ReturnType<typeof useMockCounter>, 'count'> & {
      count1: number
      increment1: () => void
    }

    const { useBridgedStore, StoreProvider } = createHookBridge({
      useStoreLogic: (initialValue: number) => {
        const { count, setCount } = useMockCounter(initialValue)
        return {
          tracked: { count },
          methods: { setCount },
        }
      },
      createStoreConfig: () => ({
        createStore: (initState) => {
          return createStore<State>()(
            devtools(
              (set) => ({
                ...initState,
                count1: 0,
                increment1: () =>
                  set((state) => ({ count1: state.count1 + 1 })),
              }),
              { name: 'MyStore' },
            ),
          )
        },
        updateState: (store, state) => {
          store.setState(state, false, 'hookStateUpdate')
        },
      }),
    })
    const TestComponent = () => {
      const { store, setCount } = useBridgedStore()
      const count = useStore(store, (s) => s.count)
      const count1 = useStore(store, (s) => s.count1)
      const increment1 = useStore(store, (s) => s.increment1)
      return (
        <div>
          <span>Count: {count}</span>
          <button type='button' onClick={() => setCount((count) => count + 1)}>
            Increment
          </button>
          <span>Count1: {count1}</span>
          <button type='button' onClick={increment1}>
            Increment1
          </button>
        </div>
      )
    }
    render(
      <StoreProvider logicArgs={[5]}>
        <TestComponent />
      </StoreProvider>,
    )

    const countElement = screen.getByText(/Count:/)
    expect(countElement.textContent).toBe('Count: 5')
    const button = screen.getByText('Increment')
    act(() => {
      button.click()
    })
    expect(countElement.textContent).toBe('Count: 6')

    const count1Element = screen.getByText(/Count1:/)
    expect(count1Element.textContent).toBe('Count1: 0')
    const button1 = screen.getByText('Increment1')
    act(() => {
      button1.click()
    })
    expect(count1Element.textContent).toBe('Count1: 1')
  })
})
