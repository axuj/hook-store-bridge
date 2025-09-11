import ChatBot from './ChatBot.client'
import { StoreProvider } from './storeBridge'

export default function Chat() {
  return (
    <StoreProvider>
      <div className='m-auto h-[calc(100vh-100px)] max-w-[800px]'>
        <ChatBot />
      </div>
    </StoreProvider>
  )
}
