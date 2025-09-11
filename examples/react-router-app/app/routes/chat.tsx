import { useEffect, useState } from 'react'
import ChatBot from './+chat/ChatBot.client'
import { StoreProvider } from './+chat/storeBridge'

export default function Chat() {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <StoreProvider>
      <div className='m-auto h-[calc(100vh-100px)] max-w-[800px]'>
        {isClient ? <ChatBot /> : <div>loading...</div>}
      </div>
    </StoreProvider>
  )
}
