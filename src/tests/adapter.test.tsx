import { render, renderHook, screen } from '@testing-library/react'
import { act, useCallback, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { createStore, useStore } from 'zustand'
import { createHookBridge } from '../bridge'

describe('createHookBridge', () => {
  it('should throw an error if useAdaptedStore is used without a Provider', () => {
    const useMockHook = () => ({ value: 123 })
    const { useAdaptedStore } = createHookBridge({
      useHook: useMockHook,
      stateKeys: ['value'],
    })

    expect(() => {
      renderHook(() => useAdaptedStore())
    }).toThrow('`useAdaptedStore` must be used within a `StoreProvider`.')
  })

  it('should provide state and actions correctly when used with a Provider', async () => {
    const useMockCounter = (initialValue: number) => {
      const [count, setCount] = useState(initialValue)
      return { count, setCount }
    }
    const { useAdaptedStore, StoreProvider } = createHookBridge({
      useHook: useMockCounter,
      stateKeys: ['count'],
      actionKeys: ['setCount'],
    })
    const TestComponent = () => {
      const { store, setCount } = useAdaptedStore()
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
      <StoreProvider hookArgs={[5]}>
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

    const { useAdaptedStore, StoreProvider } = createHookBridge({
      useHook: useMockHook,
      stateKeys: ['obj1', 'test'],
    })
    const TestComponent = () => {
      const { store } = useAdaptedStore()
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
      <StoreProvider hookArgs={[{ count: 5 }, { count: 10 }]}>
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

    const { useAdaptedStore, StoreProvider } = createHookBridge({
      useHook: useMockHook,
      stateKeys: ['test'],
    })
    const TestComponent = () => {
      const { store } = useAdaptedStore()
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

    const { useAdaptedStore, StoreProvider } = createHookBridge({
      useHook: useMockHook,
      stateKeys: ['count'],
      actionKeys: ['increment'],
    })
    const TestComponent = () => {
      const { store, increment } = useAdaptedStore()
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
      <StoreProvider hookArgs={[5]}>
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

    const { useAdaptedStore, StoreProvider } = createHookBridge({
      useHook: useMockHook,
      stateKeys: ['count'],
    })

    const TestComponent = ({ initialValue }: { initialValue: number }) => {
      const { store } = useAdaptedStore()
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
          <StoreProvider hookArgs={[initialValue]}>
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

    const { useAdaptedStore, StoreProvider } = createHookBridge({
      useHook: useMockCounter,
      stateKeys: ['count'] as const,
      actionKeys: ['setCount'],

      createStoreConfig: () => ({
        createStore: (initState) => {
          return createStore<State>()((set) => ({
            ...initState,
            count1: 0,
            increment1: () => set((state) => ({ count1: state.count1 + 1 })),
          }))
        },
        updateState: (store, state) => {
          store.setState(state)
        },
      }),
    })
    const TestComponent = () => {
      const { store, setCount } = useAdaptedStore()
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
      <StoreProvider hookArgs={[5]}>
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
