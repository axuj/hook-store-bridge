'use client'
import type { PropsWithChildren } from 'react'
import { CountsProvider, useContextCounts } from './+count/count-context'
import { Counter } from './+count/counter'
import { StoreProvider, useAdaptedStore } from './+count/storeBridge'

export function meta() {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ]
}

function Count() {
  const { store, setCount } = useAdaptedStore()
  const count = store.use.count()
  return <Counter count={count} setCount={setCount} />
}

function Count1() {
  const { store, setCount1 } = useAdaptedStore()
  const count = store.use.count1()
  return <Counter count={count} setCount={setCount1} />
}
function Count2() {
  const { store, setCount2 } = useAdaptedStore()
  const count = store.use.count2()
  return <Counter count={count} setCount={setCount2} />
}
function Count3() {
  const { store, setCount3 } = useAdaptedStore()
  const count = store.use.count3()
  return <Counter count={count} setCount={setCount3} />
}

function CountCountex() {
  const { count, setCount } = useContextCounts()
  return <Counter count={count} setCount={setCount} />
}
function Count1Countex() {
  const { count1, setCount1 } = useContextCounts()
  return <Counter count={count1} setCount={setCount1} />
}
function Count2Countex() {
  const { count2, setCount2 } = useContextCounts()
  return <Counter count={count2} setCount={setCount2} />
}
function Count3Countex() {
  const { count3, setCount3 } = useContextCounts()
  return <Counter count={count3} setCount={setCount3} />
}

function Layout({ children, title }: PropsWithChildren<{ title: string }>) {
  return (
    <div className='mt-8'>
      <h2 className='mb-4 font-bold text-xl'>{title}</h2>
      {children}
    </div>
  )
}

export default function Home() {
  return (
    <>
      <Layout title='Hook Store Bridge Counters'>
        <StoreProvider>
          <Count />
          <Count1 />
          <Count2 />
          <Count3 />
        </StoreProvider>
      </Layout>

      <Layout title='Context Counters'>
        <CountsProvider>
          <CountCountex />
          <Count1Countex />
          <Count2Countex />
          <Count3Countex />
        </CountsProvider>
      </Layout>
    </>
  )
}
