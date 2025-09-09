import { render, renderHook, screen } from '@testing-library/react'
import React, { act, useCallback } from 'react'
import { describe, expect, it } from 'vitest'
import { createHookAdapter } from '../adapter'

// A simple mock hook for testing the error case

describe('createHookAdapter', () => {
  it('should throw an error if useAdaptedStore is used without a Provider', () => {
    const useMockHook = () => ({ value: 123 })
    const [useAdaptedStore] = createHookAdapter(useMockHook, ['value'], [])

    expect(() => {
      renderHook(() => useAdaptedStore())
    }).toThrow('`useAdaptedStore` must be used within a `StoreProvider`.')
  })

  it('should provide state and actions correctly when used with a Provider', async () => {
    const useMockCounter = (initialValue: number) => {
      const [count, setCount] = React.useState(initialValue)
      return { count, setCount }
    }
    const [useAdaptedStore, StoreProvider] = createHookAdapter(
      useMockCounter,
      ['count'],
      ['setCount'],
    )
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

    const [useAdaptedStore, StoreProvider] = createHookAdapter(
      useMockHook,
      ['obj1', 'test'],
      [],
    )
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

  it('action改变', () => {
    const useMockHook = (initialValue: number) => {
      const [count, setCount] = React.useState(initialValue)
      const increment = useCallback(() => {
        setCount(count + 1)
      }, [count])
      return { count, setCount, increment }
    }

    const [useAdaptedStore, StoreProvider] = createHookAdapter(
      useMockHook,
      ['count'],
      ['increment'],
    )
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
})
