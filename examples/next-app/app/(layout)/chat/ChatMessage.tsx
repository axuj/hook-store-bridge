'use client'

import type { UIMessage } from 'ai'
import { memo } from 'react'
import {
  Message,
  MessageAvatar,
  MessageContent,
} from '~/components/ai-elements/message'
import { Response } from '~/components/ai-elements/response'

import { useAdaptedStore } from './storeBridge'

export const ChatMessages = () => {
  const { store } = useAdaptedStore()
  const messages = store.use.messages()
  return (
    <>
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
    </>
  )
}

export const ChatMessage = memo(({ message }: { message: UIMessage }) => {
  return (
    <>
      {message.parts.map((part, i) => {
        if (part.type === 'text') {
          return (
            <Message from={message.role} key={`${message.id}-${i}`}>
              <div>
                <MessageContent>
                  <Response>{part.text}</Response>
                </MessageContent>
              </div>
              <MessageAvatar
                name={message.role === 'user' ? 'User' : 'Assistant'}
                src={
                  message.role === 'user'
                    ? 'https://github.com/haydenbleasel.png'
                    : 'https://github.com/openai.png'
                }
              />
            </Message>
          )
        }
        return null
      })}
    </>
  )
})
