'use client'
import { useChat } from '@ai-sdk/react'
import { createHookBridge } from 'hook-store-bridge'
import { useState } from 'react'

function useMyChat() {
  const [model, setModel] = useState<string>('gpt-4')

  return { ...useChat(), model, setModel }
}

export const { useAdaptedStore, StoreProvider } = createHookBridge({
  useHook: useMyChat,
  stateKeys: ['messages', 'error', 'model', 'status'],
  actionKeys: ['stop', 'sendMessage', 'setModel'],
})
