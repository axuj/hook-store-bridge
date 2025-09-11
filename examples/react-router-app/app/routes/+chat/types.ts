export type MessageType = {
  key: string
  from: 'user' | 'assistant'
  sources?: { href: string; title: string }[]
  versions: {
    id: string
    content: string
  }[]
  reasoning?: {
    content: string
    duration: number
  }
  tools?: {
    name: string
    description: string
    status: any // ToolUIPart['state']
    parameters: Record<string, unknown>
    result: string | undefined
    error: string | undefined
  }[]
  avatar: string
  name: string
}
