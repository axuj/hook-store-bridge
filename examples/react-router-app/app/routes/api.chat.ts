import {
  createUIMessageStreamResponse,
  simulateReadableStream,
  type UIMessageChunk,
} from 'ai'
import { nanoid } from 'nanoid'
import type { Route } from './+types/api.chat'

// 模拟响应数据
const mockResponses = [
  "That's a great question! Let me help you understand this concept better. The key thing to remember is that proper implementation requires careful consideration of the underlying principles and best practices in the field.",
  "I'd be happy to explain this topic in detail. From my understanding, there are several important factors to consider when approaching this problem. Let me break it down step by step for you.",
  "This is an interesting topic that comes up frequently. The solution typically involves understanding the core concepts and applying them in the right context. Here's what I recommend...",
  "Great choice of topic! This is something that many developers encounter. The approach I'd suggest is to start with the fundamentals and then build up to more complex scenarios.",
  "That's definitely worth exploring. From what I can see, the best way to handle this is to consider both the theoretical aspects and practical implementation details.",
]

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const randomResponse =
      mockResponses[Math.floor(Math.random() * mockResponses.length)]
    const words = randomResponse.split(' ')
    const id = nanoid()
    const stream: ReadableStream<UIMessageChunk> = simulateReadableStream({
      chunks: [
        { type: 'start' },
        { type: 'start-step' },

        { type: 'text-start', id },
        ...words.map((word, i) => ({
          type: 'text-delta' as const,
          delta: word + (i < words.length - 1 ? ' ' : ''),
          id,
        })),
        { type: 'text-end', id },

        { type: 'finish-step' },
        { type: 'finish' },
      ],
      initialDelayInMs: 100,
      chunkDelayInMs: 50,
    })
    // 创建响应
    const response = createUIMessageStreamResponse({
      stream,
    })

    return response
  } catch (error) {
    console.error('Chat API Error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
