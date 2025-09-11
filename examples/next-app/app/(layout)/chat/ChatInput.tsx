'use client'
import { GlobeIcon, MicIcon } from 'lucide-react'
import { useState } from 'react'
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '~/components/ai-elements/prompt-input'
import { models } from './data'
import { useAdaptedStore } from './storeBridge'

export const ChatInput = () => {
  const { store, setModel, sendMessage } = useAdaptedStore()
  const model = store.use.model()
  const status = store.use.status()

  const [useWebSearch, setUseWebSearch] = useState<boolean>(false)
  const [useMicrophone, setUseMicrophone] = useState<boolean>(false)
  const [text, setText] = useState('')

  const handleSubmitCallback = (message: any) => {
    const hasText = Boolean(message.text)
    const hasAttachments = Boolean(message.files?.length)

    if (['submitted', 'streaming'].includes(status)) return

    if (!(hasText || hasAttachments)) {
      return
    }

    if (message.files?.length) {
      // 处理文件附件（如果需要）
      console.log('Files attached', message.files)
    }

    setText('')

    // 使用 useChat 的 sendMessage 方法发送消息
    sendMessage({
      text: message.text || 'Sent with attachments',
    })
  }
  return (
    <PromptInput globalDrop multiple onSubmit={handleSubmitCallback}>
      <PromptInputBody>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
        <PromptInputTextarea
          onChange={(event) => setText(event.target.value)}
          value={text}
        />
      </PromptInputBody>
      <PromptInputToolbar>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <PromptInputButton
            onClick={() => setUseMicrophone(!useMicrophone)}
            variant={useMicrophone ? 'default' : 'ghost'}
          >
            <MicIcon size={16} />
            <span className='sr-only'>Microphone</span>
          </PromptInputButton>
          <PromptInputButton
            onClick={() => setUseWebSearch(!useWebSearch)}
            variant={useWebSearch ? 'default' : 'ghost'}
          >
            <GlobeIcon size={16} />
            <span>Search</span>
          </PromptInputButton>
          <PromptInputModelSelect onValueChange={setModel} value={model}>
            <PromptInputModelSelectTrigger>
              <PromptInputModelSelectValue />
            </PromptInputModelSelectTrigger>
            <PromptInputModelSelectContent>
              {models.map((modelItem) => (
                <PromptInputModelSelectItem
                  key={modelItem.id}
                  value={modelItem.id}
                >
                  {modelItem.name}
                </PromptInputModelSelectItem>
              ))}
            </PromptInputModelSelectContent>
          </PromptInputModelSelect>
        </PromptInputTools>
        <PromptInputSubmit
          disabled={!(text.trim() || status) || status === 'streaming'}
          status={status}
        />
      </PromptInputToolbar>
    </PromptInput>
  )
}
