import { Button } from '~/components/ui/button'

export function Counter({
  count,
  setCount,
}: {
  count: number
  setCount: (c: number) => void
}) {
  return (
    <div className='flex items-center gap-4 rounded-lg border bg-card p-6 shadow-sm'>
      <span className='min-w-[3rem] text-center font-bold text-2xl'>
        {count}
      </span>
      <Button onClick={() => setCount(count + 1)} className='px-4 py-2'>
        Increment
      </Button>
    </div>
  )
}
