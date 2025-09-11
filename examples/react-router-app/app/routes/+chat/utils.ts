import { toast } from 'sonner'
import { mockResponses } from './data'
import type { MessageType } from './types'

type StreamResponseType = (messageId: string, content: string) => void

export const streamResponse = async (
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>,
  setStatus: React.Dispatch<
    React.SetStateAction<'submitted' | 'streaming' | 'ready' | 'error'>
  >,
  setStreamingMessageId: React.Dispatch<React.SetStateAction<string | null>>,
  messageId: string,
  content: string,
) => {
  setStatus('streaming')
  setStreamingMessageId(messageId)

  const words = content.split(' ')
  let currentContent = ''

  for (let i = 0; i < words.length; i++) {
    currentContent += (i > 0 ? ' ' : '') + words[i]

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.versions.some((v) => v.id === messageId)) {
          return {
            ...msg,
            versions: msg.versions.map((v) =>
              v.id === messageId ? { ...v, content: currentContent } : v,
            ),
          }
        }
        return msg
      }),
    )

    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 100 + 50),
    )
  }

  setStatus('ready')
  setStreamingMessageId(null)
}

export const addUserMessage = async (
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>,
  _setStatus: React.Dispatch<
    React.SetStateAction<'submitted' | 'streaming' | 'ready' | 'error'>
  >,
  _setStreamingMessageId: React.Dispatch<React.SetStateAction<string | null>>,
  streamResponse: StreamResponseType,
  content: string,
) => {
  const userMessage: MessageType = {
    key: `user-${Date.now()}`,
    from: 'user',
    versions: [
      {
        id: `user-${Date.now()}`,
        content,
      },
    ],
    avatar: 'https://github.com/haydenbleasel.png',
    name: 'User',
  }

  setMessages((prev) => [...prev, userMessage])

  setTimeout(() => {
    const assistantMessageId = `assistant-${Date.now()}`
    const randomResponse =
      mockResponses[Math.floor(Math.random() * mockResponses.length)]

    const assistantMessage: MessageType = {
      key: `assistant-${Date.now()}`,
      from: 'assistant',
      versions: [
        {
          id: assistantMessageId,
          content: '',
        },
      ],
      avatar: 'https://github.com/openai.png',
      name: 'Assistant',
    }

    setMessages((prev) => [...prev, assistantMessage])
    streamResponse(assistantMessageId, randomResponse)
  }, 500)
}

export const handleSubmit = (
  setText: React.Dispatch<React.SetStateAction<string>>,
  setStatus: React.Dispatch<
    React.SetStateAction<'submitted' | 'streaming' | 'ready' | 'error'>
  >,
  addUserMessage: (content: string) => Promise<void>,
  _text: string,
) => {
  return (message: any) => {
    const hasText = Boolean(message.text)
    const hasAttachments = Boolean(message.files?.length)

    if (!(hasText || hasAttachments)) {
      return
    }

    setStatus('submitted')

    if (message.files?.length) {
      toast.success('Files attached', {
        description: `${message.files.length} file(s) attached to message`,
      })
    }

    addUserMessage(message.text || 'Sent with attachments')
    setText('')
  }
}

export const handleSuggestionClick = (
  setStatus: React.Dispatch<
    React.SetStateAction<'submitted' | 'streaming' | 'ready' | 'error'>
  >,
  addUserMessage: (content: string) => Promise<void>,
) => {
  return (suggestion: string) => {
    setStatus('submitted')
    addUserMessage(suggestion)
  }
}
