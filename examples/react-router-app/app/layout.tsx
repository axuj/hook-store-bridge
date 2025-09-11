import { Link, Outlet } from 'react-router'

export default function MyLayout() {
  return (
    <div className='min-h-screen bg-background'>
      <header className='border-border border-b bg-card shadow-sm'>
        <nav className='py-4'>
          <div className='ml-10 flex items-center gap-4'>
            <Link
              to='/'
              className='rounded-md px-3 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground'
            >
              Hook Store Bridge vs Context
            </Link>
            <Link
              to='/chat'
              className='rounded-md px-3 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground'
            >
              Vercel AI useChat
            </Link>
          </div>
        </nav>
      </header>
      <main className='mx-auto max-w-[1200px] px-4'>
        <Outlet />
      </main>
    </div>
  )
}
