// fork: https://github.com/vercel/ai-elements/blob/main/packages/examples/src/chatbot.tsx
'use client'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '~/components/ai-elements/conversation'
import { ChatInput } from './ChatInput'
import { ChatMessages } from './ChatMessage'
import { ChatSuggestions } from './Suggestions'

const ChatBot = () => {
  return (
    <div className='relative flex size-full flex-col divide-y overflow-hidden rounded-lg border-2'>
      <Conversation>
        <ConversationContent>
          <ChatMessages />
        </ConversationContent>

        <ConversationScrollButton />
      </Conversation>
      <div className='grid shrink-0 gap-4 pt-4'>
        <ChatSuggestions />
        <div className='w-full px-4 pb-4'>
          <ChatInput />
        </div>
      </div>
    </div>
  )
}

export default ChatBot
