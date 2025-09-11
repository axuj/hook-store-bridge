import Link from 'next/link'
import type React from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='min-h-screen bg-background'>
      <header className='border-border border-b bg-card shadow-sm'>
        <nav className='py-4'>
          <div className='ml-10 flex items-center gap-4'>
            <Link
              href='/'
              className='rounded-md px-3 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground'
            >
              Hook Store Bridge vs Context
            </Link>
            <Link
              href='/chat'
              className='rounded-md px-3 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground'
            >
              Vercel AI useChat
            </Link>
          </div>
        </nav>
      </header>
      <main className='mx-auto max-w-[1200px] px-4 py-8'>{children}</main>
    </div>
  )
}
