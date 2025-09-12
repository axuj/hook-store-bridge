'use client'
import { useChat } from '@ai-sdk/react'
import { createHookBridge } from 'hook-store-bridge'
import { useState } from 'react'

function useMyChat() {
  const [model, setModel] = useState<string>('gpt-4')
  const { messages, error, status, stop, sendMessage } = useChat()
  return {
    tracked: { messages, error, status, model },
    methods: { sendMessage, stop, setModel },
  }
}

export const { useBridgedStore, StoreProvider } = createHookBridge({
  useStoreLogic: useMyChat,
})
